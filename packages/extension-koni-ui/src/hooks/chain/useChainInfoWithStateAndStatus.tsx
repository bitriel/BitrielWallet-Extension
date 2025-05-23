// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainApiStatus } from '@bitriel/extension-base/services/chain-service/types';
import { ChainInfoWithState, useChainInfoWithState } from '@bitriel/extension-koni-ui/hooks';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export type ChainInfoWithStateAndStatus = ChainInfoWithState & _ChainApiStatus;

export function useChainInfoWithStateAndStatus ({ filterStatus = true } = {} as {filterStatus?: boolean}): ChainInfoWithStateAndStatus[] {
  const chainInfoList = useChainInfoWithState({ filterStatus });
  const chainStatusMap = useSelector((state: RootState) => state.chainStore.chainStatusMap);

  const chainInfoListWithStatus: ChainInfoWithStateAndStatus[] = useMemo(() => {
    return chainInfoList.map((item) => {
      return { ...item, ...(chainStatusMap[item.slug] || {}) };
    });
  }, [chainInfoList, chainStatusMap]);

  return chainInfoListWithStatus;
}

export default useChainInfoWithStateAndStatus;
