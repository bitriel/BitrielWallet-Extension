// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy } from '@bitriel/extension-base/types';

export const hasAnyAccountForMigration = (allAccountProxies: AccountProxy[]) => {
  for (const account of allAccountProxies) {
    if (account.isNeedMigrateUnifiedAccount) {
      return true;
    }
  }

  return false;
};
