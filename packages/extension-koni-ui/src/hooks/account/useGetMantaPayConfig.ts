// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaPayConfig } from '@bitriel/extension-base/background/KoniTypes';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useGetMantaPayConfig = (address?: string) => {
  const configs = useSelector((state: RootState) => state.mantaPay.configs);

  return useMemo((): MantaPayConfig | undefined => {
    if (!address) {
      return undefined;
    } else {
      for (const config of configs) {
        if (config.address === address) {
          return config;
        }
      }

      return undefined;
    }
  }, [address, configs]);
};
