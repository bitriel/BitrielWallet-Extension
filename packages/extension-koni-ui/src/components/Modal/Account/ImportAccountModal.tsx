// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IMPORT_ACCOUNT_MODAL } from '@bitriel/extension-koni-ui/constants';
import { useClickOutSide, useExtensionDisplayModes, useGoBackSelectAccount, useSetSessionLatest, useSidePanelUtils, useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { windowOpen } from '@bitriel/extension-koni-ui/messaging';
import { Theme } from '@bitriel/extension-koni-ui/themes';
import { PhosphorIcon, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { renderModalSelector } from '@bitriel/extension-koni-ui/utils';
import { BackgroundIcon, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { FileJs, Leaf, QrCode, Wallet } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { BackIcon, CloseIcon } from '../../Icon';
import { SettingItemSelection } from '../../Setting';

type Props = ThemeProps;

interface ImportAccountItem {
  label: string;
  key: string;
  icon: PhosphorIcon;
  backgroundColor: string;
  onClick: () => void;
}

const modalId = IMPORT_ACCOUNT_MODAL;

const Component: React.FC<Props> = ({ className }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { setStateSelectAccount } = useSetSessionLatest();
  const { checkActive, inactiveModal } = useContext(ModalContext);
  const isActive = checkActive(modalId);

  const { isExpanseMode, isSidePanelMode } = useExtensionDisplayModes();
  const { closeSidePanel } = useSidePanelUtils();
  const onBack = useGoBackSelectAccount(modalId);

  const onCancel = useCallback(() => {
    setStateSelectAccount(true);
    inactiveModal(modalId);
  }, [inactiveModal, setStateSelectAccount]);

  useClickOutSide(isActive, renderModalSelector(className), onCancel);

  const onClickItem = useCallback((path: string) => {
    return () => {
      inactiveModal(modalId);
      setStateSelectAccount(true);
      navigate(path);
    };
  }, [inactiveModal, setStateSelectAccount, navigate]);

  const onClickJson = useCallback(() => {
    if (!isExpanseMode) {
      windowOpen({ allowedPath: '/accounts/restore-json' }).catch(console.error);

      isSidePanelMode && closeSidePanel();
    } else {
      inactiveModal(modalId);
      navigate('/accounts/restore-json');
    }
  }, [closeSidePanel, inactiveModal, isExpanseMode, isSidePanelMode, navigate]);

  const onClickSeed = useCallback(() => {
    inactiveModal(modalId);
    navigate('/accounts/import-seed-phrase');
  }, [inactiveModal, navigate]);

  const items = useMemo((): ImportAccountItem[] => [
    {
      backgroundColor: token['green-7'],
      icon: Leaf,
      key: 'import-seed-phrase',
      label: t('Import from seed phrase'),
      onClick: onClickSeed
    },
    {
      backgroundColor: token['orange-7'],
      icon: FileJs,
      key: 'restore-json',
      label: t('Import from JSON file'),
      onClick: onClickJson
    },
    {
      backgroundColor: token['gray-3'],
      icon: Wallet,
      key: 'import-private-key',
      label: t('Import from private key'),
      onClick: onClickItem('/accounts/import-private-key')
    },
    {
      backgroundColor: token['blue-7'],
      icon: QrCode,
      key: 'import-by-qr',
      label: t('Import by QR code'),
      onClick: onClickItem('/accounts/import-by-qr')
    }
  ], [token, t, onClickSeed, onClickJson, onClickItem]);

  const renderIcon = useCallback((item: ImportAccountItem) => {
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
      title={t<string>('Import account')}
    >
      <div className='items-container'>
        {items.map((item) => {
          return (
            <div
              key={item.key}
              onClick={item.onClick}
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

const ImportAccountModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    }
  };
});

export default ImportAccountModal;
