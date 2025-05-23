// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CURRENT_PAGE } from '@bitriel/extension-web-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@bitriel/extension-web-ui/constants/router';
import { RouteState } from '@bitriel/extension-web-ui/Popup/Root';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

export default function useDefaultNavigate () {
  const navigate = useNavigate();
  const [, setStorage] = useLocalStorage<string>(CURRENT_PAGE, '/');

  const goHome = useCallback(
    () => {
      navigate(DEFAULT_ROUTER_PATH);
      setStorage('/home/tokens');
    },
    [navigate, setStorage]
  );

  const goBack = useCallback(
    () => {
      navigate(RouteState.prevDifferentPathNum);
    },
    [navigate]
  );

  return {
    goHome,
    goBack
  };
}
