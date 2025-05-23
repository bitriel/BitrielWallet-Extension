// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AbstractAddressJson } from '@bitriel/extension-base/types';
import { findNetworkJsonByGenesisHash, reformatAddress } from '@bitriel/extension-web-ui/utils';
import { useCallback } from 'react';

import { useSelector } from '../common';

const useFormatAddress = (addressPrefix?: number) => {
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  return useCallback((item: AbstractAddressJson): string => {
    let addPrefix = 42;

    if (addressPrefix !== undefined) {
      addPrefix = addressPrefix;
    }

    if ('originGenesisHash' in item) {
      const originGenesisHash = item.originGenesisHash as string;
      const network = findNetworkJsonByGenesisHash(chainInfoMap, originGenesisHash);

      if (network) {
        addPrefix = network.substrateInfo?.addressPrefix ?? addPrefix;
      }
    }

    return reformatAddress(item.address, addPrefix);
  }, [addressPrefix, chainInfoMap]);
};

export default useFormatAddress;
