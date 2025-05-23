// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PriceJson } from '@bitriel/extension-base/background/KoniTypes';
import { PriceStore } from '@bitriel/extension-koni-ui/stores/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit/dist';

const initialState = {
  currencyData: { label: 'United States Dollar', symbol: '$', isPrefix: false },
  currency: 'USD',
  priceMap: {},
  price24hMap: {},
  exchangeRateMap: {},
  ready: false
} as PriceStore;

const priceSlice = createSlice({
  initialState,
  name: 'price',
  reducers: {
    updatePrice (state, action: PayloadAction<PriceJson>) {
      return {
        ...action.payload
      };
    }
  }
});

export const { updatePrice } = priceSlice.actions;
export default priceSlice.reducer;
