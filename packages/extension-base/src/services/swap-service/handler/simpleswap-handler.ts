// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { SwapError } from '@bitriel/extension-base/background/errors/SwapError';
import { TransactionError } from '@bitriel/extension-base/background/errors/TransactionError';
import { ChainType, ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getContractAddressOfToken, _isChainSubstrateCompatible, _isNativeToken } from '@bitriel/extension-base/services/chain-service/utils';
import FeeService from '@bitriel/extension-base/services/fee-service/service';
import { BaseStepDetail, BaseSwapStepMetadata, BasicTxErrorType, CommonOptimalSwapPath, CommonStepFeeInfo, CommonStepType, DynamicSwapType, OptimalSwapPathParamsV2, SimpleSwapTxData, SwapErrorType, SwapProviderId, SwapStepType, SwapSubmitParams, SwapSubmitStepData, TransactionData, ValidateSwapProcessParams } from '@bitriel/extension-base/types';
import { _reformatAddressWithChain, formatNumber } from '@bitriel/extension-base/utils';
import { getId } from '@bitriel/extension-base/utils/getId';
import BigN, { BigNumber } from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';

import { BalanceService } from '../../balance-service';
import { getERC20TransactionObject, getEVMTransactionObject } from '../../balance-service/transfer/smart-contract';
import { createSubstrateExtrinsic } from '../../balance-service/transfer/token';
import { ChainService } from '../../chain-service';
import { SIMPLE_SWAP_SUPPORTED_TESTNET_ASSET_MAPPING } from '../utils';
import { SwapBaseHandler, SwapBaseInterface } from './base-handler';

interface ExchangeSimpleSwapData{
  id: string;
  trace_id: string;
  address_from: string;
  amount_to: string;
}

const apiUrl = 'https://api.simpleswap.io';

export const simpleSwapApiKey = process.env.SIMPLE_SWAP_API_KEY || '';

const toBNString = (input: string | number | BigNumber, decimal: number): string => {
  const raw = new BigNumber(input);

  return raw.shiftedBy(decimal).integerValue(BigNumber.ROUND_CEIL).toFixed();
};

const createSwapRequest = async (params: {fromSymbol: string; toSymbol: string; fromAmount: string; fromAsset: _ChainAsset; receiver: string; sender: string; toAsset: _ChainAsset;}) => {
  const fromDecimals = _getAssetDecimals(params.fromAsset);
  const toDecimals = _getAssetDecimals(params.toAsset);
  const formatedAmount = formatNumber(params.fromAmount, fromDecimals, (s) => s);
  const requestBody = {
    fixed: false,
    currency_from: params.fromSymbol,
    currency_to: params.toSymbol,
    amount: formatedAmount, // Convert to small number due to require of api
    address_to: params.receiver,
    extra_id_to: '',
    user_refund_address: params.sender,
    user_refund_extra_id: ''
  };

  const response = await fetch(
    `${apiUrl}/create_exchange?api_key=${simpleSwapApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  const depositAddressResponse = await response.json() as ExchangeSimpleSwapData;

  return {
    id: depositAddressResponse.id,
    addressFrom: depositAddressResponse.address_from,
    amountTo: toBNString(depositAddressResponse.amount_to, toDecimals)
  };
};

export class SimpleSwapHandler implements SwapBaseInterface {
  private swapBaseHandler: SwapBaseHandler;
  providerSlug: SwapProviderId;

  constructor (chainService: ChainService, balanceService: BalanceService, feeService: FeeService) {
    this.swapBaseHandler = new SwapBaseHandler({
      chainService,
      balanceService,
      feeService,
      providerName: 'SimpleSwap',
      providerSlug: SwapProviderId.SIMPLE_SWAP
    });
    this.providerSlug = SwapProviderId.SIMPLE_SWAP;
  }

  get chainService () {
    return this.swapBaseHandler.chainService;
  }

  get balanceService () {
    return this.swapBaseHandler.balanceService;
  }

  get providerInfo () {
    return this.swapBaseHandler.providerInfo;
  }

  get name () {
    return this.swapBaseHandler.name;
  }

  get slug () {
    return this.swapBaseHandler.slug;
  }

  generateOptimalProcessV2 (params: OptimalSwapPathParamsV2): Promise<CommonOptimalSwapPath> {
    return this.swapBaseHandler.generateOptimalProcessV2(params, [
      this.getSubmitStep.bind(this)
    ]);
  }

  async getSubmitStep (params: OptimalSwapPathParamsV2, stepIndex: number): Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined> {
    if (!params.selectedQuote) {
      return Promise.resolve(undefined);
    }

    const originTokenInfo = this.chainService.getAssetBySlug(params.selectedQuote.pair.from);
    const destinationTokenInfo = this.chainService.getAssetBySlug(params.selectedQuote.pair.to);
    const originChain = this.chainService.getChainInfoByKey(originTokenInfo.originChain);
    const destinationChain = this.chainService.getChainInfoByKey(destinationTokenInfo.originChain);

    const submitStep: BaseStepDetail = {
      name: 'Swap',
      type: SwapStepType.SWAP,
      // @ts-ignore
      metadata: {
        sendingValue: params.request.fromAmount.toString(),
        expectedReceive: params.selectedQuote.toAmount,
        originTokenInfo,
        destinationTokenInfo,
        sender: _reformatAddressWithChain(params.request.address, originChain),
        receiver: _reformatAddressWithChain(params.request.recipient || params.request.address, destinationChain),
        version: 2
      } as unknown as BaseSwapStepMetadata
    };

    return Promise.resolve([submitStep, params.selectedQuote.feeInfo]);
  }

  public async handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { currentStep, process } = params;
    const type = process.steps[currentStep].type;

    switch (type) {
      case CommonStepType.DEFAULT:
        return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
      case SwapStepType.SWAP:
        return this.handleSubmitStep(params);
      default:
        return this.handleSubmitStep(params);
    }
  }

  public async handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    const { address, quote, recipient } = params;

    const pair = quote.pair;

    const fromAsset = this.chainService.getAssetBySlug(pair.from);
    const toAsset = this.chainService.getAssetBySlug(pair.to);
    const chainInfo = this.chainService.getChainInfoByKey(fromAsset.originChain);
    const toChainInfo = this.chainService.getChainInfoByKey(toAsset.originChain);
    const chainType = _isChainSubstrateCompatible(chainInfo) ? ChainType.SUBSTRATE : ChainType.EVM;
    const sender = _reformatAddressWithChain(address, chainInfo);
    const receiver = _reformatAddressWithChain(recipient ?? sender, toChainInfo);

    const fromSymbol = SIMPLE_SWAP_SUPPORTED_TESTNET_ASSET_MAPPING[fromAsset.slug];
    const toSymbol = SIMPLE_SWAP_SUPPORTED_TESTNET_ASSET_MAPPING[toAsset.slug];

    const { fromAmount } = quote;
    const { addressFrom, amountTo, id } = await createSwapRequest({ fromSymbol, toSymbol, fromAmount, fromAsset, receiver, sender, toAsset });

    console.log('simpleswap data', id, addressFrom);

    if (!id || id.length === 0 || !addressFrom || addressFrom.length === 0) {
      throw new SwapError(SwapErrorType.UNKNOWN);
    }

    // Validate the amount to be swapped
    const rate = BigN(amountTo).div(BigN(quote.toAmount)).multipliedBy(100);

    if (rate.lt(95)) {
      throw new SwapError(SwapErrorType.NOT_MEET_MIN_EXPECTED);
    }

    // Can modify quote.toAmount to amountTo after confirm real amount received

    const txData: SimpleSwapTxData = {
      id: id,
      address,
      provider: this.providerInfo,
      quote: params.quote,
      slippage: params.slippage,
      recipient: receiver,
      process: params.process
    };

    let extrinsic: TransactionData;

    if (chainType === ChainType.SUBSTRATE) {
      const chainApi = this.chainService.getSubstrateApi(chainInfo.slug);
      const substrateApi = await chainApi.isReady;

      const [submittableExtrinsic] = await createSubstrateExtrinsic({
        from: address,
        networkKey: chainInfo.slug,
        substrateApi,
        to: addressFrom,
        tokenInfo: fromAsset,
        transferAll: false,
        value: quote.fromAmount
      });

      extrinsic = submittableExtrinsic as SubmittableExtrinsic<'promise'>;
    } else {
      const feeInfo = await this.swapBaseHandler.feeService.subscribeChainFee(getId(), chainInfo.slug, 'evm');

      if (_isNativeToken(fromAsset)) {
        const [transactionConfig] = await getEVMTransactionObject({
          evmApi: this.chainService.getEvmApi(chainInfo.slug),
          transferAll: false,
          value: quote.fromAmount,
          from: address,
          to: addressFrom,
          chain: chainInfo.slug,
          feeInfo
        });

        extrinsic = transactionConfig;
      } else {
        const [transactionConfig] = await getERC20TransactionObject({
          assetAddress: _getContractAddressOfToken(fromAsset),
          chain: chainInfo.slug,
          evmApi: this.chainService.getEvmApi(chainInfo.slug),
          feeInfo,
          from: address,
          to: addressFrom,
          value: quote.fromAmount,
          transferAll: false
        });

        extrinsic = transactionConfig;
      }
    }

    return {
      txChain: fromAsset.originChain,
      txData,
      extrinsic,
      transferNativeAmount: _isNativeToken(fromAsset) ? quote.fromAmount : '0',
      extrinsicType: ExtrinsicType.SWAP,
      chainType
    } as SwapSubmitStepData;
  }

  public async validateSwapProcessV2 (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    // todo: recheck address and recipient format in params
    const { process, selectedQuote } = params; // todo: review flow, currentStep param.

    // todo: validate path with optimalProcess
    // todo: review error message in case many step swap
    if (BigNumber(selectedQuote.fromAmount).lte(0)) {
      return [new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Amount must be greater than 0')];
    }

    const actionList = JSON.stringify(process.path.map((step) => step.action));
    const swap = actionList === JSON.stringify([DynamicSwapType.SWAP]);
    const swapXcm = actionList === JSON.stringify([DynamicSwapType.SWAP, DynamicSwapType.BRIDGE]);
    const xcmSwap = actionList === JSON.stringify([DynamicSwapType.BRIDGE, DynamicSwapType.SWAP]);
    const xcmSwapXcm = actionList === JSON.stringify([DynamicSwapType.BRIDGE, DynamicSwapType.SWAP, DynamicSwapType.BRIDGE]);

    const swapIndex = params.process.steps.findIndex((step) => step.type === SwapStepType.SWAP); // todo

    if (swapIndex <= -1) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (swap) {
      return this.swapBaseHandler.validateSwapOnlyProcess(params, swapIndex); // todo: create interface for input request
    }

    if (swapXcm) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (xcmSwap) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    if (xcmSwapXcm) {
      return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
    }

    return [new TransactionError(BasicTxErrorType.INTERNAL_ERROR)];
  }
}
