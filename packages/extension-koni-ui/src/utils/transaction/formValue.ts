// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy } from '@bitriel/extension-base/types';
import { isAccountAll } from '@bitriel/extension-koni-ui/utils';

export const getTransactionFromAccountProxyValue = (currentAccountProxy: AccountProxy | null): string => {
  return currentAccountProxy?.id ? isAccountAll(currentAccountProxy.id) ? '' : currentAccountProxy.id : '';
};
