// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';

export interface ChainlistConfig {
  patchVersion: string
}

export default class ChainlistStore extends SubscribableStore<ChainlistConfig> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}chainlist` : null);
  }
}
