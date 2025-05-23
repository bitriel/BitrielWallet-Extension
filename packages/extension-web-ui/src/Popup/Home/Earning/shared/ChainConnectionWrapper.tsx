// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertModal, ConnectChainModal, LoadingModal } from '@bitriel/extension-web-ui/components';
import { useTranslation } from '@bitriel/extension-web-ui/hooks';
import { AlertDialogProps } from '@bitriel/extension-web-ui/types';
import React from 'react';

type Props = {
  children?: React.ReactNode;
  connectingChain: string| undefined;
  connectChainModalId: string;
  closeConnectChainModal: VoidFunction;
  onConnectChain: (chain: string) => void;
  chainConnectionLoadingModalId: string;
  alertProps: AlertDialogProps | undefined;
  alertModalId: string;
};

export const ChainConnectionWrapper = ({ alertModalId,
  alertProps,
  chainConnectionLoadingModalId,
  children,
  closeConnectChainModal,
  connectChainModalId,
  connectingChain,
  onConnectChain }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      {
        children
      }

      {
        !!connectingChain && (
          <ConnectChainModal
            chain={connectingChain}
            modalId={connectChainModalId}
            onCancel={closeConnectChainModal}
            onConnectChain={onConnectChain}
          />
        )
      }

      <LoadingModal
        loadingText={t('Getting data')}
        modalId={chainConnectionLoadingModalId}
      />

      {
        !!alertProps && (
          <AlertModal
            modalId={alertModalId}
            {...alertProps}
          />
        )
      }
    </>
  );
};
