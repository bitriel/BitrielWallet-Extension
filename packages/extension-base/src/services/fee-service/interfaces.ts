// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { ChainService } from '@bitriel/extension-base/services/chain-service';
import { _SubstrateApi } from '@bitriel/extension-base/services/chain-service/types';
import { BalanceItem } from '@bitriel/extension-base/types';

export interface TokenHasBalanceInfo {
  slug: string;
  free: string;
  rate: string; // rate = payFeeToken / nativeToken
}

export interface TokenPayFeeInfo {
  tokensCanPayFee: TokenHasBalanceInfo[];
  defaultTokenSlug: string;
}

export interface RequestAssetHubTokensCanPayFee {
  substrateApi: _SubstrateApi;
  chainService: ChainService;
  nativeTokenInfo: _ChainAsset;
  nativeBalanceInfo: TokenHasBalanceInfo;
  tokensHasBalanceInfoMap: Record<string, BalanceItem>;
  feeAmount?: string
}

export interface RequestHydrationTokensCanPayFee {
  substrateApi: _SubstrateApi;
  chainService: ChainService;
  nativeTokenInfo: _ChainAsset;
  nativeBalanceInfo: TokenHasBalanceInfo;
  tokensHasBalanceInfoMap: Record<string, BalanceItem>;
  address: string;
  feeAmount?: string;
}
