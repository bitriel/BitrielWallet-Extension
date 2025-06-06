// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout, PageWrapper } from '@bitriel/extension-web-ui/components';
import { AddressInput } from '@bitriel/extension-web-ui/components/Field/AddressInput';
import CloseIcon from '@bitriel/extension-web-ui/components/Icon/CloseIcon';
import { ATTACH_ACCOUNT_MODAL } from '@bitriel/extension-web-ui/constants/modal';
import { ScreenContext } from '@bitriel/extension-web-ui/contexts/ScreenContext';
import useCompleteCreateAccount from '@bitriel/extension-web-ui/hooks/account/useCompleteCreateAccount';
import useGetDefaultAccountName from '@bitriel/extension-web-ui/hooks/account/useGetDefaultAccountName';
import useGoBackFromCreateAccount from '@bitriel/extension-web-ui/hooks/account/useGoBackFromCreateAccount';
import useFocusById from '@bitriel/extension-web-ui/hooks/form/useFocusById';
import useAutoNavigateToCreatePassword from '@bitriel/extension-web-ui/hooks/router/useAutoNavigateToCreatePassword';
import useDefaultNavigate from '@bitriel/extension-web-ui/hooks/router/useDefaultNavigate';
import { createAccountExternalV2 } from '@bitriel/extension-web-ui/messaging';
import { RootState } from '@bitriel/extension-web-ui/stores';
import { ThemeProps } from '@bitriel/extension-web-ui/types';
import { convertFieldToObject, simpleCheckForm } from '@bitriel/extension-web-ui/utils/form/form';
import { readOnlyScan } from '@bitriel/extension-web-ui/utils/scanner/attach';
import { Form, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { Eye } from 'phosphor-react';
import { Callbacks, FieldData, RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps;

interface ReadOnlyAccountInput {
  address?: string;
}

const FooterIcon = (
  <Icon
    phosphorIcon={Eye}
    weight='fill'
  />
);

const modalId = 'attach-read-only-scanner-modal';
const formName = 'attach-read-only-form';
const fieldName = 'address';

const Component: React.FC<Props> = ({ className }: Props) => {
  useAutoNavigateToCreatePassword();

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  const onComplete = useCompleteCreateAccount();
  const accountName = useGetDefaultAccountName();

  const accounts = useSelector((root: RootState) => root.accountState.accounts);

  const onBack = useGoBackFromCreateAccount(ATTACH_ACCOUNT_MODAL);

  const [form] = Form.useForm<ReadOnlyAccountInput>();

  const [reformatAddress, setReformatAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEthereum, setIsEthereum] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const { isWebUI } = useContext(ScreenContext);

  const handleResult = useCallback((val: string) => {
    const result = readOnlyScan(val);

    if (result) {
      setReformatAddress(result.content);
      setIsEthereum(result.isEthereum);
    }
  }, []);

  const onFieldsChange: Callbacks<ReadOnlyAccountInput>['onFieldsChange'] = useCallback((changes: FieldData[], allFields: FieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisable(error || empty);

    const changeMap = convertFieldToObject<ReadOnlyAccountInput>(changes);

    if (changeMap.address) {
      handleResult(changeMap.address);
    }
  }, [handleResult]);

  const accountAddressValidator = useCallback((rule: RuleObject, value: string) => {
    const result = readOnlyScan(value);

    if (result) {
      // For each account, check if the address already exists return promise reject
      for (const account of accounts) {
        if (account.address === result.content) {
          setReformatAddress('');

          return Promise.reject(t('Account name already in use'));
        }
      }
    } else {
      setReformatAddress('');

      if (value !== '') {
        return Promise.reject(t('Invalid address'));
      }
    }

    return Promise.resolve();
  }, [accounts, t]);

  const onSubmit = useCallback(() => {
    setLoading(true);

    if (reformatAddress) {
      createAccountExternalV2({
        name: accountName,
        address: reformatAddress,
        genesisHash: '',
        isEthereum: isEthereum,
        isAllowed: true,
        isReadOnly: true
      })
        .then((errors) => {
          if (errors.length) {
            form.setFields([{ name: fieldName, errors: errors.map((e) => e.message) }]);
          } else {
            onComplete();
          }
        })
        .catch((error: Error) => {
          form.setFields([{ name: fieldName, errors: [error.message] }]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [form, reformatAddress, accountName, isEthereum, onComplete]);

  useFocusById(modalId);

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        className='web-single-column web-cancel-fill-height'
        onBack={onBack}
        rightFooterButton={{
          children: t('Attach watch-only account'),
          icon: FooterIcon,
          disabled: isDisable,
          onClick: onSubmit,
          loading: loading
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t<string>('Attach watch-only account')}
      >
        <div className={CN('container')}>
          <div className='description'>
            {t('Track the activity of any wallet without a private key')}
          </div>
          <div className='page-icon'>
            <PageIcon
              color='var(--page-icon-color)'
              iconProps={{
                weight: 'fill',
                phosphorIcon: Eye
              }}
            />
          </div>
          <Form
            form={form}
            initialValues={{ address: '' }}
            name={formName}
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            <Form.Item
              name={fieldName}
              rules={[
                {
                  message: t('Account address is required'),
                  required: true
                },
                {
                  validator: accountAddressValidator
                }
              ]}
              statusHelpAsTooltip={isWebUI}
            >
              <AddressInput
                id={modalId}
                placeholder={t('Please type or paste account address')}
                showScanner={true}
              />
            </Form.Item>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const AttachReadOnly = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.container': {
      padding: token.padding,

      '.web-ui-enable &': {
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: -16
      }
    },

    '.description': {
      padding: `0 ${token.padding}px`,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.controlHeightLG,
      marginBottom: token.sizeXXL,
      '--page-icon-color': token.colorSecondary
    }
  };
});

export default AttachReadOnly;
