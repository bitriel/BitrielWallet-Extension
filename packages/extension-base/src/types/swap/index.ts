// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@bitriel/chain-list/types';
import { SwapError } from '@bitriel/extension-base/background/errors/SwapError';
import { AmountData, ChainType, ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { BaseStepDetail, BaseStepType, CommonOptimalSwapPath, CommonStepFeeInfo } from '@bitriel/extension-base/types/service-base';
import BigN from 'bignumber.js';

import { BaseProcessRequestSign, TransactionData } from '../transaction';

// core
export type SwapRate = number;

export interface SwapPair {
  slug: string;
  from: string;
  to: string;
  metadata?: Record<string, any>;
}

export interface ActionPair {
  slug: string;
  from: string;
  to: string;
}

export interface SwapQuote {
  pair: SwapPair;
  fromAmount: string;
  toAmount: string;
  rate: SwapRate; // rate = fromToken / toToken
  provider: SwapProvider;
  aliveUntil: number; // timestamp
  route: SwapRoute;

  minSwap?: string; // min amount to start swapping
  maxSwap?: string; // set by the provider
  estimatedArrivalTime?: number; // in seconds
  isLowLiquidity?: boolean; // definition would be different for different providers
  metadata?: any;

  feeInfo: CommonStepFeeInfo;
}

export interface SwapRoute {
  path: string[]; // list of tokenSlug
  // todo: there might be more info
}

export enum SwapErrorType {
  ERROR_FETCHING_QUOTE = 'ERROR_FETCHING_QUOTE',
  NOT_MEET_MIN_SWAP = 'NOT_MEET_MIN_SWAP',
  UNKNOWN = 'UNKNOWN',
  ASSET_NOT_SUPPORTED = 'ASSET_NOT_SUPPORTED',
  QUOTE_TIMEOUT = 'QUOTE_TIMEOUT',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  SWAP_EXCEED_ALLOWANCE = 'SWAP_EXCEED_ALLOWANCE',
  SWAP_NOT_ENOUGH_BALANCE = 'SWAP_NOT_ENOUGH_BALANCE',
  NOT_ENOUGH_LIQUIDITY = 'NOT_ENOUGH_LIQUIDITY',
  MAKE_POOL_NOT_ENOUGH_EXISTENTIAL_DEPOSIT = 'MAKE_POOL_NOT_ENOUGH_EXISTENTIAL_DEPOSIT',
  AMOUNT_CANNOT_BE_ZERO = 'AMOUNT_CANNOT_BE_ZERO',
  NOT_MEET_MIN_EXPECTED = 'NOT_MEET_MIN_EXPECTED',
}

export enum SwapStepType {
  SWAP = 'SWAP',
  PERMIT = 'PERMIT'
}

export enum SwapProviderId {
  CHAIN_FLIP_TESTNET = 'CHAIN_FLIP_TESTNET',
  CHAIN_FLIP_MAINNET = 'CHAIN_FLIP_MAINNET',
  HYDRADX_MAINNET = 'HYDRADX_MAINNET',
  HYDRADX_TESTNET = 'HYDRADX_TESTNET',
  POLKADOT_ASSET_HUB = 'POLKADOT_ASSET_HUB',
  KUSAMA_ASSET_HUB = 'KUSAMA_ASSET_HUB',
  ROCOCO_ASSET_HUB = 'ROCOCO_ASSET_HUB',
  WESTEND_ASSET_HUB = 'WESTEND_ASSET_HUB',
  SIMPLE_SWAP = 'SIMPLE_SWAP',
  UNISWAP = 'UNISWAP',
  KYBER = 'KYBER'
}

export const _SUPPORTED_SWAP_PROVIDERS: SwapProviderId[] = [
  SwapProviderId.CHAIN_FLIP_TESTNET,
  SwapProviderId.CHAIN_FLIP_MAINNET,
  SwapProviderId.HYDRADX_MAINNET,
  // SwapProviderId.HYDRADX_TESTNET,
  SwapProviderId.POLKADOT_ASSET_HUB,
  SwapProviderId.KUSAMA_ASSET_HUB,
  // SwapProviderId.ROCOCO_ASSET_HUB,
  // SwapProviderId.WESTEND_ASSET_HUB,
  SwapProviderId.SIMPLE_SWAP,
  SwapProviderId.UNISWAP,
  SwapProviderId.KYBER
];

export interface SwapProvider {
  id: SwapProviderId;
  name: string;

  faq?: string;
}

// process handling
export enum SwapFeeType {
  PLATFORM_FEE = 'PLATFORM_FEE',
  NETWORK_FEE = 'NETWORK_FEE',
  WALLET_FEE = 'WALLET_FEE'
}

export type SwapTxData = ChainflipSwapTxData | HydradxSwapTxData | SimpleSwapTxData; // todo: will be more

export interface SwapBaseTxData {
  provider: SwapProvider;
  quote: SwapQuote;
  address: string;
  slippage: number;
  recipient?: string;
  process: CommonOptimalSwapPath;
}

export interface ChainflipSwapTxData extends SwapBaseTxData {
  depositChannelId: string;
  depositAddress: string;
  estimatedDepositChannelExpiryTime?: number;
}

export interface SimpleSwapTxData extends SwapBaseTxData {
  id: string;
}

export interface HydradxSwapTxData extends SwapBaseTxData {
  txHex: string;
}

// parameters & responses
export type GenSwapStepFuncV2 = (params: OptimalSwapPathParamsV2, stepIndex: number) => Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined>;

export interface ChainflipPreValidationMetadata {
  minSwap: AmountData;
  maxSwap?: AmountData;
  chain: _ChainInfo;
}

export interface HydradxPreValidationMetadata {
  maxSwap: AmountData;
  chain: _ChainInfo;
}

export interface AssetHubPreValidationMetadata {
  chain: _ChainInfo;
  toAmount: string;
  quoteRate: string;
  priceImpactPct?: string;
}

export interface SimpleSwapValidationMetadata{
  minSwap: AmountData;
  maxSwap: AmountData;
  chain: _ChainInfo;
}

export interface QuoteAskResponse {
  quote?: SwapQuote;
  error?: SwapError;
}

export interface SwapRequest {
  address: string;
  pair: SwapPair;
  fromAmount: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
  feeToken?: string;
  currentQuote?: SwapProvider
}

export interface SwapRequestV2 {
  address: string;
  pair: SwapPair;
  fromAmount: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
  feeToken?: string;
  preferredProvider?: SwapProviderId; // allow user to designate a provider
  isCrossChain?: boolean;
  isSupportKyberVersion?: boolean;
}

export interface SwapRequestResult {
  process: CommonOptimalSwapPath;
  quote: SwapQuoteResponse;
}

export interface SwapQuoteResponse {
  optimalQuote?: SwapQuote; // if no optimalQuote then there's an error
  quotes: SwapQuote[];
  aliveUntil: number; // timestamp
  error?: SwapError; // only if there's no available quote
}

export interface SwapSubmitParams extends BaseProcessRequestSign {
  process: CommonOptimalSwapPath;
  currentStep: number;
  quote: SwapQuote;
  address: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
  cacheProcessId: string;
}

export interface SwapSubmitStepData {
  txChain: string;
  txData: any;
  extrinsic: TransactionData;
  transferNativeAmount: string;
  extrinsicType: ExtrinsicType;
  chainType: ChainType;
  isPermit?: boolean;
  isDutch?: boolean;
}

export enum DynamicSwapType {
  SWAP = 'SWAP',
  BRIDGE = 'BRIDGE'
}

export interface DynamicSwapAction {
  action: DynamicSwapType;
  pair: ActionPair;
}

export const enum BridgeStepPosition {
  FIRST = 0,
  AFTER_SWAP = 1
}

export interface OptimalSwapPathParamsV2 {
  request: SwapRequest;
  selectedQuote?: SwapQuote;
  path: DynamicSwapAction[];
}

export interface SwapEarlyValidation {
  error?: SwapErrorType;
  metadata?: ChainflipPreValidationMetadata | HydradxPreValidationMetadata | AssetHubPreValidationMetadata;
}

export interface AssetHubSwapEarlyValidation extends SwapEarlyValidation {
  metadata: AssetHubPreValidationMetadata;
}

export interface ValidateSwapProcessParams {
  address: string;
  process: CommonOptimalSwapPath;
  selectedQuote: SwapQuote;
  recipient?: string;
  currentStep: number;
}

export interface SlippageType {
  slippage: BigN,
  isCustomType: boolean
}

export interface PermitSwapData {
  processId: string;
  step: BaseStepType;
}

export const CHAINFLIP_SLIPPAGE = 0.02; // Example: 0.01 for 1%
export const SIMPLE_SWAP_SLIPPAGE = 0.05;

export interface BaseSwapStepMetadata {
  sendingValue: string;
  expectedReceive: string;
  originTokenInfo: _ChainAsset;
  destinationTokenInfo: _ChainAsset;
  sender: string;
  receiver: string;
  version: number;
}

export interface HydrationSwapStepMetadata extends BaseSwapStepMetadata {
  txHex: `0x${string}`
}

export interface ChainFlipSwapStepMetadata extends BaseSwapStepMetadata {
  srcChain: string,
  destChain: string
}
