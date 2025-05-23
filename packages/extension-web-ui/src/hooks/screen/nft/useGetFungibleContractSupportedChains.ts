// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { _isChainSupportEvmERC20, _isChainSupportVFT, _isChainSupportWasmPSP22 } from '@bitriel/extension-base/services/chain-service/utils';
import { useChainInfoData } from '@bitriel/extension-web-ui/hooks';
import { useMemo } from 'react';

function filterFungibleContractTypes (chainInfoMap: Record<string, _ChainInfo>) {
  const filteredChainInfoMap: Record<string, _ChainInfo> = {};

  Object.values(chainInfoMap).forEach((chainInfo) => {
    if (_isChainSupportEvmERC20(chainInfo) || _isChainSupportWasmPSP22(chainInfo) || _isChainSupportVFT(chainInfo)) {
      filteredChainInfoMap[chainInfo.slug] = chainInfo;
    }
  });

  return filteredChainInfoMap;
}

export default function useGetFungibleContractSupportedChains (): Record<string, _ChainInfo> {
  const chainInfoMap = useChainInfoData().chainInfoMap;

  return useMemo(() => {
    return filterFungibleContractTypes(chainInfoMap);
  }, [chainInfoMap]);
}
