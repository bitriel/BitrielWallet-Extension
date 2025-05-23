// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, TransactionAdditionalInfo } from '@bitriel/extension-base/background/KoniTypes';
import { getExplorerLink, getSimpleSwapExplorerLink } from '@bitriel/extension-base/services/transaction-service/utils';
import { SimpleSwapTxData, SwapProviderId, SwapTxData } from '@bitriel/extension-base/types';
import { InfoItemBase } from '@bitriel/extension-koni-ui/components';
import { HISTORY_DETAIL_MODAL } from '@bitriel/extension-koni-ui/constants';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@bitriel/extension-koni-ui/types';
import { Button, Icon, SwIconProps, SwModal } from '@subwallet/react-ui';
import { ArrowSquareUpRight } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import HistoryDetailLayout from './parts/Layout';

type Props = ThemeProps & {
  onCancel: () => void,
  data: TransactionHistoryDisplayItem | null
}

export type StatusType = {
  schema: InfoItemBase['valueColorSchema'],
  icon: SwIconProps['phosphorIcon'],
  name: string
};

function Component ({ className = '', data, onCancel }: Props): React.ReactElement<Props> {
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const { t } = useTranslation();

  const openBlockExplorer = useCallback(
    (link: string) => {
      return () => {
        window.open(link, '_blank');
      };
    },
    []
  );

  const modalFooter = useMemo<React.ReactNode>(() => {
    if (!data) {
      return null;
    }

    const extrinsicType = data.type;
    const chainInfo = chainInfoMap[data.chain];
    let originChainInfo = chainInfo;

    if (extrinsicType === ExtrinsicType.TRANSFER_XCM && data.additionalInfo) {
      const additionalInfo = data.additionalInfo as TransactionAdditionalInfo[ExtrinsicType.TRANSFER_XCM];

      originChainInfo = chainInfoMap[additionalInfo.originalChain] || chainInfo;
    }

    let link = (data.extrinsicHash && data.extrinsicHash !== '') && getExplorerLink(originChainInfo, data.extrinsicHash, 'tx');

    if (extrinsicType === ExtrinsicType.SWAP) {
      const additionalInfo = data.additionalInfo as SwapTxData;

      if ([SwapProviderId.SIMPLE_SWAP].includes(additionalInfo.provider.id)) {
        link = getSimpleSwapExplorerLink(additionalInfo as SimpleSwapTxData);
      }
    }

    return (
      <Button
        block
        disabled={!link}
        icon={
          <Icon
            phosphorIcon={ArrowSquareUpRight}
            weight={'fill'}
          />
        }
        onClick={openBlockExplorer(link || '')}
      >
        {t('View on explorer')}
      </Button>
    );
  }, [chainInfoMap, data, openBlockExplorer, t]);

  return (
    <SwModal
      className={className}
      footer={modalFooter}
      id={HISTORY_DETAIL_MODAL}
      onCancel={onCancel}
      title={data?.displayData?.title || ''}
    >
      <div className={'__layout-container'}>
        {data && <HistoryDetailLayout data={data} />}
      </div>
    </SwModal>
  );
}

export const HistoryDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-body': {
      marginBottom: 0
    },

    '.ant-sw-modal-footer': {
      border: 0
    }
  });
});
