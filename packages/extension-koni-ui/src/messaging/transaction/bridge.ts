// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestClaimBridge } from '@bitriel/extension-base/types/bridge';
import { sendMessage } from '@bitriel/extension-koni-ui/messaging';

export async function submitClaimAvailBridge (data: RequestClaimBridge) {
  return sendMessage('pri(availBridge.submitClaimAvailBridgeOnAvail)', data);
}

export async function submitClaimPolygonBridge (data: RequestClaimBridge) {
  return sendMessage('pri(polygonBridge.submitClaimPolygonBridge)', data);
}
