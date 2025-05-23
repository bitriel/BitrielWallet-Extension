// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BalanceMap } from '@bitriel/extension-base/types';
import { BalanceStore, ReduxStatus } from '@bitriel/extension-koni-ui/stores/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

const initialState: BalanceStore = {
  balanceMap: {},
  reduxStatus: ReduxStatus.INIT
};

const balanceSlice = createSlice({
  initialState,
  name: 'balance',
  reducers: {
    update (state, action: PayloadAction<BalanceMap>) {
      const payload = action.payload;

      return {
        balanceMap: { ...payload },
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { update } = balanceSlice.actions;
export default balanceSlice.reducer;
