// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import BaseStore from '@bitriel/extension-base/services/storage-service/db-stores/BaseStore';

export default class AssetStore extends BaseStore<_ChainAsset> {
  async getAll () {
    return this.table.toArray();
  }

  async removeAssets (keys: string[]) {
    return this.table.where('slug').anyOfIgnoreCase(keys).delete();
  }
}
