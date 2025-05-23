// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LoadingScreen, PageWrapper } from '@bitriel/extension-koni-ui/components';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import { useSelector, useSetCurrentPage, useTransactionContext } from '@bitriel/extension-koni-ui/hooks';
import { StoreName } from '@bitriel/extension-koni-ui/stores';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface Props extends ThemeProps {
  children: React.ReactNode | React.ReactNode[];
  path: string;
  stores: StoreName[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { children, className, path, stores } = props;

  useSetCurrentPage(path);

  const dataContext = useContext(DataContext);
  const { inactiveModal } = useContext(ModalContext);

  const { defaultData } = useTransactionContext();
  const navigate = useNavigate();

  const { chainStateMap } = useSelector((state) => state.chainStore);

  const isChainActive = !!chainStateMap[defaultData.chain]?.active;
  const ignoreCheckChain = ['/transaction/claim-reward'].includes(path);

  useEffect(() => {
    if (!isChainActive) {
      if (!ignoreCheckChain) {
        navigate('/home/earning');
      }
    }
  }, [inactiveModal, isChainActive, navigate, ignoreCheckChain]);

  if (!isChainActive && !ignoreCheckChain) {
    return <LoadingScreen />;
  }

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(stores)}
    >
      {children}
    </PageWrapper>
  );
};

const EarnOutlet = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };
});

export default EarnOutlet;
