// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertDialogProps } from '@bitriel/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useState } from 'react';

const useAlert = (alertModalId: string, initAlertProps?: AlertDialogProps) => {
  const [alertProps, setAlertProps] = useState<AlertDialogProps | undefined>(initAlertProps);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const openAlert = useCallback((alertProps: AlertDialogProps) => {
    setAlertProps(alertProps);
    activeModal(alertModalId);
  }, [activeModal, alertModalId]);

  const closeAlert = useCallback(() => {
    inactiveModal(alertModalId);
    setAlertProps(undefined);
  }, [alertModalId, inactiveModal]);

  const updateAlertProps = useCallback((alertProps: Partial<AlertDialogProps>) => {
    setAlertProps((prev) => {
      if (!prev) {
        return undefined;
      }

      return {
        ...prev,
        ...alertProps
      };
    });
  }, []);

  return {
    alertProps,
    updateAlertProps,
    openAlert,
    closeAlert
  };
};

export default useAlert;
