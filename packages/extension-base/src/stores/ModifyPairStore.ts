// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';
import { ModifyPairStoreData } from '@bitriel/extension-base/types';

export default class ModifyPairStore extends SubscribableStore<ModifyPairStoreData> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}pair_modify` : null);
  }
}
