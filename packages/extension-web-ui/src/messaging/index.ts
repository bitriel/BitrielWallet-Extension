// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { WindowOpenParams } from '@bitriel/extension-base/background/types';

import { CronReloadRequest, Notification, RequestGetTransaction, RequestParseEvmContractInput, ResponseParseEvmContractInput, ResponseSubscribeHistory, TransactionHistoryItem } from '@bitriel/extension-base/background/KoniTypes';
import { CrowdloanContributionsResponse } from '@bitriel/extension-base/services/subscan-service/types';
import { SWTransactionResult } from '@bitriel/extension-base/services/transaction-service/types';
import { sendMessage } from '@bitriel/extension-web-ui/messaging/base';

export async function windowOpen (params: WindowOpenParams): Promise<boolean> {
  return sendMessage('pri(window.open)', params);
}

export async function parseEVMTransactionInput (request: RequestParseEvmContractInput): Promise<ResponseParseEvmContractInput> {
  return sendMessage('pri(evm.transaction.parse.input)', request);
}

export async function getTransaction (request: RequestGetTransaction): Promise<SWTransactionResult> {
  return sendMessage('pri(transactions.getOne)', request);
}

export async function subscribeNotifications (callback: (rs: Notification[]) => void): Promise<Notification[]> {
  return sendMessage('pri(notifications.subscribe)', null, callback);
}

export async function reloadCron (request: CronReloadRequest): Promise<boolean> {
  return sendMessage('pri(cron.reload)', request);
}

// Phishing page
export async function passPhishingPage (url: string): Promise<boolean> {
  return sendMessage('pri(phishing.pass)', { url });
}

export async function getCrowdloanContributions (relayChain: string, address: string, page?: number): Promise<CrowdloanContributionsResponse> {
  return sendMessage('pri(crowdloan.getCrowdloanContributions)', { relayChain,
    address,
    page });
}

export async function cancelSubscription (request: string): Promise<boolean> {
  return sendMessage('pri(subscription.cancel)', request);
}

export async function subscribeTransactionHistory (chain: string, address: string, callback: (items: TransactionHistoryItem[]) => void): Promise<ResponseSubscribeHistory> {
  return sendMessage('pri(transaction.history.subscribe)', { address, chain }, callback);
}

export * from './accounts';
export * from './base';
export * from './confirmation';
export * from './keyring';
export * from './manta-pay';
export * from './metadata';
export * from './qr-signer';
export * from './settings';
export * from './transaction';
export * from './WalletConnect';
export * from './database';
