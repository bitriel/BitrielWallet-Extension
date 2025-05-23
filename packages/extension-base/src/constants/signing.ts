// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainType } from '@bitriel/extension-base/background/KoniTypes';
import { AccountChainType } from '@bitriel/extension-base/types';

export const SIGNING_COMPATIBLE_MAP: Record<ChainType, AccountChainType[]> = {
  [ChainType.SUBSTRATE]: [AccountChainType.SUBSTRATE, AccountChainType.ETHEREUM],
  [ChainType.EVM]: [AccountChainType.ETHEREUM],
  [ChainType.BITCOIN]: [AccountChainType.BITCOIN],
  [ChainType.TON]: [AccountChainType.TON],
  [ChainType.CARDANO]: [AccountChainType.CARDANO]
};

export const LEDGER_SIGNING_COMPATIBLE_MAP: Record<ChainType, AccountChainType[]> = {
  [ChainType.SUBSTRATE]: [AccountChainType.SUBSTRATE],
  [ChainType.EVM]: [AccountChainType.ETHEREUM],
  [ChainType.BITCOIN]: [AccountChainType.BITCOIN],
  [ChainType.TON]: [AccountChainType.TON],
  [ChainType.CARDANO]: [AccountChainType.CARDANO]
};
