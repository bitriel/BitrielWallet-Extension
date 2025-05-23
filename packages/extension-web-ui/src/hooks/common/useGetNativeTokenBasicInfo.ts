// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTokenInfo } from '@bitriel/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo } from '@bitriel/extension-base/services/chain-service/utils';
import { RootState } from '@bitriel/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useGetNativeTokenBasicInfo (chainSlug: string): BasicTokenInfo {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);

  return useMemo(() => {
    const chainInfo = chainInfoMap[chainSlug];

    return _getChainNativeTokenBasicInfo(chainInfo);
  }, [chainInfoMap, chainSlug]);
}
