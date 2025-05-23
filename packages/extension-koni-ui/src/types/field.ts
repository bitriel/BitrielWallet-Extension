// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrencyJson } from '@bitriel/extension-base/background/KoniTypes';
import { BalanceValueInfo } from '@bitriel/extension-koni-ui/types/balance';

export type TokenSelectorItemType = {
  name: string;
  slug: string;
  symbol: string;
  originChain: string;
  balanceInfo?: {
    isReady: boolean;
    isNotSupport: boolean;
    isTestnet: boolean;
    free: BalanceValueInfo;
    locked: BalanceValueInfo;
    total: BalanceValueInfo;
    currency?: CurrencyJson;
  };
  showBalance?: boolean;
};
