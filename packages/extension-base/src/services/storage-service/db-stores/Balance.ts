// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceItem } from '@bitriel/extension-base/types';

import { IBalance } from '../databases';
import BaseStoreWithAddress from '../db-stores/BaseStoreWithAddress';

export default class BalanceStore extends BaseStoreWithAddress<IBalance> {
  async getBalanceMapByAddresses (addresses: string): Promise<BalanceItem[]> {
    return this.table.where('address').anyOf(addresses).toArray();
  }

  async getBalanceHasAmount (address: string, chain: string): Promise<BalanceItem[]> {
    return this.table.filter((item) => item.address === address && item.free !== '0' && item.tokenSlug.startsWith(chain)).toArray();
  }

  async removeBySlugs (tokenSlugs: string[]) {
    return this.table.where('tokenSlug').anyOfIgnoreCase(tokenSlugs).delete();
  }

  async removeByAddresses (addresses: string[]) {
    return this.table.where('address').anyOfIgnoreCase(addresses).delete();
  }

  async checkBalanceByTokens (tokens: string[], filterFunc: (i: IBalance) => boolean) {
    return this.table.where('tokenSlug').anyOfIgnoreCase(tokens).filter(filterFunc).count();
  }

  async checkBalanceExist (filterFunc: (x: IBalance) => boolean) {
    return this.table.filter((item) => filterFunc(item)).count();
  }
}
