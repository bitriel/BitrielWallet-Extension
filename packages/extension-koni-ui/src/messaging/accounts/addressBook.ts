// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { sendMessage } from '@bitriel/extension-koni-ui/messaging/base';
import { KeyringAddress } from '@subwallet/ui-keyring/types';

export async function saveRecentAccount (accountId: string, chain?: string): Promise<KeyringAddress> {
  return sendMessage('pri(addressBook.saveRecent)', { accountId, chain });
}

export async function editContactAddress (address: string, name: string): Promise<boolean> {
  return sendMessage('pri(addressBook.edit)', { address: address, meta: { name: name } });
}

export async function removeContactAddress (address: string): Promise<boolean> {
  return sendMessage('pri(addressBook.delete)', { address: address });
}
