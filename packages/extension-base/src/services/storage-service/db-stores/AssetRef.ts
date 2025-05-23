// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IAssetRef } from '@bitriel/extension-base/services/storage-service/databases';
import BaseStore from '@bitriel/extension-base/services/storage-service/db-stores/BaseStore';
import { liveQuery } from 'dexie';

export default class AssetRefStore extends BaseStore<IAssetRef> {
  async getAll () {
    return this.table.toArray();
  }

  async getAssetRef (slug: string) {
    return this.table.get(slug);
  }

  subscribeAssetRef () {
    return liveQuery(
      async () => (await this.table.toArray())
    );
  }
}
