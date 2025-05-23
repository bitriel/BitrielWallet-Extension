// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CurrencyType } from '@bitriel/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';

export default class CurrentCurrencyStore extends SubscribableStore<CurrencyType> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}current_currency` : null);
  }
}
