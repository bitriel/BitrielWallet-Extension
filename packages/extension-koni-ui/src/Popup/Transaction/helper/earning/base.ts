// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { _getSubstrateGenesisHash, _isChainEvmCompatible } from '@bitriel/extension-base/services/chain-service/utils';
import { AccountJson, YieldPoolType } from '@bitriel/extension-base/types';
import { isAccountAll } from '@bitriel/extension-base/utils';
import { ALL_KEY } from '@bitriel/extension-koni-ui/constants';

import { isEthereumAddress } from '@polkadot/util-crypto';

const defaultAccountFilter = (poolType: YieldPoolType, chain?: _ChainInfo): ((account: AccountJson) => boolean) => {
  return (account: AccountJson) => {
    if (account.genesisHash && chain && _getSubstrateGenesisHash(chain) !== account.genesisHash) {
      return false;
    }

    if (isAccountAll(account.address)) {
      return false;
    }

    return !(poolType === YieldPoolType.NOMINATION_POOL && isEthereumAddress(account.address));
  };
};

export const accountFilterFunc = (
  chainInfoMap: Record<string, _ChainInfo>,
  poolType: YieldPoolType,
  poolChain?: string
): ((account: AccountJson) => boolean) => {
  return (account: AccountJson) => {
    if (poolChain && poolChain !== ALL_KEY) {
      const chain = chainInfoMap[poolChain];
      const defaultFilter = defaultAccountFilter(poolType, chain);
      const isEvmChain = _isChainEvmCompatible(chain);

      return defaultFilter(account) && isEvmChain === isEthereumAddress(account.address);
    } else {
      return defaultAccountFilter(poolType)(account);
    }
  };
};
