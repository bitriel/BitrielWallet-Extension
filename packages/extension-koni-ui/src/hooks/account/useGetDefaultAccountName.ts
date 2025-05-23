// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RootState } from '@bitriel/extension-koni-ui/stores';
import { isAccountAll } from '@bitriel/extension-koni-ui/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

const useGetDefaultAccountName = () => {
  const { accounts } = useSelector((state: RootState) => state.accountState);

  return useMemo(() => {
    const filtered = accounts.filter((account) => !isAccountAll(account.address));

    return `Account ${filtered.length + 1}`;
  }, [accounts]);
};

export default useGetDefaultAccountName;
