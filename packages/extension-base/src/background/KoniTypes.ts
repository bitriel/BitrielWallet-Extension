// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _AssetType, _ChainAsset, _ChainInfo, _FundStatus, _MultiChainAsset } from '@bitriel/chain-list/types';
import { TransactionError } from '@bitriel/extension-base/background/errors/TransactionError';
import { Resolver } from '@bitriel/extension-base/background/handlers/State';
import { AccountAuthType, AuthorizeRequest, ConfirmationRequestBase, RequestAccountList, RequestAccountSubscribe, RequestAccountUnsubscribe, RequestAuthorizeCancel, RequestAuthorizeReject, RequestAuthorizeSubscribe, RequestAuthorizeTab, RequestCurrentAccountAddress, ResponseAuthorizeList } from '@bitriel/extension-base/background/types';
import { AppConfig, BrowserConfig, OSConfig } from '@bitriel/extension-base/constants';
import { RequestOptimalTransferProcess } from '@bitriel/extension-base/services/balance-service/helpers';
import { CardanoBalanceItem } from '@bitriel/extension-base/services/balance-service/helpers/subscribe/cardano/types';
import { CardanoTransactionConfig } from '@bitriel/extension-base/services/balance-service/transfer/cardano-transfer';
import { TonTransactionConfig } from '@bitriel/extension-base/services/balance-service/transfer/ton-transfer';
import { _CHAIN_VALIDATION_ERROR } from '@bitriel/extension-base/services/chain-service/handler/types';
import { _ChainState, _EvmApi, _NetworkUpsertParams, _SubstrateApi, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse, EnableChainParams, EnableMultiChainParams } from '@bitriel/extension-base/services/chain-service/types';
import { TokenPayFeeInfo } from '@bitriel/extension-base/services/fee-service/interfaces';
import { _NotificationInfo, NotificationSetup } from '@bitriel/extension-base/services/inapp-notification-service/interfaces';
import { AppBannerData, AppConfirmationData, AppPopupData } from '@bitriel/extension-base/services/mkt-campaign-service/types';
import { AuthUrls } from '@bitriel/extension-base/services/request-service/types';
import { CrowdloanContributionsResponse } from '@bitriel/extension-base/services/subscan-service/types';
import { SWTransactionResponse, SWTransactionResult } from '@bitriel/extension-base/services/transaction-service/types';
import { WalletConnectNotSupportRequest, WalletConnectSessionRequest } from '@bitriel/extension-base/services/wallet-connect-service/types';
import { AccountChainType, AccountJson, AccountsWithCurrentAddress, AddressJson, BalanceJson, BaseRequestSign, BuyServiceInfo, BuyTokenInfo, CommonOptimalTransferPath, CurrentAccountInfo, EarningRewardHistoryItem, EarningRewardJson, EarningStatus, HandleYieldStepParams, InternalRequestSign, LeavePoolAdditionalData, NominationPoolInfo, OptimalYieldPath, OptimalYieldPathParams, RequestAccountBatchExportV2, RequestAccountCreateSuriV2, RequestAccountNameValidate, RequestAccountProxyEdit, RequestAccountProxyForget, RequestBatchJsonGetAccountInfo, RequestBatchRestoreV2, RequestBounceableValidate, RequestChangeAllowOneSign, RequestChangeTonWalletContractVersion, RequestCheckCrossChainTransfer, RequestCheckPublicAndSecretKey, RequestCheckTransfer, RequestCrossChainTransfer, RequestDeriveCreateMultiple, RequestDeriveCreateV3, RequestDeriveValidateV2, RequestEarlyValidateYield, RequestEarningSlippage, RequestExportAccountProxyMnemonic, RequestGetAllTonWalletContractVersion, RequestGetAmountForPair, RequestGetDeriveAccounts, RequestGetDeriveSuggestion, RequestGetTokensCanPayFee, RequestGetYieldPoolTargets, RequestInputAccountSubscribe, RequestJsonGetAccountInfo, RequestJsonRestoreV2, RequestMetadataHash, RequestMnemonicCreateV2, RequestMnemonicValidateV2, RequestPrivateKeyValidateV2, RequestShortenMetadata, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestSubmitProcessTransaction, RequestSubscribeProcessById, RequestTransfer, RequestUnlockDotCheckCanMint, RequestUnlockDotSubscribeMintedData, RequestYieldLeave, RequestYieldStepSubmit, RequestYieldWithdrawal, ResponseAccountBatchExportV2, ResponseAccountCreateSuriV2, ResponseAccountNameValidate, ResponseBatchJsonGetAccountInfo, ResponseCheckPublicAndSecretKey, ResponseDeriveValidateV2, ResponseEarlyValidateYield, ResponseExportAccountProxyMnemonic, ResponseGetAllTonWalletContractVersion, ResponseGetDeriveAccounts, ResponseGetDeriveSuggestion, ResponseGetYieldPoolTargets, ResponseInputAccountSubscribe, ResponseJsonGetAccountInfo, ResponseMetadataHash, ResponseMnemonicCreateV2, ResponseMnemonicValidateV2, ResponsePrivateKeyValidateV2, ResponseShortenMetadata, ResponseSubscribeProcessAlive, ResponseSubscribeProcessById, StorageDataInterface, SubmitYieldStepData, SubnetYieldPositionInfo, SwapPair, SwapQuoteResponse, SwapRequest, SwapRequestResult, SwapRequestV2, SwapSubmitParams, SwapTxData, TokenSpendingApprovalParams, UnlockDotTransactionNft, UnstakingStatus, ValidateSwapProcessParams, ValidateYieldProcessParams, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@bitriel/extension-base/types';
import { RequestSubmitTransfer, RequestSubscribeTransfer, ResponseSubscribeTransfer } from '@bitriel/extension-base/types/balance/transfer';
import { RequestClaimBridge } from '@bitriel/extension-base/types/bridge';
import { GetNotificationParams, RequestIsClaimedPolygonBridge, RequestSwitchStatusParams } from '@bitriel/extension-base/types/notification';
import { InjectedAccount, InjectedAccountWithMeta, MetadataDefBase } from '@bitriel/extension-inject/types';
import { KeyringPair$Meta } from '@subwallet/keyring/types';
import { KeyringOptions } from '@subwallet/ui-keyring/options/types';
import { KeyringAddress } from '@subwallet/ui-keyring/types';
import { SessionTypes } from '@walletconnect/types/dist/types/sign-client/session';
import { DexieExportJsonStructure } from 'dexie-export-import';
import Web3 from 'web3';
import { RequestArguments, TransactionConfig } from 'web3-core';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';

import { ExtDef } from '@polkadot/types/extrinsic/signedExtensions/types';
import { SignerResult } from '@polkadot/types/types/extrinsic';
import { HexString } from '@polkadot/util/types';

import { EarningSlippageResult } from '../services/earning-service/handlers/native-staking/dtao';
import { TransactionWarning } from './warnings/TransactionWarning';

export enum RuntimeEnvironment {
  Web = 'Web',
  Node = 'Node',
  ExtensionChrome = 'Extension (Chrome)',
  ExtensionFirefox = 'Extension (Firefox)',
  WebWorker = 'Web Worker',
  ServiceWorker = 'Service Worker',
  Unknown = 'Unknown',
}

export interface RuntimeEnvironmentInfo {
  environment: RuntimeEnvironment;
  version: string;
  host?: string;
  protocol?: string;
}

export type TargetEnvironment = 'extension' | 'webapp' | 'mobile';

export interface EnvironmentSupport {
  MANTA_ZK: boolean;
}

export interface ServiceInfo {
  chainInfoMap: Record<string, _ChainInfo>;
  chainStateMap: Record<string, _ChainState>;
  chainApiMap: ApiMap;
  currentAccountInfo: CurrentAccountInfo;
  assetRegistry: Record<string, _ChainAsset>;
}

export interface AssetSetting {
  visible: boolean,
  // restrictions on assets can be implemented later
}

/// Request Auth

export interface AuthRequestV2 extends Resolver<ResultResolver> {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  url: string;
  accountAuthTypes: AccountAuthType[];
}

/// Manage Auth

// Get Auth

export interface RequestAuthorizeApproveV2 {
  id: string;
  accounts: string[];
}

// Auth All site

export interface RequestAuthorizationAll {
  connectValue: boolean;
}

// Manage site auth (all allowed/unAllowed)

export interface RequestAuthorization extends RequestAuthorizationAll {
  url: string;
}

// Manage single auth with single account

export interface RequestAuthorizationPerAccount extends RequestAuthorization {
  address: string;
}

// Manage single site with multi account

export interface RequestAuthorizationPerSite {
  id: string;
  values: Record<string, boolean>;
}

// Manage site block

export interface RequestAuthorizationBlock {
  id: string;
  connectedValue: boolean;
}

// Forget site auth

export interface RequestForgetSite {
  url: string;
}

export interface ResultResolver {
  result: boolean;
  accounts: string[];
}

// Switch current network auth

export interface RequestSwitchCurrentNetworkAuthorization {
  url: string;
  networkKey: string;
  authSwitchNetworkType: AccountAuthType
}

/// Staking subscribe

export enum StakingType {
  NOMINATED = 'nominated',
  POOLED = 'pooled',
  LIQUID_STAKING = 'liquid_staking'
}

export interface StakingRewardItem {
  state: APIItemState,
  name: string,
  chain: string,
  address: string,
  type: StakingType,

  latestReward?: string,
  totalReward?: string,
  totalSlash?: string,
  unclaimedReward?: string
}

export interface StakingItem {
  name: string,
  chain: string,
  address: string,
  type: StakingType,

  balance?: string,
  activeBalance?: string,
  unlockingBalance?: string,
  nativeToken: string,
  unit?: string,

  state: APIItemState
}

export interface StakingJson {
  reset?: boolean,
  ready?: boolean,
  details: StakingItem[]
}

export interface StakingRewardJson {
  ready: boolean;
  data: Record<string, StakingRewardItem>;
}

export interface PriceJson {
  currency: CurrencyType;
  ready?: boolean,
  currencyData: CurrencyJson,
  exchangeRateMap: Record<string, ExchangeRateJSON>,
  priceMap: Record<string, number>,
  price24hMap: Record<string, number>,
  priceCoinGeckoSupported: string[],
  lastUpdatedMap: Record<string, Date>
}

export interface HistoryTokenPriceJSON {
  history: PriceChartPoint[];
}

export interface ResponseSubscribeCurrentTokenPrice {
  id: string;
  price: CurrentTokenPrice;
}

export interface CurrentTokenPrice {
  value: number;
  value24h: number;
  time: number;
}

export interface ExchangeRateJSON {
  exchange: number;
  label: string;
}

export interface CurrencyJson {
  label: string;
  isPrefix: boolean;
  symbol: string;
}

export enum APIItemState {
  PENDING = 'pending',
  READY = 'ready',
  CACHED = 'cached',
  ERROR = 'error',
  NOT_SUPPORT = 'not_support'
}

export enum RMRK_VER {
  VER_1 = '1.0.0',
  VER_2 = '2.0.0'
}

export enum CrowdloanParaState {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface NftItem extends NftItemExtraInfo {
  // must-have
  id: string;
  chain: string;
  collectionId: string;
  owner: string;
  originAsset?: string;

  name?: string;
  image?: string;
  externalUrl?: string;
  rarity?: string;
  description?: string;
  properties?: Record<any, any> | null;
}

interface NftItemExtraInfo {
  type?: _AssetType.ERC721 | _AssetType.PSP34 | RMRK_VER; // for sending
  rmrk_ver?: RMRK_VER;
  onChainOption?: any; // for sending PSP-34 tokens, should be done better
  assetHubType?: AssetHubNftType // for sending assetHub nft. There're 2 types nft
}

export enum AssetHubNftType {
  NFTS = 'nfts',
  UNIQUES = 'uniques'
}

export interface NftCollection {
  // must-have
  collectionId: string;
  chain: string;
  originAsset?: string;

  collectionName?: string;
  image?: string;
  itemCount?: number;
  externalUrl?: string;
}

export interface NftJson {
  total: number;
  nftList: Array<NftItem>;
}

export interface NftCollectionJson {
  ready: boolean;
  nftCollectionList: Array<NftCollection>;
}

export interface MetadataItem {
  genesisHash: string;
  specName: string;
  specVersion: string;
  hexValue: HexString;
  types: Record<string, Record<string, string> | string>;
  userExtensions?: ExtDef;
  hexV15?: HexString;
  tokenInfo?: {
    ss58Format: number;
    tokenDecimals: number;
    tokenSymbol: string;
  };
}

export interface MetadataV15Item {
  genesisHash: string;
  specVersion: string;
  hexV15?: HexString;
}

export interface CrowdloanItem {
  state: APIItemState,
  paraState?: CrowdloanParaState,
  contribute: string,
  fundId: string;
  paraId: number;
  status: _FundStatus;
  startTime: Date;
  endTime: Date;
  auctionIndex: number;
  firstPeriod: number;
  lastPeriod: number;
}

export interface CrowdloanJson {
  reset?: boolean,
  details: Record<string, CrowdloanItem>
}

export type NetWorkGroup =
  'RELAY_CHAIN'
  | 'POLKADOT_PARACHAIN'
  | 'KUSAMA_PARACHAIN'
  | 'MAIN_NET'
  | 'TEST_NET'
  | 'UNKNOWN';

export enum ContractType {
  wasm = 'wasm',
  evm = 'evm'
}

export interface NetworkJson {
  // General Information
  key: string; // Key of network in NetworkMap
  chain: string; // Name of the network
  icon?: string; // Icon name, available with known network
  active: boolean; // Network is active or not

  // Provider Information
  providers: Record<string, string>; // Predefined provider map
  currentProvider: string | null; // Current provider key
  currentProviderMode: 'http' | 'ws'; // Current provider mode, compute depend on provider protocol. the feature need to know this to decide use subscribe or cronjob to use this features.
  customProviders?: Record<string, string>; // Custom provider map, provider name same with provider map
  nftProvider?: string;

  // Metadata get after connect to provider
  genesisHash: string; // identifier for network
  groups: NetWorkGroup[];
  ss58Format: number;
  paraId?: number;
  chainType?: 'substrate' | 'ethereum';
  crowdloanUrl?: string;

  // Ethereum related information for predefined network only
  isEthereum?: boolean; // Only show network with isEthereum=true when select one Evm account // user input
  evmChainId?: number;

  isHybrid?: boolean;

  // Native token information
  nativeToken?: string;
  decimals?: number;

  // Other information
  coinGeckoKey?: string; // Provider key to get token price from CoinGecko // user input
  blockExplorer?: string; // Link to block scanner to check transaction with extrinsic hash // user input
  abiExplorer?: string; // Link to block scanner to check transaction with extrinsic hash // user input
  dependencies?: string[]; // Auto active network in dependencies if current network is activated
  getStakingOnChain?: boolean; // support get bonded on chain
  supportBonding?: boolean;
  supportSmartContract?: ContractType[]; // if network supports PSP smart contracts

  apiStatus?: NETWORK_STATUS;
  requestId?: string;
}

export interface DonateInfo {
  key: string;
  name: string;
  value: string;
  icon: string;
  link: string;
}

export interface NetWorkMetadataDef extends MetadataDefBase {
  networkKey: string;
  groups: NetWorkGroup[];
  isEthereum: boolean;
  paraId?: number;
  isAvailable: boolean;
  active: boolean;
  apiStatus: NETWORK_STATUS;
}

export interface OptionInputAddress {
  options: KeyringOptions;
}

export type LanguageType = 'en'
| 'zh'
| 'fr'
| 'tr'
| 'pl'
| 'th'
| 'ur'
| 'vi'
| 'ja'
| 'ru';

export type CurrencyType = 'USD'
| 'BRL'
| 'CNY'
| 'EUR'
| 'GBP'
| 'HKD'
| 'JPY'
| 'RUB'
| 'VND'

export type PriceChartTimeframe = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export interface PriceChartPoint {
  time: number;
  value: number;
}

export type LanguageOptionType = {
  text: string;
  value: LanguageType;
}

export type BrowserConfirmationType = 'extension' | 'popup' | 'window';

export enum WalletUnlockType {
  ALWAYS_REQUIRED = 'always_required',
  WHEN_NEEDED = 'when_needed',
}

export interface UiSettings {
  language: LanguageType,
  currency: string,
  browserConfirmationType: BrowserConfirmationType;
  isShowZeroBalance: boolean;
  isShowBalance: boolean;
  accountAllLogo: string;
  theme: ThemeNames;
  camera: boolean;
  timeAutoLock: number;
  unlockType: WalletUnlockType;
  enableChainPatrol: boolean;
  notificationSetup: NotificationSetup;
  isAcknowledgedUnifiedAccountMigration: boolean;
  isUnifiedAccountMigrationInProgress: boolean;
  isUnifiedAccountMigrationDone: boolean;
  // On-ramp service account reference
  walletReference: string;
  allowOneSign: boolean;
}

export type RequestSettingsType = UiSettings;

export type RequestCameraSettings = { camera: boolean };

export type RequestChangeTimeAutoLock = { autoLockTime: number };

export type RequestUnlockType = { unlockType: WalletUnlockType };

export type RequestChangeEnableChainPatrol = { enable: boolean };

export type RequestChangeShowZeroBalance = { show: boolean };

export type RequestChangeLanguage = { language: LanguageType };

export type RequestChangePriceCurrency = { currency: CurrencyType }

export type RequestGetHistoryTokenPriceData = { priceId: string, timeframe: PriceChartTimeframe };

export type RequestChangeShowBalance = { enable: boolean };

export type DetectBalanceCache = Record<string, number>;

export type RequestSaveAppConfig = { appConfig: AppConfig };

export type RequestSaveBrowserConfig = { browserConfig: BrowserConfig };

export type RequestSaveOSConfig = { osConfig: OSConfig };

export interface RandomTestRequest {
  start: number;
  end: number;
}

export enum TransactionDirection {
  SEND = 'send',
  RECEIVED = 'received'
}

export enum ChainType {
  EVM = 'evm',
  SUBSTRATE = 'substrate',
  BITCOIN = 'bitcoin',
  TON = 'ton',
  CARDANO = 'cardano'
}

export enum ExtrinsicType {
  TRANSFER_BALANCE = 'transfer.balance',
  TRANSFER_TOKEN = 'transfer.token',
  TRANSFER_XCM = 'transfer.xcm',

  SEND_NFT = 'send_nft',
  CROWDLOAN = 'crowdloan',

  STAKING_JOIN_POOL = 'staking.join_pool', // todo: merge to JOIN_YIELD_POOL
  STAKING_LEAVE_POOL = 'staking.leave_pool', // todo: deprecated, STAKING_LEAVE_POOL + STAKING_UNBOND
  STAKING_POOL_WITHDRAW = 'staking.pool_withdraw', // todo: deprecated, STAKING_POOL_WITHDRAW + STAKING_WITHDRAW

  STAKING_BOND = 'staking.bond',
  STAKING_UNBOND = 'staking.unbond', // todo: STAKING_LEAVE_POOL + STAKING_UNBOND
  STAKING_CLAIM_REWARD = 'staking.claim_reward',
  STAKING_WITHDRAW = 'staking.withdraw', // todo: STAKING_POOL_WITHDRAW + STAKING_WITHDRAW
  STAKING_COMPOUNDING = 'staking.compounding', // deprecated
  STAKING_CANCEL_COMPOUNDING = 'staking.cancel_compounding', // deprecated
  STAKING_CANCEL_UNSTAKE = 'staking.cancel_unstake',

  JOIN_YIELD_POOL = 'earn.join_pool', // TODO: review this
  MINT_VDOT = 'earn.mint_vdot',
  MINT_LDOT = 'earn.mint_ldot',
  MINT_SDOT = 'earn.mint_sdot',
  MINT_QDOT = 'earn.mint_qdot',
  MINT_STDOT = 'earn.mint_stdot',
  MINT_VMANTA = 'earn.mint_vmanta',

  REDEEM_QDOT = 'earn.redeem_qdot',
  REDEEM_VDOT = 'earn.redeem_vdot',
  REDEEM_LDOT = 'earn.redeem_ldot',
  REDEEM_SDOT = 'earn.redeem_sdot',
  REDEEM_STDOT = 'earn.redeem_stdot',
  REDEEM_VMANTA = 'earn.redeem_vmanta',

  UNSTAKE_QDOT = 'earn.unstake_qdot',
  UNSTAKE_VDOT = 'earn.unstake_vdot',
  UNSTAKE_LDOT = 'earn.unstake_ldot',
  UNSTAKE_SDOT = 'earn.unstake_sdot',
  UNSTAKE_STDOT = 'earn.unstake_stdot',
  UNSTAKE_VMANTA = 'earn.unstake_vmanta',

  TOKEN_SPENDING_APPROVAL = 'token.spending_approval',

  SWAP = 'swap',

  CLAIM_BRIDGE = 'claim.claim_bridge',

  // SET_FEE_TOKEN = 'set_fee-token',

  EVM_EXECUTE = 'evm.execute',
  UNKNOWN = 'unknown'
}

export interface ExtrinsicDataTypeMap {
  // Transfer
  [ExtrinsicType.TRANSFER_BALANCE]: RequestTransfer,
  [ExtrinsicType.TRANSFER_TOKEN]: RequestTransfer,
  [ExtrinsicType.TRANSFER_XCM]: RequestCrossChainTransfer,

  // NFT
  [ExtrinsicType.SEND_NFT]: NftTransactionRequest,

  // Staking
  [ExtrinsicType.STAKING_JOIN_POOL]: RequestStakePoolingBonding,
  [ExtrinsicType.STAKING_LEAVE_POOL]: RequestYieldLeave,
  [ExtrinsicType.STAKING_BOND]: RequestStakePoolingBonding,
  [ExtrinsicType.STAKING_UNBOND]: RequestUnbondingSubmit,
  [ExtrinsicType.STAKING_CLAIM_REWARD]: RequestStakeClaimReward,
  [ExtrinsicType.STAKING_WITHDRAW]: RequestYieldWithdrawal,
  [ExtrinsicType.STAKING_COMPOUNDING]: RequestTuringStakeCompound,
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: RequestTuringCancelStakeCompound,
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: RequestStakeCancelWithdrawal,
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: any,

  // Yield
  [ExtrinsicType.JOIN_YIELD_POOL]: RequestYieldStepSubmit,
  [ExtrinsicType.MINT_VDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_LDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_SDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_QDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_STDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_STDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_VMANTA]: SubmitYieldStepData,

  [ExtrinsicType.UNSTAKE_VDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_QDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_LDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_SDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_STDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_VMANTA]: RequestYieldLeave,

  [ExtrinsicType.REDEEM_VDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_QDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_LDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_SDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_STDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_VMANTA]: RequestYieldLeave,

  [ExtrinsicType.TOKEN_SPENDING_APPROVAL]: TokenSpendingApprovalParams,

  [ExtrinsicType.CLAIM_BRIDGE]: RequestClaimBridge

  [ExtrinsicType.EVM_EXECUTE]: TransactionConfig,
  [ExtrinsicType.CROWDLOAN]: any,
  [ExtrinsicType.SWAP]: SwapTxData
  [ExtrinsicType.UNKNOWN]: any
}

export enum ExtrinsicStatus {
  QUEUED = 'queued', // Transaction in queue
  SUBMITTING = 'submitting', // Transaction in queue
  PROCESSING = 'processing', // Transaction is sending
  SUCCESS = 'success', // Send successfully
  FAIL = 'fail', // Send failed
  CANCELLED = 'cancelled', // Is remove before sending,
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface TxHistoryItem {
  time: number | string;
  networkKey: string;
  isSuccess: boolean;
  action: TransactionDirection;
  extrinsicHash: string;

  change?: string;
  changeSymbol?: string; // if undefined => main token
  fee?: string;
  feeSymbol?: string;
  // if undefined => main token, sometime "fee" uses different token than "change"
  // ex: sub token (DOT, AUSD, KSM, ...) of Acala, Karura uses main token to pay fee
  origin?: 'app' | 'network';
}

export interface TransactionHistoryItemJson {
  items: TxHistoryItem[],
  total: number
}

export interface BasicTokenInfo {
  decimals: number;
  symbol: string;
}

export interface SufficientMetadata {
  isSufficient: boolean,
  minBalance: number
}

export interface AmountData extends BasicTokenInfo {
  value: string;
  metadata?: unknown;
}

export interface FeeData extends AmountData {
  tooHigh?: boolean;
}

export interface AmountDataWithId extends AmountData {
  id: string;
}

export interface XCMTransactionAdditionalInfo {
  destinationChain: string,
  originalChain: string,
  fee?: AmountData
}

export interface NFTTransactionAdditionalInfo {
  collectionName: string;
}

export type TransactionAdditionalInfo = {
  [ExtrinsicType.TRANSFER_XCM]: XCMTransactionAdditionalInfo,
  [ExtrinsicType.SEND_NFT]: NFTTransactionAdditionalInfo,
  [ExtrinsicType.MINT_VDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_VMANTA]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_QDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_SDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_LDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_STDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.REDEEM_VDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_VMANTA]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_QDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_SDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_LDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_STDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_VDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_VMANTA]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_QDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_SDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_LDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_STDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.STAKING_UNBOND]: Pick<SubmitYieldStepData, 'inputTokenSlug' | 'exchangeRate'>
}

// export type TransactionAdditionalInfo<T extends ExtrinsicType> = T extends ExtrinsicType.TRANSFER_XCM
//   ? XCMTransactionAdditionalInfo
//   : T extends ExtrinsicType.SEND_NFT
//     ? NFTTransactionAdditionalInfo
//     : T extends ExtrinsicType.MINT_VDOT
//       ? Pick<SubmitBifrostLiquidStaking, 'rewardTokenSlug' | 'estimatedAmountReceived'>
//       : undefined;
export interface TransactionHistoryItem<ET extends ExtrinsicType = ExtrinsicType.TRANSFER_BALANCE> {
  origin?: 'app' | 'migration' | 'subsquid' | 'subscan', // 'app' or history source
  callhash?: string,
  signature?: string,
  chain: string,
  chainType?: ChainType,
  chainName?: string,
  direction: TransactionDirection,
  type: ExtrinsicType,
  from: string,
  fromName?: string,
  to: string,
  toName?: string,
  address: string,
  status: ExtrinsicStatus,
  transactionId?: string, // Available for transaction history
  extrinsicHash: string,
  time: number,
  data?: string,
  blockNumber: number,
  blockHash: string,
  amount?: AmountData,
  tip?: AmountData,
  fee?: AmountData,
  explorerUrl?: string,
  additionalInfo?: any,
  startBlock?: number,
  nonce?: number,
  addressPrefix?: number,
  processId?: string;
}

export interface SWWarning {
  errorType: string;
  code?: number;
  message: string;
  data?: unknown;
}

export interface TransactionResponse {
  extrinsicHash?: string;
  txError?: boolean;
  errors?: TransactionError[];
  status?: boolean;
  txResult?: TxResultType;
  passwordError?: string | null;
}

export interface NftTransactionResponse extends SWTransactionResponse {
  isSendingSelf: boolean;
}

export type HandleBasicTx = (data: TransactionResponse) => void;

export enum BalanceErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_ERROR = 'TOKEN_ERROR',
  TIMEOUT = 'TIMEOUT',
  GET_BALANCE_ERROR = 'GET_BALANCE_ERROR',
}

export enum ProviderErrorType {
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_REJECT = 'USER_REJECT',
}

/// Manage account
// Export private key

export interface RequestAccountExportPrivateKey {
  address: string;
  password: string;
}

export interface ResponseAccountExportPrivateKey {
  privateKey: string;
  publicKey: string;
}

// Export batch accounts

// External account

export enum AccountExternalErrorCode {
  INVALID_ADDRESS = 'invalidToAccount',
  KEYRING_ERROR = 'keyringError',
  UNKNOWN_ERROR = 'unknownError'
}

export interface AccountExternalError {
  code: AccountExternalErrorCode;
  message: string;
}

// Attach QR-signer account

export interface RequestAccountCreateExternalV2 {
  address: string;
  genesisHash?: string | null;
  name: string;
  isAllowed: boolean;
  isReadOnly: boolean;
}

// Attach Ledger account

export interface CreateHardwareAccountItem {
  accountIndex: number;
  address: string;
  addressOffset: number;
  genesisHash: string;
  originGenesisHash: string;
  hardwareType: string;
  name: string;
  isEthereum: boolean;
  isGeneric: boolean;
  isLedgerRecovery?: boolean;
}

export interface RequestAccountCreateHardwareV2 extends CreateHardwareAccountItem {
  isAllowed?: boolean;
}

export interface RequestAccountCreateHardwareMultiple {
  accounts: CreateHardwareAccountItem[];
}

// Restore account with public and secret key

export interface RequestAccountCreateWithSecretKey {
  publicKey: string;
  secretKey: string;
  name: string;
  isAllow: boolean;
  isEthereum: boolean;
}

export interface ResponseAccountCreateWithSecretKey {
  errors: AccountExternalError[];
  success: boolean;
}

// Subscribe Address Book

export interface AddressBookInfo {
  addresses: AddressJson[];
}

export interface RequestEditContactAccount {
  address: string;
  meta: KeyringPair$Meta;
}

export interface RequestDeleteContactAccount {
  address: string;
}

// Inject account

export interface RequestAddInjectedAccounts {
  accounts: InjectedAccountWithMeta[];
}

export interface RequestRemoveInjectedAccounts {
  addresses: string[];
}

/// Sign Transaction

/// Sign External Request

// Status

export enum ExternalRequestPromiseStatus {
  PENDING,
  REJECTED,
  FAILED,
  COMPLETED
}

// Structure

export interface ExternalRequestPromise {
  resolve?: (result: SignerResult | PromiseLike<SignerResult>) => void,
  reject?: (error?: Error) => void,
  status: ExternalRequestPromiseStatus,
  message?: string;
  createdAt: number
}

// Reject

export interface RequestRejectExternalRequest {
  id: string;
  message?: string;
  throwError?: boolean;
}

export type ResponseRejectExternalRequest = void

// Resolve

export interface RequestResolveExternalRequest {
  id: string;
  data: SignerResult;
}

export type ResponseResolveExternalRequest = void

///

export type AccountRef = Array<string>
export type AccountRefMap = Record<string, AccountRef>

export type RequestPrice = null
export type RequestSubscribePrice = null
export type RequestBalance = null
export type RequestSubscribeBalance = null
export type RequestSubscribeBalancesVisibility = null
export type RequestCrowdloan = null
export type RequestCrowdloanContributions = {
  relayChain: string;
  address: string;
  page?: number;
};
export type RequestSubscribeCrowdloan = null
export type RequestSubscribeNft = null
export type RequestSubscribeStaking = null
export type RequestSubscribeStakingReward = null

export enum ThemeNames {
  LIGHT = 'light',
  DARK = 'dark',
  SUBSPACE = 'subspace'
}

export enum NETWORK_STATUS {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending'
}

export type TxResultType = {
  change: string;
  changeSymbol?: string;
  fee?: string;
  feeSymbol?: string;
}

export interface NftTransactionRequest {
  networkKey: string,
  senderAddress: string,
  recipientAddress: string,

  nftItemName?: string, // Use for confirmation view only
  params: Record<string, any>,
  nftItem: NftItem
}

export interface EvmNftTransaction extends ValidateTransactionResponse {
  tx: Record<string, any> | null;
}

export interface ValidateNetworkResponse {
  // validation state
  success: boolean,
  error?: _CHAIN_VALIDATION_ERROR,
  conflictChain?: string,
  conflictKey?: string,

  // chain spec
  genesisHash: string,
  addressPrefix: string,
  name: string,
  paraId: number | null,
  evmChainId: number | null, // null if not evm compatible
  symbol: string,
  decimals: number,
  existentialDeposit: string
}

export interface ValidateNetworkRequest {
  provider: string,
  existedChainSlug?: string
}

export interface ApiMap {
  substrate: Record<string, _SubstrateApi>;
  evm: Record<string, _EvmApi>;
}

export interface RequestFreeBalance {
  address: string,
  networkKey: string,
  token?: string,
  extrinsicType?: ExtrinsicType
}

export interface RequestMaxTransferable {
  address: string,
  networkKey: string,
  token?: string,
  isXcmTransfer?: boolean,
  destChain: string
}

export interface RequestSaveRecentAccount {
  accountId: string;
  chain?: string;
}

export interface SubstrateNftTransaction {
  error: boolean;
  estimatedFee?: string;
  balanceError: boolean;
}

export interface SubstrateNftSubmitTransaction extends BaseRequestSign {
  params: Record<string, any> | null;
  senderAddress: string;
  nftItemName?: string;
  recipientAddress: string;
}

export type RequestSubstrateNftSubmitTransaction = InternalRequestSign<SubstrateNftSubmitTransaction>;

export interface RequestAccountMeta {
  address: string | Uint8Array;
}

export interface ResponseAccountMeta {
  meta: KeyringPair$Meta;
}

export type RequestEvmEvents = null;
export type EvmEventType =
  'connect'
  | 'disconnect'
  | 'accountsChanged'
  | 'chainChanged'
  | 'message'
  | 'data'
  | 'reconnect'
  | 'error';
export type EvmAccountsChangedPayload = string [];
export type EvmChainChangedPayload = string;
export type EvmConnectPayload = { chainId: EvmChainChangedPayload }
export type EvmDisconnectPayload = unknown

export interface EvmEvent {
  type: EvmEventType,
  payload: EvmAccountsChangedPayload | EvmChainChangedPayload | EvmConnectPayload | EvmDisconnectPayload;
}

export interface EvmAppState {
  networkKey?: string,
  chainId?: string,
  isConnected?: boolean,
  web3?: Web3,
  listenEvents?: string[]
}

export type RequestEvmProviderSend = JsonRpcPayload;

export interface ResponseEvmProviderSend {
  error: (Error | null);
  result?: JsonRpcResponse;
}

export enum EvmProviderErrorType {
  USER_REJECTED_REQUEST = 'USER_REJECTED_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  DISCONNECTED = 'DISCONNECTED',
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  NETWORK_NOT_SUPPORTED= 'NETWORK_NOT_SUPPORTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface EvmSendTransactionParams {
  from: string;
  to?: string;
  value?: string | number;
  gasLimit?: string | number;
  maxPriorityFeePerGas?: string | number;
  maxFeePerGas?: string | number;
  gasPrice?: string | number;
  data?: string;
  gas?: string | number;
}

export interface EvmSignRequest {
  address: string;
  hashPayload: string;
  canSign: boolean;
}

export interface TonSignRequest {
  account: AccountJson;
  hashPayload: string;
  canSign: boolean;
}

export interface CardanoSignRequest {
  address: string;
  hashPayload: string;
  canSign: boolean;
}

export interface ErrorValidation {
  message: string;
  name: string;
}

export interface EvmSignatureRequest extends EvmSignRequest {
  id: string;
  type: string;
  payload: unknown;
  errors?: ErrorValidation[];
  processId?: string;
}

export interface TonSignatureRequest extends TonSignRequest {
  id: string;
  type: string;
  payload: unknown;
}

export interface CardanoSignatureRequest extends CardanoSignRequest {
  id: string;
  errors?: ErrorValidation[];
  currentAddress: string;
  payload: unknown
}

export interface EvmSendTransactionRequest extends TransactionConfig, EvmSignRequest {
  estimateGas: string;
  parseData: EvmTransactionData;
  isToContract: boolean;
  errors?: ErrorValidation[]
}

export interface SubmitApiRequest extends EvmSignRequest {
  id: string;
  type: string;
  payload: unknown;
  errors?: ErrorValidation[];
  processId?: string;
}

// Cardano Request Dapp Input
export enum CardanoProviderErrorType {
  INVALID_REQUEST = 'INVALID_REQUEST',
  REFUSED_REQUEST = 'REFUSED_REQUEST',
  ACCOUNT_CHANGED = 'ACCOUNT_CHANGED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
  ADDRESS_SIGN_NOT_PK = 'ADDRESS_SIGN_NOT_PK',
  SIGN_DATA_DECLINED = 'SIGN_DATA_DECLINED',
  SUBMIT_TRANSACTION_REFUSED = 'SUBMIT_TRANSACTION_REFUSED',
  SUBMIT_TRANSACTION_FAILURE = 'SUBMIT_TRANSACTION_FAILURE',
  SIGN_TRANSACTION_DECLINED = 'SIGN_TRANSACTION_DECLINED',
}

export type Cbor = string;
export type CardanoPaginate = {
  page: number,
  limit: number,
};

export interface RequestCardanoGetUtxos {
  amount?: Cbor;
  paginate?: CardanoPaginate;
}

export interface RequestCardanoGetCollateral {
  amount: Cbor;
}

export interface RequestCardanoSignData {
  address: string;
  payload: string;
}

export interface ResponseCardanoSignData {
  signature: Cbor,
  key: Cbor,
}

export interface RequestCardanoSignTransaction {
  tx: Cbor;
  partialSign: boolean
}

export interface AddressCardanoTransactionBalance {
  values: CardanoBalanceItem[],
  isOwner?: boolean,
  isRecipient?: boolean
}

export type CardanoKeyType = 'stake' | 'payment';
export interface CardanoTransactionDappConfig {
  txInputs: Record<string, AddressCardanoTransactionBalance>,
  txOutputs: Record<string, AddressCardanoTransactionBalance>,
  networkKey: string,
  from: string,
  addressRequireKeyTypes: CardanoKeyType[],
  value: CardanoBalanceItem[],
  estimateCardanoFee: string,
  cardanoPayload: string,
  errors?: ErrorValidation[],
  id: string,
}

export type ResponseCardanoSignTransaction = Cbor;

// TODO: add account info + dataToSign
export type TonSendTransactionRequest = TonTransactionConfig;
export type CardanoSendTransactionRequest = CardanoTransactionConfig;
export type CardanoSignTransactionRequest = CardanoTransactionDappConfig;

export type EvmWatchTransactionRequest = EvmSendTransactionRequest;
export type TonWatchTransactionRequest = TonSendTransactionRequest;
export type CardanoWatchTransactionRequest = CardanoSendTransactionRequest;

export interface ConfirmationsQueueItemOptions {
  requiredPassword?: boolean;
  address?: string;
  networkKey?: string;
  isPassConfirmation?: boolean;
}

export interface ConfirmationsQueueItem<T> extends ConfirmationsQueueItemOptions, ConfirmationRequestBase {
  payload: T;
  payloadJson: string;
}

export interface ConfirmationResult<T> extends ConfirmationRequestBase {
  isApproved: boolean;
  payload?: T;
}

export interface AddNetworkRequestExternal { // currently only support adding pure Evm network
  chainId: string;
  rpcUrls: string[];
  chainName: string;
  blockExplorerUrls?: string[];
  requestId?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export type AddNetworkToRequestConnect = AddNetworkRequestExternal;

export interface AddTokenRequestExternal {
  slug?: string;
  contractAddress: string;
  originChain: string;
  type: _AssetType;
  name: string;
  symbol: string;
  decimals: number;
  validated: boolean;
  contractError: boolean;
}

export interface ErrorNetworkConnection {
  networkKey: string,
  address: string,
  errors: ErrorValidation[]
}

export interface ConfirmationDefinitions {
  addNetworkRequest: [ConfirmationsQueueItem<_NetworkUpsertParams>, ConfirmationResult<null>],
  addTokenRequest: [ConfirmationsQueueItem<AddTokenRequestExternal>, ConfirmationResult<boolean>],
  evmSignatureRequest: [ConfirmationsQueueItem<EvmSignatureRequest>, ConfirmationResult<string>],
  evmSendTransactionRequest: [ConfirmationsQueueItem<EvmSendTransactionRequest>, ConfirmationResult<string>]
  evmWatchTransactionRequest: [ConfirmationsQueueItem<EvmWatchTransactionRequest>, ConfirmationResult<string>],
  errorConnectNetwork: [ConfirmationsQueueItem<ErrorNetworkConnection>, ConfirmationResult<null>],
  submitApiRequest: [ConfirmationsQueueItem<SubmitApiRequest>, ConfirmationResult<string>]
}

export interface ConfirmationDefinitionsTon {
  tonSignatureRequest: [ConfirmationsQueueItem<TonSignatureRequest>, ConfirmationResult<string>],
  tonSendTransactionRequest: [ConfirmationsQueueItem<TonSendTransactionRequest>, ConfirmationResult<string>],
  tonWatchTransactionRequest: [ConfirmationsQueueItem<TonWatchTransactionRequest>, ConfirmationResult<string>]
}

export interface ConfirmationDefinitionsCardano {
  cardanoSignatureRequest: [ConfirmationsQueueItem<CardanoSignatureRequest>, ConfirmationResult<ResponseCardanoSignData>],
  cardanoSendTransactionRequest: [ConfirmationsQueueItem<CardanoSendTransactionRequest>, ConfirmationResult<string>],
  cardanoSignTransactionRequest: [ConfirmationsQueueItem<CardanoSignTransactionRequest>, ConfirmationResult<string>],
  cardanoWatchTransactionRequest: [ConfirmationsQueueItem<CardanoWatchTransactionRequest>, ConfirmationResult<string>]
}

export type ConfirmationType = keyof ConfirmationDefinitions;
export type ConfirmationTypeTon = keyof ConfirmationDefinitionsTon;
export type ConfirmationTypeCardano = keyof ConfirmationDefinitionsCardano;

export type ConfirmationsQueue = {
  [CT in ConfirmationType]: Record<string, ConfirmationDefinitions[CT][0]>;
}
export type ConfirmationsQueueTon = {
  [CT in ConfirmationTypeTon]: Record<string, ConfirmationDefinitionsTon[CT][0]>;
}
export type ConfirmationsQueueCardano = {
  [CT in ConfirmationTypeCardano]: Record<string, ConfirmationDefinitionsCardano[CT][0]>;
}

export type RequestConfirmationsSubscribe = null;
export type RequestConfirmationsSubscribeTon = null;
export type RequestConfirmationsSubscribeCardano = null;

// Design to use only one confirmation
export type RequestConfirmationComplete = {
  [CT in ConfirmationType]?: ConfirmationDefinitions[CT][1];
}
export type RequestConfirmationCompleteTon = {
  [CT in ConfirmationTypeTon]?: ConfirmationDefinitionsTon[CT][1];
}
export type RequestConfirmationCompleteCardano = {
  [CT in ConfirmationTypeCardano]?: ConfirmationDefinitionsCardano[CT][1];
}

export interface BondingOptionParams {
  chain: string;
  type: StakingType;
}

export interface SingleModeJson {
  networkKeys: string[],
  theme: ThemeNames,
  autoTriggerDomain: string // Regex for auto trigger single mode
}

/// Evm transaction

export type NestedArray<T> = T | NestedArray<T>[];

/// Evm Contract Input

export interface EvmTransactionArg {
  name: string;
  type: string;
  value: string;
  children?: EvmTransactionArg[];
}

export interface ParseEvmTransactionData {
  method: string;
  methodName: string;
  args: EvmTransactionArg[];
}

export interface RequestParseEvmContractInput {
  data: string;
  contract: string;
  chainId: number;
}

export type EvmTransactionData = ParseEvmTransactionData | string;

export interface ResponseParseEvmContractInput {
  result: EvmTransactionData;
}

/// Ledger

export interface LedgerNetwork {
  /** GenesisHash for substrate app */
  genesisHash: string;
  /** Display in selector */
  networkName: string;
  /** Name for account(Ledger X Account) */
  accountName: string;
  /** Name in Ledger */
  appName: string;
  /** Network is predefined in ledger lib */
  network: string;
  /** slug in chain list */
  slug: string;
  /** Deprecated */
  icon: 'substrate' | 'ethereum';
  /** Dev mode on Ledger */
  isDevMode: boolean;
  /** Is use generic Ledger app */
  isGeneric: boolean;
  /** Use for evm account */
  isEthereum: boolean;
  /** Hide networks that are supported by the dot migration app */
  isHide?: boolean;
  /** Recovery app */
  isRecovery?: boolean;
  /** Slip44 in the derivation path */
  slip44: number;
}

export interface MigrationLedgerNetwork extends Omit<LedgerNetwork, 'isGeneric' | 'isEthereum' | 'isDevMode' | 'icon' > {
  ss58_addr_type: number
}

/// Qr Sign

// Parse Substrate

export interface FormattedMethod {
  args?: ArgInfo[];
  methodName: string;
}

export interface ArgInfo {
  argName: string;
  argValue: string | string[];
}

export interface EraInfo {
  period: number;
  phase: number;
}

export interface ResponseParseTransactionSubstrate {
  era: EraInfo | string;
  nonce: number;
  method: string | FormattedMethod[];
  tip: number;
  specVersion: number;
  message: string;
}

export interface RequestParseTransactionSubstrate {
  data: string;
  networkKey: string;
}

// Parse Evm

export interface RequestQrParseRLP {
  data: string;
}

export interface ResponseQrParseRLP {
  data: EvmTransactionData;
  input: string;
  nonce: number;
  to: string;
  gas: number;
  gasPrice: number;
  value: number;
}

// Check lock

export interface RequestAccountIsLocked {
  address: string;
}

export interface ResponseAccountIsLocked {
  isLocked: boolean;
  remainingTime: number;
}

// Sign

export type SignerDataType = 'transaction' | 'message'

export interface RequestQrSignSubstrate {
  address: string;
  data: string;
  networkKey: string;
}

export interface ResponseQrSignSubstrate {
  signature: string;
}

export interface RequestQrSignEvm {
  address: string;
  message: string;
  type: 'message' | 'transaction';
  chainId?: number;
}

export interface ResponseQrSignEvm {
  signature: string;
}

export interface RequestChangeFeeToken {
  currentFeeToken?: string;
  selectedFeeToken: string;
}

/// Transfer

export interface ValidateTransactionResponse {
  errors: TransactionError[],
  warnings: TransactionWarning[],
  transferNativeAmount?: string
}

/// Stake

export interface ChainStakingMetadata {
  chain: string;
  type: StakingType;

  // essential
  era: number, // also round for parachains
  minJoinNominationPool?: string; // for relaychain supports nomination pool
  minStake: string;
  maxValidatorPerNominator: number;
  maxWithdrawalRequestPerValidator: number;
  allowCancelUnstaking: boolean;
  unstakingPeriod: number; // in hours

  // supplemental
  expectedReturn?: number; // in %, annually
  inflation?: number; // in %, annually
  nominatorCount?: number;
}// Staking & Bonding

export interface NominationInfo {
  chain: string;
  validatorAddress: string; // can be a nomination pool id
  validatorIdentity?: string;
  activeStake: string;

  hasUnstaking?: boolean;
  validatorMinStake?: string;
  status: EarningStatus;
  originActiveStake?: string
}

export interface UnstakingInfo {
  chain: string;
  status: UnstakingStatus;
  claimable: string; // amount to be withdrawn
  waitingTime?: number;
  targetTimestampMs?: number;
  validatorAddress?: string; // might unstake from a validator or not
}

// Migrated
export interface NominatorMetadata {
  chain: string,
  type: StakingType,

  status: EarningStatus,
  address: string,
  activeStake: string,
  nominations: NominationInfo[],
  unstakings: UnstakingInfo[],
  isBondedBefore?: boolean
}

// Migrated
export interface ValidatorInfo {
  address: string;
  chain: string;

  totalStake: string;
  ownStake: string;
  otherStake: string;

  minBond: string;
  nominatorCount: number;
  commission: number; // in %
  expectedReturn?: number; // in %, annually

  blocked: boolean;
  identity?: string;
  isVerified: boolean;
  icon?: string;
  isCrowded: boolean;
}

export interface BondingSubmitParams extends BaseRequestSign {
  chain: string,
  type: StakingType,
  nominatorMetadata?: NominatorMetadata, // undefined if user has no stake
  amount: string,
  address: string,
  selectedValidators: ValidatorInfo[],
  lockPeriod?: number // in month,
  poolInfo?: {
    metadata: SubnetYieldPositionInfo,
    type: YieldPoolType,
    chain: string
  },
  poolPosition?: {
    chain: string,
  }
}

export type RequestBondingSubmit = InternalRequestSign<BondingSubmitParams>;

// UnBonding

export interface UnbondingSubmitParams extends BaseRequestSign {
  amount: string;
  chain: string;

  nominatorMetadata: NominatorMetadata;
  // for some chains
  validatorAddress?: string;

  isLiquidStaking?: boolean;
  derivativeTokenInfo?: _ChainAsset;
  exchangeRate?: number;
  inputTokenInfo?: _ChainAsset;
  isFastUnbond: boolean;
  poolInfo?: {
    metadata: SubnetYieldPositionInfo,
  },
}

export type RequestUnbondingSubmit = InternalRequestSign<UnbondingSubmitParams>;

// Claim

// Compound

export interface StakePoolingBondingParams extends BaseRequestSign {
  nominatorMetadata?: NominatorMetadata,
  chain: string,
  selectedPool: NominationPoolInfo,
  amount: string,
  address: string
}

export type RequestStakePoolingBonding = InternalRequestSign<StakePoolingBondingParams>;

export interface StakePoolingUnbondingParams extends BaseRequestSign {
  nominatorMetadata: NominatorMetadata,
  chain: string,
  amount: string
}

export type RequestStakePoolingUnbonding = InternalRequestSign<StakePoolingUnbondingParams>;

export interface TuringStakeCompoundParams extends BaseRequestSign {
  address: string,
  collatorAddress: string,
  networkKey: string,
  accountMinimum: string,
  bondedAmount: string,
}

export type RequestTuringStakeCompound = InternalRequestSign<TuringStakeCompoundParams>;

export interface TuringCancelStakeCompoundParams extends BaseRequestSign {
  taskId: string;
  networkKey: string;
  address: string;
}

export type RequestTuringCancelStakeCompound = InternalRequestSign<TuringCancelStakeCompoundParams>;

/// Keyring state

export interface KeyringState {
  isReady: boolean;
  hasMasterPassword: boolean;
  isLocked: boolean;
}

export interface UIViewState {
  isUILocked: boolean;
}

export interface AddressBookState {
  contacts: AddressJson[];
  recent: AddressJson[];
}

// Change master password
export interface RequestChangeMasterPassword {
  oldPassword?: string;
  newPassword: string;

  createNew: boolean;
}

export interface ResponseChangeMasterPassword {
  status: boolean;
  errors: string[];
}

// Migrate password

export interface RequestMigratePassword {
  address: string;
  password: string;
}

export interface ResponseMigratePassword {
  status: boolean;
  errors: string[];
}

// Unlock

export interface RequestUnlockKeyring {
  password: string;
}

export interface ResponseUnlockKeyring {
  status: boolean;
  errors: string[];
}

// Export mnemonic

export interface RequestKeyringExportMnemonic {
  address: string;
  password: string;
}

export interface ResponseKeyringExportMnemonic {
  result: string;
}

// Reset wallet

export interface RequestResetWallet {
  resetAll: boolean;
}

export interface ResponseResetWallet {
  status: boolean;
  errors: string[];
}

/// Signing
export interface RequestSigningApprovePasswordV2 {
  id: string;
}

export interface AssetSettingUpdateReq {
  tokenSlug: string;
  assetSetting: AssetSetting;
  autoEnableNativeToken?: boolean;
}

export interface RequestGetTransaction {
  id: string;
}

// Mobile update
export type SubscriptionServiceType = 'chainRegistry' | 'balance' | 'crowdloan' | 'staking';

export interface MobileData {
  storage: string
  indexedDB: string
}

export type CronServiceType = 'price' | 'nft' | 'staking' | 'history' | 'recoverApi' | 'checkApiStatus';

export type CronType =
  'recoverApiMap' |
  'checkApiMapStatus' |
  'refreshHistory' |
  'refreshNft' |
  'refreshPrice' |
  'refreshStakeUnlockingInfo' |
  'refreshStakingReward' |
  'refreshPoolingStakingReward';

export interface RequestInitCronAndSubscription {
  subscription: {
    activeServices: SubscriptionServiceType[]
  },
  cron: {
    intervalMap: Partial<Record<CronType, number>>,
    activeServices: CronServiceType[]
  }
}

export interface RequestCronAndSubscriptionAction {
  subscriptionServices: SubscriptionServiceType[];
  cronServices: CronServiceType[];
}

export interface ActiveCronAndSubscriptionMap {
  subscription: Record<SubscriptionServiceType, boolean>;
  cron: Record<CronServiceType, boolean>;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface NotificationButton {
  title: string;
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  notifyViaBrowser?: boolean;
  action?: {
    url?: string; // Add more action in the future
    buttonClick?: (btnIndex: number) => void;
    click?: () => void;
  };
  buttons?: NotificationButton[];
}

export type NotificationParams = Omit<Notification, 'id'>;

export interface CronReloadRequest {
  data: 'nft' | 'staking' | 'balance' | 'crowdloan'
}

export interface AllLogoMap {
  chainLogoMap: Record<string, string>;
  assetLogoMap: Record<string, string>;
}

// Phishing detect

export interface PassPhishing {
  pass: boolean;
}

export interface RequestPassPhishingPage {
  url: string;
}

// Psp token

export interface RequestAddPspToken {
  genesisHash: string;
  tokenInfo: {
    type: string;
    address: string;
    symbol: string;
    name: string;
    decimals?: number;
    logo?: string;
  };
}

// Popular tokens

export interface TokenPriorityDetails {
  tokenGroup: Record<string, number>;
  token: Record<string, number>
}

// Sufficient chains

export interface SufficientChainsDetails {
  assetHubPallet: string[],
  assetsPallet: string[],
  foreignAssetsPallet: string[],
  assetRegistryPallet: string[]
}

/// WalletConnect

// Connect
export interface RequestConnectWalletConnect {
  uri: string;
}

export interface RequestRejectConnectWalletSession {
  id: string;
}

export interface RequestApproveConnectWalletSession {
  id: string;
  accounts: string[];
}

export interface RequestReconnectConnectWalletSession {
  id: string;
}

export interface RequestDisconnectWalletConnectSession {
  topic: string;
}

// Not support

export interface RequestRejectWalletConnectNotSupport {
  id: string;
}

export interface RequestApproveWalletConnectNotSupport {
  id: string;
}

/// Manta

export interface MantaPayConfig {
  address: string;
  zkAddress: string;
  enabled: boolean;
  chain: string;
  isInitialSync: boolean;
}

export interface MantaAuthorizationContext {
  address: string;
  chain: string;
  data: unknown;
}

export interface MantaPaySyncState {
  isSyncing: boolean,
  progress: number,
  needManualSync?: boolean
}

export interface MantaPayEnableParams {
  password: string,
  address: string
}

export enum MantaPayEnableMessage {
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SUCCESS = 'SUCCESS'
}

export interface MantaPayEnableResponse {
  success: boolean;
  message: MantaPayEnableMessage;
}

/// Metadata
export interface RequestFindRawMetadata {
  genesisHash: string;
}

export interface ResponseFindRawMetadata {
  rawMetadata: string;
  specVersion: number;
  types: Record<string, Record<string, string> | string>;
  userExtensions?: ExtDef;
}

export interface ResolveDomainRequest {
  chain: string,
  domain: string
}

export interface ResolveAddressToDomainRequest {
  chain: string,
  address: string
}

export interface RequestYieldFastWithdrawal extends BaseRequestSign {
  address: string;
  yieldPoolInfo: YieldPoolInfo;
  yieldPositionInfo: YieldPositionInfo;
  amount: string;
}

/* Campaign */

export type CampaignAction = 'open_view' | 'open_url' | null;

export interface CampaignButton {
  id: number;
  color: string;
  icon: string | null;
  name: string;
  type: CampaignAction;
  metadata: Record<string, any> | null;
}

export interface ShowCampaignPopupRequest {
  value: boolean;
}

export enum CampaignDataType {
  NOTIFICATION = 'notification',
  BANNER = 'banner'
}

export interface BaseCampaignData {
  slug: string;
  campaignId: number;
  isDone: boolean;
  isArchive: boolean;
  type: CampaignDataType;
  data: Record<string, any>;
  buttons: CampaignButton[];
  startTime: number;
  endTime: number;
  condition: Record<string, any> | null;
}

export interface CampaignBanner extends BaseCampaignData {
  type: CampaignDataType.BANNER;
  data: {
    media: string;
    alt: string;
    action: CampaignAction;
    metadata: Record<string, any> | null;
    environments: string[];
    position: string[];
  };
}

export interface CampaignNotification extends BaseCampaignData {
  type: CampaignDataType.NOTIFICATION;
  data: {
    title: string;
    message: string;
    repeat: number;
    repeatAfter: number;
    action: CampaignAction;
    metadata: Record<string, any> | null;
  };
}

export type CampaignData = CampaignBanner | CampaignNotification;

export interface RequestCampaignBannerComplete {
  slug: string;
}

export interface RequestSubscribeHistory {
  address: string;
  chain: string;
}

export interface ResponseSubscribeHistory {
  id: string;
  items: TransactionHistoryItem[]
}

export interface ResponseNftImport {
  success: boolean;
  error: string;
}

/* Campaign */

/* Migrate Unified Account */
export interface RequestSaveMigrationAcknowledgedStatus {
  isAcknowledgedUnifiedAccountMigration: boolean;
}

export interface RequestSaveUnifiedAccountMigrationInProgress {
  isUnifiedAccountMigrationInProgress: boolean;
}

export interface RequestMigrateUnifiedAndFetchEligibleSoloAccounts {
  password: string
}

export interface ResponseMigrateUnifiedAndFetchEligibleSoloAccounts {
  migratedUnifiedAccountIds: string[],
  soloAccounts: Record<string, SoloAccountToBeMigrated[]>
  sessionId: string; // to keep linking to password in state
}

export interface SoloAccountToBeMigrated {
  upcomingProxyId: string,
  proxyId: string,
  address: string,
  name: string,
  chainType: AccountChainType
}

export interface RequestMigrateSoloAccount {
  soloAccounts: SoloAccountToBeMigrated[];
  accountName: string;
  sessionId: string;
}

export interface ResponseMigrateSoloAccount {
  migratedUnifiedAccountId: string
}

export interface RequestPingSession {
  sessionId: string;
}

export interface ExtrinsicsDataResponse {
  extrinsics: { id: string }[];
}

/* Core types */
export type _Address = string;
export type _BalanceMetadata = unknown;

// Use stringify to communicate, pure boolean value will error with case 'false' value
export interface KoniRequestSignatures {
  // Bonding functions
  'pri(staking.submitTuringCancelCompound)': [RequestTuringCancelStakeCompound, SWTransactionResponse];
  'pri(staking.submitTuringCompound)': [RequestTuringStakeCompound, SWTransactionResponse];
  'pri(staking.submitClaimReward)': [RequestStakeClaimReward, SWTransactionResponse];
  'pri(staking.submitCancelWithdrawal)': [RequestStakeCancelWithdrawal, SWTransactionResponse];
  'pri(unbonding.submitTransaction)': [RequestUnbondingSubmit, SWTransactionResponse];
  'pri(bonding.submitBondingTransaction)': [RequestBondingSubmit, SWTransactionResponse];
  'pri(bonding.subscribeChainStakingMetadata)': [null, ChainStakingMetadata[], ChainStakingMetadata[]];
  'pri(bonding.subscribeNominatorMetadata)': [null, NominatorMetadata[], NominatorMetadata[]];
  'pri(bonding.getBondingOptions)': [BondingOptionParams, ValidatorInfo[]];
  'pri(bonding.getNominationPoolOptions)': [string, NominationPoolInfo[]];
  'pri(bonding.nominationPool.submitBonding)': [RequestYieldStepSubmit, SWTransactionResponse];
  'pri(bonding.nominationPool.submitUnbonding)': [RequestStakePoolingUnbonding, SWTransactionResponse];

  // Chains, assets functions
  'pri(chainService.subscribeChainInfoMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeChainStateMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeChainStatusMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeAssetRegistry)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeMultiChainAssetMap)': [null, Record<string, _MultiChainAsset>, Record<string, _MultiChainAsset>];
  'pri(chainService.subscribeXcmRefMap)': [null, Record<string, _AssetRef>, Record<string, _AssetRef>];
  'pri(chainService.upsertChain)': [_NetworkUpsertParams, boolean];
  'pri(chainService.enableChains)': [EnableMultiChainParams, boolean];
  'pri(chainService.enableChain)': [EnableChainParams, boolean];
  'pri(chainService.enableChainWithPriorityAssets)': [EnableChainParams, boolean];
  'pri(chainService.reconnectChain)': [string, boolean];
  'pri(chainService.disableChains)': [string[], boolean];
  'pri(chainService.disableChain)': [string, boolean];
  'pri(chainService.removeChain)': [string, boolean];
  'pri(chainService.deleteCustomAsset)': [string, boolean];
  'pri(chainService.upsertCustomAsset)': [Record<string, any>, ResponseNftImport];
  'pri(chainService.validateCustomAsset)': [_ValidateCustomAssetRequest, _ValidateCustomAssetResponse];
  'pri(chainService.resetDefaultChains)': [null, boolean];
  'pri(chainService.getSupportedContractTypes)': [null, string[]];
  'pri(chainService.validateCustomChain)': [ValidateNetworkRequest, ValidateNetworkResponse];
  'pri(chainService.recoverSubstrateApi)': [string, boolean];
  'pri(chainService.disableAllChains)': [null, boolean];
  'pri(assetSetting.getSubscription)': [null, Record<string, AssetSetting>, Record<string, AssetSetting>];
  'pri(assetSetting.update)': [AssetSettingUpdateReq, boolean];

  // NFT functions
  'pri(evmNft.submitTransaction)': [NftTransactionRequest, SWTransactionResponse];
  'pri(evmNft.getTransaction)': [NftTransactionRequest, EvmNftTransaction];
  'pri(substrateNft.submitTransaction)': [NftTransactionRequest, SWTransactionResponse];
  'pri(substrateNft.getTransaction)': [NftTransactionRequest, SubstrateNftTransaction];
  'pri(nft.getNft)': [null, NftJson];
  'pri(nft.getSubscription)': [RequestSubscribeNft, NftJson, NftJson];
  'pri(nftCollection.getNftCollection)': [null, NftCollectionJson];
  'pri(nftCollection.getSubscription)': [null, NftCollection[], NftCollection[]];

  // Staking functions
  'pri(staking.getStaking)': [null, StakingJson];
  'pri(staking.getSubscription)': [RequestSubscribeStaking, StakingJson, StakingJson];
  'pri(stakingReward.getStakingReward)': [null, StakingRewardJson];
  'pri(stakingReward.getSubscription)': [RequestSubscribeStakingReward, StakingRewardJson, StakingRewardJson];

  // Price, balance, crowdloan functions
  'pri(price.getPrice)': [RequestPrice, PriceJson];
  'pri(price.getSubscription)': [RequestSubscribePrice, PriceJson, PriceJson];
  'pri(price.getHistory)': [RequestGetHistoryTokenPriceData, HistoryTokenPriceJSON];
  'pri(price.checkCoinGeckoPriceSupport)': [string, boolean];
  'pri(price.subscribeCurrentTokenPrice)': [string, ResponseSubscribeCurrentTokenPrice, CurrentTokenPrice];
  'pri(balance.getBalance)': [RequestBalance, BalanceJson];
  'pri(balance.getSubscription)': [RequestSubscribeBalance, BalanceJson, BalanceJson];
  'pri(crowdloan.getCrowdloan)': [RequestCrowdloan, CrowdloanJson];
  'pri(crowdloan.getCrowdloanContributions)': [RequestCrowdloanContributions, CrowdloanContributionsResponse];
  'pri(crowdloan.getSubscription)': [RequestSubscribeCrowdloan, CrowdloanJson, CrowdloanJson];

  // Phishing page
  'pri(phishing.pass)': [RequestPassPhishingPage, boolean];

  // Manta pay
  'pri(mantaPay.enable)': [MantaPayEnableParams, MantaPayEnableResponse];
  'pri(mantaPay.disable)': [string, boolean];
  'pri(mantaPay.getZkBalance)': [null, null];
  'pri(mantaPay.subscribeConfig)': [null, MantaPayConfig[], MantaPayConfig[]];
  'pri(mantaPay.subscribeSyncingState)': [null, MantaPaySyncState, MantaPaySyncState];
  'pri(mantaPay.initSyncMantaPay)': [string, null];

  // Auth
  'pri(authorize.listV2)': [null, ResponseAuthorizeList];
  'pri(authorize.requestsV2)': [RequestAuthorizeSubscribe, AuthorizeRequest[], AuthorizeRequest[]];
  'pri(authorize.approveV2)': [RequestAuthorizeApproveV2, boolean];
  'pri(authorize.changeSiteAll)': [RequestAuthorizationAll, boolean, AuthUrls];
  'pri(authorize.changeSite)': [RequestAuthorization, boolean, AuthUrls];
  'pri(authorize.changeSitePerAccount)': [RequestAuthorizationPerAccount, boolean, AuthUrls];
  'pri(authorize.changeSitePerSite)': [RequestAuthorizationPerSite, boolean];
  'pri(authorize.changeSiteBlock)': [RequestAuthorizationBlock, boolean];
  'pri(authorize.forgetSite)': [RequestForgetSite, boolean, AuthUrls];
  'pri(authorize.forgetAllSite)': [null, boolean, AuthUrls];
  'pri(authorize.rejectV2)': [RequestAuthorizeReject, boolean];
  'pri(authorize.cancelV2)': [RequestAuthorizeCancel, boolean];

  /* Account management */

  // Validate
  'pri(accounts.validate.seed)': [RequestMnemonicValidateV2, ResponseMnemonicValidateV2];
  'pri(accounts.validate.name)': [RequestAccountNameValidate, ResponseAccountNameValidate];
  'pri(accounts.validate.privateKey)': [RequestPrivateKeyValidateV2, ResponsePrivateKeyValidateV2];
  'pri(accounts.validate.substrate.publicAndPrivateKey)': [RequestCheckPublicAndSecretKey, ResponseCheckPublicAndSecretKey];
  'pri(accounts.validate.bounceable)': [RequestBounceableValidate, boolean];

  // Create account
  'pri(seed.createV2)': [RequestMnemonicCreateV2, ResponseMnemonicCreateV2];
  'pri(accounts.create.suriV2)': [RequestAccountCreateSuriV2, ResponseAccountCreateSuriV2];
  'pri(accounts.create.externalV2)': [RequestAccountCreateExternalV2, AccountExternalError[]];
  'pri(accounts.create.hardwareV2)': [RequestAccountCreateHardwareV2, boolean];
  'pri(accounts.create.hardwareMultiple)': [RequestAccountCreateHardwareMultiple, boolean];
  'pri(accounts.create.withSecret)': [RequestAccountCreateWithSecretKey, ResponseAccountCreateWithSecretKey];

  // Inject account
  'pri(accounts.inject.add)': [RequestAddInjectedAccounts, boolean];
  'pri(accounts.inject.remove)': [RequestRemoveInjectedAccounts, boolean];

  // Restore by json
  'pri(accounts.json.info)': [RequestJsonGetAccountInfo, ResponseJsonGetAccountInfo];
  'pri(accounts.json.restoreV2)': [RequestJsonRestoreV2, string[]];
  'pri(accounts.json.batchInfo)': [RequestBatchJsonGetAccountInfo, ResponseBatchJsonGetAccountInfo];
  'pri(accounts.json.batchRestoreV2)': [RequestBatchRestoreV2, string[]];

  // Export account
  'pri(accounts.export.json.batch)': [RequestAccountBatchExportV2, ResponseAccountBatchExportV2];
  'pri(accounts.export.privateKey)': [RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey];
  'pri(accounts.export.mnemonic)': [RequestExportAccountProxyMnemonic, ResponseExportAccountProxyMnemonic];

  // Current account
  'pri(accounts.subscribeWithCurrentProxy)': [RequestAccountSubscribe, AccountsWithCurrentAddress, AccountsWithCurrentAddress];
  'pri(accounts.saveCurrentProxy)': [RequestCurrentAccountAddress, CurrentAccountInfo];

  // Edit account
  'pri(accounts.edit)': [RequestAccountProxyEdit, boolean];
  'pri(accounts.forget)': [RequestAccountProxyForget, boolean];
  'pri(accounts.ton.version.change)': [RequestChangeTonWalletContractVersion, string];
  'pri(accounts.ton.version.map)': [RequestGetAllTonWalletContractVersion, ResponseGetAllTonWalletContractVersion];

  // Derive
  'pri(accounts.derive.validateV2)': [RequestDeriveValidateV2, ResponseDeriveValidateV2];
  'pri(accounts.derive.suggestion)': [RequestGetDeriveSuggestion, ResponseGetDeriveSuggestion];
  'pri(accounts.derive.getList)': [RequestGetDeriveAccounts, ResponseGetDeriveAccounts];
  'pri(accounts.derive.create.multiple)': [RequestDeriveCreateMultiple, boolean];
  'pri(accounts.derive.createV3)': [RequestDeriveCreateV3, boolean];

  // Keyring state
  'pri(keyring.subscribe)': [null, KeyringState, KeyringState];
  'pri(keyring.change)': [RequestChangeMasterPassword, ResponseChangeMasterPassword];
  'pri(keyring.migrate)': [RequestMigratePassword, ResponseMigratePassword];
  'pri(keyring.unlock)': [RequestUnlockKeyring, ResponseUnlockKeyring];
  'pri(keyring.lock)': [null, void];
  'pri(keyring.export.mnemonic)': [RequestKeyringExportMnemonic, ResponseKeyringExportMnemonic];
  'pri(keyring.reset)': [RequestResetWallet, ResponseResetWallet];

  // Address book
  'pri(addressBook.saveRecent)': [RequestSaveRecentAccount, KeyringAddress];
  'pri(addressBook.subscribe)': [null, AddressBookInfo, AddressBookInfo];
  'pri(addressBook.edit)': [RequestEditContactAccount, boolean];
  'pri(addressBook.delete)': [RequestDeleteContactAccount, boolean];

  // Domain name
  'pri(accounts.resolveDomainToAddress)': [ResolveDomainRequest, string | undefined];
  'pri(accounts.resolveAddressToDomain)': [ResolveAddressToDomainRequest, string | undefined];

  // For input UI
  'pri(accounts.subscribeAccountsInputAddress)': [RequestInputAccountSubscribe, ResponseInputAccountSubscribe, ResponseInputAccountSubscribe];

  /* Account management */

  // Settings
  'pri(settings.changeBalancesVisibility)': [null, boolean];
  'pri(settings.subscribe)': [null, UiSettings, UiSettings];
  'pri(settings.getLogoMaps)': [null, AllLogoMap];
  'pri(settings.saveAccountAllLogo)': [string, boolean, UiSettings];
  'pri(settings.saveTheme)': [ThemeNames, boolean];
  'pri(settings.saveBrowserConfirmationType)': [BrowserConfirmationType, boolean];
  'pri(settings.saveCamera)': [RequestCameraSettings, boolean];
  'pri(settings.saveAutoLockTime)': [RequestChangeTimeAutoLock, boolean];
  'pri(settings.saveUnlockType)': [RequestUnlockType, boolean];
  'pri(settings.saveEnableChainPatrol)': [RequestChangeEnableChainPatrol, boolean];
  'pri(settings.saveNotificationSetup)': [NotificationSetup, boolean];
  'pri(settings.saveUnifiedAccountMigrationInProgress)': [RequestSaveUnifiedAccountMigrationInProgress, boolean];
  'pri(settings.pingUnifiedAccountMigrationDone)': [null, boolean];
  'pri(settings.saveMigrationAcknowledgedStatus)': [RequestSaveMigrationAcknowledgedStatus, boolean];
  'pri(settings.saveLanguage)': [RequestChangeLanguage, boolean];
  'pri(settings.savePriceCurrency)': [RequestChangePriceCurrency, boolean];
  'pri(settings.saveShowZeroBalance)': [RequestChangeShowZeroBalance, boolean];
  'pri(settings.saveShowBalance)': [RequestChangeShowBalance, boolean];
  'pri(settings.update.allowOneSign)': [RequestChangeAllowOneSign, boolean];
  'pri(settings.logo.assets.subscribe)': [null, Record<string, string>, Record<string, string>];
  'pri(settings.logo.chains.subscribe)': [null, Record<string, string>, Record<string, string>];

  // Environment Config
  'pri(settings.saveAppConfig)': [RequestSaveAppConfig, boolean];
  'pri(settings.saveBrowserConfig)': [RequestSaveBrowserConfig, boolean];
  'pri(settings.saveOSConfig)': [RequestSaveOSConfig, boolean];

  /* Earning */

  /* Info */

  'pri(yield.subscribePoolInfo)': [null, YieldPoolInfo[], YieldPoolInfo[]];
  'pri(yield.subscribeYieldPosition)': [null, YieldPositionInfo[], YieldPositionInfo[]];
  'pri(yield.subscribeYieldReward)': [null, EarningRewardJson, EarningRewardJson];
  'pri(yield.subscribeRewardHistory)': [null, Record<string, EarningRewardHistoryItem>, Record<string, EarningRewardHistoryItem>];
  'pri(yield.getTargets)': [RequestGetYieldPoolTargets, ResponseGetYieldPoolTargets];
  'pri(yield.minAmountPercent)': [null, Record<string, number>, Record<string, number>];

  // Deprecated
  'pri(yield.getNativeStakingValidators)': [YieldPoolInfo, ValidatorInfo[]];
  'pri(yield.getStakingNominationPools)': [YieldPoolInfo, NominationPoolInfo[]];

  /* Info */

  /* Actions */

  /* Join */

  'pri(yield.join.earlyValidate)': [RequestEarlyValidateYield, ResponseEarlyValidateYield];
  'pri(yield.join.getOptimalPath)': [OptimalYieldPathParams, OptimalYieldPath];
  'pri(yield.join.handleStep)': [HandleYieldStepParams, SWTransactionResponse];
  'pri(yield.join.validateProcess)': [ValidateYieldProcessParams, TransactionError[]];

  /* Join */

  /* Leave */

  'pri(yield.leave.submit)': [RequestYieldLeave, SWTransactionResponse];

  // Deprecated
  'pri(yield.submitRedeem)': [RequestYieldFastWithdrawal, SWTransactionResponse];
  'pri(yield.staking.submitUnstaking)': [RequestUnbondingSubmit, SWTransactionResponse];
  'pri(yield.nominationPool.submitUnstaking)': [RequestStakePoolingUnbonding, SWTransactionResponse];

  /* Leave */

  /* Other */

  'pri(yield.withdraw.submit)': [RequestYieldWithdrawal, SWTransactionResponse];
  'pri(yield.cancelWithdrawal.submit)': [RequestStakeCancelWithdrawal, SWTransactionResponse];
  'pri(yield.claimReward.submit)': [RequestStakeClaimReward, SWTransactionResponse];
  'pri(yield.getEarningSlippage)': [RequestEarningSlippage, EarningSlippageResult];

  /* Other */

  /* Actions */

  /* Earning */

  // Subscription
  'pri(transaction.history.getSubscription)': [null, TransactionHistoryItem[], TransactionHistoryItem[]];
  'pri(transaction.history.subscribe)': [RequestSubscribeHistory, ResponseSubscribeHistory, TransactionHistoryItem[]];
  'pri(transfer.getMaxTransferable)': [RequestMaxTransferable, AmountData];
  'pri(transfer.subscribe)': [RequestSubscribeTransfer, ResponseSubscribeTransfer, ResponseSubscribeTransfer];
  'pri(subscription.cancel)': [string, boolean];
  'pri(freeBalance.get)': [RequestFreeBalance, AmountData];
  'pri(freeBalance.subscribe)': [RequestFreeBalance, AmountDataWithId, AmountDataWithId];

  // Transfer
  'pri(accounts.checkTransfer)': [RequestCheckTransfer, ValidateTransactionResponse];
  'pri(accounts.transfer)': [RequestSubmitTransfer, SWTransactionResponse];
  'pri(accounts.getOptimalTransferProcess)': [RequestOptimalTransferProcess, CommonOptimalTransferPath];
  'pri(accounts.approveSpending)': [TokenSpendingApprovalParams, SWTransactionResponse];

  'pri(accounts.checkCrossChainTransfer)': [RequestCheckCrossChainTransfer, ValidateTransactionResponse];
  'pri(accounts.crossChainTransfer)': [RequestCrossChainTransfer, SWTransactionResponse];

  'pri(customFee.getTokensCanPayFee)': [RequestGetTokensCanPayFee, TokenPayFeeInfo];
  'pri(customFee.getAmountForPair)': [RequestGetAmountForPair, string];

  // Confirmation Queues
  'pri(confirmations.subscribe)': [RequestConfirmationsSubscribe, ConfirmationsQueue, ConfirmationsQueue];
  'pri(confirmationsTon.subscribe)': [RequestConfirmationsSubscribeTon, ConfirmationsQueueTon, ConfirmationsQueueTon];
  'pri(confirmationsCardano.subscribe)': [RequestConfirmationsSubscribeCardano, ConfirmationsQueueCardano, ConfirmationsQueueCardano];
  'pri(confirmations.complete)': [RequestConfirmationComplete, boolean];
  'pri(confirmationsTon.complete)': [RequestConfirmationCompleteTon, boolean];
  'pri(confirmationsCardano.complete)': [RequestConfirmationCompleteCardano, boolean];

  'pub(utils.getRandom)': [RandomTestRequest, number];
  'pub(accounts.listV2)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribeV2)': [RequestAccountSubscribe, string, InjectedAccount[]];
  'pub(accounts.unsubscribe)': [RequestAccountUnsubscribe, boolean];

  // Sign QR
  'pri(account.isLocked)': [RequestAccountIsLocked, ResponseAccountIsLocked];
  'pri(qr.transaction.parse.substrate)': [RequestParseTransactionSubstrate, ResponseParseTransactionSubstrate];
  'pri(qr.transaction.parse.evm)': [RequestQrParseRLP, ResponseQrParseRLP];
  'pri(qr.sign.substrate)': [RequestQrSignSubstrate, ResponseQrSignSubstrate];
  'pri(qr.sign.evm)': [RequestQrSignEvm, ResponseQrSignEvm];

  // External account request
  'pri(account.external.reject)': [RequestRejectExternalRequest, ResponseRejectExternalRequest];
  'pri(account.external.resolve)': [RequestResolveExternalRequest, ResponseResolveExternalRequest];

  // Evm
  'evm(events.subscribe)': [RequestEvmEvents, boolean, EvmEvent];
  'evm(request)': [RequestArguments, unknown];
  'evm(provider.send)': [RequestEvmProviderSend, string | number, ResponseEvmProviderSend];

  // Cardano
  'cardano(account.get.address)': [null, string[]];
  'cardano(account.get.balance)': [null, Cbor];
  'cardano(account.get.change.address)': [null, string];
  'cardano(account.get.reward.address)': [null, string[]];
  'cardano(account.get.utxos)': [RequestCardanoGetUtxos, Cbor[] | null];
  'cardano(account.get.collateral)': [RequestCardanoGetCollateral, Cbor[] | null];
  'cardano(network.get.current)': [null, number];
  'cardano(data.sign)': [RequestCardanoSignData, ResponseCardanoSignData];
  'cardano(transaction.sign)': [RequestCardanoSignTransaction, ResponseCardanoSignTransaction];
  'cardano(transaction.submit)': [Cbor, string];

  // Evm Transaction
  'pri(evm.transaction.parse.input)': [RequestParseEvmContractInput, ResponseParseEvmContractInput];

  // Authorize
  'pri(authorize.subscribe)': [null, AuthUrls, AuthUrls];

  // Signing
  'pri(signing.approve.passwordV2)': [RequestSigningApprovePasswordV2, boolean];

  // Transaction
  // Get Transaction
  'pri(transactions.getOne)': [RequestGetTransaction, SWTransactionResult];
  'pri(transactions.subscribe)': [null, Record<string, SWTransactionResult>, Record<string, SWTransactionResult>];

  // Notification
  'pri(notifications.subscribe)': [null, Notification[], Notification[]];

  // Private
  'pri(cron.reload)': [CronReloadRequest, boolean];

  // Mobile
  'mobile(ping)': [null, string];
  'mobile(cronAndSubscription.init)': [RequestInitCronAndSubscription, ActiveCronAndSubscriptionMap];
  'mobile(cronAndSubscription.activeService.subscribe)': [null, ActiveCronAndSubscriptionMap, ActiveCronAndSubscriptionMap];
  'mobile(cronAndSubscription.start)': [RequestCronAndSubscriptionAction, void];
  'mobile(cronAndSubscription.stop)': [RequestCronAndSubscriptionAction, void];
  'mobile(cronAndSubscription.restart)': [RequestCronAndSubscriptionAction, void];
  'mobile(cron.start)': [CronServiceType[], void];
  'mobile(cron.stop)': [CronServiceType[], void];
  'mobile(cron.restart)': [CronServiceType[], void];
  'mobile(subscription.start)': [SubscriptionServiceType[], void];
  'mobile(subscription.stop)': [SubscriptionServiceType[], void];
  'mobile(subscription.restart)': [SubscriptionServiceType[], void];
  'mobile(storage.backup)': [null, MobileData];
  'mobile(storage.restore)': [Partial<MobileData>, null];

  // Psp token
  'pub(token.add)': [RequestAddPspToken, boolean];

  /// Wallet connect
  'pri(walletConnect.connect)': [RequestConnectWalletConnect, boolean];
  'pri(walletConnect.requests.connect.subscribe)': [null, WalletConnectSessionRequest[], WalletConnectSessionRequest[]];
  'pri(walletConnect.session.approve)': [RequestApproveConnectWalletSession, boolean];
  'pri(walletConnect.session.reject)': [RequestRejectConnectWalletSession, boolean];
  'pri(walletConnect.session.reconnect)': [RequestReconnectConnectWalletSession, boolean];
  'pri(walletConnect.session.subscribe)': [null, SessionTypes.Struct[], SessionTypes.Struct[]];
  'pri(walletConnect.session.disconnect)': [RequestDisconnectWalletConnectSession, boolean];
  'pri(walletConnect.requests.notSupport.subscribe)': [null, WalletConnectNotSupportRequest[], WalletConnectNotSupportRequest[]];
  'pri(walletConnect.notSupport.approve)': [RequestApproveWalletConnectNotSupport, boolean];
  'pri(walletConnect.notSupport.reject)': [RequestRejectWalletConnectNotSupport, boolean];

  /// Metadata
  'pri(metadata.find)': [RequestFindRawMetadata, ResponseFindRawMetadata];
  'pri(metadata.hash)': [RequestMetadataHash, ResponseMetadataHash];
  'pri(metadata.transaction.shorten)': [RequestShortenMetadata, ResponseShortenMetadata];

  /* Campaign */

  'pri(campaign.unlockDot.canMint)': [RequestUnlockDotCheckCanMint, boolean];
  'pri(campaign.unlockDot.subscribe)': [RequestUnlockDotSubscribeMintedData, UnlockDotTransactionNft, UnlockDotTransactionNft];

  /* Campaign */

  /* Campaign */
  'pri(campaign.banner.subscribe)': [null, CampaignBanner[], CampaignBanner[]];
  'pri(campaign.popup.subscribeVisibility)': [null, ShowCampaignPopupRequest, ShowCampaignPopupRequest];
  'pri(campaign.popup.toggle)': [ShowCampaignPopupRequest, null];
  'pri(campaign.popup.getData)': [null, AppPopupData[]];
  'pri(campaign.banner.getData)': [null, AppBannerData[]];
  'pri(campaign.confirmation.getData)': [null, AppConfirmationData[]];
  'pri(campaign.popups.subscribe)': [null, AppPopupData[], AppPopupData[]];
  'pri(campaign.banners.subscribe)': [null, AppBannerData[], AppBannerData[]];
  'pri(campaign.confirmations.subscribe)': [null, AppConfirmationData[], AppConfirmationData[]];
  'pri(campaign.banner.complete)': [RequestCampaignBannerComplete, boolean];
  /* Campaign */

  /* Buy Service */
  'pri(buyService.tokens.subscribe)': [null, Record<string, BuyTokenInfo>, Record<string, BuyTokenInfo>];
  'pri(buyService.services.subscribe)': [null, Record<string, BuyServiceInfo>, Record<string, BuyServiceInfo>];
  /* Buy Service */

  /* Database Service */
  'pri(database.export)': [null, string];
  'pri(database.import)': [string, boolean];
  'pri(database.exportJson)': [null, DexieExportJsonStructure];
  'pri(database.migrateLocalStorage)': [string, boolean];
  'pri(database.setLocalStorage)': [StorageDataInterface, boolean];
  'pri(database.getLocalStorage)': [string, string | null];
  /* Database Service */

  /* Swap */
  'pri(swapService.subscribePairs)': [null, SwapPair[], SwapPair[]];
  'pri(swapService.handleSwapRequest)': [SwapRequest, SwapRequestResult];
  'pri(swapService.handleSwapRequestV2)': [SwapRequestV2, SwapRequestResult];
  'pri(swapService.handleSwapStep)': [SwapSubmitParams, SWTransactionResponse];
  'pri(swapService.getLatestQuote)': [SwapRequest, SwapQuoteResponse];
  'pri(swapService.validateSwapProcess)': [ValidateSwapProcessParams, TransactionError[]];
  /* Swap */

  /* Notification Service */
  'pri(inappNotification.subscribeUnreadNotificationCountMap)': [null, Record<string, number>, Record<string, number>];
  'pri(inappNotification.markAllReadNotification)': [string, null];
  'pri(inappNotification.switchReadNotificationStatus)': [RequestSwitchStatusParams, null];
  'pri(inappNotification.fetch)': [GetNotificationParams, _NotificationInfo[]];
  'pri(inappNotification.get)': [string, _NotificationInfo];
  'pri(inappNotification.isClaimedPolygonBridge)': [RequestIsClaimedPolygonBridge, boolean]
  /* Notification Service */

  /* Avail Bridge */
  'pri(availBridge.submitClaimAvailBridgeOnAvail)': [RequestClaimBridge, SWTransactionResponse]
  /* Avail Bridge */

  /* Polygon Bridge */
  'pri(polygonBridge.submitClaimPolygonBridge)': [RequestClaimBridge, SWTransactionResponse]
  /* Polygon Bridge */

  /* Ledger */
  'pri(ledger.generic.allow)': [null, string[], string[]];
  /* Ledger */

  /* Popular tokens */
  'pri(tokens.subscribePriority)': [null, TokenPriorityDetails, TokenPriorityDetails];
  /* Popular tokens */

  /* Process multi steps */
  'pri(process.transaction.submit)': [RequestSubmitProcessTransaction, SWTransactionResponse];
  'pri(process.subscribe.id)': [RequestSubscribeProcessById, ResponseSubscribeProcessById, ResponseSubscribeProcessById];
  'pri(process.subscribe.alive)': [null, ResponseSubscribeProcessAlive, ResponseSubscribeProcessAlive];
  /* Process multi steps */

  /* Migrate Unified Account */
  'pri(migrate.migrateUnifiedAndFetchEligibleSoloAccounts)': [RequestMigrateUnifiedAndFetchEligibleSoloAccounts, ResponseMigrateUnifiedAndFetchEligibleSoloAccounts];
  'pri(migrate.migrateSoloAccount)': [RequestMigrateSoloAccount, ResponseMigrateSoloAccount];
  'pri(migrate.pingSession)': [RequestPingSession, boolean];
}

export interface ApplicationMetadataType {
  version: string;
}

export type OSType = 'Mac OS' | 'iOS' | 'Windows' | 'Android' | 'Linux' | 'Unknown';
export const MobileOS: OSType[] = ['iOS', 'Android'];
