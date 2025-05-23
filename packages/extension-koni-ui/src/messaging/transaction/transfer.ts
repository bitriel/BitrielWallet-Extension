// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData, RequestMaxTransferable } from '@bitriel/extension-base/background/KoniTypes';
import { RequestOptimalTransferProcess } from '@bitriel/extension-base/services/balance-service/helpers';
import { TokenPayFeeInfo } from '@bitriel/extension-base/services/fee-service/interfaces';
import { SWTransactionResponse } from '@bitriel/extension-base/services/transaction-service/types';
import { CommonOptimalTransferPath, RequestCrossChainTransfer, RequestGetAmountForPair, RequestGetTokensCanPayFee, TokenSpendingApprovalParams } from '@bitriel/extension-base/types';
import { RequestSubmitTransfer, RequestSubscribeTransfer, ResponseSubscribeTransfer } from '@bitriel/extension-base/types/balance/transfer';

import { sendMessage } from '../base';

export async function makeTransfer (request: RequestSubmitTransfer): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.transfer)', request);
}

export async function makeCrossChainTransfer (request: RequestCrossChainTransfer): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.crossChainTransfer)', request);
}

export async function approveSpending (request: TokenSpendingApprovalParams): Promise<SWTransactionResponse> {
  return sendMessage('pri(accounts.approveSpending)', request);
}

export async function getMaxTransfer (request: RequestMaxTransferable): Promise<AmountData> {
  return sendMessage('pri(transfer.getMaxTransferable)', request);
}

export async function subscribeMaxTransfer (request: RequestSubscribeTransfer, callback: (data: ResponseSubscribeTransfer) => void): Promise<ResponseSubscribeTransfer> {
  return sendMessage('pri(transfer.subscribe)', request, callback);
}

export async function getOptimalTransferProcess (request: RequestOptimalTransferProcess): Promise<CommonOptimalTransferPath> {
  return sendMessage('pri(accounts.getOptimalTransferProcess)', request);
}

export async function getTokensCanPayFee (request: RequestGetTokensCanPayFee): Promise<TokenPayFeeInfo> { // can set a default fee to ED of native token
  return sendMessage('pri(customFee.getTokensCanPayFee)', request);
}

export async function getAmountForPair (request: RequestGetAmountForPair): Promise<string> {
  return sendMessage('pri(customFee.getAmountForPair)', request);
}
