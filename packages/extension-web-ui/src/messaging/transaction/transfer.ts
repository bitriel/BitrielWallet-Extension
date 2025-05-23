// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData, RequestMaxTransferable } from '@bitriel/extension-base/background/KoniTypes';
import { RequestOptimalTransferProcess } from '@bitriel/extension-base/services/balance-service/helpers';
import { SWTransactionResponse } from '@bitriel/extension-base/services/transaction-service/types';
import { RequestCrossChainTransfer, RequestTransfer, TokenSpendingApprovalParams } from '@bitriel/extension-base/types';
import { CommonOptimalTransferPath } from '@bitriel/extension-base/types/service-base';

import { sendMessage } from '../base';

export async function makeTransfer (request: RequestTransfer): Promise<SWTransactionResponse> {
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

export async function getOptimalTransferProcess (request: RequestOptimalTransferProcess): Promise<CommonOptimalTransferPath> {
  return sendMessage('pri(accounts.getOptimalTransferProcess)', request);
}
