// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { EnvConfig } from '@bitriel/extension-base/constants';
import { EXTENSION_PREFIX } from '@bitriel/extension-base/defaults';
import SubscribableStore from '@bitriel/extension-base/stores/SubscribableStore';

export default class EnvironmentStore extends SubscribableStore<EnvConfig> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}environment` : null);
  }
}
