// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetSymbol } from '@bitriel/extension-base/services/chain-service/utils';
import { CHOOSE_FEE_TOKEN_MODAL } from '@bitriel/extension-koni-ui/constants';
import { useSelector } from '@bitriel/extension-koni-ui/hooks';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Icon, Logo, ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  slug: string,
  selected?: boolean,
  onSelect?: (slug: string) => void,
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, onSelect, selected, slug } = props;
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);
  const { inactiveModal } = useContext(ModalContext);
  const _onSelect = useCallback(() => {
    onSelect?.(slug);
    setTimeout(() => {
      inactiveModal(CHOOSE_FEE_TOKEN_MODAL);
    }, 100);
  }, [onSelect, slug, inactiveModal]);

  const feeAssetInfo = useMemo(() => {
    return (slug ? assetRegistryMap[slug] : undefined);
  }, [assetRegistryMap, slug]);

  return (
    <>
      <div
        className={CN(className, '__choose-fee-item-wrapper')}
        onClick={_onSelect}
      >
        <div className={'__left-part'}>
          <Logo
            className='token-logo'
            isShowSubLogo={false}
            shape='squircle'
            size={40}
            token={slug.toLowerCase()}
          />
          <div className={'__fee-info'}>
            <div className={'__line-1'}>
              <div className={'__fee-symbol'}>{_getAssetSymbol(feeAssetInfo)}</div>
            </div>
          </div>
        </div>
        {selected && (
          <Icon
            className='check-icon'
            phosphorIcon={CheckCircle}
            size='md'
            weight='fill'
          />
        )}
      </div>
    </>
  );
};

const ChooseFeeTokenItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    '.__left-part': {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },
    '.__fee-info': {
      fontSize: 16,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite
    },
    '.__line-2': {
      fontSize: 12,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextTertiary
    },
    '.check-icon': {
      color: token.colorSuccess
    }
  };
});

export default ChooseFeeTokenItem;
