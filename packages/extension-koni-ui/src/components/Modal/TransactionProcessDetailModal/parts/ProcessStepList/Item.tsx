// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProcessStep } from '@bitriel/extension-base/types';
import { TransactionProcessStepSimpleItem } from '@bitriel/extension-koni-ui/components';
import { useGetTransactionProcessStepText } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  processStep: ProcessStep,
  index: number,
  isLastItem?: boolean;
  combineInfo: unknown;
};

const Component: FC<Props> = (props: Props) => {
  const { className, combineInfo, index, isLastItem, processStep } = props;
  const getStepText = useGetTransactionProcessStepText();

  const text = useMemo(() => {
    return getStepText(processStep, combineInfo);
  }, [combineInfo, getStepText, processStep]);

  return (
    <TransactionProcessStepSimpleItem
      className={className}
      index={index}
      isLastItem={isLastItem}
      status={processStep.status}
      content={text}
    />
  );
};

export const Item = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

  });
});
