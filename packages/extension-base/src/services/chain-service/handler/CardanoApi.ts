// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CardanoAddressBalance, CardanoBalanceItem, CardanoUtxosItem, TransactionUtxosItem } from '@bitriel/extension-base/services/balance-service/helpers/subscribe/cardano/types';
import { cborToBytes, retryCardanoTxStatus } from '@bitriel/extension-base/services/balance-service/helpers/subscribe/cardano/utils';
import { _ApiOptions } from '@bitriel/extension-base/services/chain-service/handler/types';
import { _CardanoApi, _ChainConnectionStatus } from '@bitriel/extension-base/services/chain-service/types';
import { createPromiseHandler, PromiseHandler } from '@bitriel/extension-base/utils';
import { BehaviorSubject } from 'rxjs';

import { hexAddPrefix, isHex } from '@polkadot/util';

export const API_KEY = {
  mainnet: process.env.BLOCKFROST_API_KEY_MAIN || '',
  testnet: process.env.BLOCKFROST_API_KEY_PREP || ''
};

export class CardanoApi implements _CardanoApi {
  chainSlug: string;
  // private api: BlockFrostAPI;
  apiUrl: string;
  apiError?: string;
  apiRetry = 0;
  public readonly isApiConnectedSubject = new BehaviorSubject(false);
  public readonly connectionStatusSubject = new BehaviorSubject(_ChainConnectionStatus.DISCONNECTED);
  isApiReady = false;
  isApiReadyOnce = false;
  isReadyHandler: PromiseHandler<_CardanoApi>;
  isTestnet: boolean; // todo: add api with interface BlockFrostAPI to remove isTestnet check
  private projectId: string;

  providerName: string;

  constructor (chainSlug: string, apiUrl: string, { isTestnet, providerName }: _ApiOptions) {
    this.chainSlug = chainSlug;
    this.apiUrl = apiUrl;
    this.isTestnet = isTestnet ?? true;
    this.projectId = isTestnet ? API_KEY.testnet : API_KEY.mainnet;
    this.providerName = providerName || 'unknown';
    // this.api = this.createProvider(isTestnet);
    this.isReadyHandler = createPromiseHandler<_CardanoApi>();

    this.connect();
  }

  get isApiConnected (): boolean {
    return this.isApiConnectedSubject.getValue();
  }

  get connectionStatus (): _ChainConnectionStatus {
    return this.connectionStatusSubject.getValue();
  }

  private updateConnectionStatus (status: _ChainConnectionStatus): void {
    const isConnected = status === _ChainConnectionStatus.CONNECTED;

    if (isConnected !== this.isApiConnectedSubject.value) {
      this.isApiConnectedSubject.next(isConnected);
    }

    if (status !== this.connectionStatusSubject.value) {
      this.connectionStatusSubject.next(status);
    }
  }

  get isReady (): Promise<_CardanoApi> {
    return this.isReadyHandler.promise;
  }

  async updateApiUrl (apiUrl: string) {
    if (this.apiUrl === apiUrl) {
      return;
    }

    await this.disconnect();

    this.apiUrl = apiUrl;
    // this.api = this.createProvider();
  }

  async recoverConnect () {
    await this.disconnect();
    this.connect();

    await this.isReadyHandler.promise;
  }

  // private createProvider (isTestnet = true): BlockFrostAPI {
  //   const projectId = isTestnet ? API_KEY.testnet : API_KEY.mainnet;
  //
  //   return new BlockFrostAPI({
  //     projectId
  //   });
  // }

  connect (): void {
    this.updateConnectionStatus(_ChainConnectionStatus.CONNECTING);
    // There isn't a persistent network connection underlying TonClient. Cant check connection status.
    // this.isApiReadyOnce = true;
    this.onConnect();
  }

  async disconnect () {
    this.onDisconnect();
    this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);

    return Promise.resolve();
  }

  destroy () {
    // Todo: implement this in the future
    return this.disconnect();
  }

  onConnect (): void {
    if (!this.isApiConnected) {
      console.log(`Connected to ${this.chainSlug} at ${this.apiUrl}`);
      this.isApiReady = true;

      if (this.isApiReadyOnce) {
        this.isReadyHandler.resolve(this);
      }
    }

    this.updateConnectionStatus(_ChainConnectionStatus.CONNECTED);
  }

  onDisconnect (): void {
    this.updateConnectionStatus(_ChainConnectionStatus.DISCONNECTED);

    if (this.isApiConnected) {
      console.warn(`Disconnected from ${this.chainSlug} of ${this.apiUrl}`);
      this.isApiReady = false;
      this.isReadyHandler = createPromiseHandler<_CardanoApi>();
    }
  }

  async getBalanceMap (address: string): Promise<CardanoBalanceItem[]> {
    try {
      const url = this.isTestnet ? `https://cardano-preprod.blockfrost.io/api/v0/addresses/${address}` : `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`;
      const response = await fetch(
        url, {
          method: 'GET',
          headers: {
            Project_id: this.projectId
          }
        }
      );

      const addressBalance = await response.json() as CardanoAddressBalance;

      return addressBalance.amount;
    } catch (e) {
      console.error('Error on getting account balance', e);

      return [];
    }
  }

  async getUtxos (address: string, page: number, limit: number): Promise<CardanoUtxosItem[]> {
    try {
      let url = this.isTestnet ? `https://cardano-preprod.blockfrost.io/api/v0/addresses/${address}/utxos` : `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/utxos`;

      url += `?page=${page}&count=${limit}`;
      const response = await fetch(
        url, {
          method: 'GET',
          headers: {
            Project_id: this.projectId
          }
        }
      );

      const utxos = await response.json() as CardanoUtxosItem[];

      return utxos;
    } catch (e) {
      console.error('Error on getting account balance', e);

      return [];
    }
  }

  async getSpecificUtxo (txHash: string): Promise<TransactionUtxosItem> {
    try {
      const url = this.isTestnet ? `https://cardano-preprod.blockfrost.io/api/v0/txs/${txHash}/utxos` : `https://cardano-mainnet.blockfrost.io/api/v0/txs/${txHash}/utxos`;
      const response = await fetch(
        url, {
          method: 'GET',
          headers: {
            Project_id: this.projectId
          }
        }
      );

      const utxo = await response.json() as TransactionUtxosItem;

      return utxo;
    } catch (e) {
      console.error('Error on getting account balance', e);

      return {} as TransactionUtxosItem;
    }
  }

  async sendCardanoTxReturnHash (tx: string): Promise<string> {
    try {
      const url = this.isTestnet ? 'https://cardano-preprod.blockfrost.io/api/v0/tx/submit' : 'https://cardano-mainnet.blockfrost.io/api/v0/tx/submit';
      const response = await fetch(
        url, {
          method: 'POST',
          headers: {
            Project_id: this.projectId,
            'Content-Type': 'application/cbor'
          },
          body: cborToBytes(tx)
        }
      );

      const hash = (await response.text()).replace(/^"|"$/g, '');

      if (isHex(hexAddPrefix(hash))) {
        return hash;
      } else {
        console.error('Error on submitting cardano tx');

        return '';
      }
    } catch (e) {
      console.error('Error on submitting cardano tx', e);

      return '';
    }
  }

  async getStatusByTxHash (txHash: string, ttl: number): Promise<boolean> {
    const cronTime = 30000;

    return retryCardanoTxStatus(async () => {
      const url = this.isTestnet ? `https://cardano-preprod.blockfrost.io/api/v0/txs/${txHash}` : `https://cardano-mainnet.blockfrost.io/api/v0/txs/${txHash}`;
      const response = await fetch(
        url, {
          method: 'GET',
          headers: {
            Project_id: this.projectId
          }
        }
      );

      const txInfo = await response.json() as { hash: string, block: string, index: number };

      if (txInfo.block && txInfo.hash && txInfo.index >= 0) {
        return true;
      }

      throw new Error('Transaction not found');
    }, { retries: ttl / cronTime, delay: cronTime });
  }
}
