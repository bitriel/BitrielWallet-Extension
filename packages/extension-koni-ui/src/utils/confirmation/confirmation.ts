// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitions } from '@bitriel/extension-base/background/KoniTypes';
import { EvmSignatureSupportType } from '@bitriel/extension-koni-ui/types/confirmation';

import { ExtrinsicPayload } from '@polkadot/types/interfaces';

export const isSubstrateMessage = (payload: string | ExtrinsicPayload): payload is string => typeof payload === 'string';

export const isEvmMessage = (request: ConfirmationDefinitions[EvmSignatureSupportType][0]): request is ConfirmationDefinitions['evmSignatureRequest'][0] => {
  return !!(request as ConfirmationDefinitions['evmSignatureRequest'][0]).payload.type;
};
