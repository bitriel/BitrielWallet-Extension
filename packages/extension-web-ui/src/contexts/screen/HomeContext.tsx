// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { HomeContextType } from '@bitriel/extension-web-ui/types/context';
import BigN from 'bignumber.js';
import React from 'react';

export const HomeContext = React.createContext<HomeContextType>({
  accountBalance: {
    tokenBalanceMap: {},
    tokenGroupBalanceMap: {},
    totalBalanceInfo: {
      freeValue: new BigN(0),
      lockedValue: new BigN(0),
      convertedValue: new BigN(0),
      converted24hValue: new BigN(0),
      change: {
        value: new BigN(0),
        percent: new BigN(0)
      }
    }
  },
  tokenGroupStructure: {
    tokenGroupMap: {},
    sortedTokenGroups: [],
    sortedTokenSlugs: []
  }
});
