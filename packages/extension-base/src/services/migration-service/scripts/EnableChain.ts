// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@bitriel/extension-base/services/migration-service/Base';

export default abstract class EnableChain extends BaseMigrationJob {
  abstract slug: string;

  public override async run (): Promise<void> {
    const state = this.state;

    await state.enableChainWithPriorityAssets(this.slug, true);
  }
}
