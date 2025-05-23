// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _isCustomAsset } from '@bitriel/extension-base/services/chain-service/utils';
import BaseMigrationJob from '@bitriel/extension-base/services/migration-service/Base';

export default class MigrateTokenDecimals extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;

    return new Promise((resolve) => {
      const assetMap = state.getAssetRegistry();

      for (const [slug, info] of Object.entries(assetMap)) {
        if (_isCustomAsset(slug)) {
          state.chainService.upsertCustomToken({
            ...info,
            decimals: info.decimals ? parseInt(info.decimals.toString()) : info.decimals
          });
        }
      }

      resolve();
    });
  }
}
