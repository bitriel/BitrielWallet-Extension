// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ATTACH_ACCOUNT_MODAL, CREATE_ACCOUNT_MODAL, IMPORT_ACCOUNT_MODAL, SELECT_ACCOUNT_MODAL } from '@bitriel/extension-koni-ui/constants';
import { useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Button, Icon, ModalContext } from '@subwallet/react-ui';
import { FileArrowDown, PlusCircle, Swatches } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const openModal = useCallback((id: string) => {
    inactiveModal(SELECT_ACCOUNT_MODAL);
    activeModal(id);
  }, [activeModal, inactiveModal]);

  const openCreateAccount = useCallback(() => {
    openModal(CREATE_ACCOUNT_MODAL);
  }, [openModal]);

  const openImportAccount = useCallback(() => {
    openModal(IMPORT_ACCOUNT_MODAL);
  }, [openModal]);

  const openAttachAccount = useCallback(() => {
    openModal(ATTACH_ACCOUNT_MODAL);
  }, [openModal]);

  return (
    <div className={className}>
      <Button
        block={true}
        className={'__create-new-account-button'}
        icon={(
          <Icon
            phosphorIcon={PlusCircle}
            weight={'fill'}
          />
        )}
        onClick={openCreateAccount}
        schema='secondary'
      >
        {t('Create a new account')}
      </Button>
      <Button
        className='btn-min-width'
        icon={(
          <Icon
            phosphorIcon={FileArrowDown}
            weight={'fill'}
          />
        )}
        onClick={openImportAccount}
        schema='secondary'
        tooltip={t('Import account')}
      />
      <Button
        className='btn-min-width'
        icon={(
          <Icon
            phosphorIcon={Swatches}
            weight={'fill'}
          />
        )}
        onClick={openAttachAccount}
        schema='secondary'
        tooltip={t('Attach account')}
      />
    </div>
  );
};

const SelectAccountFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',

    '.__create-new-account-button': {
      overflow: 'hidden',

      '.ant-btn-content-wrapper': {
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    },

    '.btn-min-width': {
      minWidth: token.controlHeightLG + token.sizeSM
    }
  };
});

export default SelectAccountFooter;
