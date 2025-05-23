// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { YieldPoolInfo, YieldPositionInfo } from '@bitriel/extension-base/types';
import { ThemeProps } from '@bitriel/extension-web-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { AccountInfoPart } from './AccountInfoPart';
import { NominationInfoPart } from './NominationInfoPart';

type Props = ThemeProps & {
  compound: YieldPositionInfo;
  list: YieldPositionInfo[];
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
};

function Component ({ className, compound, inputAsset, list, poolInfo }: Props) {
  return (
    <div
      className={CN(className)}
    >
      <AccountInfoPart
        compound={compound}
        inputAsset={inputAsset}
        list={list}
        poolInfo={poolInfo}
      />
      <NominationInfoPart
        compound={compound}
        inputAsset={inputAsset}
        poolInfo={poolInfo}
      />
    </div>
  );
}

export const AccountAndNominationInfoPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  borderRadius: token.borderRadiusLG,
  backgroundColor: token.colorBgSecondary
}));
