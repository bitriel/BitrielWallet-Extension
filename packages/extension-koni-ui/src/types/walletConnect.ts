// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountChainType } from '@bitriel/extension-base/types';
import { ChainInfo } from '@bitriel/extension-koni-ui/types/chain';

export interface WalletConnectChainInfo {
  chainInfo: ChainInfo | null;
  slug: string;
  supported: boolean;
  accountType?: AccountChainType;
  wcChain: string;
}
