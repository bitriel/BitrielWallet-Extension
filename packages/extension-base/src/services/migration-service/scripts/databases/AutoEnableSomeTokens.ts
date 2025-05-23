// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AssetSetting } from '@bitriel/extension-base/background/KoniTypes';
import BaseMigrationJob from '@bitriel/extension-base/services/migration-service/Base';

export default class AutoEnableSomeTokens extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      const slugs = ['statemint-NATIVE-DOT', 'statemint-LOCAL-DED', 'statemint-LOCAL-PINK', 'moonbeam-LOCAL-xcDOT', 'moonbeam-LOCAL-xcPINK'];

      const migratedAssetSetting: Record<string, AssetSetting> = {};

      for (const slug of slugs) {
        migratedAssetSetting[slug] = { visible: true };

        await this.state.chainService.updateAssetSetting(slug, { visible: true }, true);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
