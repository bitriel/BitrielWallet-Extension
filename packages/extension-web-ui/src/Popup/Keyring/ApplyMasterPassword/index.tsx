// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@bitriel/extension-base/constants';
import { AccountJson } from '@bitriel/extension-base/types';
import { CloseIcon, Layout, PageWrapper } from '@bitriel/extension-web-ui/components';
import { ScreenContext } from '@bitriel/extension-web-ui/contexts/ScreenContext';
import { useDefaultNavigate, useDeleteAccount, useNotification } from '@bitriel/extension-web-ui/hooks';
import useUnlockChecker from '@bitriel/extension-web-ui/hooks/common/useUnlockChecker';
import { forgetAccount, keyringMigrateMasterPassword } from '@bitriel/extension-web-ui/messaging';
import { RootState } from '@bitriel/extension-web-ui/stores';
import { CreateDoneParam, FormCallbacks, FormFieldData, Theme, ThemeProps } from '@bitriel/extension-web-ui/types';
import { simpleCheckForm, toShort } from '@bitriel/extension-web-ui/utils';
import { Button, ButtonProps, Field, Form, Icon, Input } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, Trash } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

import MigrateDone from './Done';
import IntroductionMigratePassword from './Introduction';

type Props = ThemeProps;

type PageStep = 'Introduction' | 'Migrate' | 'Done'

enum FormFieldName {
  PASSWORD = 'password',
}

interface MigratePasswordFormState {
  [FormFieldName.PASSWORD]: string;
}

const nextIcon = (
  <Icon
    phosphorIcon={ArrowCircleRight}
    weight='fill'
  />
);

const finishIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const removeIcon = (
  <Icon
    phosphorIcon={Trash}
  />
);

const formName = 'migrate-password-form';
const passwordInputId = `${formName}_${FormFieldName.PASSWORD}`;

const focusPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(passwordInputId);

    if (element) {
      element.focus();
    }
  }, 10);
};

const selectPassword = () => {
  setTimeout(() => {
    const element = document.getElementById(passwordInputId);

    if (element) {
      (element as HTMLInputElement).select();
    }
  }, 10);
};

const intersectionArray = (array1: AccountJson[], array2: AccountJson[]): AccountJson[] => {
  return array1.filter((account) => array2.find((acc) => acc.address === account.address));
};

const filterAccountMigrated = (acc: AccountJson) => {
  return acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal && acc.isMasterPassword && !acc.isInjected && !acc.pendingMigrate;
};

const filterAccountCanMigrate = (acc: AccountJson) => {
  return acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal && !acc.isInjected && !acc.pendingMigrate;
};

const Component: React.FC<Props> = (props: Props) => {
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();
  const { className } = props;
  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();
  const notify = useNotification();
  const { token } = useTheme() as Theme;

  const deleteAccountAction = useDeleteAccount();

  const { accounts } = useSelector((state: RootState) => state.accountState);
  const [step, setStep] = useState<PageStep>('Introduction');
  const [form] = Form.useForm<MigratePasswordFormState>();
  const [currentAccount, setCurrentAccount] = useState<AccountJson | undefined>(undefined);
  const [isDisabled, setIsDisable] = useState(true);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const checkUnlock = useUnlockChecker();

  const migratedRef = useRef<AccountJson[]>(accounts.filter(filterAccountMigrated));

  const migrated = useMemo(() => {
    const oldVal = migratedRef.current;
    const newVal = accounts.filter(filterAccountMigrated);
    const result = intersectionArray(oldVal, newVal);

    migratedRef.current = result;

    return result;
  }, [accounts]);

  const canMigrate = useMemo(
    () => accounts
      .filter(filterAccountCanMigrate)
      .filter((acc) => !migrated.find((item) => item.address === acc.address))
    , [accounts, migrated]
  );

  const needMigrate = useMemo(
    () => canMigrate.filter((acc) => !acc.isMasterPassword)
    , [canMigrate]
  );

  const onBack = useCallback(() => {
    if (step === 'Migrate') {
      setStep('Introduction');
    } else {
      goHome();
    }
  }, [goHome, step]);

  const onUpdate: FormCallbacks<MigratePasswordFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisable(error || empty);
  }, []);

  const convertError = useCallback((error: string) => {
    if (error === 'Unable to decode using the supplied passphrase') {
      return t('Wrong password');
    } else {
      return t(error);
    }
  }, [t]);

  const onSubmit: FormCallbacks<MigratePasswordFormState>['onFinish'] = useCallback((values: MigratePasswordFormState) => {
    const password = values[FormFieldName.PASSWORD];

    if (currentAccount?.address && password) {
      setLoading(true);
      setTimeout(() => {
        keyringMigrateMasterPassword({
          address: currentAccount.address,
          password: password
        }).then((res) => {
          if (!res?.status) {
            form.setFields([{ name: FormFieldName.PASSWORD, errors: [convertError(res.errors[0])] }]);
            selectPassword();
            setIsError(true);
          } else {
            setIsError(false);
          }
        }).catch((e: Error) => {
          setIsError(true);
          form.setFields([{ name: FormFieldName.PASSWORD, errors: [convertError(e.message)] }]);
          selectPassword();
        }).finally(() => {
          setLoading(false);
        });
      }, 500);
    }
  }, [currentAccount?.address, form, convertError]);

  const title = useMemo((): string => {
    const migrated = canMigrate.length - needMigrate.length;

    switch (step) {
      case 'Introduction':
        return t<string>('Apply master password');
      case 'Done':
        return t<string>('Successful');
      case 'Migrate':
        return `${String(migrated + 1).padStart(2, '0')}/${String(canMigrate.length).padStart(2, '0')}`;
      default:
        return '';
    }
  }, [t, step, needMigrate.length, canMigrate.length]);

  const footerButton = useMemo((): ButtonProps => {
    switch (step) {
      case 'Introduction':
        return {
          children: t('Apply master password now'),
          onClick: () => {
            checkUnlock().then(() => {
              if (isWebUI) {
                if (needMigrate.length) {
                  setStep('Migrate');
                }

                return;
              }

              setStep(needMigrate.length ? 'Migrate' : 'Done');
            }).catch(() => {
              // User cancel unlock
            });
          },
          icon: nextIcon
        };
      case 'Done':
        return {
          children: t('Finish'),
          onClick: () => {
            goHome();
          },
          icon: finishIcon
        };
      case 'Migrate':
        return {
          children: t('Next'),
          onClick: () => {
            form.submit();
          },
          icon: nextIcon
        };
    }
  }, [checkUnlock, form, goHome, isWebUI, needMigrate.length, step, t]);

  const onDelete = useCallback(() => {
    if (currentAccount?.address) {
      deleteAccountAction()
        .then(() => {
          setDeleting(true);
          setTimeout(() => {
            forgetAccount(currentAccount.address, true)
              .then(() => {
                setIsError(false);
              })
              .catch((e: Error) => {
                notify({
                  message: e.message,
                  type: 'error'
                });
              })
              .finally(() => {
                setDeleting(false);
              });
          }, 500);
        })
        .catch((e: Error) => {
          if (e) {
            notify({
              message: e.message,
              type: 'error'
            });
          }
        });
    }
  }, [currentAccount?.address, deleteAccountAction, notify]);

  useEffect(() => {
    setStep((prevState) => {
      if (prevState !== 'Introduction') {
        if (isWebUI) {
          return needMigrate.length ? 'Migrate' : prevState;
        }

        return needMigrate.length ? 'Migrate' : 'Done';
      } else {
        return 'Introduction';
      }
    });
  }, [needMigrate.length, deleting, isWebUI]);

  useEffect(() => {
    if (step === 'Migrate') {
      setCurrentAccount((prevState) => {
        if (deleting) {
          return prevState;
        }

        if (!prevState) {
          form.resetFields();
          setIsDisable(true);

          return needMigrate[0];
        } else {
          const exists = needMigrate.find((acc) => acc.address === prevState.address);

          form.resetFields();
          setIsDisable(true);

          if (exists) {
            return prevState;
          } else {
            return needMigrate[0];
          }
        }
      });

      focusPassword();
    } else {
      setIsError(false);
      form.resetFields();
      setIsDisable(true);
    }
  }, [form, needMigrate, deleting, step]);

  useEffect(() => {
    if (step !== 'Introduction' && isWebUI && !needMigrate.length) {
      navigate('/create-done', { state: { accounts: canMigrate } as CreateDoneParam });
    }
  }, [isWebUI, navigate, canMigrate, needMigrate.length, step]);

  return (
    <PageWrapper
      animateOnce={true}
      className={CN(className)}
    >
      <Layout.Base
        {...(!isWebUI
          ? {
            showBackButton: true,
            subHeaderPaddingVertical: true,
            showSubHeader: true,
            subHeaderCenter: true,
            subHeaderBackground: 'transparent'
          }
          : {})}
        disableBack={loading}
        onBack={onBack}
        showBackButton={step !== 'Introduction'}
        subHeaderLeft={step === 'Done' && <CloseIcon />}
        title={title}
      >
        <div className={CN('__screen-body', {
          '__web-ui': isWebUI
        })}
        >
          {step === 'Introduction' && <IntroductionMigratePassword className={'__introduction-container'} />}
          {!isWebUI && step === 'Done' && (
            <MigrateDone
              accounts={canMigrate}
              className={'__migrate-done-container'}
            />
          )}
          {step === 'Migrate' && currentAccount && (
            <div className='body-container'>
              <div className='account-avatar'>
                <SwAvatar
                  size={token.sizeLG * 4}
                  theme={currentAccount.type === 'ethereum' ? 'ethereum' : 'polkadot'}
                  value={currentAccount.address}
                />
              </div>
              <Form
                form={form}
                initialValues={{
                  [FormFieldName.PASSWORD]: ''
                }}
                name={formName}
                onFieldsChange={onUpdate}
                onFinish={onSubmit}
              >
                <Form.Item>
                  <Field
                    content={currentAccount.name || ''}
                    label={t('Account name')}
                    placeholder={t('Account name')}
                  />
                </Form.Item>
                <Form.Item>
                  <Field
                    content={toShort(currentAccount.address || '', 15, 17)}
                    label={t('Account address')}
                    placeholder={t('Account address')}
                  />
                </Form.Item>
                <Form.Item
                  name={FormFieldName.PASSWORD}
                  rules={[
                    {
                      message: t('Current password is required'),
                      required: true
                    }
                  ]}
                  statusHelpAsTooltip={isWebUI}
                >
                  <Input.Password
                    label={t('Current password')}
                    type='password'
                  />
                </Form.Item>
                {
                  isError && (
                    <Form.Item
                      className='form-item-button'
                    >
                      <Button
                        icon={removeIcon}
                        loading={deleting}
                        onClick={onDelete}
                        size='xs'
                        type='ghost'
                      >
                        {t('Remove this account')}
                      </Button>
                    </Form.Item>
                  )
                }
              </Form>
            </div>
          )}

          <Button
            {...footerButton}
            block={true}
            className={'__footer-button'}
            disabled ={step === 'Migrate' && (isDisabled || deleting)}
            loading={step === 'Migrate' && loading}
          />
        </div>
      </Layout.Base>
    </PageWrapper>
  );
};

const ApplyMasterPassword = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__screen-body': {
      maxWidth: '416px',
      width: '100%',
      margin: '0 auto',
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.body-container': {
      '.account-avatar': {
        marginTop: token.margin,
        marginBottom: token.margin * 2,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
      },

      '.ant-field-content-wrapper': {
        '.ant-field-content': {
          color: token.colorTextDescription
        }
      },

      '.ant-form-item': {
        marginBottom: token.marginXS
      },

      '.form-item-no-error': {
        '.ant-form-item-explain': {
          display: 'none'
        }
      },

      '.form-item-button': {
        paddingTop: token.marginXXS,
        marginBottom: 0,

        '.ant-form-item-control-input-content': {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center'
        }
      }
    },

    '.__screen-body.__web-ui': {
      '.__introduction-container': {
        paddingBottom: token.padding
      },

      '.__migrate-done-container': {
        paddingBottom: token.padding
      },

      '.__footer-button': {
        marginTop: token.margin
      }
    }
  };
});

export default ApplyMasterPassword;
