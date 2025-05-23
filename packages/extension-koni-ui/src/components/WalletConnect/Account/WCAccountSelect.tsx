// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@bitriel/extension-base/constants';
import { AccountChainType, AccountJson } from '@bitriel/extension-base/types';
import { isSameAddress } from '@bitriel/extension-base/utils';
import { AccountItemWithProxyAvatar, AccountProxySelectorAllItem, AlertBox } from '@bitriel/extension-koni-ui/components';
import { useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { searchAccountFunction } from '@bitriel/extension-koni-ui/utils';
import { Button, Icon, ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import { SwListSectionRef } from '@subwallet/react-ui/es/sw-list';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { GeneralEmptyList } from '../../EmptyList';
import WCAccountInput from './WCAccountInput';

interface Props extends ThemeProps {
  id: string;
  namespace: string;
  selectedAccounts: string[];
  appliedAccounts: string[];
  availableAccounts: AccountJson[];
  accountType: AccountChainType;
  onSelectAccount: (account: string, applyImmediately?: boolean) => VoidFunction;
  useModal: boolean;
  onApply: () => void;
  onCancel: () => void;
}

const renderEmpty = () => <GeneralEmptyList />;

const Component: React.FC<Props> = (props: Props) => {
  const { accountType, appliedAccounts, availableAccounts, className, id, onApply, onCancel, onSelectAccount, selectedAccounts, useModal } = props;

  const { t } = useTranslation();

  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);

  const sectionRef = useRef<SwListSectionRef>(null);

  const isActive = checkActive(id);

  const noAccountTitle = useMemo(() => {
    switch (accountType) {
      case AccountChainType.SUBSTRATE:
        return t('No available Substrate account');
      case AccountChainType.ETHEREUM:
        return t('No available EVM account');
      default:
        return t('No available account');
    }
  }, [accountType, t]);

  const noAccountDescription = useMemo(() => {
    switch (accountType) {
      case AccountChainType.SUBSTRATE:
        return t("You don't have any Substrate account to connect. Please create one or skip this step by hitting Cancel.");
      case AccountChainType.ETHEREUM:
        return t("You don't have any EVM account to connect. Please create one or skip this step by hitting Cancel.");
      default:
        return t("You don't have any account to connect. Please create one or skip this step by hitting Cancel.");
    }
  }, [accountType, t]);

  const basicProxyAccounts = useMemo(() => {
    return availableAccounts.map(({ name, proxyId }) => ({ name, id: proxyId || '' }));
  }, [availableAccounts]);

  const onOpenModal = useCallback(() => {
    activeModal(id);
  }, [activeModal, id]);

  const onCloseModal = useCallback(() => {
    inactiveModal(id);
    onCancel();
  }, [inactiveModal, id, onCancel]);

  const _onApply = useCallback(() => {
    inactiveModal(id);
    onApply();
  }, [id, inactiveModal, onApply]);

  const renderItem = useCallback((item: AccountJson) => {
    const selected = !!selectedAccounts.find((address) => isSameAddress(address, item.address));

    return (
      <AccountItemWithProxyAvatar
        account={item}
        accountName={item.name}
        className={'__account-proxy-item'}
        isSelected={selected}
        key={item.address}
        onClick={onSelectAccount(item.address, false)}
        showAccountNameFallback={false}
        showUnselectIcon={true}
      />
    );
  }, [onSelectAccount, selectedAccounts]);

  useEffect(() => {
    if (!isActive) {
      sectionRef.current?.setSearchValue('');
    }
  }, [isActive]);

  return (
    <div className={CN(className)}>
      {
        !availableAccounts.length
          ? (
            <AlertBox
              description={noAccountDescription}
              title={noAccountTitle}
              type='warning'
            />
          )
          : useModal
            ? (
              <>
                <WCAccountInput
                  accounts={availableAccounts}
                  onClick={onOpenModal}
                  selected={appliedAccounts}
                />
                <SwModal
                  className={CN(className, 'account-modal')}
                  footer={(
                    <Button
                      block
                      disabled={!selectedAccounts.length}
                      icon={(
                        <Icon
                          phosphorIcon={CheckCircle}
                          weight={'fill'}
                        />
                      )}
                      onClick={_onApply}
                    >
                      {t('Apply {{number}} account{{s}}', { replace: { number: selectedAccounts.length, s: selectedAccounts.length > 1 ? 's' : '' } })}
                    </Button>
                  )}
                  id={id}
                  onCancel={onCloseModal}
                  title={t('Select account')}
                >
                  <SwList.Section
                    className='account-list'
                    enableSearchInput={true}
                    list={availableAccounts}
                    ref={sectionRef}
                    renderItem={renderItem}
                    renderWhenEmpty={renderEmpty}
                    rowGap='var(--row-gap)'
                    searchFunction={searchAccountFunction}
                    searchMinCharactersCount={2}
                    searchPlaceholder={t<string>('Search account')}
                  />
                </SwModal>
              </>
            )
            : (
              <>
                <div className={CN('account-list', 'no-modal')}>
                  {availableAccounts.length > 1 && (
                    <AccountProxySelectorAllItem
                      accountProxies={basicProxyAccounts}
                      className={'all-account-selection'}
                      isSelected={selectedAccounts.length === availableAccounts.length}
                      onClick={onSelectAccount(ALL_ACCOUNT_KEY, true)}
                      showUnSelectedIcon
                    />
                  )}
                  {availableAccounts.map((item) => {
                    const selected = !!selectedAccounts.find((address) => isSameAddress(address, item.address));

                    return (
                      <AccountItemWithProxyAvatar
                        account={item}
                        accountName={item.name}
                        className={'__account-proxy-item'}
                        isSelected={selected}
                        key={item.address}
                        onClick={onSelectAccount(item.address, true)}
                        showAccountNameFallback={false}
                        showUnselectIcon
                      />
                    );
                  })}
                </div>
                <div className={CN(className, 'additional-content')}>
                  {t('Make sure you trust this site before connecting')}
                </div>
              </>
            )
      }
    </div>
  );
};

const WCAccountSelect = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--row-gap': `${token.sizeXS}px`,

    '.account-list.no-modal': {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--row-gap)'
    },

    '&.account-modal': {
      '.ant-sw-modal-body': {
        padding: `${token.padding}px 0 ${token.padding}px`,
        flexDirection: 'column',
        display: 'flex'
      }
    },

    '.additional-content': {
      padding: token.padding,
      paddingBottom: 0,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextTertiary
    },

    '.all-account-selection': {
      '.__item-middle-part': {
        textAlign: 'start',
        fontSize: token.fontSize
      }
    },

    '.account-list.no-modal .__account-proxy-item': {
      marginBottom: 0
    },

    '.__account-proxy-item': {
      marginBottom: token.marginXS,
      background: token.colorBgSecondary,

      '&:hover': {
        background: token.colorBgInput,
        '.__item-actions-overlay': {
          opacity: 0
        },
        '.-show-on-hover': {
          opacity: 1
        }
      }
    }
  };
});

export default WCAccountSelect;
