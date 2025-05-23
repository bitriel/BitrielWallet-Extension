// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { GAS_PRICE_RATIO, NETWORK_MULTI_GAS_FEE } from '@bitriel/extension-base/constants';
import { _EvmApi } from '@bitriel/extension-base/services/chain-service/types';
import { estimateTokensForPool, getReserveForPool } from '@bitriel/extension-base/services/swap-service/handler/asset-hub/utils';
import { EvmEIP1559FeeOption, EvmFeeInfo, EvmFeeInfoCache, InfuraFeeInfo, InfuraThresholdInfo } from '@bitriel/extension-base/types';
import { BN_WEI, BN_ZERO } from '@bitriel/extension-base/utils';
import BigN from 'bignumber.js';

import { ApiPromise } from '@polkadot/api';

import { gasStation, POLYGON_GAS_INDEXER } from '../../balance-service/transfer/xcm/polygonBridge';

const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const INFURA_API_KEY_SECRET = process.env.INFURA_API_KEY_SECRET || '';
const INFURA_AUTH = 'Basic ' + Buffer.from(INFURA_API_KEY + ':' + INFURA_API_KEY_SECRET).toString('base64');

export const FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE = 105; // percentage
const EIP1559_MIN_PRIORITY_FEE = '1';

export const parseInfuraFee = (info: InfuraFeeInfo, threshold: InfuraThresholdInfo): EvmFeeInfo => {
  const base = new BigN(info.estimatedBaseFee).multipliedBy(BN_WEI);
  const thresholdBN = new BigN(threshold.busyThreshold).multipliedBy(BN_WEI);
  const busyNetwork = thresholdBN.gte(BN_ZERO) ? base.gt(thresholdBN) : false;

  return {
    busyNetwork,
    gasPrice: undefined,
    baseGasFee: base.toFixed(0),
    type: 'evm',
    options: {
      slow: {
        maxFeePerGas: new BigN(info.low.suggestedMaxFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP).toFixed(0),
        maxPriorityFeePerGas: new BigN(info.low.suggestedMaxPriorityFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP).toFixed(0),
        maxWaitTimeEstimate: info.low.maxWaitTimeEstimate || 0,
        minWaitTimeEstimate: info.low.minWaitTimeEstimate || 0
      },
      average: {
        maxFeePerGas: new BigN(info.medium.suggestedMaxFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP).toFixed(0),
        maxPriorityFeePerGas: new BigN(info.medium.suggestedMaxPriorityFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP).toFixed(0),
        maxWaitTimeEstimate: info.medium.maxWaitTimeEstimate || 0,
        minWaitTimeEstimate: info.medium.minWaitTimeEstimate || 0
      },
      fast: {
        maxFeePerGas: new BigN(info.high.suggestedMaxFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP).toFixed(0),
        maxPriorityFeePerGas: new BigN(info.high.suggestedMaxPriorityFeePerGas).multipliedBy(BN_WEI).integerValue(BigN.ROUND_UP).toFixed(0),
        maxWaitTimeEstimate: info.high.maxWaitTimeEstimate || 0,
        minWaitTimeEstimate: info.high.minWaitTimeEstimate || 0
      },
      default: busyNetwork ? 'average' : 'slow'
    }
  };
};

export const fetchInfuraFeeData = async (chainId: number, infuraAuth?: string): Promise<EvmFeeInfo | null> => {
  const baseUrl = 'https://gas.api.infura.io/networks/{{chainId}}/suggestedGasFees';
  const baseThressholdUrl = 'https://gas.api.infura.io/networks/{{chainId}}/busyThreshold';
  // const baseFeeHistoryUrl = 'https://gas.api.infura.io/networks/{{chainId}}/baseFeeHistory';
  // const baseFeePercentileUrl = 'https://gas.api.infura.io/networks/{{chainId}}/baseFeePercentile';
  const feeUrl = baseUrl.replaceAll('{{chainId}}', chainId.toString());
  const thressholdUrl = baseThressholdUrl.replaceAll('{{chainId}}', chainId.toString());

  try {
    const [feeResp, thressholdResp] = await Promise.all([feeUrl, thressholdUrl].map((url) => {
      return fetch(url, {
        method: 'GET',
        headers: {
          Authorization: INFURA_AUTH
        }
      });
    }));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [feeInfo, thresholdInfo]: [InfuraFeeInfo, InfuraThresholdInfo] = await Promise.all([
      feeResp.json(),
      thressholdResp.json()]);

    return parseInfuraFee(feeInfo, thresholdInfo);
  } catch (e) {
    console.warn(e);

    return null;
  }
};

export const fetchSubWalletFeeData = async (chainId: number, networkKey: string): Promise<EvmFeeInfo | null> => {
  return await new Promise<EvmFeeInfo | null>((resolve) => {
    const baseUrl = 'https://api-cache.subwallet.app/sw-evm-gas/{{chain}}';
    const url = baseUrl.replaceAll('{{chain}}', networkKey);

    // TODO: Update the logo to follow the new estimateFee format or move the logic to the backend
    fetch(url,
      {
        method: 'GET'
      })
      .then((rs) => {
        return rs.json();
      })
      .then((info: EvmFeeInfoCache) => {
        resolve(info);
      })
      .catch((e) => {
        console.warn(e);
        resolve(null);
      });
  });
};

export const fetchOnlineFeeData = async (chainId: number, networkKey: string, useInfura = false): Promise<EvmFeeInfo | null> => {
  return await new Promise<EvmFeeInfo | null>((resolve) => {
    const fetchFunction = useInfura ? fetchInfuraFeeData : fetchSubWalletFeeData;

    fetchFunction(chainId, networkKey)
      .then((info) => {
        resolve(info);
      })
      .catch((e) => {
        console.warn(e);
        resolve(null);
      });
  });
};

export const recalculateGasPrice = (_price: string, chain: string) => {
  const needMulti = NETWORK_MULTI_GAS_FEE.includes(chain) || NETWORK_MULTI_GAS_FEE.includes('*');

  return needMulti ? new BigN(_price).multipliedBy(GAS_PRICE_RATIO).toFixed(0) : _price;
};

export const getEIP1559GasFee = (
  baseFee: BigN,
  maxPriorityFee: BigN,
  blockNumber: number,
  blockTime: number
): EvmEIP1559FeeOption => {
  // https://www.blocknative.com/blog/eip-1559-fees
  const maxFee = baseFee.multipliedBy(1.2).plus(maxPriorityFee);

  return {
    maxFeePerGas: maxFee.toFixed(0),
    maxPriorityFeePerGas: maxPriorityFee.toFixed(0),
    minWaitTimeEstimate: blockTime * (blockNumber - 2),
    maxWaitTimeEstimate: blockTime * blockNumber
  };
};

export const calculateGasFeeParams = async (web3: _EvmApi, networkKey: string, useOnline = true, useInfura = true): Promise<EvmFeeInfo> => {
  if (useOnline) {
    try {
      const chainId = await web3.api.eth.getChainId();

      const onlineData = await fetchOnlineFeeData(chainId, networkKey, useInfura);

      if (onlineData) {
        return onlineData;
      }
    } catch (e) {

    }
  }

  try {
    if (networkKey === 'polygonzkEvm_cardona' || networkKey === 'polygonZkEvm') {
      const isTestnet = networkKey === 'polygonzkEvm_cardona';
      const gasDomain = isTestnet ? POLYGON_GAS_INDEXER.TESTNET : POLYGON_GAS_INDEXER.MAINNET;
      const gasResponse = await fetch(`${gasDomain}`).then((res) => res.json()) as gasStation;
      const gasPriceInWei = gasResponse.standard * 1e9 + 200000;

      return {
        type: 'evm',
        gasPrice: gasPriceInWei.toString(),
        baseGasFee: undefined,
        busyNetwork: false,
        options: undefined
      };
    }

    const numBlock = 20;
    const rewardPercent: number[] = [25, 50, 75];

    const history = await web3.api.eth.getFeeHistory(numBlock, 'latest', rewardPercent);

    const currentBlock = history.oldestBlock - 1;
    const [newBlock, oldBlock] = await Promise.all([
      web3.api.eth.getBlock(currentBlock),
      web3.api.eth.getBlock(currentBlock - numBlock)
    ]);
    const blockTime = Number((BigInt(newBlock.timestamp || 0) - BigInt(oldBlock.timestamp || 0)) / BigInt(numBlock) * BigInt(1000));
    const baseGasFee = new BigN(history.baseFeePerGas[history.baseFeePerGas.length - 1]); // Last element is latest

    const blocksBusy = history.reward.reduce((previous: number, rewards, currentIndex) => {
      const [firstPriority] = rewards;
      const base = history.baseFeePerGas[currentIndex];

      const priorityBN = new BigN(firstPriority);
      const baseBN = new BigN(base);

      /*
      * True if priority >= 0.3 * base
      *  */
      const blockIsBusy = baseBN.gt(BN_ZERO)
        ? (priorityBN.dividedBy(baseBN).gte(0.3) ? 1 : 0)
        : 0; // Special for bsc, base fee = 0

      return previous + blockIsBusy;
    }, 0);

    const busyNetwork = blocksBusy >= (numBlock / 2); // True, if half of block is busy

    const slowPriorityFee = history.reward.reduce((previous, rewards) => previous.plus(rewards[0]), BN_ZERO).dividedBy(numBlock).decimalPlaces(0);
    const averagePriorityFee = history.reward.reduce((previous, rewards) => previous.plus(rewards[1]), BN_ZERO).dividedBy(numBlock).decimalPlaces(0);
    const fastPriorityFee = history.reward.reduce((previous, rewards) => previous.plus(rewards[2]), BN_ZERO).dividedBy(numBlock).decimalPlaces(0);

    if (slowPriorityFee.eq(0) && averagePriorityFee.eq(0) && fastPriorityFee.eq(0)) {
      throw new Error('Fee rates are currently same for all levels');
    }

    return {
      type: 'evm',
      gasPrice: undefined,
      baseGasFee: baseGasFee.toString(),
      busyNetwork,
      options: {
        slow: enforceMinOneTip(getEIP1559GasFee(baseGasFee, slowPriorityFee, 10, blockTime)),
        average: enforceMinOneTip(getEIP1559GasFee(baseGasFee, averagePriorityFee, 5, blockTime)),
        fast: enforceMinOneTip(getEIP1559GasFee(baseGasFee, fastPriorityFee, 3, blockTime)),
        default: busyNetwork ? 'average' : 'slow'
      }
    };
  } catch (e) {
    const _price = await web3.api.eth.getGasPrice();
    const gasPrice = recalculateGasPrice(_price, networkKey);

    return {
      type: 'evm',
      busyNetwork: false,
      gasPrice,
      baseGasFee: undefined,
      options: undefined
    };
  }
};

export const enforceMinOneTip = (feeOptionDetail: EvmEIP1559FeeOption): EvmEIP1559FeeOption => {
  if (feeOptionDetail.maxPriorityFeePerGas === '0') {
    feeOptionDetail.maxPriorityFeePerGas = EIP1559_MIN_PRIORITY_FEE;

    return feeOptionDetail;
  }

  return feeOptionDetail;
};

export const calculateToAmountByReservePool = async (api: ApiPromise, fromToken: _ChainAsset, toToken: _ChainAsset, fromAmount: string): Promise<string> => {
  const reserve = await getReserveForPool(api, fromToken, toToken);

  return estimateTokensForPool(fromAmount, reserve);
};
