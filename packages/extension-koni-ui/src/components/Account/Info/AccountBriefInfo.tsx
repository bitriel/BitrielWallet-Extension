// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@bitriel/extension-base/types';
import AvatarGroup from '@bitriel/extension-koni-ui/components/Account/Info/AvatarGroup';
import useChainInfo from '@bitriel/extension-koni-ui/hooks/chain/useChainInfo';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { isAccountAll } from '@bitriel/extension-koni-ui/utils';
import { formatAccountAddress } from '@bitriel/extension-koni-ui/utils/account/account';
import { Typography } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  account: AccountJson;
}

const Component: React.FC<Props> = ({ account, className }: Props) => {
  const { t } = useTranslation();
  const isAll = useMemo((): boolean => isAccountAll(account.address), [account.address]);
  const networkInfo = useChainInfo(undefined, account?.genesisHash);
  const address = useMemo((): string => formatAccountAddress(account, networkInfo), [account, networkInfo]);

  return (
    <div className={className}>
      {isAll && <AvatarGroup />}
      <Typography.Text
        className='account-name'
        ellipsis={true}
      >
        { isAll ? t('All accounts') : account.name}
      </Typography.Text>
      {!isAll && <div className='account-address'>(...{address.slice(-3)})</div>}
    </div>
  );
};

const AccountBriefInfo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    gap: token.sizeXS,
    alignItems: 'center',
    overflow: 'hidden',

    '&.mr': {
      marginRight: -1
    },

    '.account-name': {
      fontWeight: token.headingFontWeight,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextBase
    },

    '.account-address': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      'white-space': 'nowrap'
    }
  };
});

export default AccountBriefInfo;
