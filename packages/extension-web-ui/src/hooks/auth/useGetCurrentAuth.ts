// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {AuthUrlInfo} from "@bitriel/extension-base/services/request-service/types";
import { useGetCurrentTab } from '@bitriel/extension-web-ui/hooks/auth/useGetCurrentTab';
import { RootState } from '@bitriel/extension-web-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useGetCurrentAuth = () => {
  const currentTab = useGetCurrentTab();
  const currentUrl = currentTab?.url;

  const authUrls = useSelector((state: RootState) => state.settings.authUrls);

  return useMemo((): AuthUrlInfo | undefined => {
    let rs: AuthUrlInfo | undefined;

    if (currentUrl) {
      for (const auth of Object.values(authUrls)) {
        if (currentUrl.includes(auth.id)) {
          rs = auth;
          break;
        }
      }
    }

    return rs;
  }, [currentUrl, authUrls]);
};
