// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuyService, OnrampAccountSupportType, SupportService } from '@bitriel/extension-base/types';

interface _BuyTokenInfo {
  serviceInfo: Record<string, BuyService & { isSuspended: boolean }>;
  network: string;
  slug: string;
  symbol: string;
  support: OnrampAccountSupportType;
}

interface _BuyServiceInfo {
  id: number;
  name: string;
  contactUrl: string;
  termUrl: string;
  policyUrl: string;
  url: string;
  slug: SupportService;
}

export type ListBuyTokenResponse = _BuyTokenInfo[];
export type ListBuyServicesResponse = _BuyServiceInfo[];
