// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BuyServiceInfo, BuyTokenInfo } from '@bitriel/extension-base/types';
import { BuyServiceStore, ReduxStatus } from '@bitriel/extension-koni-ui/stores/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

const initialState: BuyServiceStore = {
  tokens: {},
  services: {},
  reduxStatus: ReduxStatus.INIT
};

const buyServiceSlice = createSlice({
  initialState,
  name: 'buyService',
  reducers: {
    updateBuyTokens (state, action: PayloadAction<Record<string, BuyTokenInfo>>): BuyServiceStore {
      return {
        ...state,
        tokens: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateBuyServices (state, action: PayloadAction<Record<string, BuyServiceInfo>>): BuyServiceStore {
      return {
        ...state,
        services: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateBuyServices, updateBuyTokens } = buyServiceSlice.actions;
export default buyServiceSlice.reducer;
