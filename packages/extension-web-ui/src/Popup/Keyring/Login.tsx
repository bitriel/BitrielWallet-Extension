// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper, ResetWalletModal } from '@bitriel/extension-web-ui/components';
import SocialGroup from '@bitriel/extension-web-ui/components/SocialGroup';
import { RESET_WALLET_MODAL } from '@bitriel/extension-web-ui/constants';
import { ScreenContext } from '@bitriel/extension-web-ui/contexts/ScreenContext';
import useTranslation from '@bitriel/extension-web-ui/hooks/common/useTranslation';
import useUILock from '@bitriel/extension-web-ui/hooks/common/useUILock';
import useFocusById from '@bitriel/extension-web-ui/hooks/form/useFocusById';
import { keyringUnlock } from '@bitriel/extension-web-ui/messaging';
import { ThemeProps } from '@bitriel/extension-web-ui/types';
import { FormCallbacks, FormFieldData } from '@bitriel/extension-web-ui/types/form';
import { simpleCheckForm } from '@bitriel/extension-web-ui/utils/form/form';
import { Button, Form, Image, Input, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps

enum FormFieldName {
  PASSWORD = 'password'
}

interface LoginFormState {
  [FormFieldName.PASSWORD]: string;
}

const passwordInputId = 'login-password';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { activeModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);

  const [form] = Form.useForm<LoginFormState>();

  const [loading, setLoading] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const { unlock } = useUILock();

  const onUpdate: FormCallbacks<LoginFormState>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisable(error || empty);
  }, []);

  const onError = useCallback((error: string) => {
    form.setFields([{ name: FormFieldName.PASSWORD, errors: [error] }]);
    (document.getElementById(passwordInputId) as HTMLInputElement)?.select();
  }, [form]);

  const onSubmit: FormCallbacks<LoginFormState>['onFinish'] = useCallback((values: LoginFormState) => {
    setLoading(true);
    setTimeout(() => {
      keyringUnlock({
        password: values[FormFieldName.PASSWORD]
      })
        .then((data) => {
          if (!data.status) {
            onError(t(data.errors[0]));
          } else {
            unlock();
          }
        })
        .catch((e: Error) => {
          onError(e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);
  }, [onError, unlock, t]);

  const onReset = useCallback(() => {
    activeModal(RESET_WALLET_MODAL);
  }, [activeModal]);

  useFocusById(passwordInputId);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.Base>
        <div className='bg-image' />
        <div className='body-container'>
          <div className='logo-container'>
            <Image
              src='/images/subwallet/gradient-logo.png'
              width={80}
            />
          </div>
          <div className='title'>
            {t('Welcome back!')}
          </div>
          <div className='sub-title'>
            {t('Enter your password to unlock wallet')}
          </div>
          <Form
            form={form}
            initialValues={{ [FormFieldName.PASSWORD]: '' }}
            onFieldsChange={onUpdate}
            onFinish={onSubmit}
          >
            <Form.Item
              name={FormFieldName.PASSWORD}
              rules={[
                {
                  message: t('Password is required'),
                  required: true
                }
              ]}
              statusHelpAsTooltip={isWebUI}
            >
              <Input.Password
                containerClassName='password-input'
                id={passwordInputId}
                placeholder={t('Password')}
              />
            </Form.Item>
            <Form.Item>
              <Button
                block={true}
                disabled={isDisable}
                htmlType='submit'
                loading={loading}
              >
                {t('Unlock')}
              </Button>
            </Form.Item>
            <Form.Item>
              <div
                className='forgot-password'
                onClick={onReset}
              >
                {t('Don’t remember your password?')}
              </div>
            </Form.Item>
          </Form>
          <ResetWalletModal />
        </div>
        <SocialGroup className={'social-group'} />
      </Layout.Base>
    </PageWrapper>
  );
};

const Login = styled(Component)<Props>(({ theme }: Props) => {
  const { extendToken, token } = theme;

  return {
    position: 'relative',

    '.bg-image': {
      backgroundImage: 'url("./images/subwallet/welcome-background.png")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top',
      backgroundSize: 'contain',
      height: '100%',
      position: 'absolute',
      width: '100%',
      left: 0,
      top: 0
    },

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.body-container': {
      padding: `0 ${token.padding}px`,
      textAlign: 'center',
      opacity: 0.999,
      width: extendToken.oneColumnWidth,
      maxWidth: '100%',
      margin: 'auto',

      '.logo-container': {
        marginTop: 0,
        color: token.colorTextBase
      },

      '.title': {
        marginTop: token.margin,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        color: token.colorTextBase
      },

      '.sub-title': {
        marginTop: token.marginXS,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight3
      },

      '.password-input': {
        marginTop: 62
      },

      '.forgot-password': {
        cursor: 'pointer',
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        color: token.colorTextLight4,
        marginTop: 27
      }
    },

    '.social-group': {
      marginTop: 0,
      paddingTop: 40,
      textAlign: 'center'
    },

    '.web-ui-enable &': {
      '.bg-image': {
        display: 'none'
      },

      '.password-input': {
        marginTop: 36
      },

      '.forgot-password': {
        marginTop: 0
      }
    }
  };
});

export default Login;
