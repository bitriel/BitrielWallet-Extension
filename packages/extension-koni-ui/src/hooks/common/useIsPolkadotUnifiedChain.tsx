// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from '@bitriel/extension-koni-ui/hooks';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { useCallback } from 'react';

const useIsPolkadotUnifiedChain = () => {
  const chainOldPrefixMap = useSelector((state: RootState) => state.chainStore.chainOldPrefixMap);

  return useCallback((chainSlug?: string): boolean => {
    if (!chainSlug) {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(chainOldPrefixMap, chainSlug);
  }, [chainOldPrefixMap]);
};

export default useIsPolkadotUnifiedChain;
