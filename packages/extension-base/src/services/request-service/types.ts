// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, RequestSign, Resolver, ResponseSigning } from '@bitriel/extension-base/background/types';
import { MetadataDef } from '@bitriel/extension-inject/types';

export interface SignRequest extends Resolver<ResponseSigning> {
  address: string;
  id: string;
  request: RequestSign;
  url: string;
}

export interface MetaRequest extends Resolver<boolean> {
  id: string;
  request: MetadataDef;
  url: string;
}

export interface AuthUrlInfo {
  count: number;
  id: string;
  isAllowed: boolean;
  origin: string;
  url: string;
  accountAuthTypes: AccountAuthType[];
  isAllowedMap: Record<string, boolean>;
  currentNetworkMap: Partial<Record<AccountAuthType, string>>;
  currentAccount?: string;
}

export interface AuthUrlInfoNeedMigration extends Omit<AuthUrlInfo, 'accountAuthTypes'> {
  accountAuthType?: AccountAuthType | 'both';
  currentEvmNetworkKey?: string;
}

export type AuthUrls = Record<string, AuthUrlInfo>;
