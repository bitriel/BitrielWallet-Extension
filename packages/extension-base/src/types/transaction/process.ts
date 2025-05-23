// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { TransactionEventResponse } from '@bitriel/extension-base/services/transaction-service/types';

import { CommonStepDetail, CommonStepFeeInfo } from '../service-base';
import { SwapPair, SwapProvider, SwapRate, SwapRoute, SwapSubmitParams } from '../swap';
import { RequestYieldStepSubmit } from '../yield';

export interface BaseProcessRequestSign {
  isPassConfirmation?: boolean;
  onSend?: (rs: TransactionEventResponse) => void;
  errorOnTimeOut?: boolean;
  processId?: string;
}

export enum ProcessType {
  SWAP = 'swap',
  EARNING = 'earning'
}

export interface RequestSubmitProcessTransaction {
  address: string;
  type: ProcessType;
  request: SwapSubmitParams | RequestYieldStepSubmit;
  id: string;
}

export enum StepStatus {
  /* The step is queued and waiting to be processed. */
  QUEUED = 'QUEUED',
  /* The previous step is complete, and the step is being prepared for submission. */
  PREPARE = 'PREPARE',
  /* The step is currently being submitted to the chain. */
  SUBMITTING = 'SUBMITTING',
  /* The step is being processed, having extrinsic hash. */
  PROCESSING = 'PROCESSING',
  /* The step has been completed successfully. */
  COMPLETE = 'COMPLETE',
  /* The step has failed. */
  FAILED = 'FAILED',
  /* The step has been canceled. */
  CANCELLED = 'CANCELLED',
  /* The step has timed out. */
  TIMEOUT = 'TIMEOUT'
}

export const PROCESSING_STEP_STATUS: StepStatus[] = [StepStatus.PREPARE, StepStatus.SUBMITTING, StepStatus.PROCESSING];

export interface ProcessStep extends CommonStepDetail {
  fee: CommonStepFeeInfo;
  status: StepStatus;
  chain?: string;
  transactionId?: string;
  extrinsicHash?: string;
}

export interface ProcessTransactionData {
  id: string;
  type: ProcessType;
  address: string;
  status: StepStatus;
  steps: ProcessStep[];
  combineInfo: unknown;
  currentStepId: number;
  lastTransactionId?: string;
  lastTransactionChain?: string;
}

export interface BriefProcessStep {
  processId: string;
  stepId: number;
}

export interface BriefXcmStep {
  sendingValue: string;
  originTokenInfo: _ChainAsset;
  destinationTokenInfo: _ChainAsset;
}

export interface BriefXcmStepV2 {
  sendingValue: string;
  originTokenInfo: _ChainAsset;
  destinationValue: string;
  destinationTokenInfo: _ChainAsset;
}

// temp for avoid conflict // todo: recheck to refactor BriefXcmStepV2 and BriefSwapStepV2 later;
export interface BriefSwapStepV2 {
  sendingValue: string;
  originTokenInfo: _ChainAsset;
  destinationValue: string;
  destinationTokenInfo: _ChainAsset;
}

export type BriefStepV2 = BriefXcmStepV2 | BriefSwapStepV2;

export interface BriefSwapStep {
  pair: SwapPair;
  fromAmount: string;
  toAmount: string;
  rate: SwapRate; // rate = fromToken / toToken
  provider: SwapProvider;
  aliveUntil: number; // timestamp
  route: SwapRoute;
}

export interface ApproveStepMetadata {
  tokenApprove: string;
  contractAddress: string;
  spenderAddress: string;
  amount?: string;
  owner?: string;
  isUniswapApprove?: boolean;
}

export interface RequestSubscribeProcessById {
  processId: string;
}

export interface ResponseSubscribeProcessById {
  process: ProcessTransactionData | undefined;
  id: string;
}

export interface ResponseSubscribeProcessAlive {
  processes: Record<string, ProcessTransactionData>;
}
