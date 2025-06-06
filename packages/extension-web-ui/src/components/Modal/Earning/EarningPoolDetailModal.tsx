// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningStatus } from '@bitriel/extension-base/types';
import { BaseModal } from '@bitriel/extension-web-ui/components';
import MetaInfo from '@bitriel/extension-web-ui/components/MetaInfo/MetaInfo';
import { EarningStatusUi, NominationPoolsEarningStatusUi } from '@bitriel/extension-web-ui/constants';
import { useGetChainPrefixBySlug } from '@bitriel/extension-web-ui/hooks';
import useTranslation from '@bitriel/extension-web-ui/hooks/common/useTranslation';
import { NominationPoolDataType, ThemeProps } from '@bitriel/extension-web-ui/types';
import { Number } from '@subwallet/react-ui';
import React, { useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  onCancel: () => void,
  detailItem?: NominationPoolDataType,
  maxPoolMembersValue?: number,
  chain?: string,
};

export const EarningPoolDetailModalId = 'earningPoolDetailModalId';

function Component ({ chain, className, detailItem, maxPoolMembersValue, onCancel }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address = '', bondedAmount, decimals, isProfitable, memberCounter = 0, name, state, symbol } = detailItem || {};

  const earningStatus: EarningStatus = useMemo(() => {
    return isProfitable ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING;
  }, [isProfitable]);

  const networkPrefix = useGetChainPrefixBySlug(chain);
  const ratePercent = useMemo(() => {
    const rate = maxPoolMembersValue && (memberCounter / maxPoolMembersValue);

    if (rate !== undefined) {
      if (rate < 0.9) {
        return 'default';
      } else if (rate >= 0.9 && rate < 1) {
        return 'gold';
      } else {
        return 'danger';
      }
    }

    return undefined;
  }, [maxPoolMembersValue, memberCounter]);

  return (
    <BaseModal
      className={className}
      id={EarningPoolDetailModalId}
      onCancel={onCancel}
      title={t('Pool details')}
    >
      <MetaInfo
        hasBackgroundWrapper
        spaceSize={'xs'}
        valueColorScheme={'light'}
      >
        <MetaInfo.Account
          address={address}
          label={t('Pool')}
          name={name}
          networkPrefix={networkPrefix}
        />

        {
          state && (
            <MetaInfo.Status
              label={t('State')}
              statusIcon={NominationPoolsEarningStatusUi[state].icon}
              statusName={state || ''}
              valueColorSchema={NominationPoolsEarningStatusUi[state].schema}
            />
          )
        }

        <MetaInfo.Status
          label={t('Earning status')}
          statusIcon={EarningStatusUi[earningStatus].icon}
          statusName={EarningStatusUi[earningStatus].name}
          valueColorSchema={EarningStatusUi[earningStatus].schema}
        />

        <MetaInfo.Number
          decimals={decimals}
          label={t('Total staked')}
          suffix={symbol}
          value={bondedAmount || '0'}
          valueColorSchema={'even-odd'}
        />

        {!maxPoolMembersValue &&
          <MetaInfo.Number
            label={t('Member')}
            value={memberCounter}
            valueColorSchema={'even-odd'}
          />}

        {!!maxPoolMembersValue && !!ratePercent && (
          <MetaInfo.Default
            className={'__maximum-member'}
            label={'Member'}
            labelAlign='top'
            valueColorSchema={`${ratePercent}`}
          >
            <Number
              decimal={0}
              value={memberCounter}
            /> &nbsp;/&nbsp; <Number
              decimal={0}
              value={maxPoolMembersValue}
            />
          </MetaInfo.Default>
        )}
      </MetaInfo>
    </BaseModal>
  );
}

const EarningPoolDetailModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__maximum-member .__value': {
      display: 'flex'
    }

  });
});

export default EarningPoolDetailModal;
