// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _STAKING_CHAIN_GROUP } from '@bitriel/extension-base/services/earning-service/constants';
import { EarningRewardItem, YieldPoolType } from '@bitriel/extension-base/types';
import { isSameAddress } from '@bitriel/extension-base/utils';
import { BN_ZERO } from '@bitriel/extension-koni-ui/constants';
import { useGetChainSlugsByAccount, useSelector } from '@bitriel/extension-koni-ui/hooks';
import { findAccountByAddress } from '@bitriel/extension-koni-ui/utils';
import { useMemo } from 'react';

const useYieldRewardTotal = (slug: string): string | undefined => {
  const { earningRewards, poolInfoMap } = useSelector((state) => state.earning);
  const { accounts, currentAccountProxy, isAllAccount } = useSelector((state) => state.accountState);
  const chainsByAccountType = useGetChainSlugsByAccount();

  return useMemo(() => {
    const checkAddress = (item: EarningRewardItem) => {
      if (isAllAccount) {
        const account = findAccountByAddress(accounts, item.address);

        return !!account;
      } else {
        return currentAccountProxy?.accounts.some(({ address }) => isSameAddress(address, item.address));
      }
    };

    const poolInfo = poolInfoMap[slug];

    if (poolInfo) {
      if (poolInfo.type !== YieldPoolType.NOMINATION_POOL && !_STAKING_CHAIN_GROUP.mythos.includes(poolInfo.chain)) {
        return '0';
      } else {
        if (earningRewards.length) {
          let result = BN_ZERO;

          for (const reward of earningRewards) {
            if (reward.slug === slug && chainsByAccountType.includes(reward.chain) && poolInfoMap[slug]) {
              const isValid = checkAddress(reward);

              if (isValid) {
                result = result.plus(reward.unclaimedReward || '0');
              }
            }
          }

          return result.toString();
        } else {
          return undefined;
        }
      }
    } else {
      return undefined;
    }
  }, [accounts, chainsByAccountType, currentAccountProxy?.accounts, earningRewards, isAllAccount, poolInfoMap, slug]);
};

export default useYieldRewardTotal;
