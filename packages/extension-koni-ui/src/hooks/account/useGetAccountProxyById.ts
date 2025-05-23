// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy } from '@bitriel/extension-base/types';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetAccountProxyById = (id?: string): AccountProxy | null => {
  const accountProxies = useSelector((state: RootState) => state.accountState.accountProxies);

  return useMemo((): AccountProxy | null => {
    return accountProxies.find((ap) => ap.id === id) || null;
  }, [accountProxies, id]);
};

export default useGetAccountProxyById;
