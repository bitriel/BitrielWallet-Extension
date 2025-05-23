// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { CurrencyJson } from '@bitriel/extension-base/background/KoniTypes';
import { PalletNominationPoolsBondedPoolInner, YieldPositionInfo } from '@bitriel/extension-base/types';
import { NominationPoolInfo, ValidatorInfo } from '@bitriel/extension-base/types/yield/info/chain/target';
import { InfoItemBase } from '@bitriel/extension-koni-ui/components';
import { BalanceValueInfo } from '@bitriel/extension-koni-ui/types/balance';
import { PhosphorIcon } from '@bitriel/extension-koni-ui/types/index';
import { SwIconProps } from '@subwallet/react-ui';

export type NominationPoolState = Pick<PalletNominationPoolsBondedPoolInner, 'state'>;
export interface EarningStatusUiProps {
  schema: InfoItemBase['valueColorSchema'];
  icon: PhosphorIcon;
  name: string;
}

export enum EarningEntryView {
  OPTIONS= 'options',
  POSITIONS= 'positions',
}

export type ExtraYieldPositionInfo = YieldPositionInfo & {
  asset: _ChainAsset;
  price: number;
  currency?: CurrencyJson;
  // exchangeRate: number;
  subnetData?: { // for Subnet staking
    subnetSymbol: string;
    subnetShortName: string;
  }
}

export interface YieldGroupInfo {
  maxApy?: number;
  group: string;
  symbol: string;
  token: string;
  balance: BalanceValueInfo;
  isTestnet: boolean;
  name?: string;
  chain: string;
  poolListLength: number;
  poolSlugs: string[];
  assetSlugs: string[]
}

export interface EarningTagType {
  label: string;
  icon: PhosphorIcon;
  color: string;
  weight: SwIconProps['weight'];
}

export interface NominationPoolDataType extends NominationPoolInfo {
  symbol: string;
  decimals: number;
  idStr: string;
  isRecommend?: boolean;
  disabled?: boolean
  isSessionHeader?: boolean
}

export interface ValidatorDataType extends ValidatorInfo {
  symbol: string;
  decimals: number;
}
export enum NetworkType {
  MAIN_NETWORK = 'MAIN_NETWORK',
  TEST_NETWORK = 'TEST_NETWORK',
}

export type PoolTargetData = NominationPoolDataType | ValidatorDataType;
