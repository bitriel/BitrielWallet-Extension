// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestParseTransactionSubstrate, RequestQrSignEvm, RequestQrSignSubstrate, ResponseAccountIsLocked, ResponseParseTransactionSubstrate, ResponseQrParseRLP, ResponseQrSignEvm, ResponseQrSignSubstrate } from '@bitriel/extension-base/background/KoniTypes';

import { sendMessage } from '../base';

export async function accountIsLocked (address: string): Promise<ResponseAccountIsLocked> {
  return sendMessage('pri(account.isLocked)', { address });
}

export async function qrSignSubstrate (request: RequestQrSignSubstrate): Promise<ResponseQrSignSubstrate> {
  return sendMessage('pri(qr.sign.substrate)', request);
}

export async function qrSignEvm (request: RequestQrSignEvm): Promise<ResponseQrSignEvm> {
  return sendMessage('pri(qr.sign.evm)', request);
}

export async function parseSubstrateTransaction (request: RequestParseTransactionSubstrate): Promise<ResponseParseTransactionSubstrate> {
  return sendMessage('pri(qr.transaction.parse.substrate)', request);
}

export async function parseEVMTransaction (data: string): Promise<ResponseQrParseRLP> {
  return sendMessage('pri(qr.transaction.parse.evm)', { data });
}
