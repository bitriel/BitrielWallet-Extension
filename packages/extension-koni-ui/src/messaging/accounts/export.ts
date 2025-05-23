// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseAccountExportPrivateKey } from '@bitriel/extension-base/background/KoniTypes';
import { RequestAccountBatchExportV2, RequestExportAccountProxyMnemonic, ResponseExportAccountProxyMnemonic } from '@bitriel/extension-base/types';
import { sendMessage } from '@bitriel/extension-koni-ui/messaging';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';

// JSON
export async function exportAccount (address: string, password: string): Promise<{ exportedJson: KeyringPair$Json }> {
  return sendMessage('pri(accounts.export.json)', { address, password });
}

export async function exportAccountPrivateKey (address: string, password: string): Promise<ResponseAccountExportPrivateKey> {
  return sendMessage('pri(accounts.export.privateKey)', { address, password });
}

export async function exportAccountBatch (request: RequestAccountBatchExportV2): Promise<{ exportedJson: KeyringPairs$Json }> {
  return sendMessage('pri(accounts.export.json.batch)', request);
}

export async function exportAccountMnemonic (request: RequestExportAccountProxyMnemonic): Promise<ResponseExportAccountProxyMnemonic> {
  return sendMessage('pri(accounts.export.mnemonic)', request);
}
