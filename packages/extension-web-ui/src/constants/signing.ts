// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationType } from '@bitriel/extension-web-ui/stores/base/RequestState';
import { AccountSignMode } from '@bitriel/extension-web-ui/types/account';

export const MODE_CAN_SIGN: AccountSignMode[] = [AccountSignMode.PASSWORD, AccountSignMode.QR, AccountSignMode.LEGACY_LEDGER, AccountSignMode.GENERIC_LEDGER];

export const NEED_SIGN_CONFIRMATION: ConfirmationType[] = ['evmSignatureRequest', 'evmSendTransactionRequest', 'signingRequest'];
