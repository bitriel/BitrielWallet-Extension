// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { _STAKING_CHAIN_GROUP } from '@bitriel/extension-base/services/earning-service/constants';
import { SubnetYieldPositionInfo, YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@bitriel/extension-base/types';
import { isAccountAll } from '@bitriel/extension-base/utils';
import { Avatar, CollapsiblePanel, MetaInfo } from '@bitriel/extension-koni-ui/components';
import { useGetChainPrefixBySlug, useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { toShort } from '@bitriel/extension-koni-ui/utils';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
};

function Component ({ className, compound,
  inputAsset,
  poolInfo }: Props) {
  const { t } = useTranslation();

  const isAllAccount = useMemo(() => isAccountAll(compound.address), [compound.address]);

  const isRelayChain = useMemo(() => _STAKING_CHAIN_GROUP.relay.includes(poolInfo.chain), [poolInfo.chain]);

  const networkPrefix = useGetChainPrefixBySlug(poolInfo.chain);
  const haveNomination = useMemo(() => {
    return [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING, YieldPoolType.SUBNET_STAKING].includes(poolInfo.type);
  }, [poolInfo.type]);

  const noNomination = useMemo(
    () => !haveNomination || isAllAccount || !compound.nominations.length,
    [compound.nominations.length, haveNomination, isAllAccount]
  );

  if (noNomination) {
    return null;
  }

  const symbol = (compound as SubnetYieldPositionInfo).subnetData?.subnetSymbol || inputAsset?.symbol || '';

  return (
    <CollapsiblePanel
      className={CN(className)}
      title={t('Nomination info')}
    >
      <MetaInfo
        labelColorScheme='gray'
        labelFontWeight='regular'
        spaceSize='ms'
      >
        {compound.nominations.map((item) => {
          return (
            <MetaInfo.Number
              className={CN('__nomination-item', {
                '-hide-number': isRelayChain
              })}
              decimals={inputAsset?.decimals || 0}
              key={item.validatorAddress}
              label={(
                <>
                  <Avatar
                    identPrefix={networkPrefix}
                    size={24}
                    value={item.validatorAddress}
                  />
                  <div className={'__nomination-name'}>
                    {item.validatorIdentity || toShort(item.validatorAddress)}
                  </div>
                </>
              )}
              suffix={symbol}
              value={item.activeStake}
              valueColorSchema='even-odd'
            />
          );
        })}
      </MetaInfo>
    </CollapsiblePanel>
  );
}

export const NominationInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.__nomination-item': {
    gap: token.sizeSM,

    '.__label': {
      'white-space': 'nowrap',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.sizeXS,
      overflow: 'hidden'
    },

    '.__value-col': {
      flex: '0 1 auto'
    }
  },

  '.__nomination-item.-hide-number': {
    '.__value-col': {
      display: 'none'
    }
  },

  '.__nomination-name': {
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  }
}));
