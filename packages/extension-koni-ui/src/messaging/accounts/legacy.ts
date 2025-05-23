// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountsWithCurrentAddress, RequestInputAccountSubscribe, ResponseInputAccountSubscribe } from '@bitriel/extension-base/types';

import { sendMessage } from '../base';

export async function subscribeAccountsWithCurrentAddress (cb: (data: AccountsWithCurrentAddress) => void): Promise<AccountsWithCurrentAddress> {
  return sendMessage('pri(accounts.subscribeWithCurrentProxy)', {}, cb);
}

export async function subscribeAccountsInputAddress (request: RequestInputAccountSubscribe, cb: (data: ResponseInputAccountSubscribe) => void): Promise<ResponseInputAccountSubscribe> {
  return sendMessage('pri(accounts.subscribeAccountsInputAddress)', request, cb);
}
