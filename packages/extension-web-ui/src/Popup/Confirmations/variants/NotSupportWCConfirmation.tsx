// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletConnectNotSupportRequest } from '@bitriel/extension-base/services/wallet-connect-service/types';
import { AlertBox, ConfirmationGeneralInfo } from '@bitriel/extension-web-ui/components';
import { rejectWalletConnectNotSupport } from '@bitriel/extension-web-ui/messaging';
import { ThemeProps } from '@bitriel/extension-web-ui/types';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: WalletConnectNotSupportRequest;
}

const onCancel = async (id: string) => await rejectWalletConnectNotSupport({ id });

const Component: React.FC<Props> = (props: Props) => {
  const { className, request } = props;

  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const handleCancel = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      onCancel(request.id).finally(() => {
        setLoading(false);
      });
    }, 300);
  }, [request.id]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {t('Signature required')}
        </div>
        <div className='description'>
          <AlertBox
            description={t('SubWallet has not supported this request for WalletConnect yet')}
            title={t('Request not supported')}
            type='warning'
          />
        </div>
      </div>
      <div className='confirmation-footer'>
        <Button
          loading={loading}
          onClick={handleCancel}
        >
          {t('Back to home')}
        </Button>
      </div>
    </>
  );
};

const NotSupportWCConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.highlight': {
      color: token.colorWarning
    },

    '.account-item': {
      '.ant-web3-block': {
        cursor: 'not-allowed',
        opacity: token.opacityDisable
      },

      '.ant-web3-block:hover': {
        cursor: 'not-allowed',
        background: token.colorBgSecondary
      }
    }
  };
});

export default NotSupportWCConfirmation;
