// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { REQUEST_CAMERA_ACCESS_MODAL } from '@bitriel/extension-web-ui/constants/modal';
import { RootState } from '@bitriel/extension-web-ui/stores';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

const useOpenQrScanner = (modalId: string) => {
  const { activeModal } = useContext(ModalContext);
  const { camera } = useSelector((state: RootState) => state.settings);

  return useCallback(() => {
    if (camera) {
      activeModal(modalId);
    } else {
      activeModal(REQUEST_CAMERA_ACCESS_MODAL);
    }
  }, [activeModal, modalId, camera]);
};

export default useOpenQrScanner;
