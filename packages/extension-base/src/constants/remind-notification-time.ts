// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationActionType } from '@bitriel/extension-base/services/inapp-notification-service/interfaces';
import { fetchStaticData } from '@bitriel/extension-base/utils';

export const fetchLatestRemindNotificationTime = async () => {
  return await fetchStaticData<Record<NotificationActionType, number>>('config/remind-notification-time');
};
