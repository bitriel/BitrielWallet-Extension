// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MnemonicType } from '@bitriel/extension-base/types';
import { KeypairType } from '@subwallet/keyring/types';

export const SUBSTRATE_ACCOUNT_TYPE: KeypairType = 'sr25519';
export const EVM_ACCOUNT_TYPE: KeypairType = 'ethereum';
export const TON_ACCOUNT_TYPE: KeypairType = 'ton';
export const CARDANO_ACCOUNT_TYPE: KeypairType = 'cardano';

export const DEFAULT_ACCOUNT_TYPES: KeypairType[] = [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE];
export const DEFAULT_MNEMONIC_TYPE: MnemonicType = 'general';
