// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { BalanceAccountType, PalletAssetsAssetAccountWithStatus } from '@bitriel/extension-base/core/substrate/types';
import { _getAppliedExistentialDeposit, getStrictMode } from '@bitriel/extension-base/core/utils';

export function _getForeignAssetPalletTransferable (accountInfo: PalletAssetsAssetAccountWithStatus, existentialDeposit: string, extrinsicType?: ExtrinsicType): bigint {
  const strictMode = getStrictMode(BalanceAccountType.PalletAssetsAssetAccount, extrinsicType);

  return accountInfo.status === 'Liquid' ? BigInt(accountInfo.balance) - _getAppliedExistentialDeposit(existentialDeposit, strictMode) : BigInt(0);
}

export function _getForeignAssetPalletLockedBalance (accountInfo: PalletAssetsAssetAccountWithStatus): bigint {
  return accountInfo.status !== 'Liquid' ? BigInt(accountInfo.balance) : BigInt(0);
}
