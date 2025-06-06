// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { convertDerivativeToOriginToken } from '@bitriel/extension-base/koni/api/yield/helper/utils';
import { RequestYieldLeave, SpecialYieldPoolInfo, YieldPoolType } from '@bitriel/extension-base/types';
import { CommonTransactionInfo, MetaInfo, PageWrapper } from '@bitriel/extension-koni-ui/components';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import { useSelector } from '@bitriel/extension-koni-ui/hooks';
import CN from 'classnames';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { transaction } = props;
  const { t } = useTranslation();

  const { estimateFee } = transaction;
  const { amount, slug } = transaction.data as RequestYieldLeave;

  const { assetRegistry } = useSelector((state) => state.assetRegistry);
  const { minAmountPercentMap, poolInfoMap } = useSelector((state) => state.earning);
  const yieldPoolInfo = poolInfoMap[slug] as SpecialYieldPoolInfo;

  const isLendingPool = useMemo(() => {
    return yieldPoolInfo.type === YieldPoolType.LENDING;
  }, [yieldPoolInfo.type]);

  const assetInfo = useMemo(() => {
    const tokenSlug = isLendingPool ? yieldPoolInfo.metadata.inputAsset : yieldPoolInfo.metadata.derivativeAssets[0];

    return assetRegistry[tokenSlug || ''];
  }, [assetRegistry, isLendingPool, yieldPoolInfo.metadata.derivativeAssets, yieldPoolInfo.metadata.inputAsset]);

  const receivedAssetInfo = useMemo(() => {
    const tokenSlug = yieldPoolInfo.metadata.inputAsset;

    return assetRegistry[tokenSlug || ''];
  }, [assetRegistry, yieldPoolInfo.metadata.inputAsset]);

  const estimatedReceivables = useMemo(() => {
    const derivativeTokenSlug = yieldPoolInfo.metadata.derivativeAssets[0] || '';
    const originTokenSlug = yieldPoolInfo.metadata.inputAsset;

    const derivativeTokenInfo = assetRegistry[derivativeTokenSlug];
    const originTokenInfo = assetRegistry[originTokenSlug];

    return convertDerivativeToOriginToken(amount, yieldPoolInfo, derivativeTokenInfo, originTokenInfo);
  }, [amount, assetRegistry, yieldPoolInfo]);

  const percent = useMemo(() => {
    return minAmountPercentMap[yieldPoolInfo.slug] || minAmountPercentMap.default;
  }, [minAmountPercentMap, yieldPoolInfo.slug]);

  return (
    <>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo
        className={'meta-info'}
        hasBackgroundWrapper
      >
        <MetaInfo.Number
          decimals={assetInfo.decimals || 0}
          label={t('Amount')}
          suffix={assetInfo.symbol}
          value={amount}
        />

        {!isLendingPool && (
          <MetaInfo.Number
            decimals={receivedAssetInfo.decimals || 0}
            label={t('Estimated receivables')}
            suffix={receivedAssetInfo.symbol}
            value={estimatedReceivables}
          />
        )}

        {!isLendingPool && (
          <MetaInfo.Number
            decimals={receivedAssetInfo.decimals || 0}
            label={t('Minimum receivables')}
            suffix={receivedAssetInfo.symbol}
            value={Math.floor(parseInt(estimatedReceivables) * percent)}
          />
        )}

        {!!estimateFee && (
          <MetaInfo.Number
            decimals={estimateFee.decimals}
            label={t('Estimated fee')}
            suffix={estimateFee.symbol}
            value={estimateFee.value}
          />
        )}
      </MetaInfo>
    </>
  );
};

const Wrapper = (props: Props) => {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(props.className)}
      hideLoading={true}
      resolve={dataContext.awaitStores(['earning'])}
    >
      <Component {...props} />
    </PageWrapper>
  );
};

const FastWithdrawTransactionConfirmation = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {

  };
});

export default FastWithdrawTransactionConfirmation;
