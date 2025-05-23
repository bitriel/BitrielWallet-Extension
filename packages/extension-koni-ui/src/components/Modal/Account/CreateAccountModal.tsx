// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountActions } from '@bitriel/extension-base/types';
import BackIcon from '@bitriel/extension-koni-ui/components/Icon/BackIcon';
import CloseIcon from '@bitriel/extension-koni-ui/components/Icon/CloseIcon';
import { SettingItemSelection } from '@bitriel/extension-koni-ui/components/Setting/SettingItemSelection';
import { CREATE_ACCOUNT_MODAL, DERIVE_ACCOUNT_LIST_MODAL } from '@bitriel/extension-koni-ui/constants/modal';
import { useSetSelectedMnemonicType, useSetSessionLatest } from '@bitriel/extension-koni-ui/hooks';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import useClickOutSide from '@bitriel/extension-koni-ui/hooks/dom/useClickOutSide';
import useGoBackSelectAccount from '@bitriel/extension-koni-ui/hooks/modal/useGoBackSelectAccount';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { Theme } from '@bitriel/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { renderModalSelector } from '@bitriel/extension-koni-ui/utils/common/dom';
import { BackgroundIcon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { Leaf, ShareNetwork } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

interface CreateAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
  disabled: boolean;
}

const modalId = CREATE_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { setStateSelectAccount } = useSetSessionLatest();
  const { token } = useTheme() as Theme;
  const { accountProxies } = useSelector((state: RootState) => state.accountState);
  const isActive = checkActive(modalId);
  const navigate = useNavigate();
  const setSelectedMnemonicType = useSetSelectedMnemonicType(false);

  const onBack = useGoBackSelectAccount(modalId);

  const disableDerive = useMemo(
    () => !accountProxies
      .filter(({ accountActions }) => accountActions.includes(AccountActions.DERIVE)).length,
    [accountProxies]
  );

  const onCancel = useCallback(() => {
    setStateSelectAccount(true);
    inactiveModal(modalId);
  }, [inactiveModal, setStateSelectAccount]);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  const renderIcon = useCallback((item: CreateAccountItem) => {
    return (
      <BackgroundIcon
        backgroundColor={item.backgroundColor}
        iconColor={token.colorText}
        phosphorIcon={item.icon}
        size='sm'
        weight='fill'
      />
    );
  }, [token.colorText]);

  const items = useMemo((): CreateAccountItem[] => ([
    {
      backgroundColor: token['green-7'],
      disabled: false,
      icon: Leaf,
      key: 'new-seed-phrase',
      label: t('Create with a new seed phrase'),
      onClick: () => {
        inactiveModal(modalId);
        setSelectedMnemonicType('general');
        navigate('/accounts/new-seed-phrase');
      }
    },
    {
      backgroundColor: token['magenta-7'],
      disabled: disableDerive,
      icon: ShareNetwork,
      key: 'derive-account',
      label: t('Derive from an existing account'),
      onClick: () => {
        inactiveModal(modalId);
        activeModal(DERIVE_ACCOUNT_LIST_MODAL);
      }
    }
  ]), [token, t, disableDerive, inactiveModal, setSelectedMnemonicType, navigate, activeModal]);

  return (
    <SwModal
      className={CN(className)}
      closeIcon={(<BackIcon />)}
      id={modalId}
      maskClosable={false}
      onCancel={onBack}
      rightIconProps={{
        icon: <CloseIcon />,
        onClick: onCancel
      }}
      title={t<string>('Create a new account')}
    >
      <div className='items-container'>
        {items.map((item) => {
          return (
            <div
              className={CN({ disabled: item.disabled })}
              key={item.key}
              onClick={item.disabled ? undefined : item.onClick}
            >
              <SettingItemSelection
                label={item.label}
                leftItemIcon={renderIcon(item)}
              />
            </div>
          );
        })}
      </div>
    </SwModal>
  );
};

const CreateAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.disabled': {
      opacity: 0.4,

      '.ant-web3-block': {
        cursor: 'not-allowed',

        '&:hover': {
          backgroundColor: token['gray-1']
        }
      }
    }
  };
});

export default CreateAccountModal;
