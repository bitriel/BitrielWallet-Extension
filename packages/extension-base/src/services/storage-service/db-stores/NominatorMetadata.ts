// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata } from '@bitriel/extension-base/background/KoniTypes';
import BaseStoreWithAddressAndChain from '@bitriel/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';
import { EarningStatus } from '@bitriel/extension-base/types';
import { liveQuery } from 'dexie';

export default class NominatorMetadataStore extends BaseStoreWithAddressAndChain<NominatorMetadata> {
  async getAll () {
    return this.table.filter((item) => item.status !== EarningStatus.NOT_STAKING).toArray();
  }

  subscribeByAddresses (addresses: string[]) {
    return liveQuery(
      () => this.getByAddress(addresses)
    );
  }

  subscribeAll () {
    return liveQuery(
      () => this.getAll()
    );
  }

  getByAddress (addresses: string[]) {
    return this.table.where('address').anyOfIgnoreCase(addresses).and((item) => item.status !== EarningStatus.NOT_STAKING).toArray();
  }

  async removeByAddress (address: string) {
    return this.table.where('address').anyOfIgnoreCase(address).delete();
  }
}
