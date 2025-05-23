// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LedgerNetwork, MigrationLedgerNetwork } from '@bitriel/extension-base/background/KoniTypes';
import { PredefinedLedgerNetwork, PredefinedMigrationLedgerNetwork } from '@bitriel/extension-koni-ui/constants/ledger';
import { useMemo } from 'react';

const useGetSupportedLedger = () => {
  return useMemo<[LedgerNetwork[], MigrationLedgerNetwork[]]>(() => [[...PredefinedLedgerNetwork], [...PredefinedMigrationLedgerNetwork]], []);
};

export default useGetSupportedLedger;
