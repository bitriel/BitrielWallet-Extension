// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProcessTransactionData, SubmitJoinNominationPool, SummaryEarningProcessData } from '@bitriel/extension-base/types';
import CommonTransactionInfo from '@bitriel/extension-koni-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@bitriel/extension-koni-ui/components/MetaInfo/MetaInfo';
import { useGetTransactionProcessSteps } from '@bitriel/extension-koni-ui/hooks';
import useGetNativeTokenBasicInfo from '@bitriel/extension-koni-ui/hooks/common/useGetNativeTokenBasicInfo';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseProcessConfirmationProps } from '../Base';

type Props = BaseProcessConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const process = useMemo(() => transaction.process as ProcessTransactionData, [transaction.process]);
  const data = useMemo(() => (process.combineInfo as SummaryEarningProcessData).data as unknown as SubmitJoinNominationPool, [process.combineInfo]);

  const { t } = useTranslation();
  const { decimals, symbol } = useGetNativeTokenBasicInfo(transaction.chain);

  const getTransactionProcessSteps = useGetTransactionProcessSteps();

  const stepItems = useMemo(() => {
    return getTransactionProcessSteps(process.steps, process.combineInfo, false);
  }, [getTransactionProcessSteps, process.combineInfo, process.steps]);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo
        className={'meta-info'}
        hasBackgroundWrapper
      >
        <MetaInfo.Account
          address={data.selectedPool.address}
          label={t('Pool')}
          networkPrefix={42}
        />

        {/* <MetaInfo.AccountGroup */}
        {/*  accounts={data.address} */}
        {/*  content={t(`${data.selectedValidators.length} selected validators`)} */}
        {/*  label={t('Pool')} */}
        {/* /> */}

        <MetaInfo.Number
          decimals={decimals}
          label={t('Amount')}
          suffix={symbol}
          value={data.amount}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />

        <MetaInfo.TransactionProcess
          items={stepItems}
          type={process.type}
        />
      </MetaInfo>
    </div>
  );
};

const NominationPoolProcessConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default NominationPoolProcessConfirmation;
