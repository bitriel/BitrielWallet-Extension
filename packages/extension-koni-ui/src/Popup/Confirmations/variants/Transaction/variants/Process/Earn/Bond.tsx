// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestBondingSubmit, StakingType } from '@bitriel/extension-base/background/KoniTypes';
import { getValidatorLabel } from '@bitriel/extension-base/koni/api/staking/bonding/utils';
import { ProcessTransactionData, SummaryEarningProcessData } from '@bitriel/extension-base/types';
import CommonTransactionInfo from '@bitriel/extension-koni-ui/components/Confirmation/CommonTransactionInfo';
import MetaInfo from '@bitriel/extension-koni-ui/components/MetaInfo/MetaInfo';
import { useGetChainPrefixBySlug, useGetTransactionProcessSteps } from '@bitriel/extension-koni-ui/hooks';
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
  const data = useMemo(() => (process.combineInfo as SummaryEarningProcessData).data as unknown as RequestBondingSubmit, [process.combineInfo]);

  const handleValidatorLabel = useMemo(() => {
    return getValidatorLabel(transaction.chain);
  }, [transaction.chain]);
  const networkPrefix = useGetChainPrefixBySlug(transaction.chain);

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
        <MetaInfo.AccountGroup
          accounts={data.selectedValidators}
          content={t(`{{number}} selected ${handleValidatorLabel.toLowerCase()}`, { replace: { number: data.selectedValidators.length } })}
          identPrefix={networkPrefix}
          label={t(data.type === StakingType.POOLED ? 'Pool' : handleValidatorLabel)}
        />

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

const NativeStakingProcessConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default NativeStakingProcessConfirmation;
