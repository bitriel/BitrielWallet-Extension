// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import subwalletApiSdk from '@bitriel/bitriel-api-sdk';
import { BalanceError } from '@bitriel/extension-base/background/errors/BalanceError';
import { AmountData, APIItemState, BalanceErrorType, DetectBalanceCache, ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@bitriel/extension-base/constants';
import { _isXcmWithinSameConsensus } from '@bitriel/extension-base/core/substrate/xcm-parser';
import KoniState from '@bitriel/extension-base/koni/background/handlers/State';
import { getAcrossbridgeTransferProcessFromEvm, getDefaultTransferProcess, getSnowbridgeTransferProcessFromEvm, RequestOptimalTransferProcess } from '@bitriel/extension-base/services/balance-service/helpers/process';
import { ServiceStatus, StoppableServiceInterface } from '@bitriel/extension-base/services/base/types';
import { _getChainNativeTokenSlug, _isNativeToken, _isPureEvmChain } from '@bitriel/extension-base/services/chain-service/utils';
import { EventItem, EventType } from '@bitriel/extension-base/services/event-service/types';
import DetectAccountBalanceStore from '@bitriel/extension-base/stores/DetectAccountBalance';
import { BalanceItem, BalanceJson, CommonOptimalTransferPath } from '@bitriel/extension-base/types';
import { addLazy, createPromiseHandler, isAccountAll, PromiseHandler, waitTimeout } from '@bitriel/extension-base/utils';
import { getKeypairTypeByAddress } from '@subwallet/keyring';
import { EthereumKeypairTypes, SubstrateKeypairTypes } from '@subwallet/keyring/types';
import keyring from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import { t } from 'i18next';
import { BehaviorSubject } from 'rxjs';

import { noop } from '@polkadot/util';

import { CreateXcmExtrinsicProps } from './transfer/xcm';
import { _isAcrossChainBridge, getAcrossQuote } from './transfer/xcm/acrossBridge';
import { BalanceMapImpl } from './BalanceMapImpl';
import { subscribeBalance } from './helpers';

/**
 * Balance service
 * @class
*/
export class BalanceService implements StoppableServiceInterface {
  private state: KoniState;
  private balanceMap: BalanceMapImpl;
  private balanceUpdateCache: BalanceItem[] = [];

  startPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  stopPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  private isReload = false;

  private readonly detectAccountBalanceStore = new DetectAccountBalanceStore();
  private readonly balanceDetectSubject: BehaviorSubject<DetectBalanceCache> = new BehaviorSubject<DetectBalanceCache>({});
  private readonly intervalTime = 3 * 60 * 1000;
  private readonly cacheTime = 15 * 60 * 1000;

  /**
   * @constructor
   * @param {KoniState} state - The state of extension.
   */
  constructor (state: KoniState) {
    this.state = state;
    this.balanceMap = new BalanceMapImpl(state);
  }

  /** Init service */
  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;
    await this.state.eventService.waitChainReady;
    await this.state.eventService.waitAccountReady;

    // Load data from db to balanceSubject
    await this.loadData();

    this.status = ServiceStatus.INITIALIZED;

    // Start service
    await this.start();

    // Handle events
    this.state.eventService.onLazy(this.handleEvents.bind(this));
  }

  /** Restore balance map */
  async loadData () {
    const backupBalanceData = await this.state.dbService.getStoredBalance();

    this.balanceMap.updateBalanceItems(backupBalanceData, ALL_ACCOUNT_KEY);
  }

  /** Start service */
  async start (): Promise<void> {
    if (this.status === ServiceStatus.STOPPING) {
      await this.waitForStopped();
    }

    if (this.status === ServiceStatus.STARTED || this.status === ServiceStatus.STARTING) {
      return await this.waitForStarted();
    }

    this.status = ServiceStatus.STARTING;

    await this.startScanBalance();

    // Run subscribe balance
    await this.runSubscribeBalances();

    // Update status
    this.stopPromiseHandler = createPromiseHandler();
    this.status = ServiceStatus.STARTED;
    this.startPromiseHandler.resolve();
  }

  /** Stop service */
  async stop (): Promise<void> {
    if (this.status === ServiceStatus.STARTING) {
      await this.waitForStarted();
    }

    if (this.status === ServiceStatus.STOPPED || this.status === ServiceStatus.STOPPING) {
      return await this.waitForStopped();
    }

    this.runUnsubscribeBalances();
    this.stopScanBalance();

    // Update status
    this.startPromiseHandler = createPromiseHandler();
    this.status = ServiceStatus.STOPPING;
    this.stopPromiseHandler.resolve();
  }

  /** Wait service start */
  waitForStarted (): Promise<void> {
    return this.startPromiseHandler.promise;
  }

  /** Wait service stop */
  waitForStopped (): Promise<void> {
    return this.stopPromiseHandler.promise;
  }

  /**
   *  Handle when data change
   *  */
  handleEvents (events: EventItem<EventType>[], eventTypes: EventType[]) {
    const removedAddresses: string[] = [];
    let needReload = false;

    let lazyTime = 2000;

    // Account changed or chain changed (active or inactive)
    if (eventTypes.includes('account.updateCurrent') || eventTypes.includes('account.add') || eventTypes.includes('chain.updateState') || eventTypes.includes('asset.updateState')) {
      needReload = true;

      if (eventTypes.includes('account.updateCurrent')) {
        lazyTime = 1000;
      }
    }

    events.forEach((event) => {
      if (event.type === 'account.remove' || event.type === 'accountProxy.remove') {
        removedAddresses.push(event.data[0] as string);
        lazyTime = 1000;
      }
    });

    if (removedAddresses.length > 0) {
      this.balanceMap.removeBalanceItems([...removedAddresses, ALL_ACCOUNT_KEY]); // Add all account key to recalculate all account balances
      needReload = true;
    }

    if (needReload) {
      addLazy('reloadBalanceByEvents', () => {
        if (!this.isReload) {
          this.runSubscribeBalances().catch(console.error);
        }
      }, lazyTime, undefined, true);
    }
  }

  public getBalanceDetectCache (update: (value: DetectBalanceCache) => void): void {
    this.detectAccountBalanceStore.get('DetectBalanceCache', (value) => {
      update(value);
    });
  }

  public setBalanceDetectCache (addresses: string[]): void {
    this.detectAccountBalanceStore.get('DetectBalanceCache', (value) => {
      const rs = { ...value };

      for (const address of addresses) {
        rs[address] = Date.now();
      }

      this.detectAccountBalanceStore.set('DetectBalanceCache', rs);
    });
  }

  /** Subscribe token free balance of an address on chain */
  public async subscribeBalance (
    address: string,
    chain: string,
    tokenSlug: string | undefined,
    balanceType: 'transferable' | 'total' | 'keepAlive' = 'transferable',
    extrinsicType?: ExtrinsicType,
    callback?: (rs: AmountData) => void
  ): Promise<[() => void, AmountData]> {
    const chainInfo = this.state.chainService.getChainInfoByKey(chain);
    const chainState = this.state.chainService.getChainStateByKey(chain);

    if (!chainInfo || !chainState || !chainState.active) {
      return Promise.reject(new BalanceError(BalanceErrorType.NETWORK_ERROR, t('{{chain}} is inactive. Please enable network', { replace: { chain: chainInfo.name } })));
    }

    const tSlug = tokenSlug || _getChainNativeTokenSlug(chainInfo);
    const tokenInfo = this.state.chainService.getAssetBySlug(tSlug);

    if (!tokenInfo) {
      return Promise.reject(new BalanceError(BalanceErrorType.TOKEN_ERROR, t('Transfer is currently not available for this token: {{tSlug}}', { replace: { slug: tSlug } })));
    }

    return new Promise((resolve, reject) => {
      let hasError = true;

      const assetMap = this.state.chainService.getAssetRegistry();
      const chainInfoMap = this.state.chainService.getChainInfoMap();
      const evmApiMap = this.state.chainService.getEvmApiMap();
      const substrateApiMap = this.state.chainService.getSubstrateApiMap();
      const tonApiMap = this.state.chainService.getTonApiMap();
      const cardanoApiMap = this.state.chainService.getCardanoApiMap();

      let unsub = noop;

      unsub = subscribeBalance([address], [chain], [tSlug], assetMap, chainInfoMap, substrateApiMap, evmApiMap, tonApiMap, cardanoApiMap, (result) => {
        const rs = result[0];

        let value: string;

        switch (balanceType) {
          case 'total':
            value = new BigN(rs.free).plus(new BigN(rs.locked)).toFixed();
            break;
          default:
            value = rs.free;
        }

        if (rs.tokenSlug === tSlug && rs.state !== APIItemState.PENDING) {
          hasError = false;
          const balance: AmountData = {
            value,
            decimals: tokenInfo.decimals || 0,
            symbol: tokenInfo.symbol,
            metadata: rs.metadata
          };

          if (callback) {
            callback(balance);
          } else {
            // Auto unsubscribe if no callback
            unsub?.();
          }

          resolve([unsub, balance]);
        }
      }, extrinsicType);

      setTimeout(() => {
        if (hasError) {
          unsub?.();
          reject(new Error(t('Failed to get balance. Please check your internet connection or change your network endpoint')));
        }
      }, 9999);
    });
  }

  public async subscribeTransferableBalance (address: string, chain: string, tokenSlug: string | undefined, extrinsicType?: ExtrinsicType, callback?: (rs: AmountData) => void): Promise<[() => void, AmountData]> {
    return this.subscribeBalance(address, chain, tokenSlug, 'transferable', extrinsicType, callback);
  }

  public async subscribeTotalBalance (address: string, chain: string, tokenSlug: string | undefined, extrinsicType?: ExtrinsicType, callback?: (rs: AmountData) => void): Promise<[() => void, AmountData]> {
    return this.subscribeBalance(address, chain, tokenSlug, 'total', extrinsicType, callback);
  }

  /**
   * @public
   * @async
   * @function getTransferableBalance
   * @desc Fetch free balance on chain
   * @param {string} address - Address
   * @param {string} chain - Slug of chain
   * @param {string} [tokenSlug] - Slug of token
   * @param extrinsicType - Customize transferable based on context
   * @return {Promise<AmountData>} - Free token balance of address on chain
   */
  public async getTransferableBalance (address: string, chain: string, tokenSlug?: string, extrinsicType?: ExtrinsicType): Promise<AmountData> {
    const [, balance] = await this.subscribeTransferableBalance(address, chain, tokenSlug, extrinsicType);

    return balance;
  }

  public async getTotalBalance (address: string, chain: string, tokenSlug?: string, extrinsicType?: ExtrinsicType): Promise<AmountData> {
    const [, balance] = await this.subscribeTotalBalance(address, chain, tokenSlug, extrinsicType);

    return balance;
  }

  /** Remove balance from the subject object by addresses */
  public removeBalanceByAddresses (addresses: string[]) {
    this.balanceMap.removeBalanceItems([...addresses, ALL_ACCOUNT_KEY]);
  }

  /** Remove inactive asset from the balance map */
  public async removeInactiveChainBalances () {
    const assetSettings = await this.state.chainService.getAssetSettings();

    this.balanceMap.removeBalanceItemByFilter((item) => {
      return !assetSettings[item.tokenSlug];
    });
  }

  public async getBalance (reset?: boolean) {
    await this.removeInactiveChainBalances();

    return { details: this.balanceMap.map, reset } as BalanceJson;
  }

  /** Get stored balance from db */
  public async getStoredBalance (address: string) {
    return await this.state.dbService.stores.balance.getBalanceMapByAddresses(address);
  }

  public async getTokensHasBalance (address: string, chain: string, tokenSlug?: string): Promise<Record<string, BalanceItem>> {
    const balanceItems = await this.state.dbService.stores.balance.getBalanceHasAmount(address, chain);
    const tokenHasBalanceInfoMap: Record<string, BalanceItem> = {};

    balanceItems.forEach((balanceItem) => {
      tokenHasBalanceInfoMap[balanceItem.tokenSlug] = balanceItem;
    });

    if (tokenSlug) {
      return {
        [tokenSlug]: tokenHasBalanceInfoMap[tokenSlug]
      };
    }

    return tokenHasBalanceInfoMap;
  }

  public async handleResetBalance (forceRefresh?: boolean) {
    if (forceRefresh) {
      this.balanceMap.setData({});
      await this.state.dbService.stores.balance.clear();
    } else {
      await Promise.all([this.removeInactiveChainBalances()]);
    }
  }

  /**
   * Update value for balance map
   * Note: items must be same tokenSlug */
  public setBalanceItem (items: BalanceItem[]) {
    if (items.length) {
      const nowTime = new Date().getTime();

      for (const item of items) {
        const balance: BalanceItem = { timestamp: nowTime, ...item };

        this.balanceUpdateCache.push(balance);
      }

      addLazy('updateBalanceStore', () => {
        const proxyId = this.state.keyringService.context.currentAccount.proxyId;
        const isUnifiedAccount = this.state.keyringService.context.isUnifiedAccount(proxyId);
        const isAll = isAccountAll(proxyId);

        this.balanceMap.updateBalanceItems(this.balanceUpdateCache, isUnifiedAccount || isAll ? proxyId : undefined);

        if (isUnifiedAccount || isAll) {
          this.balanceUpdateCache = [...this.balanceUpdateCache, ...Object.values(this.balanceMap.map[proxyId])];
        }

        this.updateBalanceStore(this.balanceUpdateCache);
        this.balanceUpdateCache = [];
      }, 300, 1800);
    }
  }

  /**
   * Store balance map to db
   * */
  private updateBalanceStore (items: BalanceItem[]) {
    this.state.dbService.updateBulkBalanceStore(items).catch(console.warn);
  }

  /**
   * Subscribe balance map with subject object
   * */
  public subscribeBalanceMap () {
    return this.balanceMap.mapSubject;
  }

  /** Subscribe area */

  private _unsubscribeBalance: VoidFunction | undefined;

  /** Subscribe balance subscription */
  async runSubscribeBalances () {
    await Promise.all([this.state.eventService.waitKeyringReady, this.state.eventService.waitChainReady]);
    this.runUnsubscribeBalances();

    const addresses = this.state.keyringService.context.getDecodedAddresses();

    if (!addresses.length) {
      return;
    }

    // Reset balance before subscribe
    await this.handleResetBalance();

    let cancel = false;
    const assetMap = this.state.chainService.getAssetRegistry();
    const chainInfoMap = this.state.chainService.getChainInfoMap();
    const evmApiMap = this.state.chainService.getEvmApiMap();
    const substrateApiMap = this.state.chainService.getSubstrateApiMap();
    const tonApiMap = this.state.chainService.getTonApiMap();
    const cardanoApiMap = this.state.chainService.getCardanoApiMap();

    const activeChainSlugs = Object.keys(this.state.getActiveChainInfoMap());
    const assetState = this.state.chainService.subscribeAssetSettings().value;
    const assets: string[] = Object.values(assetMap)
      .filter((asset) => {
        return activeChainSlugs.includes(asset.originChain) && assetState[asset.slug]?.visible;
      })
      .map((asset) => asset.slug);

    const unsub = subscribeBalance(addresses, activeChainSlugs, assets, assetMap, chainInfoMap, substrateApiMap, evmApiMap, tonApiMap, cardanoApiMap, (result) => {
      !cancel && this.setBalanceItem(result);
    }, ExtrinsicType.TRANSFER_BALANCE);

    const unsub2 = this.state.subscribeMantaPayBalance();

    this._unsubscribeBalance = () => {
      cancel = true;
      unsub && unsub();
      unsub2 && unsub2();
    };
  }

  /** Unsubscribe balance subscription */
  runUnsubscribeBalances () {
    this._unsubscribeBalance && this._unsubscribeBalance();
    this._unsubscribeBalance = undefined;
  }

  /** Reload balance subscription */
  async reloadBalance () {
    this.isReload = true;
    await this.handleResetBalance(true);
    await this.runSubscribeBalances();

    await waitTimeout(1800);
    this.isReload = false;
  }

  /** Subscribe area */

  public async autoEnableChains (addresses: string[]) {
    this.setBalanceDetectCache(addresses);
    const assetMap = this.state.chainService.getAssetRegistry();
    const promiseList = addresses.map((address) => {
      const type = getKeypairTypeByAddress(address);
      const typeValid = [...SubstrateKeypairTypes, ...EthereumKeypairTypes].includes(type);

      if (typeValid) {
        return this.state.subscanService.getMultiChainBalance(address)
          .catch((e) => {
            console.error(e);

            return null;
          });
      } else {
        return null;
      }
    });

    const evmPromiseList = addresses.map((address) => {
      const type = getKeypairTypeByAddress(address);
      const typeValid = [...EthereumKeypairTypes].includes(type);

      if (typeValid) {
        return new Promise<string[] | null>((resolve) => {
          const timeOutPromise = new Promise<string[]>((_resolve) => {
            setTimeout(() => _resolve([]), 30000);
          });

          const apiPromise = subwalletApiSdk.balanceDetectionApi?.getEvmTokenBalanceSlug(address) || Promise.resolve([]);

          Promise.race([timeOutPromise, apiPromise])
            .then((result) => resolve(result))
            .catch((error) => {
              console.error(error);
              resolve(null);
            });
        });
      } else {
        return Promise.resolve(null);
      }
    });

    const needEnableChains: string[] = [];
    const needActiveTokens: string[] = [];
    const balanceDataList = await Promise.all(promiseList);
    const evmBalanceDataList = await Promise.all(evmPromiseList);
    const currentAssetSettings = await this.state.chainService.getAssetSettings();
    const chainInfoMap = this.state.chainService.getChainInfoMap();
    const detectBalanceChainSlugMap = this.state.chainService.detectBalanceChainSlugMap;

    for (const balanceData of balanceDataList) {
      if (balanceData) {
        for (const balanceDatum of balanceData) {
          const { balance, bonded, category, locked, network, symbol } = balanceDatum;
          const chain = detectBalanceChainSlugMap[network];
          const chainInfo = chain ? chainInfoMap[chain] : null;
          const chainState = this.state.chainService.getChainStateByKey(chain);
          const balanceIsEmpty = (!balance || balance === '0') && (!locked || locked === '0') && (!bonded || bonded === '0');
          const tokenKey = `${chain}-${category === 'native' ? 'NATIVE' : 'LOCAL'}-${symbol.toUpperCase()}`;
          const existedKey = Object.keys(assetMap).find((v) => v.toLowerCase() === tokenKey.toLowerCase());

          // Cancel if chain is not supported or is testnet
          if (!chainInfo || chainInfo.isTestnet) {
            continue;
          }

          // Cancel is balance is 0
          if (balanceIsEmpty) {
            continue;
          }

          // Cancel is chain is turned off by user
          if (chainState && chainState.manualTurnOff) {
            continue;
          }

          // const a = this.state.chainService.getChainStateByKey(chain);

          if (existedKey && !currentAssetSettings[existedKey]?.visible) {
            needEnableChains.push(chain);
            needActiveTokens.push(existedKey);
            currentAssetSettings[existedKey] = { visible: true };
          }
        }
      }
    }

    for (const balanceData of evmBalanceDataList) {
      if (balanceData) {
        for (const slug of balanceData) {
          const chainSlug = slug.split('-')[0];
          const chainState = this.state.chainService.getChainStateByKey(chainSlug);
          const existedKey = Object.keys(assetMap).find((v) => v.toLowerCase() === slug.toLowerCase());

          // Cancel is chain is turned off by user
          if (chainState && chainState.manualTurnOff) {
            continue;
          }

          if (existedKey && !currentAssetSettings[existedKey]?.visible) {
            needEnableChains.push(chainSlug);
            needActiveTokens.push(existedKey);
            currentAssetSettings[existedKey] = { visible: true };
          }
        }
      }
    }

    if (needActiveTokens.length) {
      await this.state.chainService.enableChains(needEnableChains);
      this.state.chainService.setAssetSettings({ ...currentAssetSettings });
    }
  }

  private _intervalScan: NodeJS.Timer | undefined;
  private _unsubscribeBalanceDetectCache: VoidFunction | undefined;
  private startBalanceDetectCache: PromiseHandler<void> | undefined;

  private async startScanBalance () {
    await Promise.all([this.state.eventService.waitAccountReady, this.state.eventService.waitChainReady]);
    this.stopScanBalance();
    this.startBalanceDetectCache = createPromiseHandler<void>();

    const updateBalanceDetectCache = (value: DetectBalanceCache) => {
      this.startBalanceDetectCache?.resolve();
      this.balanceDetectSubject.next(value || {});
    };

    this.getBalanceDetectCache(updateBalanceDetectCache);
    const subscription = this.detectAccountBalanceStore.getSubject().subscribe({ next: updateBalanceDetectCache });

    this._unsubscribeBalanceDetectCache = subscription.unsubscribe;

    const scanBalance = () => {
      const addresses = keyring.getPairs().map((account) => account.address);
      const cache = this.balanceDetectSubject.value;

      const now = Date.now();
      const needDetectAddresses: string[] = [];

      for (const address of addresses) {
        if (!cache[address] || now - cache[address] > this.cacheTime) {
          needDetectAddresses.push(address);
        }
      }

      if (needDetectAddresses.length) {
        this.autoEnableChains(needDetectAddresses).finally(noop);
      }
    };

    await this.startBalanceDetectCache?.promise;

    scanBalance();
    this._intervalScan = setInterval(scanBalance, this.intervalTime);
  }

  private stopScanBalance () {
    this._intervalScan && clearInterval(this._intervalScan);
    this._unsubscribeBalanceDetectCache && this._unsubscribeBalanceDetectCache();
    this._intervalScan = undefined;
    this._unsubscribeBalanceDetectCache = undefined;
    this.startBalanceDetectCache = undefined;
  }

  // process
  public async getOptimalTransferProcess (params: RequestOptimalTransferProcess): Promise<CommonOptimalTransferPath> {
    const originChainInfo = this.state.chainService.getChainInfoByKey(params.originChain);

    if (!params.destChain) { // normal transfers
      return getDefaultTransferProcess();
    }

    const destChainInfo = this.state.chainService.getChainInfoByKey(params.destChain);

    // xcm
    if (!_isXcmWithinSameConsensus(originChainInfo, destChainInfo) && _isPureEvmChain(originChainInfo)) {
      const evmApi = this.state.chainService.getEvmApi(originChainInfo.slug);
      const tokenInfo = this.state.chainService.getAssetBySlug(params.tokenSlug);

      return getSnowbridgeTransferProcessFromEvm(params.address, evmApi, tokenInfo, params.amount);
    }

    // Across Bridge
    if (_isAcrossChainBridge(originChainInfo.slug, destChainInfo.slug)) {
      const tokenInfo = this.state.chainService.getAssetBySlug(params.tokenSlug);

      if (!_isNativeToken(tokenInfo)) {
        const chainInfoMap = this.state.getChainInfoMap();
        const originTokenInfo = this.state.getAssetBySlug(params.tokenSlug);
        const destinationTokenInfo = this.state.getXcmEqualAssetByChain(params.destChain, params.tokenSlug);

        if (!destinationTokenInfo) {
          throw new Error('Destination token info not found');
        }

        const inputData = {
          destinationTokenInfo,
          originTokenInfo,
          sendingValue: params.amount,
          sender: params.address,
          recipient: params.address,
          destinationChain: chainInfoMap[destinationTokenInfo.originChain],
          originChain: chainInfoMap[originTokenInfo.originChain]
        } as CreateXcmExtrinsicProps;

        const data = await getAcrossQuote(inputData);

        if (!data) {
          throw new Error('Failed to fetch Across Bridge Data. Please try again later');
        }

        return getAcrossbridgeTransferProcessFromEvm(data.to);
      }
    }

    return getDefaultTransferProcess();
  }
}
