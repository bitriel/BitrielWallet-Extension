// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { sendMessage } from '@bitriel/extension-web-ui/messaging';

export async function exportIndexedDB (): Promise<string> {
  return sendMessage('pri(database.export)', null);
}

export async function importIndexedDB (request: string): Promise<boolean> {
  return sendMessage('pri(database.import)', request);
}

export async function getIndexedDBJson (): Promise<object> {
  return sendMessage('pri(database.exportJson)', null);
}
