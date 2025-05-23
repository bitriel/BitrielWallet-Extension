// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Chain } from '@bitriel/extension-chains/types';
import { ChainProps } from '@bitriel/extension-koni-ui/types';

export const convertChainToChainProps = (chain: Chain): ChainProps => {
  return {
    base58prefix: chain.ss58Format,
    decimals: chain.tokenDecimals,
    unit: chain.tokenSymbol
  };
};
