// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { _getAssetDecimals } from '@bitriel/extension-base/services/chain-service/utils';
import { SpecialYieldPoolInfo } from '@bitriel/extension-base/types';
import { BN_TEN } from '@bitriel/extension-base/utils';
import BigN from 'bignumber.js';

export const YIELD_EXTRINSIC_TYPES = [
  ExtrinsicType.MINT_VDOT,
  ExtrinsicType.MINT_LDOT,
  ExtrinsicType.MINT_SDOT,
  ExtrinsicType.MINT_QDOT,
  ExtrinsicType.MINT_STDOT,
  ExtrinsicType.REDEEM_QDOT,
  ExtrinsicType.REDEEM_SDOT,
  ExtrinsicType.REDEEM_VDOT,
  ExtrinsicType.REDEEM_LDOT,
  ExtrinsicType.REDEEM_STDOT,
  ExtrinsicType.JOIN_YIELD_POOL,
  ExtrinsicType.STAKING_CLAIM_REWARD,
  ExtrinsicType.STAKING_LEAVE_POOL
];

export const YIELD_POOL_STAT_REFRESH_INTERVAL = 90000;

export function convertDerivativeToOriginToken (amount: string, poolInfo: SpecialYieldPoolInfo, derivativeTokenInfo: _ChainAsset, originTokenInfo: _ChainAsset) {
  const derivativeDecimals = _getAssetDecimals(derivativeTokenInfo);
  const originDecimals = _getAssetDecimals(originTokenInfo);

  const exchangeRate = poolInfo.statistic?.assetEarning?.[0].exchangeRate || 1;
  const formattedAmount = new BigN(amount).dividedBy(BN_TEN.pow(derivativeDecimals)); // TODO: decimals
  const minAmount = formattedAmount.multipliedBy(exchangeRate);

  return minAmount.multipliedBy(BN_TEN.pow(originDecimals)).toFixed(0);
}
