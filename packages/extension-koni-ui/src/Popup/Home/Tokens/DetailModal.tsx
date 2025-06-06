// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { APIItemState } from '@bitriel/extension-base/background/KoniTypes';
import { BalanceItem } from '@bitriel/extension-base/types';
import { AccountTokenBalanceItem, EmptyList, RadioGroup } from '@bitriel/extension-koni-ui/components';
import { useSelector } from '@bitriel/extension-koni-ui/hooks';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { TokenBalanceItemType } from '@bitriel/extension-koni-ui/types/balance';
import { isAccountAll } from '@bitriel/extension-koni-ui/utils';
import { Form, Icon, ModalContext, Number, SwModal } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowCircleLeft, Coins } from 'phosphor-react';
import React, { useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  id: string,
  onCancel: () => void,
  tokenBalanceMap: Record<string, TokenBalanceItemType>,
  currentTokenInfo?: {
    symbol: string;
    slug: string;
  }
}

type ItemType = {
  symbol: string,
  label: string,
  key: string,
  value: BigN
}

enum ViewValue {
  OVERVIEW = 'Overview',
  DETAIL = 'Detail'
}

interface ViewOption {
  label: string;
  value: ViewValue;
}

interface FormState {
  view: ViewValue
}

// todo: need to recheck account balance logic again
function Component ({ className = '', currentTokenInfo, id, onCancel, tokenBalanceMap }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const { checkActive } = useContext(ModalContext);

  const isActive = checkActive(id);

  const { accounts, currentAccountProxy, isAllAccount } = useSelector((state) => state.accountState);
  const { balanceMap } = useSelector((state) => state.balance);

  const [form] = Form.useForm<FormState>();

  const view = Form.useWatch('view', form);

  const defaultValues = useMemo((): FormState => ({
    view: ViewValue.OVERVIEW
  }), []);

  const viewOptions = useMemo((): ViewOption[] => {
    return [
      {
        label: t('Token Details'),
        value: ViewValue.OVERVIEW
      },
      {
        label: t('Account Details'),
        value: ViewValue.DETAIL
      }
    ];
  }, [t]);

  const items = useMemo((): ItemType[] => {
    const symbol = currentTokenInfo?.symbol || '';
    const balanceInfo = currentTokenInfo ? tokenBalanceMap[currentTokenInfo.slug] : undefined;

    const result: ItemType[] = [];

    result.push({
      key: 'transferable',
      symbol,
      label: t('Transferable'),
      value: balanceInfo ? balanceInfo.free.value : new BigN(0)
    });

    result.push({
      key: 'locked',
      symbol,
      label: t('Locked'),
      value: balanceInfo ? balanceInfo.locked.value : new BigN(0)
    });

    return result;
  }, [currentTokenInfo, t, tokenBalanceMap]);

  const accountItems = useMemo((): BalanceItem[] => {
    if (!currentAccountProxy || !currentTokenInfo?.slug) {
      return [];
    }

    const result: BalanceItem[] = [];

    const filterAccountId = (accountId: string) => {
      if (isAllAccount) {
        return !isAccountAll(accountId) && accounts.some((a) => a.address === accountId);
      } else {
        return currentAccountProxy.accounts.some((a) => a.address === accountId);
      }
    };

    for (const [accountId, info] of Object.entries(balanceMap)) {
      if (filterAccountId(accountId)) {
        const item = info[currentTokenInfo.slug];

        if (item && item.state === APIItemState.READY) {
          result.push(item);
        }
      }
    }

    return result.sort((a, b) => {
      const aTotal = new BigN(a.free).plus(BigN(a.locked));
      const bTotal = new BigN(b.free).plus(BigN(b.locked));

      return bTotal.minus(aTotal).toNumber();
    });
  }, [accounts, balanceMap, currentAccountProxy, currentTokenInfo?.slug, isAllAccount]);

  const symbol = currentTokenInfo?.symbol || '';

  const filteredItems = useMemo(() => {
    return accountItems.filter((item) => {
      return new BigN(item.free).plus(item.locked).gt(0);
    });
  }, [accountItems]);

  useEffect(() => {
    if (!isActive) {
      form?.resetFields();
    }
  }, [form, isActive]);

  return (
    <SwModal
      className={CN(className, { 'fix-height': isAllAccount })}
      id={id}
      onCancel={onCancel}
      title={t('Token details')}
    >
      <Form
        form={form}
        initialValues={defaultValues}
        name='token-detail-form'
      >
        <Form.Item
          hidden={!isAllAccount}
          name='view'
        >
          <RadioGroup
            optionType='button'
            options={viewOptions}
          />
        </Form.Item>
      </Form>
      <div className='content-container'>
        {
          view === ViewValue.OVERVIEW && (
            <>
              <div className={'__container'}>
                {items.map((item) => (
                  <div
                    className={'__row'}
                    key={item.key}
                  >
                    <div className={'__label'}>{item.label}</div>

                    <Number
                      className={'__value'}
                      decimal={0}
                      decimalOpacity={0.45}
                      intOpacity={0.85}
                      size={14}
                      suffix={item.symbol}
                      unitOpacity={0.85}
                      value={item.value}
                    />
                  </div>
                ))}
              </div>
            </>
          )
        }
        {
          view === ViewValue.DETAIL && (
            <>
              {filteredItems.length
                ? (filteredItems.map((item) => (
                  <AccountTokenBalanceItem
                    item={item}
                    key={item.address}
                  />
                )))
                : (
                  <>
                    <EmptyList
                      buttonProps={{
                        icon: <Icon
                          phosphorIcon={ArrowCircleLeft}
                          weight={'fill'}
                        />,
                        onClick: onCancel,
                        size: 'xs',
                        shape: 'circle',
                        children: t('Back to home')
                      }}
                      className='__empty-list'
                      emptyMessage={t('Switch to another token to see account balance')}
                      emptyTitle={t('No account with {{symbol}} balance found', {
                        replace: {
                          symbol: symbol
                        }
                      })}
                      key='empty-list'
                      phosphorIcon={Coins}
                    />
                  </>
                )}
            </>
          )
        }
      </div>
    </SwModal>
  );
}

export const DetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.fix-height': {
      '.ant-sw-modal-body': {
        height: 470
      }
    },

    '.ant-sw-modal-body': {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },

    '.content-container': {
      overflow: 'auto',
      flex: 1
    },

    '.__container': {
      borderRadius: token.borderRadiusLG,
      backgroundColor: token.colorBgSecondary,
      padding: '12px 12px 4px'
    },

    '.__explorer-link': {
      marginTop: token.margin
    },

    '.__row': {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: token.marginSM
    },

    '.__label': {
      paddingRight: token.paddingSM
    }
  });
});
