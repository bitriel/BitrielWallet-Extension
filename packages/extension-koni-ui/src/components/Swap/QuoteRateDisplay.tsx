// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { _getAssetSymbol } from '@bitriel/extension-base/services/chain-service/utils';
import { swapNumberMetadata } from '@bitriel/extension-base/utils';
import { NumberDisplay } from '@bitriel/extension-koni-ui/components';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  rateValue: number;
  fromAssetInfo?: _ChainAsset;
  toAssetInfo?: _ChainAsset;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, fromAssetInfo,
    rateValue,
    toAssetInfo } = props;

  return (
    <div className={CN(className)}>
      <NumberDisplay
        decimal={0}
        suffix={_getAssetSymbol(fromAssetInfo)}
        value={1}
      />
      <span>&nbsp;~&nbsp;</span>
      <NumberDisplay
        decimal={0}
        metadata={swapNumberMetadata}
        suffix={_getAssetSymbol(toAssetInfo)}
        value={rateValue}
      />
    </div>
  );
};

const QuoteRateDisplay = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',

    '.ant-number, .ant-number .ant-typography': {
      fontSize: 'inherit !important',
      color: 'inherit !important',
      lineHeight: 'inherit'
    }
  };
});

export default QuoteRateDisplay;
