// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ModifyPairStore } from '@bitriel/extension-base/stores';
import { ModifyPairStoreData } from '@bitriel/extension-base/types';
import { BehaviorSubject } from 'rxjs';

import { StoreSubject } from './Base';

export class ModifyPairStoreSubject extends StoreSubject<ModifyPairStoreData> {
  store = new ModifyPairStore();
  subject = new BehaviorSubject<ModifyPairStoreData>({});
  key = 'ModifyPairs';
  defaultValue = {};
}
