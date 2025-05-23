// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useGetAccountByAddress from '@bitriel/extension-web-ui/hooks/account/useGetAccountByAddress';
import { AccountSignMode } from '@bitriel/extension-web-ui/types/account';
import { getSignMode } from '@bitriel/extension-web-ui/utils/account/account';
import { useMemo } from 'react';

const useGetAccountSignModeByAddress = (address?: string): AccountSignMode => {
  const account = useGetAccountByAddress(address);

  return useMemo((): AccountSignMode => {
    return getSignMode(account);
  }, [account]);
};

export default useGetAccountSignModeByAddress;
