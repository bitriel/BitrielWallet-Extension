// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWError } from '@bitriel/extension-base/background/errors/SWError';
import { ProviderErrorType } from '@bitriel/extension-base/background/KoniTypes';
import { detectTranslate } from '@bitriel/extension-base/utils';

const defaultErrorMap: Record<ProviderErrorType, { message: string, code?: number }> = {
  CHAIN_DISCONNECTED: {
    message: detectTranslate('Network is disconnected'),
    code: undefined
  },
  INVALID_PARAMS: {
    message: detectTranslate('Undefined error. Please contact SubWallet support'),
    code: undefined
  },
  INTERNAL_ERROR: {
    message: detectTranslate('Undefined error. Please contact SubWallet support'),
    code: undefined
  },
  USER_REJECT: {
    message: detectTranslate('Rejected by user'),
    code: undefined
  }
};

export class ProviderError extends SWError {
  override errorType: ProviderErrorType;

  constructor (errorType: ProviderErrorType, errMessage?: string, data?: unknown, errorCode?: number) {
    const { code, message } = defaultErrorMap[errorType];

    super(errorType, errMessage || message, errorCode || code, data);

    this.errorType = errorType;
  }
}
