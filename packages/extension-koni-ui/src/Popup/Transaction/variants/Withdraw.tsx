// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@bitriel/chain-list/types';
import { AmountData, ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@bitriel/extension-base/services/earning-service/constants';
import { getAstarWithdrawable } from '@bitriel/extension-base/services/earning-service/handlers/native-staking/astar';
import { AccountJson, RequestYieldWithdrawal, UnstakingInfo, UnstakingStatus, YieldPoolType, YieldPositionInfo } from '@bitriel/extension-base/types';
import { isSameAddress } from '@bitriel/extension-base/utils';
import { AccountSelector, HiddenInput, MetaInfo } from '@bitriel/extension-koni-ui/components';
import { MktCampaignModalContext } from '@bitriel/extension-koni-ui/contexts/MktCampaignModalContext';
import { useGetChainAssetInfo, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useTransactionContext, useWatchTransaction, useYieldPositionDetail } from '@bitriel/extension-koni-ui/hooks';
import useGetConfirmationByScreen from '@bitriel/extension-koni-ui/hooks/campaign/useGetConfirmationByScreen';
import { yieldSubmitStakingWithdrawal } from '@bitriel/extension-koni-ui/messaging';
import { accountFilterFunc } from '@bitriel/extension-koni-ui/Popup/Transaction/helper';
import { FormCallbacks, FormFieldData, ThemeProps, WithdrawParams } from '@bitriel/extension-koni-ui/types';
import { convertFieldToObject, isAccountAll, simpleCheckForm } from '@bitriel/extension-koni-ui/utils';
import { Button, Form, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, XCircle } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { EarnOutlet, FreeBalance, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const hideFields: Array<keyof WithdrawParams> = ['chain', 'asset', 'slug'];
const validateFields: Array<keyof WithdrawParams> = ['from'];

const filterAccount = (
  chainInfoMap: Record<string, _ChainInfo>,
  allPositionInfos: YieldPositionInfo[],
  poolType: YieldPoolType,
  poolChain?: string
): ((account: AccountJson) => boolean) => {
  return (account: AccountJson): boolean => {
    const nomination = allPositionInfos.find((data) => isSameAddress(data.address, account.address));

    return (
      (nomination
        ? nomination.unstakings.filter((data) => data.status === UnstakingStatus.CLAIMABLE).length > 0
        : false) && accountFilterFunc(chainInfoMap, poolType, poolChain)(account)
    );
  };
};

const Component = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mktCampaignModalContext = useContext(MktCampaignModalContext);
  const { defaultData, persistData } = useTransactionContext<WithdrawParams>();
  const { slug } = defaultData;

  const [form] = Form.useForm<WithdrawParams>();
  const formDefault = useMemo((): WithdrawParams => ({ ...defaultData }), [defaultData]);
  const { getCurrentConfirmation, renderConfirmationButtons } = useGetConfirmationByScreen('withdraw');
  const { accounts, isAllAccount } = useSelector((state) => state.accountState);
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { poolInfoMap } = useSelector((state) => state.earning);

  const [isDisable, setIsDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isBalanceReady, setIsBalanceReady] = useState(true);

  const chainValue = useWatchTransaction('chain', form, defaultData);
  const fromValue = useWatchTransaction('from', form, defaultData);

  const { list: allPositionInfos } = useYieldPositionDetail(slug);
  const { list: yieldPositions } = useYieldPositionDetail(slug, fromValue);
  const yieldPosition = yieldPositions[0];
  const type = yieldPosition.type;

  const poolInfo = useMemo(() => poolInfoMap[slug], [poolInfoMap, slug]);
  const stakingChain = useMemo(() => poolInfo?.chain || '', [poolInfo?.chain]);

  const inputAsset = useGetChainAssetInfo(poolInfo.metadata.inputAsset);
  const decimals = inputAsset?.decimals || 0;
  const symbol = inputAsset?.symbol || '';
  const poolChain = poolInfo?.chain || '';
  const networkPrefix = chainInfoMap[poolChain]?.substrateInfo?.addressPrefix;

  const currentConfirmation = useMemo(() => {
    if (slug) {
      return getCurrentConfirmation([slug]);
    } else {
      return undefined;
    }
  }, [getCurrentConfirmation, slug]);

  const goHome = useCallback(() => {
    navigate('/home/earning');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<WithdrawParams>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    // TODO: field change
    const { empty, error } = simpleCheckForm(allFields, ['--asset']);

    const values = convertFieldToObject<WithdrawParams>(allFields);

    setIsDisable(empty || error);
    persistData(values);
  }, [persistData]);

  const handleDataForInsufficientAlert = useCallback(
    (estimateFee: AmountData) => {
      return {
        chainName: chainInfoMap[chainValue]?.name || '',
        symbol: estimateFee.symbol
      };
    },
    [chainInfoMap, chainValue]
  );

  const { onError, onSuccess } = useHandleSubmitTransaction(undefined, handleDataForInsufficientAlert);

  const unstakingInfo = useMemo((): UnstakingInfo | undefined => {
    if (fromValue && !isAccountAll(fromValue) && !!yieldPosition) {
      if (_STAKING_CHAIN_GROUP.astar.includes(yieldPosition.chain)) {
        return getAstarWithdrawable(yieldPosition);
      }

      return yieldPosition.unstakings.filter((data) => data.status === UnstakingStatus.CLAIMABLE)[0];
    }

    return undefined;
  }, [fromValue, yieldPosition]);

  const onSubmit: FormCallbacks<WithdrawParams>['onFinish'] = useCallback((values: WithdrawParams) => {
    setLoading(true);

    if (!unstakingInfo) {
      setLoading(false);

      return;
    }

    const params: RequestYieldWithdrawal = {
      address: values.from,
      slug: values.slug,
      unstakingInfo: unstakingInfo
    };

    setTimeout(() => {
      yieldSubmitStakingWithdrawal(params)
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [onError, onSuccess, unstakingInfo]);

  const onClickSubmit = useCallback((values: WithdrawParams) => {
    if (currentConfirmation) {
      mktCampaignModalContext.openModal({
        type: 'confirmation',
        title: currentConfirmation.name,
        message: currentConfirmation.content,
        externalButtons: renderConfirmationButtons(mktCampaignModalContext.hideModal, () => {
          onSubmit(values);
          mktCampaignModalContext.hideModal();
        })
      });
    } else {
      onSubmit(values);
    }
  }, [currentConfirmation, mktCampaignModalContext, onSubmit, renderConfirmationButtons]);

  const onPreCheck = usePreCheckAction(fromValue);

  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  useEffect(() => {
    form.setFieldValue('chain', stakingChain);
  }, [form, stakingChain]);

  const accountList = useMemo(() => {
    return accounts.filter(filterAccount(chainInfoMap, allPositionInfos, poolInfo.type));
  }, [accounts, allPositionInfos, chainInfoMap, poolInfo.type]);

  const exType = useMemo(() => {
    if (type === YieldPoolType.LIQUID_STAKING) {
      if (chainValue === 'moonbeam') {
        return ExtrinsicType.EVM_EXECUTE;
      } else {
        return ExtrinsicType.UNKNOWN;
      }
    }

    if (type === YieldPoolType.LENDING) {
      return ExtrinsicType.UNKNOWN;
    }

    return ExtrinsicType.STAKING_WITHDRAW;
  }, [type, chainValue]);

  useEffect(() => {
    if (!fromValue && accountList.length === 1) {
      form.setFieldValue('from', accountList[0].address);
    }
  }, [accountList, form, fromValue]);

  return (
    <>
      <TransactionContent>
        <Form
          className={'form-container form-space-sm'}
          form={form}
          initialValues={formDefault}
          onFieldsChange={onFieldsChange}
          onFinish={onClickSubmit}
        >

          <HiddenInput fields={hideFields} />
          <Form.Item
            name={'from'}
          >
            <AccountSelector
              addressPrefix={networkPrefix}
              disabled={!isAllAccount}
              doFilter={false}
              externalAccounts={accountList}
            />
          </Form.Item>
          <FreeBalance
            address={fromValue}
            chain={chainValue}
            className={'free-balance'}
            label={t('Available balance')}
            onBalanceReady={setIsBalanceReady}
          />
          <Form.Item>
            <MetaInfo
              className='withdraw-meta-info'
              hasBackgroundWrapper={true}
            >
              <MetaInfo.Chain
                chain={chainValue}
                label={t('Network')}
              />
              {
                unstakingInfo && (
                  <MetaInfo.Number
                    decimals={decimals}
                    label={t('Amount')}
                    suffix={symbol}
                    value={unstakingInfo.claimable}
                  />
                )
              }
            </MetaInfo>
          </Form.Item>
        </Form>
      </TransactionContent>
      <TransactionFooter>
        <Button
          disabled={loading}
          icon={(
            <Icon
              phosphorIcon={XCircle}
              weight='fill'
            />
          )}
          onClick={goHome}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>

        <Button
          disabled={isDisable || !isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight='fill'
            />
          )}
          loading={loading}
          onClick={onPreCheck(form.submit, exType)}
        >
          {t('Continue')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  return (
    <EarnOutlet
      className={CN(className)}
      path={'/transaction/withdraw'}
      stores={['earning']}
    >
      <Component />
    </EarnOutlet>
  );
};

const Withdraw = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.free-balance': {
      marginBottom: token.marginXS
    },

    '.meta-info': {
      marginTop: token.paddingSM
    }
  };
});

export default Withdraw;
