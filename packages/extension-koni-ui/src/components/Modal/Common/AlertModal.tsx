// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NotificationType } from '@bitriel/extension-base/background/KoniTypes';
import { AlertDialogProps, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Button, Icon, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Info, Warning, XCircle } from 'phosphor-react';
import { IconProps } from 'phosphor-react/src/lib';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & AlertDialogProps & {
  modalId: string
}

const alertTypeAndIconMap = {
  [NotificationType.INFO]: {
    icon: Info,
    weight: 'fill'
  },
  [NotificationType.WARNING]: {
    icon: Warning,
    weight: undefined
  },
  [NotificationType.ERROR]: {
    icon: XCircle,
    weight: 'fill'
  },
  [NotificationType.SUCCESS]: {
    icon: CheckCircle,
    weight: 'fill'
  }
};

const Component: React.FC<Props> = (props: Props) => {
  const { cancelButton,
    className,
    closable,
    cancelDisabled,
    content,
    modalId,
    subtitle,
    okButton,
    okLoading,
    title,
    maskClosable,
    onCancel,
    type = NotificationType.INFO } = props;

  const { inactiveModal } = useContext(ModalContext);

  const onDefaultCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal, modalId]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={closable}
        destroyOnClose={true}
        footer={
          <>
            {!!cancelButton &&
              <Button
                block={true}
                className={'__left-button'}
                disabled={cancelDisabled}
                icon={cancelButton.icon && (
                  <Icon
                    phosphorIcon={cancelButton.icon}
                    weight={cancelButton.iconWeight || 'fill'}
                  />
                )}
                onClick={cancelButton.onClick}
                schema={cancelButton.schema || 'secondary'}
              >
                {cancelButton.text}
              </Button>
            }
            <Button
              block={true}
              className={'__right-button'}
              icon={okButton.icon && (
                <Icon
                  phosphorIcon={okButton.icon}
                  weight={okButton.iconWeight || 'fill'}
                />
              )}
              loading={okLoading}
              onClick={okButton?.onClick}
              schema={okButton.schema}
            >
              {okButton.text}
            </Button>
          </>
        }
        id={modalId}
        maskClosable={maskClosable}
        onCancel={closable === false ? undefined : (onCancel || onDefaultCancel)}
        title={title}
      >
        <div className='__modal-content'>
          <div className={CN('__alert-icon', {
            '-info': type === NotificationType.INFO,
            '-success': type === NotificationType.SUCCESS,
            '-warning': type === NotificationType.WARNING,
            '-error': type === NotificationType.ERROR
          })}
          >
            <PageIcon
              color='var(--page-icon-color)'
              iconProps={{
                weight: alertTypeAndIconMap[type].weight as IconProps['weight'],
                phosphorIcon: alertTypeAndIconMap[type].icon
              }}
            />
          </div>

          {
            !!subtitle && (
              <div className={'__subtitle'}>{subtitle}</div>
            )
          }

          {content}
        </div>
      </SwModal>
    </>
  );
};

const AlertModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-modal-body': {
      paddingBottom: 0
    },

    '.ant-sw-modal-footer': {
      display: 'flex',
      borderTop: 0,
      gap: token.sizeXXS
    },

    '.ant-sw-header-center-part': {
      width: '100%',
      maxWidth: 292
    },

    '.__modal-content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextDescription,
      paddingTop: token.padding,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.__alert-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 20,

      '&.-info': {
        '--page-icon-color': token.geekblue
      },
      '&.-success': {
        '--page-icon-color': token.colorSuccess
      },
      '&.-warning': {
        '--page-icon-color': token.colorWarning
      },
      '&.-error': {
        '--page-icon-color': token.colorError
      }
    },

    '.__subtitle': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      marginBottom: 20
    }
  };
});

export default AlertModal;
