// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@bitriel/extension-base/types';
import { AccountProxyAvatar } from '@bitriel/extension-koni-ui/components';
import { Theme } from '@bitriel/extension-koni-ui/themes';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { toShort } from '@bitriel/extension-koni-ui/utils';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { Context, useContext, useMemo } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  account: AccountJson | null;
  accountAddress?: string;
  accountName?: string;
  isSelected?: boolean;
  showUnselectIcon?: boolean;
  renderRightPart?: (checkedIconNode: React.ReactNode) => React.ReactNode;
  rightPartNode?: React.ReactNode;
  leftPartNode?: React.ReactNode;
  showAccountNameFallback?: boolean;
  onClick?: VoidFunction;
};

function Component (props: Props): React.ReactElement<Props> {
  const { account, accountAddress, accountName, className, isSelected, leftPartNode, onClick, renderRightPart, rightPartNode, showAccountNameFallback = true, showUnselectIcon } = props;
  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;

  const checkedIconNode = ((showUnselectIcon || isSelected) && (
    <div className='__checked-icon-wrapper'>
      <Icon
        iconColor={isSelected ? token.colorSuccess : token.colorTextLight4}
        phosphorIcon={CheckCircle}
        size='sm'
        weight='fill'
      />
    </div>
  ));

  const address = useMemo(() => accountAddress || account?.address, [account?.address, accountAddress]);
  const hasAccountName = useMemo(() => !!accountName || !!account?.name, [account?.name, accountName]);

  return (
    <div
      className={CN(className)}
      onClick={onClick}
    >
      <div className='__item-left-part'>
        {
          leftPartNode || (
            <AccountProxyAvatar
              size={24}
              value={account?.proxyId || address}
            />
          )
        }
      </div>
      <div className='__item-middle-part'>
        <div className={CN('__account-name-item', {
          '-is-show-fallback': showAccountNameFallback
        })}
        >
          {accountName || account?.name || ''}
        </div>
        {showAccountNameFallback && !!address &&
          <div className={CN('account-item-address-wrapper', {
            '-is-wrap-parentheses': hasAccountName
          })}
          >{toShort(address, 4, 4)}</div>}
      </div>
      <div className='__item-right-part'>
        {rightPartNode || (renderRightPart ? renderRightPart(checkedIconNode) : checkedIconNode)}
      </div>
    </div>
  );
}

const AccountItemWithProxyAvatar = styled(Component)<Props>(({ theme }) => {
  const { token } = theme as Theme;

  return {
    background: token.colorBgInput,
    padding: token.paddingSM,
    minHeight: 52,
    paddingRight: token.paddingSM,
    borderRadius: token.borderRadiusLG,
    alignItems: 'center',
    display: 'flex',
    cursor: 'pointer',
    transition: `background ${token.motionDurationMid} ease-in-out`,
    gap: token.sizeXS,

    '.__item-middle-part': {
      flex: 1,
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'row',

      '.account-item-address-wrapper.-is-wrap-parentheses:before': {
        content: "'('",
        marginLeft: token.marginXXS
      },

      '.account-item-address-wrapper.-is-wrap-parentheses:after': {
        content: "')'"
      },

      '.__account-name-item': {
        maxWidth: 250,
        overflow: 'hidden',
        textWrap: 'nowrap',
        textOverflow: 'ellipsis'
      },

      '.__account-name-item.-is-show-fallback': {
        maxWidth: 150
      }
    },

    '.__item-right-part': {
      display: 'flex'
    },

    '.__checked-icon-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      minWidth: 40,
      marginRight: -token.marginXS
    },

    '.account-item-address-wrapper': {
      color: token.colorTextDescription,
      whiteSpace: 'nowrap'
    }
  };
});

export default AccountItemWithProxyAvatar;
