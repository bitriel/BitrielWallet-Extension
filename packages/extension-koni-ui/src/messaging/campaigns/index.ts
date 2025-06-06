// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestCampaignBannerComplete, ShowCampaignPopupRequest } from '@bitriel/extension-base/background/KoniTypes';
import { RequestUnlockDotCheckCanMint } from '@bitriel/extension-base/types';

import { sendMessage } from '../base';

export async function completeBannerCampaign (request: RequestCampaignBannerComplete): Promise<boolean> {
  return sendMessage('pri(campaign.banner.complete)', request);
}

export async function unlockDotCheckCanMint (request: RequestUnlockDotCheckCanMint): Promise<boolean> {
  return sendMessage('pri(campaign.unlockDot.canMint)', request);
}

export async function toggleCampaignPopup (request: ShowCampaignPopupRequest): Promise<null> {
  return sendMessage('pri(campaign.popup.toggle)', request);
}
