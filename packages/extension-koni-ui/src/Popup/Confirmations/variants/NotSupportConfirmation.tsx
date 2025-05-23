// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationResult } from '@bitriel/extension-base/background/KoniTypes';
import { ConfirmationRequestBase } from '@bitriel/extension-base/background/types';
import { AccountJson } from '@bitriel/extension-base/types';
import { detectTranslate } from '@bitriel/extension-base/utils';
import { AccountItemWithProxyAvatar, ConfirmationGeneralInfo } from '@bitriel/extension-koni-ui/components';
import { NEED_SIGN_CONFIRMATION } from '@bitriel/extension-koni-ui/constants';
import { useGetAccountTitleByAddress } from '@bitriel/extension-koni-ui/hooks';
import { cancelSignRequest, completeConfirmation } from '@bitriel/extension-koni-ui/messaging';
import { EvmSignatureSupportType, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: ConfirmationRequestBase;
  isMessage: boolean;
  type: typeof NEED_SIGN_CONFIRMATION[number];
  account?: AccountJson;
}

const handleCancelEvm = async (type: EvmSignatureSupportType, id: string) => {
  return await completeConfirmation(type, {
    id,
    isApproved: false
  } as ConfirmationResult<string>);
};

const handleCancelSubstrate = async (id: string) => await cancelSignRequest(id);

const Component: React.FC<Props> = (props: Props) => {
  const { account, className, isMessage, request, type } = props;

  const { t } = useTranslation();

  const accountTitle = useGetAccountTitleByAddress(account?.address);

  const [loading, setLoading] = useState(false);

  const handleCancel = useCallback(() => {
    let promise: (() => Promise<unknown>) | undefined;

    switch (type) {
      case 'evmSignatureRequest':
      case 'evmSendTransactionRequest':
        promise = () => handleCancelEvm(type, request.id);
        break;
      case 'signingRequest':
        promise = () => handleCancelSubstrate(request.id);
        break;
    }

    if (promise) {
      setLoading(true);

      setTimeout(() => {
        if (promise) {
          promise().finally(() => {
            setLoading(false);
          });
        }
      }, 300);
    }
  }, [request.id, type]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          { isMessage ? t('Signature required') : t('Transaction request')}
        </div>
        <div className='description'>
          <Trans
            components={{
              highlight: (
                <span className='highlight' />
              )
            }}
            i18nKey={detectTranslate('Feature not available for <highlight>{{accountTitle}}</highlight>. Change to another account type and try again.')}
            values={{ accountTitle }}
          />
        </div>
        {account && <AccountItemWithProxyAvatar
          account={account}
          className='account-item'
          showUnselectIcon={true}
        />}
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

const NotSupportConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.highlight': {
      color: token.colorWarning
    },

    '.account-item': {
      cursor: 'not-allowed',
      opacity: token.opacityDisable,
      background: token.colorBgSecondary,

      '&:hover': {
        cursor: 'not-allowed'
      }
    }
  };
});

export default NotSupportConfirmation;
