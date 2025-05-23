// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { DynamicSwapAction, OptimalSwapPathParamsV2, SwapFeeType, SwapStepType } from '@bitriel/extension-base/types/swap';
import { OptimalYieldPath, OptimalYieldPathParams, YieldStepType } from '@bitriel/extension-base/types/yield';

/* ServiceWithProcess */
export type OptimalProcessParams = OptimalYieldPathParams | OptimalSwapPathParamsV2;
export type OptimalProcessResult = OptimalYieldPath | CommonOptimalSwapPath;

export enum CommonStepType {
  DEFAULT = 'DEFAULT',
  XCM = 'XCM',
  TOKEN_APPROVAL = 'TOKEN_APPROVAL',
  SET_FEE_TOKEN = 'SET_FEE_TOKEN',
  TRANSFER = 'TRANSFER'
}
export type BaseStepType = CommonStepType | SwapStepType | YieldStepType;
export type BaseFeeType = SwapFeeType;

export interface BaseStepDetail {
  type: BaseStepType;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface CommonFeeComponent {
  feeType: BaseFeeType;
  amount: string;
  tokenSlug: string;
}

export interface CommonStepFeeInfo {
  feeComponent: CommonFeeComponent[];
  defaultFeeToken: string; // token to pay transaction fee with
  feeOptions: string[]; // list of tokenSlug, always include defaultFeeToken
  selectedFeeToken?: string;
}

export interface CommonStepDetail extends BaseStepDetail {
  id: number;
}

export interface CommonOptimalSwapPath extends CommonOptimalTransferPath { // path means the steps to complete the swap, not the quote itself
  path: DynamicSwapAction[];
}

export interface CommonOptimalTransferPath {
  totalFee: CommonStepFeeInfo[]; // each item in the array is tx fee for a step
  steps: CommonStepDetail[];
}

export const DEFAULT_FIRST_STEP: CommonStepDetail = {
  id: 0,
  name: 'Fill information',
  type: CommonStepType.DEFAULT
};

export const MOCK_STEP_FEE: CommonStepFeeInfo = {
  feeComponent: [],
  defaultFeeToken: '',
  feeOptions: []
};
