// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InjectedAccountWithMeta } from '@bitriel/extension-inject/types';
import { sendMessage } from '@bitriel/extension-web-ui/messaging/base';

export async function addInjects (accounts: InjectedAccountWithMeta[]): Promise<boolean> {
  return sendMessage('pri(accounts.inject.add)', { accounts });
}

export async function removeInjects (addresses: string[]): Promise<boolean> {
  return sendMessage('pri(accounts.inject.remove)', { addresses });
}
