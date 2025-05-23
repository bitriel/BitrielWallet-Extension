// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignBanner } from '@bitriel/extension-base/background/KoniTypes';
import { CampaignStore, ReduxStatus } from '@bitriel/extension-koni-ui/stores/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

const initialState: CampaignStore = {
  banners: [],
  isPopupVisible: true,
  reduxStatus: ReduxStatus.INIT
};

const campaignSlice = createSlice({
  initialState,
  name: 'campaign',
  reducers: {
    updateBanner (state, action: PayloadAction<CampaignBanner[]>) {
      return {
        ...state,
        banners: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updatePopupVisibility (state, action: PayloadAction<boolean>) {
      return {
        ...state,
        isPopupVisible: action.payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateBanner, updatePopupVisibility } = campaignSlice.actions;
export default campaignSlice.reducer;
