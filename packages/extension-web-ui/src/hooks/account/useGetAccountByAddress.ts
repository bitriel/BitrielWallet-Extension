// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@bitriel/extension-base/types';
import { RootState } from '@bitriel/extension-web-ui/stores';
import { findAccountByAddress } from '@bitriel/extension-web-ui/utils/account/account';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetAccountByAddress = (address?: string): AccountJson | null => {
  const accounts = useSelector((state: RootState) => state.accountState.accounts);

  return useMemo((): AccountJson | null => {
    return findAccountByAddress(accounts, address);
  }, [accounts, address]);
};

export default useGetAccountByAddress;
