// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseJsonGetAccountInfo } from '@bitriel/extension-base/types';
import { AlertBox, Layout, PageWrapper } from '@bitriel/extension-web-ui/components';
import AvatarGroup from '@bitriel/extension-web-ui/components/Account/Info/AvatarGroup';
import CloseIcon from '@bitriel/extension-web-ui/components/Icon/CloseIcon';
import InstructionContainer, { InstructionContentType } from '@bitriel/extension-web-ui/components/InstructionContainer';
import { BaseModal } from '@bitriel/extension-web-ui/components/Modal/BaseModal';
import { IMPORT_ACCOUNT_MODAL } from '@bitriel/extension-web-ui/constants/modal';
import { ScreenContext } from '@bitriel/extension-web-ui/contexts/ScreenContext';
import { useNotification, useSelector } from '@bitriel/extension-web-ui/hooks';
import useCompleteCreateAccount from '@bitriel/extension-web-ui/hooks/account/useCompleteCreateAccount';
import useGoBackFromCreateAccount from '@bitriel/extension-web-ui/hooks/account/useGoBackFromCreateAccount';
import useTranslation from '@bitriel/extension-web-ui/hooks/common/useTranslation';
import useUnlockChecker from '@bitriel/extension-web-ui/hooks/common/useUnlockChecker';
import useAutoNavigateToCreatePassword from '@bitriel/extension-web-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@bitriel/extension-web-ui/hooks/router/useDefaultNavigate';
import { batchRestoreV2, jsonGetAccountInfo, jsonRestoreV2 } from '@bitriel/extension-web-ui/messaging';
import { Theme, ThemeProps, ValidateState } from '@bitriel/extension-web-ui/types';
import { findNetworkJsonByGenesisHash, reformatAddress } from '@bitriel/extension-web-ui/utils';
import { isKeyringPairs$Json } from '@bitriel/extension-web-ui/utils/account/typeGuards';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { Button, Form, Icon, Input, ModalContext, SettingItem, SwList, Upload } from '@subwallet/react-ui';
import { UploadChangeParam, UploadFile } from '@subwallet/react-ui/es/upload/interface';
import AccountCard from '@subwallet/react-ui/es/web3-block/account-card';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import CN from 'classnames';
import { DotsThree, FileArrowDown, Info } from 'phosphor-react';
import React, { ChangeEventHandler, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import { hexToU8a, isHex, u8aToHex, u8aToString } from '@polkadot/util';
import { ethereumEncode, keccakAsU8a, secp256k1Expand } from '@polkadot/util-crypto';

type Props = ThemeProps;

const FooterIcon = (
  <Icon
    phosphorIcon={FileArrowDown}
    weight='fill'
  />
);

const modalId = 'account-json-modal';

const formName = 'restore-json-file-form';
const passwordField = 'password';

const focusPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(`${formName}_${passwordField}`);

    if (element) {
      element.focus();
    }
  }, 10);
};

const selectPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(`${formName}_${passwordField}`);

    if (element) {
      (element as HTMLInputElement).select();
    }
  }, 10);
};

const instructionContent: InstructionContentType[] = [
  {
    title: 'What is a JSON?',
    description: "The JSON backup file stores your account's information encrypted with the account's password. It's a second recovery method additionally to the mnemonic phrase. "
  },
  {
    title: 'How to export your JSON backup file',
    description: (
      <span>
        When you create your account directly on Polkadot-JS UI the JSON file is automatically downloaded to your Downloads folder.
        <br />
        If you create your account in the Polkadot extension, you need to manually export the JSON file.
        <br />
        In <a href='#'>this article</a> you will learn how to manually export your JSON backup file in the Polkadot extension and Polkadot-JS UI.
      </span>
    )
  }
];

function Component ({ className }: Props): JSX.Element {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const onComplete = useCompleteCreateAccount();
  const navigate = useNavigate();
  const onBack = useGoBackFromCreateAccount(IMPORT_ACCOUNT_MODAL);
  const { goHome } = useDefaultNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { token } = useTheme() as Theme;
  const notify = useNotification();
  const { isWebUI } = useContext(ScreenContext);

  const [form] = Form.useForm();

  const [fileValidateState, setFileValidateState] = useState<ValidateState>({});
  const [submitValidateState, setSubmitValidateState] = useState<ValidateState>({});
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [jsonFile, setJsonFile] = useState<KeyringPair$Json | KeyringPairs$Json | undefined>(undefined);
  const [accountsInfo, setAccountsInfo] = useState<ResponseJsonGetAccountInfo[]>([]);
  const [countAccountInvalid, setCountAccountInvalid] = useState(0);

  const checkUnlock = useUnlockChecker();

  const closeModal = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const openModal = useCallback(() => {
    activeModal(modalId);
  }, [activeModal]);

  const onChange = useCallback((info: UploadChangeParam<UploadFile<unknown>>) => {
    if (validating) {
      return;
    }

    setValidating(true);
    const uploadFile = info.file;

    uploadFile.originFileObj?.arrayBuffer()
      .then((bytes) => {
        let json: KeyringPair$Json | KeyringPairs$Json | undefined;

        try {
          json = JSON.parse(u8aToString(Uint8Array.from(Buffer.from(bytes)))) as KeyringPair$Json | KeyringPairs$Json;

          if (JSON.stringify(jsonFile) === JSON.stringify(json)) {
            setValidating(false);

            return;
          } else {
            setAccountsInfo([]);
            setPassword('');
            setJsonFile(json);
          }
        } catch (e) {
          const error = e as Error;

          setFileValidateState({
            status: 'error',
            message: error.message
          });
          setValidating(false);
          setRequirePassword(false);

          return;
        }

        setCountAccountInvalid(0);

        try {
          setSubmitValidateState({});

          if (isKeyringPairs$Json(json)) {
            const accounts: ResponseJsonGetAccountInfo[] = [];

            json.accounts.forEach((account) => {
              const genesisHash: string = account.meta.originGenesisHash as string;

              let addressPrefix: number | undefined;

              if (account.meta.originGenesisHash) {
                addressPrefix = findNetworkJsonByGenesisHash(chainInfoMap, genesisHash)?.substrateInfo?.addressPrefix;
              }

              let address = account.address;

              if (addressPrefix !== undefined) {
                address = reformatAddress(account.address, addressPrefix);
              }

              if (isHex(account.address) && hexToU8a(account.address).length !== 20) {
                try {
                  address = ethereumEncode(keccakAsU8a(secp256k1Expand(hexToU8a(account.address))));
                } catch (e) {
                  setCountAccountInvalid((pre) => pre + 1);

                  return;
                }
              }

              accounts.push({
                address: address,
                genesisHash: account.meta.genesisHash,
                name: account.meta.name
              } as ResponseJsonGetAccountInfo);
            });

            setRequirePassword(true);
            setAccountsInfo(accounts);
            setFileValidateState({});
            setValidating(false);
          } else {
            jsonGetAccountInfo(json)
              .then((accountInfo) => {
                let address = accountInfo.address;

                if (isHex(accountInfo.address) && hexToU8a(accountInfo.address).length !== 20) {
                  address = u8aToHex(keccakAsU8a(secp256k1Expand(hexToU8a(accountInfo.address))));
                }

                accountInfo.address = address;
                setRequirePassword(true);
                setAccountsInfo([accountInfo]);
                setFileValidateState({});
                setValidating(false);
              })
              .catch((e: Error) => {
                setRequirePassword(false);
                console.error(e);
                setFileValidateState({
                  status: 'error',
                  message: t<string>('Invalid JSON file')
                });
                setValidating(false);
                setCountAccountInvalid((pre) => pre + 1);
              });
          }
        } catch (e) {
          setFileValidateState({
            status: 'error',
            message: t<string>('Invalid JSON file')
          });
          setValidating(false);
          setRequirePassword(false);
        }
      })
      .catch((e: Error) => {
        setFileValidateState({
          status: 'error',
          message: e.message
        });
        setValidating(false);
      });
  }, [validating, jsonFile, chainInfoMap, t]);

  const onSubmit = useCallback(() => {
    if (!jsonFile) {
      return;
    }

    if (requirePassword && !password) {
      return;
    }

    checkUnlock().then(() => {
      setLoading(true);

      setTimeout(() => {
        const isMultiple = isKeyringPairs$Json(jsonFile);

        (isMultiple
          ? batchRestoreV2(jsonFile, password, accountsInfo, true)
          : jsonRestoreV2({
            file: jsonFile,
            password: password,
            address: accountsInfo[0].address,
            isAllowed: true,
            withMasterPassword: true
          }))
          .then((addressList) => {
            setTimeout(() => {
              if (addressList.length === 1) {
                notify({
                  message: t('1 account imported'),
                  type: 'success'
                });
              } else if (addressList.length > 1) {
                notify({
                  message: t('{{number}} accounts imported', { replace: { number: addressList.length } }),
                  type: 'success'
                });
              }

              if (isMultiple) {
                navigate('/keyring/migrate-password');
              } else {
                onComplete();
              }
            }, 1000);
          })
          .catch((e: Error) => {
            setSubmitValidateState({
              message: e.message,
              status: 'error'
            });
            selectPassword();
          })
          .finally(() => {
            setLoading(false);
          });
      }, 500);
    }).catch(() => {
      // User cancel unlock
    });
  }, [jsonFile, requirePassword, password, checkUnlock, accountsInfo, notify, t, navigate, onComplete]);

  const renderItem = useCallback((account: ResponseJsonGetAccountInfo): React.ReactNode => {
    return (
      <AccountCard
        accountName={account.name}
        address={account.address}
        addressPreLength={9}
        addressSufLength={9}
        avatarIdentPrefix={42}
        className='account-item'
        key={account.address}
      />
    );
  }, []);

  const onChangePassword: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.target.value;

    if (!value) {
      setSubmitValidateState({
        message: t('Password is required'),
        status: 'error'
      });
    } else {
      setSubmitValidateState({});
    }

    setPassword(value);
  }, [t]);

  useEffect(() => {
    if (requirePassword) {
      focusPassword();
    }
  }, [requirePassword]);

  const buttonProps = {
    children: t('Import account'),
    icon: FooterIcon,
    onClick: form.submit,
    disabled: !!fileValidateState.status || !!submitValidateState.status || !password,
    loading: validating || loading
  };

  const nameImportAccountItem = useMemo(() => {
    const countAccount = String(accountsInfo.length).padStart(2, '0');

    if (countAccountInvalid > 0) {
      if (accountsInfo.length === 1) {
        return t('{{number}} account found', { replace: { number: countAccount } });
      }

      return t('{{number}} accounts found', { replace: { number: countAccount } });
    }

    return t('Import {{number}} accounts', { replace: { number: countAccount } });
  }, [accountsInfo.length, countAccountInvalid, t]);

  const descriptionAlertWarningBox = useMemo(() => {
    const countAccount = String(accountsInfo.length).padStart(2, '0');

    if (accountsInfo.length === 1) {
      return t('One or more accounts found in this file are invalid. Only {{x}} account can be imported as listed below', { replace: { x: countAccount } });
    }

    return t('One or more accounts found in this file are invalid. Only {{x}} accounts can be imported as listed below', { replace: { x: countAccount } });
  }, [accountsInfo.length, t]);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={onBack}
        rightFooterButton={!isWebUI
          ? {
            children: t('Import by JSON file'),
            icon: FooterIcon,
            onClick: form.submit,
            disabled: !!fileValidateState.status || !!submitValidateState.status || !password,
            loading: validating || loading
          }
          : undefined}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t<string>('Import from Polkadot.{js}')}
      >
        <div className={CN('layout-container', {
          '__web-ui': isWebUI
        })}
        >
          <div className={CN('import-container')}>
            <div className='description'>
              {t('Drag and drop the JSON file you exported from Polkadot.{js}')}
            </div>
            <Form
              className='form-container'
              form={form}
              name={formName}
              onFinish={onSubmit}
            >
              <Form.Item
                validateStatus={fileValidateState.status}
              >
                <Upload.SingleFileDragger
                  accept={'application/json'}
                  className='file-selector'
                  disabled={validating}
                  hint={t('Drag and drop the JSON file you exported from Polkadot.{js}')}
                  onChange={onChange}
                  statusHelp={fileValidateState.message}
                  title={t('Import by JSON file')}
                />
              </Form.Item>
              {
                accountsInfo.length > 0
                  ? (
                    <Form.Item>
                      {
                        accountsInfo.length > 1 || (accountsInfo.length === 1 && countAccountInvalid > 0)
                          ? (
                            <SettingItem
                              className='account-list-item'
                              leftItemIcon={<AvatarGroup accounts={accountsInfo} />}
                              name={nameImportAccountItem}
                              onPressItem={openModal}
                              rightItem={(
                                <>
                                  {!!countAccountInvalid && <div className={'__check-icon'}>
                                    <Icon
                                      iconColor={token.colorWarning}
                                      phosphorIcon={Info}
                                      size='sm'
                                      type='phosphor'
                                      weight='fill'
                                    />
                                  </div>}
                                  <Icon
                                    phosphorIcon={DotsThree}
                                    size='sm'
                                  />
                                </>

                              )}
                            />
                          )
                          : (
                            <SettingItem
                              className='account-list-item'
                              leftItemIcon={<AvatarGroup accounts={accountsInfo} />}
                              name={accountsInfo[0].name}
                            />
                          )
                      }
                    </Form.Item>
                  )
                  : countAccountInvalid
                    ? (<AlertBox
                      className={'alert-warning-name-duplicate'}
                      description={t('All accounts found in this file are invalid. Import another JSON file and try again')}
                      title={t('Unable to import')}
                      type='error'
                    />)
                    : <></>
              }
              {
                requirePassword && accountsInfo.length > 0 && (
                  <Form.Item
                    validateStatus={submitValidateState.status}
                  >
                    <div className='input-label'>
                      {t('Please enter the password you have used when creating your Polkadot.{js} account')}
                    </div>
                    <Input.Password
                      id={`${formName}_${passwordField}`}
                      onChange={onChangePassword}
                      placeholder={t('Password')}
                      statusHelp={submitValidateState.message}
                      type='password'
                      value={password}
                    />
                  </Form.Item>
                )
              }
              {isWebUI && (
                <Button
                  {...buttonProps}
                  className='action'
                />
              )}
            </Form>
            {accountsInfo.length > 0 && <BaseModal
              className={className}
              id={modalId}
              onCancel={closeModal}
              title={t('Import list')}
            >
              {countAccountInvalid > 0 && <AlertBox
                className={'alert-warning-name-duplicate -item'}
                description={descriptionAlertWarningBox}
                title={t('Some accounts can’t be imported')}
                type='warning'
              />}
              <SwList.Section
                displayRow={true}
                list={accountsInfo}
                renderItem={renderItem}
                rowGap='var(--row-gap)'
              />
            </BaseModal>}

          </div>

          {isWebUI && (
            <InstructionContainer contents={instructionContent} />
          )}
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

const ImportJson = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    '--row-gap': `${token.sizeXS}px`,

    '.layout-container': {
      paddingLeft: token.padding,
      paddingRight: token.padding,

      '&.__web-ui': {
        display: 'flex',
        justifyContent: 'center',
        width: extendToken.twoColumnWidth,
        maxWidth: '100%',
        gap: token.size,
        margin: '0 auto'
      },

      '.import-container': {
        paddingBottom: 0,
        flex: 1,

        '& .ant-btn': {
          width: '100%'
        }
      },

      '.instruction-container': {
        flex: 1
      }
    },
    '.description': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription
    },

    '.form-container': {
      marginTop: token.margin
    },

    '.ant-form-item:last-child': {
      marginBottom: 0
    },

    '.input-label': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      marginBottom: token.margin
    },

    '.account-list-item': {
      marginTop: -token.marginXS,

      '.account-item': {
        cursor: 'default'
      },

      '.ant-web3-block-right-item': {
        marginRight: 0
      }
    },

    '.ant-web3-block': {
      display: 'flex !important'
    },

    '.ant-sw-modal-body': {
      padding: `${token.padding}px 0 ${token.padding}px`,
      flexDirection: 'column',
      display: 'flex'
    },

    '.ant-sw-list-wrapper': {
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },

    '.file-selector': {
      '.ant-upload-drag-single': {
        height: 168
      }
    },

    '.alert-warning-name-duplicate.-item': {
      margin: `0px ${token.margin}px ${token.marginXS}px ${token.margin}px`
    },

    '.alert-warning-name-duplicate': {
      margin: `-${token.marginXS}px 0px ${token.margin}px 0px`
    },

    '.__check-icon': {
      display: 'flex',
      width: 40,
      justifyContent: 'center'
    }
  };
});

export default ImportJson;
