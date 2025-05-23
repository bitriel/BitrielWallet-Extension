// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CreateDeriveAccountInfo } from '@bitriel/extension-base/types';

export interface DeriveAccount extends CreateDeriveAccountInfo{
  address: string;
}
