// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy } from '@bitriel/extension-base/types';
import { useReformatAddress, useSelector } from '@bitriel/extension-koni-ui/hooks';
import { AccountChainAddress } from '@bitriel/extension-koni-ui/types';
import { getChainsByAccountType } from '@bitriel/extension-koni-ui/utils';
import { useMemo } from 'react';

// todo:
//  - order the result
const useGetAccountChainAddresses = (accountProxy: AccountProxy): AccountChainAddress[] => {
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const getReformatAddress = useReformatAddress();

  return useMemo(() => {
    const result: AccountChainAddress[] = [];
    const chains: string[] = getChainsByAccountType(chainInfoMap, accountProxy.chainTypes, accountProxy.specialChain);

    accountProxy.accounts.forEach((a) => {
      for (const chain of chains) {
        const chainInfo = chainInfoMap[chain];
        const reformatedAddress = getReformatAddress(a, chainInfo);

        if (reformatedAddress) {
          result.push({
            name: chainInfo.name,
            slug: chainInfo.slug,
            address: reformatedAddress,
            accountType: a.type
          });
        }
      }
    });

    return result;
  }, [accountProxy, chainInfoMap, getReformatAddress]);
};

export default useGetAccountChainAddresses;
