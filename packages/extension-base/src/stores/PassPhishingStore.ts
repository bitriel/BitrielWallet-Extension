// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PassPhishing } from '@bitriel/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';

export default class PassPhishingStore extends SubscribableStore<Record<string, PassPhishing>> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}subwallet-pass-phishing-list` : null);
  }
}
