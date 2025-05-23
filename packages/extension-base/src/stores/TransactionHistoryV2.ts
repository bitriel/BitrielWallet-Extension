// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TxHistoryItem } from '@bitriel/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';

export default class TransactionHistoryStoreV2 extends SubscribableStore<Record<string, TxHistoryItem[]>> {
  constructor () {
    super(`${EXTENSION_PREFIX}transaction`);
  }
}
