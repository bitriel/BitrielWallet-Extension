// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@bitriel/extension-base/types';
import { isAccountAll } from '@bitriel/extension-web-ui/utils';

export const transactionDefaultFilterAccount = (account: AccountJson): boolean => !(isAccountAll(account.address) || account.isReadOnly);
