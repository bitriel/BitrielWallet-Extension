// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@bitriel/extension-base/services/migration-service/Base';

export default class MigratePairData extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      return new Promise((resolve) => {
        try {
          this.state.keyringService.context.updateMetadataForPair();
        } catch (e) {
          console.error(e);
        }

        resolve();
      });
    } catch (e) {
      console.error(e);
    }
  }
}
