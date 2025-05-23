// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProcessTransactionData } from '@bitriel/extension-base/types';
import { CommonTransactionInfo } from '@bitriel/extension-koni-ui/components';
import { AlertDialogProps, ThemeProps } from '@bitriel/extension-koni-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

export interface BaseProcessConfirmationProps extends ThemeProps {
  process: ProcessTransactionData;
  openAlert: (alertProps: AlertDialogProps) => void;
  closeAlert: VoidFunction;
}

/**
 * This is a base component for process confirmation, it should not be used
 * */
const Component: React.FC<BaseProcessConfirmationProps> = (props: BaseProcessConfirmationProps) => {
  const { className, process } = props;

  const chain = useMemo(() => {
    const step = process.steps.find((step) => step.id === process.currentStepId);

    return step?.chain || '';
  }, [process.currentStepId, process.steps]);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={process.address}
        network={chain}
      />
    </div>
  );
};

const BaseProcessConfirmation = styled(Component)<BaseProcessConfirmationProps>(({ theme: { token } }: BaseProcessConfirmationProps) => {
  return {};
});

export default BaseProcessConfirmation;
