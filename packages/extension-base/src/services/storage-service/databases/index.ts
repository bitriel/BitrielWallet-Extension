// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _ChainAsset, _ChainInfo } from '@bitriel/chain-list/types';
import { CampaignData, ChainStakingMetadata, CrowdloanItem, MetadataItem, MetadataV15Item, NftCollection, NftItem, NominatorMetadata, PriceJson, StakingItem, TransactionHistoryItem } from '@bitriel/extension-base/background/KoniTypes';
import { _NotificationInfo } from '@bitriel/extension-base/services/inapp-notification-service/interfaces';
import { BalanceItem, ProcessTransactionData, YieldPoolInfo, YieldPositionInfo } from '@bitriel/extension-base/types';
import Dexie, { Table, Transaction } from 'dexie';

export const DEFAULT_DATABASE = 'SubWalletDB_v2';

export interface DefaultChainDoc {
  chain: string
}

export interface DefaultAddressDoc {
  address: string
}

export interface DefaultDocWithAddressAndChain extends DefaultChainDoc, DefaultAddressDoc {}

export interface IBalance extends BalanceItem, DefaultAddressDoc {}
export interface IChain extends _ChainInfo {
  active: boolean;
  currentProvider: string;
  manualTurnOff: boolean;
}
export interface ICrowdloanItem extends CrowdloanItem, DefaultAddressDoc, DefaultChainDoc {}
export interface IKeyValue {
  key: string,
  value: string
}
export interface INft extends NftItem, DefaultAddressDoc {}
export interface ITransactionHistoryItem extends TransactionHistoryItem, DefaultAddressDoc, DefaultChainDoc {}

// TODO: refactor this
export interface IMigration {
  key: string,
  name: string,
  timestamp: number
}

export interface IMetadataItem extends MetadataItem, DefaultChainDoc {}
export interface IMetadataV15Item extends MetadataV15Item, DefaultChainDoc {}

export type IMantaPayLedger = any;

export type ICampaign = CampaignData;

export interface IAssetRef extends _AssetRef {
  slug: string
}

export default class KoniDatabase extends Dexie {
  public price!: Table<PriceJson, object>;
  public balances!: Table<IBalance, object>;

  public nfts!: Table<INft, object>;
  public nftCollections!: Table<NftCollection, object>;
  public crowdloans!: Table<ICrowdloanItem, object>;
  public stakings!: Table<StakingItem, object>;
  public transactions!: Table<ITransactionHistoryItem, object>;
  public migrations!: Table<IMigration, object>;

  public metadata!: Table<IMetadataItem, object>;
  public metadataV15!: Table<IMetadataV15Item, object>;

  public chain!: Table<IChain, object>;
  public asset!: Table<_ChainAsset, object>;

  public chainStakingMetadata!: Table<ChainStakingMetadata, object>;
  public nominatorMetadata!: Table<NominatorMetadata, object>;

  public yieldPoolInfo!: Table<YieldPoolInfo, object>;
  public yieldPosition!: Table<YieldPositionInfo, object>;

  public mantaPay!: Table<IMantaPayLedger, object>;
  public campaign!: Table<ICampaign, object>;

  public keyValue!: Table<IKeyValue, object>;

  public inappNotification!: Table<_NotificationInfo, object>;

  public processTransactions!: Table<ProcessTransactionData, object>;

  private schemaVersion: number;

  public constructor (name = DEFAULT_DATABASE, schemaVersion = 11) {
    super(name);
    this.schemaVersion = schemaVersion;

    this.conditionalVersion(1, {
      // DO NOT declare all columns, only declare properties to be indexed
      // Read more: https://dexie.org/docs/Version/Version.stores()
      // Primary key is always the first entry
      chain: 'slug',
      asset: 'slug',
      price: 'currency',
      balances: '[tokenSlug+address], tokenSlug, address',
      nfts: '[chain+address+collectionId+id], [address+chain], chain, id, address, collectionId, name',
      nftCollections: '[chain+collectionId], chain, collectionId, collectionName',
      crowdloans: '[chain+address], chain, address',
      stakings: '[chain+address+type], [chain+address], chain, address, type',
      transactions: '[chain+address+extrinsicHash], &[chain+address+extrinsicHash], chain, address, extrinsicHash, action',
      migrations: '[key+name]',
      chainStakingMetadata: '[chain+type], chain, type',
      nominatorMetadata: '[chain+address+type], [chain+address], chain, address, type'
    });

    this.conditionalVersion(2, {
      metadata: 'genesisHash, chain'
    });

    this.conditionalVersion(3, {
      mantaPay: 'key, chain'
    });

    this.conditionalVersion(4, {
      yieldPoolInfo: 'slug, chain, type',
      yieldPosition: '[slug+chain+address], [address+slug], address, chain'
    });

    this.conditionalVersion(5, {
      campaign: 'slug'
    });

    this.conditionalVersion(6, {
      keyValue: 'key'
    });

    this.conditionalVersion(7, {
      inappNotification: 'id, address, proxyId, [proxyId+actionType], actionType'
    });

    this.conditionalVersion(8, {
      metadataV15: 'genesisHash, chain'
    });

    this.conditionalVersion(9, {
      processTransactions: 'id, address'
    });
  }

  private conditionalVersion (
    version: number,
    schema: { [key: string]: string | null },
    upgrade?: (t: Transaction) => Promise<void>
  ) {
    if (this.schemaVersion != null && this.schemaVersion < version) {
      return;
    }

    const dexieVersion = this.version(version).stores(schema);

    if (upgrade != null) {
      dexieVersion.upgrade(upgrade);
    }
  }

  // Singletons
  public static instance: KoniDatabase;

  public static getInstance (name?: string, schemaVersion?: number): KoniDatabase {
    if (!KoniDatabase.instance) {
      KoniDatabase.instance = new KoniDatabase(name, schemaVersion);
    }

    return KoniDatabase.instance;
  }
}
