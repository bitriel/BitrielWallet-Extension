// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

export type FeeChainType = 'evm' | 'substrate' | 'ton' | 'cardano';

export interface BaseFeeInfo {
  busyNetwork: boolean;
  type: FeeChainType;
}

export interface BaseFeeDetail {
  estimatedFee: string;
}
