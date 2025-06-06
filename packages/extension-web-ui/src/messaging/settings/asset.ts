// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { AssetSettingUpdateReq, ResponseNftImport } from '@bitriel/extension-base/background/KoniTypes';
import { _ValidateCustomAssetRequest, _ValidateCustomAssetResponse } from '@bitriel/extension-base/services/chain-service/types';

import { sendMessage } from '../base';

export async function getSupportedContractTypes (): Promise<string[]> {
  return sendMessage('pri(chainService.getSupportedContractTypes)', null);
}

export async function upsertCustomToken (data: _ChainAsset): Promise<ResponseNftImport> {
  return sendMessage('pri(chainService.upsertCustomAsset)', data);
}

export async function deleteCustomAssets (assetSlug: string): Promise<boolean> {
  return sendMessage('pri(chainService.deleteCustomAsset)', assetSlug);
}

export async function validateCustomToken (data: _ValidateCustomAssetRequest): Promise<_ValidateCustomAssetResponse> {
  return sendMessage('pri(chainService.validateCustomAsset)', data);
}

export async function resetDefaultNetwork (): Promise<boolean> {
  return sendMessage('pri(chainService.resetDefaultChains)', null);
}

export async function updateAssetSetting (data: AssetSettingUpdateReq): Promise<boolean> {
  return sendMessage('pri(assetSetting.update)', data);
}
