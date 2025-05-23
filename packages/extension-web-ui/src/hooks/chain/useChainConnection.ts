// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { enableChain } from '@bitriel/extension-web-ui/messaging';
import { useCallback } from 'react';

import { useSelector } from '../common/useSelector';

export default function useChainConnection () {
  const chainStateMap = useSelector((root) => root.chainStore.chainStateMap);

  const checkChainConnected = useCallback(
    (chain: string) => {
      const chainState = chainStateMap[chain];

      if (!chainState) {
        // Couldn't get chain state
        return false;
      }

      return chainState.active;
    },
    [chainStateMap]
  );

  const turnOnChain = useCallback(
    (chain: string) => {
      enableChain(chain, false)
        .catch(console.error);
    },
    []
  );

  return { turnOnChain, checkChainConnected };
}
