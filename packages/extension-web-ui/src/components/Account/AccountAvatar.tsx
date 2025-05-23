// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useAccountAvatarTheme from '@bitriel/extension-web-ui/hooks/account/useAccountAvatarTheme';
import { ThemeProps } from '@bitriel/extension-web-ui/types';
import SwAvatar, { SwAvatarProps } from '@subwallet/react-ui/es/sw-avatar';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & Omit<SwAvatarProps, 'theme'>

const Component: React.FC<Props> = (props: Props) => {
  const { value } = props;
  const avatarTheme = useAccountAvatarTheme(value || '');

  return (
    <SwAvatar
      {...props}
      theme={avatarTheme}
    />
  );
};

const AccountAvatar = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default AccountAvatar;
