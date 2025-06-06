// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIViewState } from '@bitriel/extension-base/background/KoniTypes';
import { ReduxStatus } from '@bitriel/extension-koni-ui/stores/types';

const initialState: UIViewState = {
  isUILocked: false
};

const uiViewSlice = createSlice({
  initialState,
  name: 'uiViewState',
  reducers: {
    updateUIViewState (state, action: PayloadAction<UIViewState>) {
      const payload = action.payload;

      return {
        ...state,
        ...payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateUIViewState } = uiViewSlice.actions;
export default uiViewSlice.reducer;
