// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountProxy } from '@bitriel/extension-base/types';
import { stripUrl } from '@bitriel/extension-base/utils';
import { useSelector } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { getWCAccountProxyList } from '@bitriel/extension-koni-ui/utils';
import { Icon, Image, Web3Block } from '@subwallet/react-ui';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import { CaretRight } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  session: SessionTypes.Struct;
  onClick: (topic: string) => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, onClick, session } = props;

  const { namespaces, peer: { metadata: dAppInfo } } = session;

  const domain = useMemo(() => {
    try {
      return stripUrl(dAppInfo.url);
    } catch (e) {
      return dAppInfo.url;
    }
  }, [dAppInfo.url]);

  const logoUrl = `https://icons.duckduckgo.com/ip2/${domain}.ico`;

  const accountProxies = useSelector((state) => state.accountState.accountProxies);

  const accountProxyItems = useMemo((): AccountProxy[] => getWCAccountProxyList(accountProxies, namespaces), [accountProxies, namespaces]);

  const _onClick = useCallback(() => {
    onClick(session.topic);
  }, [onClick, session.topic]);

  return (
    <Web3Block
      className={CN(className, 'connection-item')}
      leftItem={
        <Image
          height={28}
          shape='circle'
          src={logoUrl}
          width={28}
        />
      }
      middleItem={(
        <>
          <div className={'__website-name h5-text'}>{dAppInfo.name}</div>
          <div className={'__website-domain common-text'}>{domain}</div>
          <div className={'__account-count h5-text'}>{accountProxyItems.length}</div>
        </>
      )}
      onClick={_onClick}
      rightItem={(
        <div className={'__arrow-icon'}>
          <Icon
            phosphorIcon={CaretRight}
            size='sm'
          />
        </div>
      )}
    />
  );
};

const ConnectionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: 0,
    paddingLeft: token.sizeSM,
    paddingRight: token.sizeXXS,
    minHeight: 48,
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,

    '&.ant-web3-block.connection-item': {
      display: 'flex'
    },

    '.ant-web3-block-middle-item': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden'
    },

    '.__website-name, .__account-count': {
      color: token.colorTextLight1
    },

    '.__website-name, .__website-domain': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },

    '.__website-name': {
      flex: 96 / 266
    },

    '.__website-domain': {
      flex: 140 / 266,
      paddingLeft: token.sizeXS,
      color: token.colorTextLight4
    },

    '.__account-count': {
      flex: 30 / 266,
      paddingLeft: token.sizeXXS,
      textAlign: 'right'
    },

    '.ant-web3-block-right-item': {
      margin: 0
    },

    '.__arrow-icon': {
      width: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
});

export default ConnectionItem;
