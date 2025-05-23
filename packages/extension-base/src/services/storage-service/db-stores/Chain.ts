// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IChain } from '@bitriel/extension-base/services/storage-service/databases';
import BaseStore from '@bitriel/extension-base/services/storage-service/db-stores/BaseStore';

export default class ChainStore extends BaseStore<IChain> {
  async getAll () {
    return this.table.toArray();
  }

  async removeChains (chains: string[]) {
    return this.table.where('slug').anyOfIgnoreCase(chains).delete();
  }
}
