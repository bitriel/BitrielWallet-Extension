// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ButtonProps } from '@subwallet/react-ui/es/button/button';

import { getExplorerLink } from '@bitriel/extension-base/services/transaction-service/utils';
import { AccountActions } from '@bitriel/extension-base/types';
import { CloseIcon, TonWalletContractSelectorModal } from '@bitriel/extension-koni-ui/components';
import { ADDRESS_QR_MODAL, TON_WALLET_CONTRACT_SELECTOR_MODAL } from '@bitriel/extension-koni-ui/constants/modal';
import { useDefaultNavigate, useFetchChainInfo, useGetAccountByAddress } from '@bitriel/extension-koni-ui/hooks';
import useNotification from '@bitriel/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { toShort } from '@bitriel/extension-koni-ui/utils';
import { Button, Icon, Logo, ModalContext, SwModal, SwQRCode, Tag } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowSquareOut, CaretLeft, CopySimple, Gear, House } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

export interface AddressQrModalProps {
  address: string;
  chainSlug: string;
  onBack?: VoidFunction;
  onCancel?: VoidFunction;
  isNewFormat?: boolean
}

type Props = ThemeProps & AddressQrModalProps & {
  onCancel: VoidFunction;
};

const modalId = ADDRESS_QR_MODAL;
const tonWalletContractSelectorModalId = TON_WALLET_CONTRACT_SELECTOR_MODAL;

const Component: React.FC<Props> = ({ address, chainSlug, className, isNewFormat, onBack, onCancel }: Props) => {
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const notify = useNotification();
  const chainInfo = useFetchChainInfo(chainSlug);
  const accountInfo = useGetAccountByAddress(address);
  const isTonWalletContactSelectorModalActive = checkActive(tonWalletContractSelectorModalId);
  const goHome = useDefaultNavigate().goHome;

  const scanExplorerAddressUrl = useMemo(() => {
    return getExplorerLink(chainInfo, address, 'account');
  }, [address, chainInfo]);

  const onGoHome = useCallback(() => {
    goHome();
    onCancel();
  }, [goHome, onCancel]);

  const handleClickViewOnExplorer = useCallback(() => {
    try {
      if (scanExplorerAddressUrl) {
        // eslint-disable-next-line no-void
        void chrome.tabs.create({ url: scanExplorerAddressUrl, active: true }).then(() => console.log('redirecting'));
      }
    } catch (e) {
      console.log('error redirecting to a new tab');
    }
  }, [scanExplorerAddressUrl]);

  const isRelatedToTon = useMemo(() => {
    return accountInfo?.accountActions.includes(AccountActions.TON_CHANGE_WALLET_CONTRACT_VERSION);
  }, [accountInfo]);

  const onChangeTonWalletContact = useCallback(() => {
    activeModal(tonWalletContractSelectorModalId);
  }, [activeModal]);

  const onCloseTonWalletContactModal = useCallback(() => {
    inactiveModal(tonWalletContractSelectorModalId);
  }, [inactiveModal]);

  const onClickCopyButton = useCallback(() => notify({ message: t('Copied to clipboard') }), [notify, t]);

  const tonWalletContactSelectorButtonProps = useMemo<ButtonProps>(() => {
    return {
      icon: (
        <Icon
          phosphorIcon={Gear}
        />
      ),
      type: 'ghost',
      onClick: onChangeTonWalletContact,
      tooltip: t('Click to change wallet address'),
      tooltipPlacement: 'topRight'
    };
  }, [onChangeTonWalletContact, t]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closeIcon={
          onBack
            ? (
              <Icon
                phosphorIcon={CaretLeft}
                size='md'
              />
            )
            : undefined
        }
        destroyOnClose={true}
        id={modalId}
        onCancel={onBack || onCancel}
        rightIconProps={onBack
          ? {
            icon: <CloseIcon />,
            onClick: onCancel
          }
          : isRelatedToTon ? tonWalletContactSelectorButtonProps : undefined
        }
        title={(
          <>
            {t<string>('Your address')}
            {onBack && isRelatedToTon && (
              <Button
                {...tonWalletContactSelectorButtonProps}
                className={'__change-version-button -schema-header'}
                size={'xs'}
              />
            )}
          </>
        )}
      >
        <>
          <div className='__qr-code-wrapper'>
            <SwQRCode
              className='__qr-code'
              color='#000'
              errorLevel='H'
              icon={''}
              size={264}
              value={address}
            />
          </div>

          <div className={'__address-box-wrapper'}>
            <div className='__address-box'>
              <Logo
                className='__network-logo'
                network={chainSlug}
                shape='circle'
                size={28}
              />

              <div className='__address'>
                {toShort(address || '', 7, 7)}
              </div>

              {isNewFormat !== undefined && <div className={'__address-tag'}>
                <Tag
                  bgType={'default'}
                  className={CN(className, '__item-tag')}
                  color={isNewFormat ? 'green' : 'yellow'}
                >
                  {t(isNewFormat ? 'New' : 'Legacy')}
                </Tag>
              </div>}

              <CopyToClipboard text={address}>
                <Button
                  className='__copy-button'
                  icon={
                    <Icon
                      phosphorIcon={CopySimple}
                      size='sm'
                    />
                  }
                  onClick={onClickCopyButton}
                  size='xs'
                  tooltip={t('Copy address')}
                  type='ghost'
                />
              </CopyToClipboard>
            </div>
          </div>

          {isNewFormat === undefined || isNewFormat
            ? (
              <Button
                block
                className={'__view-on-explorer'}
                disabled={!scanExplorerAddressUrl}
                icon={
                  <Icon
                    customSize={'28px'}
                    phosphorIcon={ArrowSquareOut}
                    size='sm'
                    weight={'fill'}
                  />
                }
                onClick={handleClickViewOnExplorer}
              >{t('View on explorer')}</Button>
            )
            : (
              <Button
                block
                className={'__go-home-button'}
                disabled={!scanExplorerAddressUrl}
                icon={
                  <Icon
                    customSize={'28px'}
                    phosphorIcon={House}
                    size='sm'
                    weight={'fill'}
                  />
                }
                onClick={onGoHome}
                schema={'secondary'}
              >{t('Back to home')}</Button>
            )}
        </>
      </SwModal>
      {isRelatedToTon && isTonWalletContactSelectorModalActive &&
        <TonWalletContractSelectorModal
          address={address}
          chainSlug={chainSlug}
          id={tonWalletContractSelectorModalId}
          onBack={onCloseTonWalletContactModal}
          onCancel={onCloseTonWalletContactModal}
        />
      }
    </>
  );
};

const AddressQrModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__qr-code-wrapper': {
      paddingTop: token.padding,
      paddingBottom: token.padding
    },
    '.ant-sw-sub-header-title': {
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.fontWeightStrong
    },

    '.ant-sw-header-center-part': {
      position: 'relative',
      height: 40
    },

    '.ant-sw-header-center-part .__change-version-button': {
      position: 'absolute',
      right: 0,
      top: 0
    },

    '.ant-sw-qr-code': {
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.__address-box-wrapper': {
      marginBottom: token.margin
    },

    '.__address-box': {
      borderRadius: token.borderRadiusLG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: token.paddingSM,
      paddingRight: token.paddingXXS,
      minHeight: 48
    },

    '.__address': {
      paddingLeft: token.paddingXS,
      paddingRight: token.paddingXS,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      'white-space': 'nowrap',
      color: token.colorTextLight4,
      flexShrink: 1
    },

    '.__change-version-icon': {
      color: token.colorWhite
    },

    '.__copy-button': {
      color: token.colorTextLight3,

      '&:hover': {
        color: token.colorTextLight2
      }
    },

    '.__view-on-explorer': {
      fontSize: token.fontSizeLG
    },

    '.__address-tag': {
      alignItems: 'center',
      display: 'flex',
      paddingRight: token.paddingXS
    },

    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 39,
      padding: `2px ${token.paddingXS}px`,
      fontSize: token.fontSizeXS,
      fontWeight: 700,
      lineHeight: token.lineHeightXS
    }
  };
});

export default AddressQrModal;
