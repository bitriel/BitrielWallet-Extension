// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { NotificationTab } from '@bitriel/extension-base/services/inapp-notification-service/interfaces';

export interface GetNotificationParams {
  proxyId: string,
  notificationTab: NotificationTab
}

export interface RequestSwitchStatusParams {
  id: string,
  isRead: boolean
}

export interface RequestIsClaimedPolygonBridge {
  chainslug: string,
  counter: number,
  sourceNetwork: number
}
