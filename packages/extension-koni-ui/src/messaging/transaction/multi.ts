// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResponse } from '@bitriel/extension-base/services/transaction-service/types';
import { RequestSubmitProcessTransaction, RequestSubscribeProcessById, ResponseSubscribeProcessById } from '@bitriel/extension-base/types';

import { sendMessage } from '../base';

export async function submitProcess (request: RequestSubmitProcessTransaction): Promise<SWTransactionResponse> {
  return sendMessage('pri(process.transaction.submit)', request);
}

export async function subscribeProcess (request: RequestSubscribeProcessById, cb: (data: ResponseSubscribeProcessById) => void): Promise<ResponseSubscribeProcessById> {
  return sendMessage('pri(process.subscribe.id)', request, cb);
}
