// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@bitriel/extension-base/background/KoniTypes';

export function isAbleToShowFee (item: TransactionHistoryItem): boolean {
  return !!(item.fee && item.fee.value && item.fee.value !== '0');
}
