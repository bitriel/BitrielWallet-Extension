// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountChainType } from './account';

export interface BuyService {
  network: string;
  symbol: string;
}

export type SupportService = 'transak' | 'banxa' | 'coinbase' | 'moonpay' | 'onramper' | 'meld';

export type OnrampAccountSupportType = 'ETHEREUM' | 'SUBSTRATE';

export interface BuyTokenInfo {
  network: string;
  symbol: string;
  slug: string;
  support: AccountChainType;
  services: Array<SupportService>;
  serviceInfo: Record<SupportService, BuyService>;
}

export interface BuyServiceInfo {
  name: string;
  contactUrl: string;
  termUrl: string;
  policyUrl: string;
  url: string;
}
