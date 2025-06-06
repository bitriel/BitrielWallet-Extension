// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResolveAddressToDomainRequest } from '@bitriel/extension-base/background/KoniTypes';
import { sendMessage } from '@bitriel/extension-koni-ui/messaging';

export async function resolveAddressToDomain (request: ResolveAddressToDomainRequest) {
  return sendMessage('pri(accounts.resolveAddressToDomain)', request);
}
