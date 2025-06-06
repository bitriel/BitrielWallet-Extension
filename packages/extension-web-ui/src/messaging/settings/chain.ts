// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { ValidateNetworkResponse } from '@bitriel/extension-base/background/KoniTypes';
import { _ChainApiStatus, _ChainState, _NetworkUpsertParams } from '@bitriel/extension-base/services/chain-service/types';
import { sendMessage } from '@bitriel/extension-web-ui/messaging';

export async function subscribeChainInfoMap (callback: (data: Record<string, _ChainInfo>) => void): Promise<Record<string, _ChainInfo>> {
  return sendMessage('pri(chainService.subscribeChainInfoMap)', null, callback);
}

export async function subscribeChainStateMap (callback: (data: Record<string, _ChainState>) => void): Promise<Record<string, _ChainState>> {
  return sendMessage('pri(chainService.subscribeChainStateMap)', null, callback);
}

export async function subscribeChainStatusMap (callback: (data: Record<string, _ChainApiStatus>) => void): Promise<Record<string, _ChainApiStatus>> {
  return sendMessage('pri(chainService.subscribeChainStatusMap)', null, callback);
}

export async function removeChain (networkKey: string): Promise<boolean> {
  return sendMessage('pri(chainService.removeChain)', networkKey);
}

export async function updateChainActiveState (chain: string, active: boolean): Promise<boolean> {
  if (active) {
    return await enableChainWithPriorityAssets(chain);
  } else {
    return await disableChain(chain);
  }
}

export async function disableChain (networkKey: string): Promise<boolean> {
  return sendMessage('pri(chainService.disableChain)', networkKey);
}

export async function enableChain (networkKey: string, enableTokens = true): Promise<boolean> {
  return sendMessage('pri(chainService.enableChain)', { chainSlug: networkKey, enableTokens });
}

export async function enableChainWithPriorityAssets (networkKey: string, enableTokens = true): Promise<boolean> {
  return sendMessage('pri(chainService.enableChainWithPriorityAssets)', { chainSlug: networkKey, enableTokens });
}

export async function enableChains (targetKeys: string[], enableTokens = true): Promise<boolean> {
  return sendMessage('pri(chainService.enableChains)', { chainSlugs: targetKeys, enableTokens });
}

export async function disableChains (targetKeys: string[]): Promise<boolean> {
  return sendMessage('pri(chainService.disableChains)', targetKeys);
}

export async function upsertChain (data: _NetworkUpsertParams): Promise<boolean> {
  return sendMessage('pri(chainService.upsertChain)', data);
}

export async function validateCustomChain (provider: string, existedChainSlug?: string): Promise<ValidateNetworkResponse> {
  return sendMessage('pri(chainService.validateCustomChain)', { provider, existedChainSlug });
}

export async function disableAllNetwork (): Promise<boolean> {
  return sendMessage('pri(chainService.disableAllChains)', null);
}
