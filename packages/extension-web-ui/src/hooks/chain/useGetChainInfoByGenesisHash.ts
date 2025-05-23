// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@bitriel/extension-web-ui/stores';
import { findChainInfoByGenesisHash } from '@bitriel/extension-web-ui/utils/chain/chain';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetChainInfoByGenesisHash = (genesisHash?: string) => {
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);

  return useMemo(() => findChainInfoByGenesisHash(chainInfoMap, genesisHash), [chainInfoMap, genesisHash]);
};

export default useGetChainInfoByGenesisHash;
