// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuyService, SupportService } from '@bitriel/extension-base/types';

const DEFAULT_BUY_SERVICE: BuyService = { symbol: '', network: '' };

export const DEFAULT_SERVICE_INFO: Record<SupportService, BuyService> = {
  transak: { ...DEFAULT_BUY_SERVICE },
  banxa: { ...DEFAULT_BUY_SERVICE },
  coinbase: { ...DEFAULT_BUY_SERVICE },
  onramper: { ...DEFAULT_BUY_SERVICE },
  moonpay: { ...DEFAULT_BUY_SERVICE },
  meld: { ...DEFAULT_BUY_SERVICE }
};
