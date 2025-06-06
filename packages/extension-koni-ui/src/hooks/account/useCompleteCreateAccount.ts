// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_ROUTER_PATH } from '@bitriel/extension-koni-ui/constants/router';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { isNoAccount } from '@bitriel/extension-koni-ui/utils/account/account';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const useCompleteCreateAccount = () => {
  const navigate = useNavigate();

  const { accounts } = useSelector((state: RootState) => state.accountState);

  const [noAccount] = useState(isNoAccount(accounts));

  return useCallback(() => {
    if (noAccount) {
      navigate('/create-done');
    } else {
      navigate(DEFAULT_ROUTER_PATH);
    }
  }, [navigate, noAccount]);
};

export default useCompleteCreateAccount;
