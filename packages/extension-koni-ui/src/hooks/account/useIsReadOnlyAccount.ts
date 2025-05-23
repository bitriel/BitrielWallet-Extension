// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { findAccountByAddress } from '@bitriel/extension-koni-ui/utils';
import { useMemo } from 'react';

import { useSelector } from '../common';

const useIsReadOnlyAccount = (address?: string): boolean => {
  const { accounts } = useSelector((state) => state.accountState);

  return useMemo(() => {
    const account = findAccountByAddress(accounts, address);

    return !!account?.isReadOnly;
  }, [accounts, address]);
};

export default useIsReadOnlyAccount;
