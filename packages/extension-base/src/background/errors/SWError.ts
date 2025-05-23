// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWErrorData } from '@bitriel/extension-base/types';

export class SWError extends Error implements SWErrorData {
  errorClass = 'Transaction';
  errorType: string;
  code: number | undefined;
  data: unknown | undefined;

  constructor (errorType: string, message: string, code?: number, data?: unknown, name?: string) {
    super(message);
    this.errorType = errorType;
    this.code = code;
    this.data = data;

    if (name) {
      this.name = name;
    }
  }

  public toJSON (): SWErrorData {
    return {
      errorClass: this.errorClass,
      errorType: this.errorType,
      data: this.data,
      name: this.name,
      message: this.message,
      code: this.code
    };
  }
}
