// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { _isChainSupportEvmNft, _isChainSupportWasmNft } from '@bitriel/extension-base/services/chain-service/utils';
import { useChainInfoData } from '@bitriel/extension-web-ui/hooks';
import { useMemo } from 'react';

function filterNftContractTypes (chainInfoMap: Record<string, _ChainInfo>) {
  const filteredChainInfoMap: Record<string, _ChainInfo> = {};

  Object.values(chainInfoMap).forEach((chainInfo) => {
    if (_isChainSupportEvmNft(chainInfo) || _isChainSupportWasmNft(chainInfo)) {
      filteredChainInfoMap[chainInfo.slug] = chainInfo;
    }
  });

  return filteredChainInfoMap;
}

export default function useGetNftContractSupportedChains (): Record<string, _ChainInfo> {
  const chainInfoMap = useChainInfoData().chainInfoMap;

  return useMemo(() => {
    return filterNftContractTypes(chainInfoMap);
  }, [chainInfoMap]);
}
