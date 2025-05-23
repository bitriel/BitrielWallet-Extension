// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseRequestSign } from '@bitriel/extension-base/types';

import { FeeChainType, FeeDetail, TransactionFee } from '../fee';

export interface RequestSubscribeTransfer extends TransactionFee {
  address: string;
  chain: string;
  value: string;
  token: string;
  destChain: string;
}

export interface ResponseSubscribeTransfer {
  id: string;
  maxTransferable: string;
  feeOptions: FeeDetail;
  feeType: FeeChainType;
  feePercentageSpecialCase?: number;
  error?: string;
}

export interface RequestSubmitTransfer extends BaseRequestSign, TransactionFee {
  chain: string;
  from: string;
  to: string;
  tokenSlug: string;
  transferAll: boolean;
  value: string;
  transferBounceable?: boolean;
}
