// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { _getSubstrateGenesisHash } from '@bitriel/extension-base/services/chain-service/utils';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useChainInfo (slug?: string, genesisHash?: string | null): _ChainInfo | null {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const networkInfo = useMemo(() => {
    if (!slug && !genesisHash) {
      return null;
    } else if (slug) {
      return chainInfoMap[slug] || null;
    } else {
      return Object.values(chainInfoMap).find((info) => _getSubstrateGenesisHash(info) === genesisHash) || null;
    }
  },
  [chainInfoMap, genesisHash, slug]);

  return networkInfo;
}
