// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapRequestV2, SwapSubmitParams, ValidateSwapProcessParams } from '@bitriel/extension-base/types/swap';
import { sendMessage } from '@bitriel/extension-koni-ui/messaging';

export async function handleSwapRequestV2 (request: SwapRequestV2) {
  return sendMessage('pri(swapService.handleSwapRequestV2)', request);
}

export async function handleSwapStep (request: SwapSubmitParams) {
  return sendMessage('pri(swapService.handleSwapStep)', request);
}

export async function validateSwapProcess (request: ValidateSwapProcessParams) {
  return sendMessage('pri(swapService.validateSwapProcess)', request);
}
