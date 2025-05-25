// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@bitriel/chain-list/types';
import { AmountData } from '@bitriel/extension-base/background/KoniTypes';
import { _SUPPORT_TOKEN_PAY_FEE_GROUP, XCM_FEE_RATIO } from '@bitriel/extension-base/constants';
import { _isSnowBridgeXcm } from '@bitriel/extension-base/core/substrate/xcm-parser';

import { getERC20TransactionObject, getEVMTransactionObject } from '@bitriel/extension-base/services/balance-service/transfer/smart-contract';
import { createSubstrateExtrinsic } from '@bitriel/extension-base/services/balance-service/transfer/token';
import { createTonTransaction } from '@bitriel/extension-base/services/balance-service/transfer/ton-transfer';
import { createAcrossBridgeExtrinsic, createAvailBridgeExtrinsicFromAvail, createAvailBridgeTxFromEth, createPolygonBridgeExtrinsic, createSnowBridgeExtrinsic, CreateXcmExtrinsicProps, createXcmExtrinsicV2, dryRunXcmExtrinsicV2, FunctionCreateXcmExtrinsic } from '@bitriel/extension-base/services/balance-service/transfer/xcm';
import { _isAcrossChainBridge, _isAcrossTestnetBridge } from '@bitriel/extension-base/services/balance-service/transfer/xcm/acrossBridge';
import { isAvailChainBridge } from '@bitriel/extension-base/services/balance-service/transfer/xcm/availBridge';
import { _isPolygonChainBridge } from '@bitriel/extension-base/services/balance-service/transfer/xcm/polygonBridge';
import { _isPosChainBridge } from '@bitriel/extension-base/services/balance-service/transfer/xcm/posBridge';
import { _EvmApi, _SubstrateApi, _TonApi } from '@bitriel/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getContractAddressOfToken, _isChainEvmCompatible, _isChainTonCompatible, _isLocalToken, _isNativeToken, _isPureEvmChain, _isTokenEvmSmartContract, _isTokenTransferredByEvm, _isTokenTransferredByTon } from '@bitriel/extension-base/services/chain-service/utils';
import { calculateToAmountByReservePool, FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE } from '@bitriel/extension-base/services/fee-service/utils';
import { getHydrationRate } from '@bitriel/extension-base/services/fee-service/utils/tokenPayFee';
import { isTonTransaction } from '@bitriel/extension-base/services/transaction-service/helpers';
import { ValidateTransactionResponseInput } from '@bitriel/extension-base/services/transaction-service/types';
import { EvmEIP1559FeeOption, FeeChainType, FeeDetail, FeeInfo, SubstrateTipInfo, TransactionFee } from '@bitriel/extension-base/types';
import { ResponseSubscribeTransfer } from '@bitriel/extension-base/types/balance/transfer';
import { BN_ZERO } from '@bitriel/extension-base/utils';
import { isTonAddress } from '@subwallet/keyring';
import BigN from 'bignumber.js';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import { addressToEvm, isEthereumAddress } from '@polkadot/util-crypto';

import { combineEthFee, combineSubstrateFee } from './combine';

export interface CalculateMaxTransferable extends TransactionFee {
  address: string;
  value: string;
  srcToken: _ChainAsset;
  destToken?: _ChainAsset;
  srcChain: _ChainInfo;
  destChain: _ChainInfo;
  substrateApi: _SubstrateApi;
  evmApi: _EvmApi;
  tonApi: _TonApi;
  isTransferLocalTokenAndPayThatTokenAsFee: boolean;
  isTransferNativeTokenAndPayLocalTokenAsFee: boolean;
  nativeToken: _ChainAsset;
}

export const detectTransferTxType = (srcToken: _ChainAsset, srcChain: _ChainInfo, destChain: _ChainInfo): FeeChainType => {
  const isXcmTransfer = srcChain.slug !== destChain.slug;

  if (isXcmTransfer) {
    const isAvailBridgeFromEvm = _isPureEvmChain(srcChain) && isAvailChainBridge(destChain.slug);
    const isSnowBridgeEvmTransfer = _isPureEvmChain(srcChain) && _isSnowBridgeXcm(srcChain, destChain) && !isAvailBridgeFromEvm;
    const isPolygonBridgeTransfer = _isPolygonChainBridge(srcChain.slug, destChain.slug);
    const isPosBridgeTransfer = _isPosChainBridge(srcChain.slug, destChain.slug);
    const isAcrossBridgeTransfer = _isAcrossChainBridge(srcChain.slug, destChain.slug);

    return (isAvailBridgeFromEvm || isSnowBridgeEvmTransfer || isPolygonBridgeTransfer || isPosBridgeTransfer || isAcrossBridgeTransfer) ? 'evm' : 'substrate';
  } else {
    if (_isChainEvmCompatible(srcChain) && _isTokenTransferredByEvm(srcToken)) {
      return 'evm';
    } else if (_isChainTonCompatible(srcChain) && _isTokenTransferredByTon(srcToken)) {
      return 'ton';
    } else {
      return 'substrate';
    }
  }
};

export const calculateMaxTransferable = async (id: string, request: CalculateMaxTransferable, freeBalance: AmountData, fee: FeeInfo): Promise<ResponseSubscribeTransfer> => {
  const { destChain, srcChain } = request;
  const isXcmTransfer = srcChain.slug !== destChain.slug;

  let maxTransferableAmount: ResponseSubscribeTransfer;

  if (isXcmTransfer) {
    const _request: CalculateMaxTransferable = { // todo: temp not support pay local fee with xcm
      ...request,
      isTransferLocalTokenAndPayThatTokenAsFee: false,
      isTransferNativeTokenAndPayLocalTokenAsFee: false
    };

    maxTransferableAmount = await calculateXcmMaxTransferable(id, _request, freeBalance, fee);
  } else {
    maxTransferableAmount = await calculateTransferMaxTransferable(id, request, freeBalance, fee);
  }

  maxTransferableAmount.feePercentageSpecialCase = FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE;

  return maxTransferableAmount;
};

export const calculateTransferMaxTransferable = async (id: string, request: CalculateMaxTransferable, freeBalance: AmountData, fee: FeeInfo): Promise<ResponseSubscribeTransfer> => {
  const { address, destChain, evmApi, feeCustom, feeOption, isTransferLocalTokenAndPayThatTokenAsFee, isTransferNativeTokenAndPayLocalTokenAsFee, nativeToken, srcChain, srcToken, substrateApi, tonApi, value } = request;
  const feeChainType = fee.type;
  let estimatedFee: string;
  let feeOptions: FeeDetail;
  let maxTransferable: BigN;
  let error: string | undefined;

  const fakeAddress = '5DRewsYzhJqZXU3SRaWy1FSt5iDr875ao91aw5fjrJmDG4Ap'; // todo: move this
  const substrateAddress = fakeAddress; // todo: move this
  const evmAddress = u8aToHex(addressToEvm(fakeAddress)); // todo: move this

  const recipient = _isChainEvmCompatible(destChain) ? evmAddress : substrateAddress;

  try {
    let transaction: ValidateTransactionResponseInput['transaction'];

    if (isEthereumAddress(address) && isEthereumAddress(recipient) && _isTokenTransferredByEvm(srcToken)) {
      // todo: refactor: merge getERC20TransactionObject & getEVMTransactionObject
      // Estimate with EVM API
      if (_isTokenEvmSmartContract(srcToken) || _isLocalToken(srcToken)) {
        [transaction, , error] = await getERC20TransactionObject({
          assetAddress: _getContractAddressOfToken(srcToken),
          chain: srcChain.slug,
          evmApi,
          feeCustom,
          feeInfo: fee,
          feeOption,
          from: address,
          to: recipient,
          transferAll: false,
          value,
          fallbackFee: true
        });
      } else {
        [transaction, , error] = await getEVMTransactionObject({
          chain: srcChain.slug,
          evmApi,
          feeCustom,
          feeInfo: fee,
          feeOption,
          from: address,
          to: recipient,
          transferAll: false,
          value,
          fallbackFee: true
        });
      }
    } else if (isTonAddress(address) && _isTokenTransferredByTon(srcToken)) {
      [transaction] = await createTonTransaction({
        tokenInfo: srcToken,
        from: address,
        to: address,
        networkKey: srcChain.slug,
        value,
        transferAll: false, // currently not used
        tonApi
      });

    } else {
      [transaction] = await createSubstrateExtrinsic({
        transferAll: false,
        value,
        from: address,
        networkKey: srcChain.slug,
        tokenInfo: srcToken,
        to: recipient,
        substrateApi
      });
    }

    if (feeChainType === 'evm') {
      // Calculate fee for evm transaction
      const tx = transaction as TransactionConfig;

      const gasLimit = tx.gas?.toString() || (await evmApi.api.eth.estimateGas(tx)).toString();

      const _feeCustom = feeCustom as EvmEIP1559FeeOption;
      const combineFee = combineEthFee(fee, feeOption, _feeCustom);

      if (combineFee.maxFeePerGas) {
        estimatedFee = new BigN(combineFee.maxFeePerGas).multipliedBy(gasLimit).toFixed(0);
      } else {
        estimatedFee = new BigN(combineFee.gasPrice || '0').multipliedBy(gasLimit).toFixed(0);
      }

      feeOptions = {
        ...fee,
        estimatedFee,
        gasLimit: gasLimit.toString()
      };
    } else if (feeChainType === 'substrate') {
      // Calculate fee for substrate transaction
      try {
        const mockTx = transaction as SubmittableExtrinsic<'promise'>;
        const paymentInfo = await mockTx.paymentInfo(address);

        estimatedFee = paymentInfo?.partialFee?.toString() || '0';
      } catch (e) {
        estimatedFee = '0';
      }

      const _feeCustom = feeCustom as SubstrateTipInfo;

      const tip = combineSubstrateFee(fee, feeOption, _feeCustom).tip;

      estimatedFee = new BigN(estimatedFee).plus(tip).toFixed(0);

      feeOptions = {
        ...fee,
        estimatedFee
      };
    } else {
      if (transaction) {
        if (isTonTransaction(transaction)) {
          estimatedFee = transaction.estimateFee;
          feeOptions = {
            ...fee,
            estimatedFee: estimatedFee
          };

        } else {
          // Not implemented yet
          estimatedFee = '0';
          feeOptions = {
            ...fee,
            estimatedFee: '0'
          };
        }
      } else {
        // Not implemented yet
        estimatedFee = '0';
        feeOptions = {
          ...fee,
          estimatedFee: '0'
        };
      }
    }
  } catch (e) {
    estimatedFee = '0';

    if (fee.type === 'evm') {
      feeOptions = {
        ...fee,
        estimatedFee,
        gasLimit: '0'
      };
    } else {
      feeOptions = {
        ...fee,
        estimatedFee
      };
    }

    error = (e as Error).message || 'Unable to estimate fee';

    console.warn('Unable to estimate fee', e);
  }

  if (isTransferLocalTokenAndPayThatTokenAsFee && feeChainType === 'substrate') {
    if (_SUPPORT_TOKEN_PAY_FEE_GROUP.assetHub.includes(srcChain.slug)) {
      const estimatedFeeNative = (BigInt(estimatedFee) * BigInt(FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE) / BigInt(100)).toString();
      const estimatedFeeLocal = await calculateToAmountByReservePool(substrateApi.api, nativeToken, srcToken, estimatedFeeNative);

      maxTransferable = BigN(freeBalance.value).minus(estimatedFeeLocal);
    } else if (_SUPPORT_TOKEN_PAY_FEE_GROUP.hydration.includes(srcChain.slug)) {
      const rate = await getHydrationRate(address, nativeToken, srcToken);

      if (rate) {
        const estimatedFeeLocal = new BigN(estimatedFee).multipliedBy(rate).integerValue(BigN.ROUND_UP).toString();

        maxTransferable = BigN(freeBalance.value).minus(estimatedFeeLocal);
      } else {
        throw new Error(`Unable to estimate fee for ${srcChain.slug}.`);
      }
    } else {
      throw new Error(`Unable to estimate fee for ${srcChain.slug}.`);
    }
  } else if (isTransferNativeTokenAndPayLocalTokenAsFee) {
    maxTransferable = BigN(freeBalance.value);
  } else {
    if (!_isNativeToken(srcToken)) {
      maxTransferable = BigN(freeBalance.value);
    } else {
      maxTransferable = BigN(freeBalance.value).minus(new BigN(estimatedFee));
    }
  }

  return {
    maxTransferable: maxTransferable.gt(BN_ZERO) ? (maxTransferable.toFixed(0) || '0') : '0',
    feeOptions: feeOptions,
    feeType: feeChainType,
    id: id,
    error
  };
};

export const calculateXcmMaxTransferable = async (id: string, request: CalculateMaxTransferable, freeBalance: AmountData, fee: FeeInfo): Promise<ResponseSubscribeTransfer> => {
  const { address, destChain, destToken, evmApi, feeCustom, feeOption, isTransferLocalTokenAndPayThatTokenAsFee, isTransferNativeTokenAndPayLocalTokenAsFee, nativeToken, srcChain, srcToken, substrateApi, value } = request;
  const feeChainType = fee.type;
  let estimatedFee = '0';
  let feeOptions: FeeDetail;
  let maxTransferable: BigN;
  let error: string | undefined;

  const isAvailBridgeFromEvm = _isPureEvmChain(srcChain) && isAvailChainBridge(destChain.slug);
  const isAvailBridgeFromAvail = isAvailChainBridge(srcChain.slug) && _isPureEvmChain(destChain);
  const isSnowBridgeEvmTransfer = _isPureEvmChain(srcChain) && _isSnowBridgeXcm(srcChain, destChain) && !isAvailBridgeFromEvm;
  const isPolygonBridgeTransfer = _isPolygonChainBridge(srcChain.slug, destChain.slug);
  const isPosBridgeTransfer = _isPosChainBridge(srcChain.slug, destChain.slug);
  const isAcrossBridgeTransfer = _isAcrossChainBridge(srcChain.slug, destChain.slug);
  const isSubstrateXcm = !(isAvailBridgeFromEvm || isAvailBridgeFromAvail || isSnowBridgeEvmTransfer || isPolygonBridgeTransfer || isPosBridgeTransfer || isAcrossBridgeTransfer);

  const fakeAddress = '5DRewsYzhJqZXU3SRaWy1FSt5iDr875ao91aw5fjrJmDG4Ap'; // todo: move this
  const substrateAddress = fakeAddress; // todo: move this
  const evmAddress = u8aToHex(addressToEvm(fakeAddress)); // todo: move this
  const bnFreeBalance = new BigN(freeBalance.value);

  const recipient = _isChainEvmCompatible(destChain) ? evmAddress : substrateAddress;

  if (!destToken) {
    throw Error('Destination token is not available');
  }

  try {
    const params: CreateXcmExtrinsicProps = {
      destinationTokenInfo: destToken,
      originTokenInfo: srcToken,
      // If value is 0, substrate will throw error when estimating fee
      sendingValue: value,
      sender: address,
      recipient,
      destinationChain: destChain,
      originChain: srcChain,
      substrateApi,
      evmApi,
      feeCustom,
      feeOption,
      feeInfo: fee
    };

    let funcCreateExtrinsic: FunctionCreateXcmExtrinsic;

    if (isPosBridgeTransfer || isPolygonBridgeTransfer) {
      funcCreateExtrinsic = createPolygonBridgeExtrinsic;
    } else if (isAcrossBridgeTransfer) {
      funcCreateExtrinsic = createAcrossBridgeExtrinsic;

      if (_isAcrossTestnetBridge(srcChain.slug)) {
        params.sendingValue = BigN(0.0037).shiftedBy(_getAssetDecimals(srcToken)).toFixed(0, 1);
      } else {
        params.sendingValue = BigN(1).shiftedBy(_getAssetDecimals(srcToken)).toFixed(0, 1);
      }
    } else if (isSnowBridgeEvmTransfer) {
      funcCreateExtrinsic = createSnowBridgeExtrinsic;
    } else if (isAvailBridgeFromEvm) {
      funcCreateExtrinsic = createAvailBridgeTxFromEth;
    } else if (isAvailBridgeFromAvail) {
      funcCreateExtrinsic = createAvailBridgeExtrinsicFromAvail;
    } else {
      funcCreateExtrinsic = createXcmExtrinsicV2;
      params.sendingValue = '1';
    }

    const extrinsic = await funcCreateExtrinsic(params);

    // todo: refactor condition
    if (feeChainType === 'evm') {
      // Calculate fee for evm transaction
      const tx = extrinsic as TransactionConfig;

      const gasLimit = tx.gas?.toString() || (await evmApi.api.eth.estimateGas(tx)).toString();

      const _feeCustom = feeCustom as EvmEIP1559FeeOption;
      const combineFee = combineEthFee(fee, feeOption, _feeCustom);

      if (combineFee.maxFeePerGas) {
        estimatedFee = new BigN(combineFee.maxFeePerGas).multipliedBy(gasLimit).toFixed(0);
      } else {
        estimatedFee = new BigN(combineFee.gasPrice || '0').multipliedBy(gasLimit).toFixed(0);
      }

      feeOptions = {
        ...fee,
        estimatedFee,
        gasLimit: gasLimit.toString()
      };
    } else if (feeChainType === 'substrate') {
      // Calculate fee for substrate transaction
      if (isSubstrateXcm) {
        const estimatedFeeByDryRun = await dryRunXcmExtrinsicV2(params);

        estimatedFee = estimatedFeeByDryRun.fee || '0';
      } else {
        try {
          const paymentInfo = await (extrinsic as SubmittableExtrinsic<'promise'>).paymentInfo(address);

          estimatedFee = paymentInfo?.partialFee?.toString() || '0';
        } catch (e) {
          estimatedFee = '0';
        }
      }

      const _feeCustom = feeCustom as SubstrateTipInfo;

      const tip = combineSubstrateFee(fee, feeOption, _feeCustom).tip;

      estimatedFee = new BigN(estimatedFee).plus(tip).toFixed(0);

      feeOptions = {
        ...fee,
        estimatedFee
      };
    } else {
      // Not implemented yet
      estimatedFee = '0';
      feeOptions = {
        ...fee,
        estimatedFee: '0'
      };
    }
  } catch (e) {
    estimatedFee = '0';

    if (fee.type === 'evm') {
      feeOptions = {
        ...fee,
        estimatedFee,
        gasLimit: '0'
      };
    } else {
      feeOptions = {
        ...fee,
        estimatedFee
      };
    }

    error = (e as Error).message || 'Unable to estimate fee';

    console.warn('Unable to estimate fee', e);
  }

  if (!destToken) {
    maxTransferable = BN_ZERO;
  } else if (isTransferLocalTokenAndPayThatTokenAsFee && feeChainType === 'substrate') {
    if (_SUPPORT_TOKEN_PAY_FEE_GROUP.assetHub.includes(srcChain.slug)) {
      const estimatedFeeNative = (BigInt(estimatedFee) * BigInt(FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE) / BigInt(100)).toString();
      const estimatedFeeLocal = await calculateToAmountByReservePool(substrateApi.api, nativeToken, srcToken, estimatedFeeNative);

      maxTransferable = bnFreeBalance.minus(estimatedFeeLocal);
    } else if (_SUPPORT_TOKEN_PAY_FEE_GROUP.hydration.includes(srcChain.slug)) {
      const rate = await getHydrationRate(address, nativeToken, srcToken);

      if (rate) {
        const estimatedFeeLocal = new BigN(estimatedFee).multipliedBy(rate).integerValue(BigN.ROUND_UP).toString();

        maxTransferable = bnFreeBalance.minus(estimatedFeeLocal);
      } else {
        throw new Error(`Unable to estimate fee for ${srcChain.slug}.`);
      }
    } else {
      throw new Error(`Unable to estimate fee for ${srcChain.slug}.`);
    }
  } else if (isTransferNativeTokenAndPayLocalTokenAsFee) {
    maxTransferable = bnFreeBalance;
  } else {
    if (!_isNativeToken(srcToken)) {
      maxTransferable = bnFreeBalance;
    } else {
      maxTransferable = bnFreeBalance.minus(BigN(estimatedFee).multipliedBy(XCM_FEE_RATIO));
    }
  }

  if (isAvailBridgeFromAvail) {
    const addedAmount = BigN(1).shiftedBy(_getAssetDecimals(srcToken));

    maxTransferable = maxTransferable.minus(addedAmount);
  }

  return {
    maxTransferable: maxTransferable.gt(BN_ZERO) ? maxTransferable.toFixed(0) : '0',
    feeOptions: feeOptions,
    feeType: feeChainType,
    id: id,
    error
  };
};
