// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationsQueueItem, EvmSignatureRequest } from '@bitriel/extension-base/background/KoniTypes';
import { AccountItemWithProxyAvatar, ConfirmationGeneralInfo, ViewDetailIcon } from '@bitriel/extension-koni-ui/components';
import { useGetAccountByAddress, useOpenDetailModal } from '@bitriel/extension-koni-ui/hooks';
import { EvmSignatureSupportType, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Button } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseDetailModal, EvmMessageDetail, EvmSignArea } from '../../parts';

interface Props extends ThemeProps {
  type: EvmSignatureSupportType
  request: ConfirmationsQueueItem<EvmSignatureRequest>
}

function Component ({ className, request, type }: Props) {
  const { id, payload } = request;
  const { t } = useTranslation();
  const { address, errors } = payload;
  const account = useGetAccountByAddress(address);
  const onClickDetail = useOpenDetailModal();

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div className='title'>
          {t('Signature required')}
        </div>
        <div className='description'>
          {t('You are approving a request with the following account')}
        </div>
        <AccountItemWithProxyAvatar
          account={account}
          accountAddress={address}
          className='account-item'
          isSelected={true}
        />
        {(!errors || errors.length === 0) && <div>
          <Button
            icon={<ViewDetailIcon />}
            onClick={onClickDetail}
            size='xs'
            type='ghost'
          >
            {t('View details')}
          </Button>
        </div>
        }
      </div>
      <EvmSignArea
        id={id}
        payload={request}
        type={type}
      />
      {(!errors || errors.length === 0) && <BaseDetailModal
        title={t('Message details')}
      >
        <EvmMessageDetail payload={request.payload} />
      </BaseDetailModal>}
    </>
  );
}

const EvmSignatureConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.__prop-label': {
      marginRight: token.marginMD,
      width: '50%',
      float: 'left'
    }
  },

  '.__label': {
    textAlign: 'left'
  }
}));

export default EvmSignatureConfirmation;
