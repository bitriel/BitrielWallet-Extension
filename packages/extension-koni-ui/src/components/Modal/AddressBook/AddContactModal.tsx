// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxyAvatar } from '@bitriel/extension-koni-ui/components';
import { ADD_ADDRESS_BOOK_MODAL } from '@bitriel/extension-koni-ui/constants';
import { useNotification, useSelector } from '@bitriel/extension-koni-ui/hooks';
import { editContactAddress } from '@bitriel/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { simpleCheckForm, toShort } from '@bitriel/extension-koni-ui/utils';
import { isAddress } from '@subwallet/keyring';
import { Button, Form, Icon, Input, ModalContext, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { PlusCircle } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

enum FormFieldName {
  ADDRESS = 'address',
  NAME = 'name'
}

interface AddContactFormProps {
  [FormFieldName.ADDRESS]: string;
  [FormFieldName.NAME]: string;
}

const modalId = ADD_ADDRESS_BOOK_MODAL;

const defaultFormValues: AddContactFormProps = {
  [FormFieldName.ADDRESS]: '',
  [FormFieldName.NAME]: ''
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const notification = useNotification();

  const { checkActive, inactiveModal } = useContext(ModalContext);
  const isActive = checkActive(modalId);

  const { contacts } = useSelector((state) => state.accountState);

  const [form] = Form.useForm<AddContactFormProps>();

  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  const address = Form.useWatch(FormFieldName.ADDRESS, form);

  const existNames = useMemo(() => contacts.map((contact) => (contact.name || '').trimStart().trimEnd()), [contacts]);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  const addressValidator = useCallback((rule: RuleObject, address: string): Promise<void> => {
    if (!address) {
      return Promise.reject(new Error(t('Contact address is required')));
    }

    if (!isAddress(address)) {
      return Promise.reject(new Error(t('Invalid contact address')));
    }

    return Promise.resolve();
  }, [t]);

  const nameValidator = useCallback((rule: RuleObject, name: string): Promise<void> => {
    if (!name) {
      return Promise.reject(new Error(t('Contact name is required')));
    }

    if (existNames.includes(name)) {
      return Promise.reject(new Error(t('Contact name must be unique')));
    }

    return Promise.resolve();
  }, [existNames, t]);

  const onFieldsChange: FormCallbacks<AddContactFormProps>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { empty, error } = simpleCheckForm(allFields);

    setIsDisabled(empty || error);
  }, []);

  const onSubmit: FormCallbacks<AddContactFormProps>['onFinish'] = useCallback((values: AddContactFormProps) => {
    const { [FormFieldName.ADDRESS]: address, [FormFieldName.NAME]: _name } = values;

    const name = _name.trimStart().trimEnd();

    setLoading(true);

    setTimeout(() => {
      editContactAddress(address, name)
        .then(() => {
          inactiveModal(modalId);
        })
        .catch((e: Error) => {
          notification({
            message: e.message,
            type: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [inactiveModal, notification]);

  useEffect(() => {
    if (!isActive) {
      form.resetFields();
    }
  }, [form, isActive]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      maskClosable={!loading}
      onCancel={onCancel}
      title={t('Add contact')}
    >
      <Form
        className='form-space-sm'
        form={form}
        initialValues={defaultFormValues}
        name='add-contact-form'
        onFieldsChange={onFieldsChange}
        onFinish={onSubmit}
      >
        <Form.Item
          name={FormFieldName.NAME}
          rules={[
            {
              transform: (value: string) => value.trimStart().trimEnd(),
              validator: nameValidator
            }
          ]}
          statusHelpAsTooltip={true}
        >
          <Input
            label={t('Contact name')}
            prefix={(
              <AccountProxyAvatar
                className={'__account-avatar'}
                size={20}
                value={address}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          name={FormFieldName.ADDRESS}
          rules={[
            {
              validator: addressValidator
            }
          ]}
          statusHelpAsTooltip={true}
        >
          <Input
            className='address-input'
            label={t('Contact address')}
            prefix={
              address && isAddress(address) && (
                <div className={'__overlay'}>
                  <div className={'__address common-text'}>
                    {toShort(address, 12, 12)}
                  </div>
                </div>
              )
            }
          />
        </Form.Item>
        <Form.Item
          className='submit-item'
        >
          <Button
            block={true}
            disabled={isDisabled}
            htmlType='submit'
            icon={(
              <Icon
                phosphorIcon={PlusCircle}
                weight='fill'
              />
            )}
            loading={loading}
          >
            {t('Add contact')}
          </Button>
        </Form.Item>
      </Form>
    </SwModal>
  );
};

const AddContactModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

    '.__overlay': {
      position: 'absolute',
      backgroundColor: token.colorBgSecondary,
      top: 0,
      left: 2,
      bottom: 2,
      right: 2,
      borderRadius: token.borderRadiusLG,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: token.paddingSM,
      paddingRight: 84,
      whiteSpace: 'nowrap'
    },

    '.address-input': {
      '.ant-input-affix-wrapper': {
        '.ant-input-prefix': {
          paddingRight: 0
        }
      },

      '&:has(input:focus), &.-status-error': {
        '.__overlay': {
          pointerEvents: 'none',
          opacity: 0
        }
      }
    },

    '.ant-form-item.submit-item': {
      marginBottom: 0
    }
  };
});

export default AddContactModal;
