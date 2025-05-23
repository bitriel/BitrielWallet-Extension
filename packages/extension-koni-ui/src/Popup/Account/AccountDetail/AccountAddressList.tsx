// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy, AccountProxyType } from '@bitriel/extension-base/types';
import { AccountChainAddressList } from '@bitriel/extension-koni-ui/components';
import { useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Button, Icon } from '@subwallet/react-ui';
import { Strategy } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  accountProxy: AccountProxy;
};

const isNotHide = false;

function Component ({ accountProxy, className }: Props) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <AccountChainAddressList accountProxy={accountProxy} />

      {
        isNotHide && accountProxy.accountType === AccountProxyType.SOLO && (
          <div className={'update-unified-account-button-wrapper'}>
            <Button
              block={true}
              className={'update-unified-account-button'}
              icon={(
                <Icon
                  phosphorIcon={Strategy}
                  weight='fill'
                />
              )}
            >
              {t('Upgrade to Unified account')}
            </Button>
          </div>
        )
      }
    </div>
  );
}

export const AccountAddressList = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  display: 'flex',
  overflow: 'hidden',
  flexDirection: 'column',

  '.ant-sw-list-section': {
    flex: 1
  }
}));
