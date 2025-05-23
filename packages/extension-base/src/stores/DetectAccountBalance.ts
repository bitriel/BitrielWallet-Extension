// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DetectBalanceCache } from '@bitriel/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';

export default class DetectAccountBalanceStore extends SubscribableStore<DetectBalanceCache> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}DetectBalanceCache` : null);
  }
}
