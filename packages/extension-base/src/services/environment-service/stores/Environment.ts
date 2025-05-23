// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { EnvConfig } from '@bitriel/extension-base/constants';
import { StoreSubject } from '@bitriel/extension-base/services/keyring-service/context/stores/Base';
import { EnvironmentStore } from '@bitriel/extension-base/stores';
import { BehaviorSubject } from 'rxjs';

export class EnvironmentStoreSubject extends StoreSubject<EnvConfig> {
  store = new EnvironmentStore();
  subject = new BehaviorSubject<EnvConfig>({});
  key = 'Environment';
  defaultValue = {};
}
