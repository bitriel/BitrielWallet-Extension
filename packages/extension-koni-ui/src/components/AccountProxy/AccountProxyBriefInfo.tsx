// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy } from '@bitriel/extension-base/types';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { isAccountAll } from '@bitriel/extension-koni-ui/utils';
import { Typography } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import AccountProxyAvatarGroup from './AccountProxyAvatarGroup';

interface Props extends ThemeProps {
  accountProxy: AccountProxy;
}

const Component: React.FC<Props> = ({ accountProxy, className }: Props) => {
  const { t } = useTranslation();
  const isAll = useMemo((): boolean => isAccountAll(accountProxy.id), [accountProxy.id]);

  return (
    <div className={className}>
      {isAll && <AccountProxyAvatarGroup />}
      <Typography.Text
        className='account-name'
        ellipsis={true}
      >
        { isAll ? t('All accounts') : accountProxy.name}
      </Typography.Text>
    </div>
  );
};

const AccountProxyBriefInfo = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

export default AccountProxyBriefInfo;
