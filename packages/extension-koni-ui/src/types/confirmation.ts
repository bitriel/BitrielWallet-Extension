// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions, ConfirmationDefinitionsCardano, ConfirmationDefinitionsTon } from '@bitriel/extension-base/background/KoniTypes';

export type EvmSignatureSupportType = keyof Pick<ConfirmationDefinitions, 'evmSignatureRequest' | 'evmSendTransactionRequest' | 'evmWatchTransactionRequest'>;
export type EvmErrorSupportType = keyof Pick<ConfirmationDefinitions, 'errorConnectNetwork'>;

export type SubmitApiType = keyof Pick<ConfirmationDefinitions, 'submitApiRequest'>;

export type TonSignatureSupportType = keyof Pick<ConfirmationDefinitionsTon, 'tonSignatureRequest' | 'tonWatchTransactionRequest' | 'tonSendTransactionRequest'>;

export type CardanoSignatureSupportType = keyof Pick<ConfirmationDefinitionsCardano, 'cardanoSignatureRequest' | 'cardanoWatchTransactionRequest' | 'cardanoSendTransactionRequest' | 'cardanoSignTransactionRequest'>;
