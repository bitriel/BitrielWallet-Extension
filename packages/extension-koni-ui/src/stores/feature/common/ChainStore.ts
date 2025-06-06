// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { _ChainInfo } from '@bitriel/chain-list/types';
import { TokenPriorityDetails } from '@bitriel/extension-base/background/KoniTypes';
import { _ChainApiStatus, _ChainState } from '@bitriel/extension-base/services/chain-service/types';
import { ChainStore, ReduxStatus } from '@bitriel/extension-koni-ui/stores/types';

const initialState: ChainStore = {
  chainInfoMap: {},
  chainStateMap: {},
  chainStatusMap: {},
  ledgerGenericAllowNetworks: [],
  priorityTokens: { tokenGroup: {}, token: {} },
  chainOldPrefixMap: {},
  reduxStatus: ReduxStatus.INIT
};

const chainStoreSlice = createSlice({
  initialState,
  name: 'chainStore',
  reducers: {
    updateChainInfoMap (state, action: PayloadAction<Record<string, _ChainInfo>>) {
      const { payload } = action;

      return {
        ...state,
        chainInfoMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateChainStateMap (state, action: PayloadAction<Record<string, _ChainState>>) {
      const { payload } = action;

      return {
        ...state,
        chainStateMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateChainStatusMap (state, action: PayloadAction<Record<string, _ChainApiStatus>>) {
      const { payload } = action;

      return {
        ...state,
        chainStatusMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateLedgerGenericAllowNetworks (state, action: PayloadAction<string[]>) {
      const { payload } = action;

      return {
        ...state,
        ledgerGenericAllowNetworks: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updatePriorityTokens (state, action: PayloadAction<TokenPriorityDetails>) {
      const { payload } = action;

      return {
        ...state,
        priorityTokens: payload,
        reduxStatus: ReduxStatus.READY
      };
    },
    updateChainOldPrefixMap (state, action: PayloadAction<Record<string, number>>) {
      const { payload } = action;

      return {
        ...state,
        chainOldPrefixMap: payload,
        reduxStatus: ReduxStatus.READY
      };
    }
  }
});

export const { updateChainInfoMap, updateChainStateMap } = chainStoreSlice.actions;
export default chainStoreSlice.reducer;
