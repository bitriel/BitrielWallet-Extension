// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmSendTransactionRequest, EvmTransactionArg } from '@bitriel/extension-base/background/KoniTypes';
import MetaInfo from '@bitriel/extension-koni-ui/components/MetaInfo/MetaInfo';
import useGetAccountByAddress from '@bitriel/extension-koni-ui/hooks/account/useGetAccountByAddress';
import useGetChainInfoByChainId from '@bitriel/extension-koni-ui/hooks/chain/useGetChainInfoByChainId';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: EvmSendTransactionRequest;
  address: string;
  accountName?: string;
}

const convertToBigN = (num: EvmSendTransactionRequest['value']): string | number | undefined => {
  if (typeof num === 'object') {
    return num.toNumber();
  } else {
    return num;
  }
};

const Component: React.FC<Props> = (props: Props) => {
  const { accountName, address, className, request } = props;
  const { chainId } = request;

  const recipient = useGetAccountByAddress(request.to);

  const chainInfo = useGetChainInfoByChainId(chainId);

  const { t } = useTranslation();

  const amount = useMemo((): number => {
    return new BigN(convertToBigN(request.value) || 0).toNumber();
  }, [request.value]);

  const handlerRenderArg = useCallback((data: EvmTransactionArg, parentName: string): JSX.Element => {
    const { children, name, value } = data;
    const _name = (parentName ? `${parentName}.` : '') + name;

    if (children) {
      return (
        <React.Fragment key={parentName}>
          {
            children.map((child) => handlerRenderArg(child, name))
          }
        </React.Fragment>
      );
    }

    return (
      <MetaInfo.Data
        key={_name}
        label={_name}
      >
        {value}
      </MetaInfo.Data>
    );
  }, []);

  const renderInputInfo = useCallback((): React.ReactNode => {
    const data = request.parseData;

    if (typeof data === 'string') {
      return null;
    }

    return (
      <>
        <MetaInfo.Default
          className='method-name'
          label={t('Method')}
          labelAlign='top'
        >
          {data.methodName}
        </MetaInfo.Default>
        <MetaInfo.Data
          className='arg-container'
          label={t('Arguments')}
        >
          {
            data.args.map((value) => handlerRenderArg(value, ''))
          }
        </MetaInfo.Data>
      </>
    );
  }, [handlerRenderArg, request.parseData, t]);

  return (
    <MetaInfo className={className}>
      {
        chainInfo
          ? (
            <MetaInfo.Chain
              chain={chainInfo.slug}
              label={t<string>('Network')}
            />
          )
          : chainId !== undefined
            ? (
              <MetaInfo.Default
                label={t<string>('Chain id')}
              >
                {chainId}
              </MetaInfo.Default>
            )
            : null
      }
      <MetaInfo.Transfer
        className={CN('meta-info-transfer', {
          '-no-account-name-item': !recipient?.name || !accountName
        })}
        recipientAddress={recipient?.address || request.to || ''}
        recipientLabel={t('To')}
        recipientName={recipient?.name || ''}
        senderAddress={address}
        senderLabel={t('From')}
        senderName={accountName || ''}
      />
      {
        (!request.isToContract || amount !== 0) &&
        (
          <MetaInfo.Number
            decimals={chainInfo?.evmInfo?.decimals}
            label={t('Amount')}
            suffix={chainInfo?.evmInfo?.symbol}
            value={amount}
          />
        )
      }
      <MetaInfo.Number
        decimals={chainInfo?.evmInfo?.decimals}
        label={t('Estimate gas')}
        suffix={chainInfo?.evmInfo?.symbol}
        value={request.estimateGas}
      />
      {renderInputInfo()}
      {
        (request.data && request.data !== '0x') &&
          (
            <MetaInfo.Data label={t('Hex data')}>
              <details>
                <summary>{request.data}</summary>
              </details>
            </MetaInfo.Data>
          )
      }
    </MetaInfo>
  );
};

const EvmTransactionDetail = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {

    '.__label': {
      fontFamily: token.fontFamily,
      textTransform: 'unset'
    },

    '.arg-container > .__col > .__value': {
      marginLeft: token.marginXS
    },

    '.-to-right': {
      textAlign: 'right'
    },

    '.method-name': {
      '.-to-right': {
        flex: 2,

        '.__value': {
          wordBreak: 'break-word'
        }
      }
    },

    '.meta-info-transfer.-no-account-name-item .__account-item ': {
      minHeight: 44,
      display: 'flex',
      alignItems: 'flex-start'
    },

    details: {
      cursor: 'pointer',

      summary: {
        textOverflow: 'ellipsis',
        outline: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      },

      '&[open] summary': {
        whiteSpace: 'normal'
      },

      pre: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }
    }
  };
});

export default EvmTransactionDetail;
