// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@bitriel/extension-base/services/migration-service/Base';

export default class MigrateSettings extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      return new Promise((resolve) => {
        this.state.getAuthorize((value) => {
          if (value) {
            const key = 'app.stellaswap.com';
            const stellaSwap = value[key];

            if (stellaSwap) {
              stellaSwap.currentNetworkMap.evm = 'moonbeam';
              value[key] = stellaSwap;

              this.state.setAuthorize(value, () => {
                resolve();
              });
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
}
