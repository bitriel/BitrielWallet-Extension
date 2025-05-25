// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _isChainEvmCompatible } from '@bitriel/extension-base/services/chain-service/utils';
import { AuthUrlInfo, AuthUrls } from '@bitriel/extension-base/services/request-service/types';
import { stripUrl } from '@bitriel/extension-base/utils';
import { BasicInputEvent, ChainSelector } from '@bitriel/extension-koni-ui/components';
import { AUTHORIZE_TYPE_SUPPORTS_NETWORK_SWITCH, SWITCH_CURRENT_NETWORK_AUTHORIZE_MODAL } from '@bitriel/extension-koni-ui/constants';
import { useGetCurrentAuth, useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { switchCurrentNetworkAuthorization } from '@bitriel/extension-koni-ui/messaging';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { ChainItemType, ThemeProps } from '@bitriel/extension-koni-ui/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

export interface SwitchNetworkAuthorizeModalProps {
  authUrlInfo: AuthUrlInfo;
  onComplete: (authInfo: AuthUrls) => void;
  needsTabAuthCheck?: boolean;
}

type Props = ThemeProps & SwitchNetworkAuthorizeModalProps &{
  onCancel: () => void;
};

const networkSelectModalId = SWITCH_CURRENT_NETWORK_AUTHORIZE_MODAL;
const networkTypeSupported = AUTHORIZE_TYPE_SUPPORTS_NETWORK_SWITCH;

function Component ({ authUrlInfo, className, needsTabAuthCheck, onCancel, onComplete }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [networkSelected, setNetworkSelected] = useState(authUrlInfo.currentNetworkMap[networkTypeSupported] || '');
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const currentAuthByActiveTab = useGetCurrentAuth();

  const networkItems = useMemo(() => {
    return Object.values(chainInfoMap)
      .reduce<ChainItemType[]>((acc, chainInfo) => {
      if (_isChainEvmCompatible(chainInfo) && networkTypeSupported === 'evm') {
        acc.push({ name: chainInfo.name, slug: chainInfo.slug });
      }

      return acc;
    }, []);
  }, [chainInfoMap]);

  const onSelectNetwork = useCallback((event: BasicInputEvent) => {
    setNetworkSelected(event.target.value);
  }, []);

  useEffect(() => {
    let isSync = true;

    if (networkSelected && networkSelected !== authUrlInfo.currentNetworkMap[networkTypeSupported]) {
      const url = stripUrl(authUrlInfo.url);

      if (isSync) {
        setLoading(true);
      }

      switchCurrentNetworkAuthorization({ networkKey: networkSelected, authSwitchNetworkType: networkTypeSupported, url }).then(({ list }) => {
        onComplete(list);
      }).catch(console.error).finally(() => {
        onCancel();

        if (isSync) {
          setNetworkSelected('');
          setLoading(false);
        }
      });
    }

    return () => {
      isSync = false;
    };
  }, [authUrlInfo, networkSelected, onCancel, onComplete]);

  useEffect(() => {
    if (needsTabAuthCheck && currentAuthByActiveTab && currentAuthByActiveTab.id !== authUrlInfo.id) {
      onCancel();
    }
  }, [authUrlInfo.id, currentAuthByActiveTab, needsTabAuthCheck, onCancel]);

  return (
    <ChainSelector
      className={className}
      id={networkSelectModalId}
      items={networkItems}
      loading={loading}
      onChange={onSelectNetwork}
      title={t('Select network')}
      value={networkSelected}
    />
  );
}

const SwitchNetworkAuthorizeModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

    '&.chain-selector-input': {
      display: 'none'
    },

    '.__action-item + .__action-item': {
      marginTop: token.marginXS
    },

    '.__item-chain-type-logo': {
      height: 20,
      width: 20
    }
  });
});

export default SwitchNetworkAuthorizeModal;
