// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestCurrentAccountAddress } from '@bitriel/extension-base/background/types';
import { CurrentAccountInfo } from '@bitriel/extension-base/types';
import { sendMessage } from '@bitriel/extension-web-ui/messaging/base';

export async function saveCurrentAccountAddress (data: RequestCurrentAccountAddress): Promise<CurrentAccountInfo> {
  return sendMessage('pri(accounts.saveCurrentProxy)', data);
}
