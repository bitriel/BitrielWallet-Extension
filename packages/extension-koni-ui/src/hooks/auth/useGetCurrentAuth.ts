// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from '@bitriel/extension-base/services/request-service/types';
import { stripUrl } from '@bitriel/extension-base/utils';
import { useGetCurrentTab } from '@bitriel/extension-koni-ui/hooks/auth/useGetCurrentTab';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useGetCurrentAuth = () => {
  const currentTab = useGetCurrentTab();
  const currentUrl = currentTab?.url;

  const authUrls = useSelector((state: RootState) => state.settings.authUrls);

  return useMemo((): AuthUrlInfo | undefined => {
    let rs: AuthUrlInfo | undefined;

    if (currentUrl) {
      try {
        const url = stripUrl(currentUrl);

        rs = authUrls[url];
      } catch (e) {}
    }

    return rs;
  }, [currentUrl, authUrls]);
};
