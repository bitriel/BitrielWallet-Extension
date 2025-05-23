// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWWarning } from '@bitriel/extension-base/background/warnings/SWWarning';
import { BasicTxErrorType, BasicTxWarningCode, TransactionErrorType, TransactionWarningType } from '@bitriel/extension-base/types';
import { detectTranslate } from '@bitriel/extension-base/utils';
import { t } from 'i18next';

import { TransactionError } from '../errors/TransactionError';

const defaultWarningMap: Record<TransactionWarningType, { message: string, code?: number }> = {
  [BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT]: {
    message: detectTranslate('Insufficient balance to cover existential deposit. Please decrease the transaction amount or increase your current balance'),
    code: undefined
  },
  [BasicTxWarningCode.IS_BOUNCEABLE_ADDRESS]: {
    message: detectTranslate('We are not supporting for bounceable address. The send mode is work as non-bounceable address.'),
    code: undefined
  }
};

export class TransactionWarning extends SWWarning {
  override warningType: TransactionWarningType;

  constructor (warningType: TransactionWarningType, message?: string, code?: number, data?: unknown) {
    const warningMessage = message || t(defaultWarningMap[warningType]?.message || '') || warningType;

    super(warningType, warningMessage, defaultWarningMap[warningType]?.code, data);
    this.warningType = warningType;
  }

  public toError (): TransactionError | null {
    const type = ((): TransactionErrorType | null => {
      switch (this.warningType) {
        case BasicTxWarningCode.IS_BOUNCEABLE_ADDRESS:
          return null;
        case BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT:
          return BasicTxErrorType.NOT_ENOUGH_EXISTENTIAL_DEPOSIT;
      }
    })();

    if (!type) {
      return null;
    }

    return new TransactionError(type, this.message, this.data);
  }
}
