// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProcessStep, StepStatus } from '@bitriel/extension-base/types';
import { useGetTransactionProcessStepText } from '@bitriel/extension-koni-ui/hooks';
import { TransactionProcessStepItemType } from '@bitriel/extension-koni-ui/types';
import { useCallback } from 'react';

const useGetTransactionProcessSteps = () => {
  const getStepText = useGetTransactionProcessStepText();

  return useCallback((processStep: ProcessStep[], combineInfo: unknown, fillStepStatus = true): TransactionProcessStepItemType[] => {
    return processStep.map((ps, index) => ({
      status: fillStepStatus ? ps.status : StepStatus.QUEUED,
      content: getStepText(ps, combineInfo),
      index,
      isLastItem: index === processStep.length - 1
    }));
  }, [getStepText]);
};

export default useGetTransactionProcessSteps;
