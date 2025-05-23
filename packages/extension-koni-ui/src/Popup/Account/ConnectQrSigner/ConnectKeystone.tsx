// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DefaultLogosMap from '@bitriel/extension-koni-ui/assets/logo';
import ConnectQrSigner from '@bitriel/extension-koni-ui/Popup/Account/ConnectQrSigner/index';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<ThemeProps> = () => {
  const { t } = useTranslation();

  return (
    <ConnectQrSigner
      deviceName={t('Keystone')}
      instructionUrl={'https://docs.subwallet.app/main/extension-user-guide/account-management/connect-keystone-device'}
      logoUrl={DefaultLogosMap.keystone}
      subTitle={t('Open "Software Wallet" section on your Keystone and choose SubWallet')}
      title={t('Connect Keystone device')}
    />
  );
};

const ConnectKeystone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default ConnectKeystone;
