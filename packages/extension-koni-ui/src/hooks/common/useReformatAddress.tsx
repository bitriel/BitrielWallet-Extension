// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { AccountJson } from '@bitriel/extension-base/types';
import { getReformatedAddressRelatedToChain } from '@bitriel/extension-koni-ui/utils';
import { useCallback } from 'react';

const useReformatAddress = () => {
  return useCallback((accountJson: AccountJson, chainInfo: _ChainInfo): string | undefined => {
    return getReformatedAddressRelatedToChain(accountJson, chainInfo);
  }, []);
};

export default useReformatAddress;
