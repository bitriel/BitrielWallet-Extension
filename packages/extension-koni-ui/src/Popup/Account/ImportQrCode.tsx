// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxyType } from '@bitriel/extension-base/types';
import { createPromiseHandler, detectTranslate } from '@bitriel/extension-base/utils';
import DefaultLogosMap, { IconMap } from '@bitriel/extension-koni-ui/assets/logo';
import { AccountNameModal, Layout, PageWrapper } from '@bitriel/extension-koni-ui/components';
import CloseIcon from '@bitriel/extension-koni-ui/components/Icon/CloseIcon';
import DualLogo from '@bitriel/extension-koni-ui/components/Logo/DualLogo';
import QrScannerErrorNotice from '@bitriel/extension-koni-ui/components/Qr/Scanner/ErrorNotice';
import { ACCOUNT_NAME_MODAL, IMPORT_ACCOUNT_MODAL } from '@bitriel/extension-koni-ui/constants/modal';
import useCompleteCreateAccount from '@bitriel/extension-koni-ui/hooks/account/useCompleteCreateAccount';
import useGoBackFromCreateAccount from '@bitriel/extension-koni-ui/hooks/account/useGoBackFromCreateAccount';
import useUnlockChecker from '@bitriel/extension-koni-ui/hooks/common/useUnlockChecker';
import useScanAccountQr from '@bitriel/extension-koni-ui/hooks/qr/useScanAccountQr';
import useAutoNavigateToCreatePassword from '@bitriel/extension-koni-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@bitriel/extension-koni-ui/hooks/router/useDefaultNavigate';
import { checkPublicAndPrivateKey, createAccountWithSecret } from '@bitriel/extension-koni-ui/messaging';
import { ThemeProps, ValidateState } from '@bitriel/extension-koni-ui/types';
import { QrAccount } from '@bitriel/extension-koni-ui/types/scanner';
import { importQrScan } from '@bitriel/extension-koni-ui/utils/scanner/attach';
import { Icon, Image, ModalContext, SwQrScanner } from '@subwallet/react-ui';
import CN from 'classnames';
import { QrCode, Scan, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps

const FooterIcon = (
  <Icon
    phosphorIcon={QrCode}
    weight='fill'
  />
);

const checkAccount = (qrAccount: QrAccount): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    checkPublicAndPrivateKey(qrAccount.genesisHash, qrAccount.content)
      .then(({ errorMessage, isEthereum, isValid }) => {
        if (isValid) {
          resolve(isEthereum);
        } else {
          reject(new Error(errorMessage || 'Invalid QR code'));
        }
      })
      .catch((e: Error) => {
        reject(e);
      });
  });
};

const accountNameModalId = ACCOUNT_NAME_MODAL;
const modalId = 'import-qr-code-scanner-modal';

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();

  const { className } = props;
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const onComplete = useCompleteCreateAccount();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);
  const checkUnlock = useUnlockChecker();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const [validateState, setValidateState] = useState<ValidateState>({});
  const [scannedAccount, setScannedAccount] = useState<QrAccount>();
  const [loading, setLoading] = useState(false);

  const accountAddressValidator = useCallback((scannedAccount: QrAccount) => {
    const { promise, reject, resolve } = createPromiseHandler<void>();

    if (scannedAccount) {
      setTimeout(() => {
        checkAccount(scannedAccount)
          .then((isEthereum) => {
            setScannedAccount({
              ...scannedAccount,
              isEthereum
            });

            resolve();
          }).catch((error: Error) => {
            reject(error);
          });
      }, 300);
    } else {
      reject(new Error('Invalid QR code'));
    }

    return promise;
  }, []);

  const onPreSubmit = useCallback((account: QrAccount) => {
    inactiveModal(modalId);
    setValidateState({
      message: '',
      status: 'success'
    });
    accountAddressValidator(account)
      .then(() => {
        activeModal(accountNameModalId);
      }).catch((error: Error) => {
        setValidateState({
          message: t(error.message),
          status: 'error'
        });
      });
  }, [inactiveModal, accountAddressValidator, activeModal, t]);

  const onSubmit = useCallback((name: string) => {
    if (scannedAccount) {
      setLoading(true);
      setTimeout(() => {
        createAccountWithSecret({
          name,
          isAllow: true,
          secretKey: scannedAccount.content,
          publicKey: scannedAccount.genesisHash,
          isEthereum: scannedAccount.isEthereum
        })
          .then(({ errors, success }) => {
            if (success) {
              setValidateState({});
              onComplete();
            } else {
              setValidateState({
                message: t(errors[0].message),
                status: 'error'
              });
            }
          })
          .catch((error: Error) => {
            setValidateState({
              message: t(error.message),
              status: 'error'
            });
          })
          .finally(() => {
            setLoading(false);

            inactiveModal(accountNameModalId);
          });
      }, 300);
    }
  }, [inactiveModal, onComplete, scannedAccount, t]);

  const { onClose, onError, onSuccess, openCamera } = useScanAccountQr(modalId, importQrScan, setValidateState, onPreSubmit);

  const onScan = useCallback(() => {
    checkUnlock().then(() => {
      setTimeout(() => {
        openCamera();
      }, 300);
    }).catch(() => {
      // User cancelled unlock
    });
  }, [checkUnlock, openCamera]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={{
          children: loading ? t('Creating') : t('Scan QR'),
          icon: FooterIcon,
          onClick: onScan,
          loading: loading
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Import by QR code')}
      >
        <div className={CN('container')}>
          <div className='sub-title'>
            {t("Make sure that you have granted SubWallet the access to your device's camera")}
          </div>
          <div className='logo'>
            <DualLogo
              leftLogo={(
                <Image
                  height={56}
                  shape='squircle'
                  src={DefaultLogosMap.subwallet}
                  width={56}
                />
              )}
              linkIcon={(
                <Icon
                  phosphorIcon={Scan}
                  size='md'
                />
              )}
              rightLogo={(
                <Image
                  height={56}
                  shape='squircle'
                  src={IconMap.__qr_code__}
                  width={56}
                />
              )}
            />
          </div>
          <div className='instruction'>
            <div className='instruction'>
              <Trans
                components={{
                  highlight: (
                    <a
                      className='link'
                      href='https://docs.subwallet.app/main/extension-user-guide/account-management/import-and-restore-an-account#import-by-qr-code'
                      rel='noopener noreferrer'
                      target='_blank'
                    />
                  )
                }}
                i18nKey={detectTranslate('Click the "Scan QR" button, or read <highlight>this instruction</highlight>, for more details')}
              />
            </div>
          </div>
          {
            validateState.message && (
              <div className='error-container'>
                <Icon
                  customSize='28px'
                  phosphorIcon={XCircle}
                  weight='fill'
                />
                <span className='error-content'>{validateState.message}</span>
              </div>
            )
          }
          <SwQrScanner
            className={className}
            id={modalId}
            isError={!!validateState.status}
            onClose={onClose}
            onError={onError}
            onSuccess={onSuccess}
            overlay={validateState.message && (<QrScannerErrorNotice message={validateState.message} />)}
            title={t('Scan QR')}
          />
        </div>
      </Layout.WithSubHeaderOnly>

      <AccountNameModal
        accountType={AccountProxyType.SOLO}
        isLoading={loading}
        onSubmit={onSubmit}
      />
    </PageWrapper>
  );
};

const ImportQrCode = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
      padding: token.padding
    },

    '.sub-title': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.logo': {
      margin: `${token.controlHeightLG}px 0`,
      '--logo-size': token.controlHeightLG + token.controlHeightXS
    },

    '.instruction': {
      padding: `0 ${token.padding}px`,
      marginBottom: token.margin,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.link': {
      color: token.colorLink,
      textDecoration: 'underline'
    },

    '.error-container': {
      color: token.colorError,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: token.marginXXL - 2,
      justifyContent: 'center'
    },

    '.error-content': {
      marginLeft: token.marginXS,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    }
  };
});

export default ImportQrCode;
