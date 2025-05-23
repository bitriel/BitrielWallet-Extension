// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GetNotificationParams, RequestIsClaimedPolygonBridge, RequestSwitchStatusParams } from '@bitriel/extension-base/types/notification';
import { sendMessage } from '@bitriel/extension-koni-ui/messaging';

export async function markAllReadNotification (request: string) {
  return sendMessage('pri(inappNotification.markAllReadNotification)', request);
}

export async function switchReadNotificationStatus (request: RequestSwitchStatusParams) {
  return sendMessage('pri(inappNotification.switchReadNotificationStatus)', request);
}

export async function fetchInappNotifications (request: GetNotificationParams) {
  return sendMessage('pri(inappNotification.fetch)', request);
}

export async function getInappNotification (notificationId: string) {
  return sendMessage('pri(inappNotification.get)', notificationId);
}

export async function getIsClaimNotificationStatus (request: RequestIsClaimedPolygonBridge) {
  return sendMessage('pri(inappNotification.isClaimedPolygonBridge)', request);
}
