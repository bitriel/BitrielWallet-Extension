// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestCampaignBannerComplete } from '@bitriel/extension-base/background/KoniTypes';

import { sendMessage } from '../base';

export async function completeBannerCampaign (request: RequestCampaignBannerComplete): Promise<boolean> {
  return sendMessage('pri(campaign.banner.complete)', request);
}

export * from './unlock-dot';
