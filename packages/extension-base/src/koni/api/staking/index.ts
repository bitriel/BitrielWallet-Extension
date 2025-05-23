// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { ChainType, NominatorMetadata, StakingItem, StakingRewardItem } from '@bitriel/extension-base/background/KoniTypes';
import { getAmplitudeStakingOnChain, getAstarStakingOnChain, getParaStakingOnChain } from '@bitriel/extension-base/koni/api/staking/paraChain';
import { getNominationPoolReward, getRelayPoolingOnChain, getRelayStakingOnChain } from '@bitriel/extension-base/koni/api/staking/relayChain';
import { getAllSubsquidStaking } from '@bitriel/extension-base/koni/api/staking/subsquidStaking';
import { _PURE_EVM_CHAINS } from '@bitriel/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@bitriel/extension-base/services/chain-service/types';
import { _isChainEvmCompatible, _isChainSupportSubstrateStaking, _isSubstrateRelayChain } from '@bitriel/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@bitriel/extension-base/services/earning-service/constants';
import { getAddressesByChainType } from '@bitriel/extension-base/utils';

interface PromiseMapping {
  api: _SubstrateApi,
  chain: string
}

export function stakingOnChainApi (addresses: string[], substrateApiMap: Record<string, _SubstrateApi>, chainInfoMap: Record<string, _ChainInfo>, stakingCallback: (networkKey: string, rs: StakingItem) => void, nominatorStateCallback: (nominatorMetadata: NominatorMetadata) => void) {
  const filteredApiMap: PromiseMapping[] = [];
  const evmAddresses = getAddressesByChainType(addresses, [ChainType.EVM]);
  const substrateAddresses = getAddressesByChainType(addresses, [ChainType.SUBSTRATE]);

  Object.entries(chainInfoMap).forEach(([networkKey, chainInfo]) => {
    if (_PURE_EVM_CHAINS.indexOf(networkKey) < 0 && _isChainSupportSubstrateStaking(chainInfo)) {
      filteredApiMap.push({ chain: networkKey, api: substrateApiMap[networkKey] });
    }
  });

  const unsubList: VoidFunction[] = [];

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  filteredApiMap.forEach(async ({ api: apiPromise, chain }) => {
    const parentApi = await apiPromise.isReady;
    const useAddresses = _isChainEvmCompatible(chainInfoMap[chain]) ? evmAddresses : substrateAddresses;

    if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
      const unsub = await getAmplitudeStakingOnChain(parentApi, useAddresses, chainInfoMap, chain, stakingCallback, nominatorStateCallback);

      unsubList.push(unsub);
    } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
      const unsub = await getAstarStakingOnChain(parentApi, useAddresses, chainInfoMap, chain, stakingCallback, nominatorStateCallback);

      unsubList.push(unsub);
    } else if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
      const unsub = await getParaStakingOnChain(parentApi, useAddresses, chainInfoMap, chain, stakingCallback, nominatorStateCallback);

      unsubList.push(unsub);
    } else if (_STAKING_CHAIN_GROUP.relay.includes(chain)) {
      const unsub = await getRelayStakingOnChain(parentApi, useAddresses, chainInfoMap, chain, stakingCallback, nominatorStateCallback);

      unsubList.push(unsub);
    }

    if (_STAKING_CHAIN_GROUP.nominationPool.includes(chain)) {
      const unsub = await getRelayPoolingOnChain(parentApi, useAddresses, chainInfoMap, chain, stakingCallback, nominatorStateCallback);

      unsubList.push(unsub);
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

export async function getNominationStakingRewardData (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, callback: (rewardItem: StakingRewardItem) => void) {
  // might retrieve from other sources
  await getAllSubsquidStaking(addresses, chainInfoMap, callback);
}

export async function getPoolingStakingRewardData (addresses: string[], networkMap: Record<string, _ChainInfo>, dotSamaApiMap: Record<string, _SubstrateApi>, callback: (rs: StakingRewardItem) => void) {
  const activeNetworks: string[] = [];

  Object.entries(networkMap).forEach(([key, chainInfo]) => {
    if (_isChainSupportSubstrateStaking(chainInfo) && _isSubstrateRelayChain(chainInfo)) {
      activeNetworks.push(key);
    }
  });

  if (activeNetworks.length === 0) {
    return;
  }

  await getNominationPoolReward(addresses, networkMap, dotSamaApiMap, callback);
}
