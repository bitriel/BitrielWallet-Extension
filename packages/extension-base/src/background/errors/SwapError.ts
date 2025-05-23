// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@bitriel/extension-base/background/errors/SWError';
import { SwapErrorType } from '@bitriel/extension-base/types/swap';
import { detectTranslate } from '@bitriel/extension-base/utils';

const defaultErrorMap: Record<SwapErrorType, { message: string, code?: number }> = {
  ERROR_FETCHING_QUOTE: {
    message: detectTranslate('No swap quote found. Change your network endpoint or adjust amount and try again'),
    code: undefined
  },
  NOT_MEET_MIN_SWAP: {
    message: detectTranslate('Amount too low. Increase your amount and try again'),
    code: undefined
  },
  QUOTE_TIMEOUT: {
    message: detectTranslate('Quote timeout'),
    code: undefined
  },
  UNKNOWN: {
    message: detectTranslate('Undefined error. Check your Internet connection or contact support'),
    code: undefined
  },
  ASSET_NOT_SUPPORTED: {
    message: detectTranslate('This swap pair is not supported'),
    code: undefined
  },
  INVALID_RECIPIENT: {
    message: detectTranslate('Invalid recipient'),
    code: undefined
  },
  SWAP_EXCEED_ALLOWANCE: {
    message: detectTranslate('You cannot swap all your balance. Lower your amount and try again'),
    code: undefined
  },
  SWAP_NOT_ENOUGH_BALANCE: {
    message: detectTranslate('You must deposit more funds to swap'),
    code: undefined
  },
  NOT_ENOUGH_LIQUIDITY: {
    message: detectTranslate('Insufficient liquidity to complete the swap. Lower your amount and try again'),
    code: undefined
  },
  AMOUNT_CANNOT_BE_ZERO: {
    message: detectTranslate('Amount must be greater than 0'),
    code: undefined
  },
  MAKE_POOL_NOT_ENOUGH_EXISTENTIAL_DEPOSIT: {
    message: detectTranslate('Insufficient liquidity to complete the swap. Lower your amount and try again'),
    code: undefined
  },
  NOT_MEET_MIN_EXPECTED: {
    // TODO: update message
    message: detectTranslate('Unable to process this swap at the moment. Try again later'),
    code: undefined
  }
};

export class SwapError extends SWError {
  override errorType: SwapErrorType;

  constructor (errorType: SwapErrorType, errMessage?: string, data?: unknown) {
    const { code, message } = defaultErrorMap[errorType];

    super(errorType, errMessage || message, code, data);

    this.errorType = errorType;
  }
}
