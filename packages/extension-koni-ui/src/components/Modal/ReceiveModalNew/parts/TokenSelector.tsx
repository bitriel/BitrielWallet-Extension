// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { _getChainName } from '@bitriel/extension-base/services/chain-service/utils';
import { TokenSelectorItem } from '@bitriel/extension-koni-ui/components';
import TokenEmptyList from '@bitriel/extension-koni-ui/components/EmptyList/TokenEmptyList';
import Search from '@bitriel/extension-koni-ui/components/Search';
import { RECEIVE_MODAL_TOKEN_SELECTOR } from '@bitriel/extension-koni-ui/constants';
import { useIsModalInactive, useSelector, useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { sortTokensByStandard } from '@bitriel/extension-koni-ui/utils';
import { SwList, SwModal } from '@subwallet/react-ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  onSelectItem?: (item: _ChainAsset) => void,
  items: _ChainAsset[];
  onCancel?: VoidFunction;
}

const modalId = RECEIVE_MODAL_TOKEN_SELECTOR;

const renderEmpty = () => <TokenEmptyList modalId={modalId} />;

// todo : will move to Modal/Selector if is necessary
function Component ({ className = '', items, onCancel, onSelectItem }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [currentSearchText, setCurrentSearchText] = useState<string>('');
  // @ts-ignore
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const priorityTokens = useSelector((state: RootState) => state.chainStore.priorityTokens);
  const isModalInactive = useIsModalInactive(modalId);

  const listItems = useMemo(() => {
    const filteredList = items.filter((item) => {
      const chainName = _getChainName(chainInfoMap[item.originChain]);

      return item.symbol.toLowerCase().includes(currentSearchText.toLowerCase()) || chainName.toLowerCase().includes(currentSearchText.toLowerCase());
    });

    if (!currentSearchText) {
      sortTokensByStandard(filteredList, priorityTokens);

      return filteredList;
    }

    if (currentSearchText.toLowerCase() === 'ton') {
      const tonItemIndex = filteredList.findIndex((item) => item.slug === 'ton-NATIVE-TON');

      if (tonItemIndex !== -1) {
        const [tonItem] = filteredList.splice(tonItemIndex, 1);

        if (tonItem) {
          filteredList.unshift(tonItem);
        }
      }

      return filteredList;
    }

    return filteredList;
  }, [chainInfoMap, currentSearchText, items, priorityTokens]);

  const handleSearch = useCallback((value: string) => {
    setCurrentSearchText(value);
  }, []);

  const onSelect = useCallback((item: _ChainAsset) => {
    return () => {
      onSelectItem?.(item);
    };
  }, [onSelectItem]);

  const renderItem = useCallback((item: _ChainAsset) => {
    return (
      <TokenSelectorItem
        chainName={_getChainName(chainInfoMap[item.originChain])}
        chainSlug={item.originChain}
        className={'token-selector-item'}
        key={item.slug}
        onClick={onSelect(item)}
        tokenSlug={item.slug}
        tokenSymbol={item.symbol}
      />
    );
  }, [chainInfoMap, onSelect]);

  useEffect(() => {
    if (isModalInactive) {
      setTimeout(() => {
        setCurrentSearchText('');
      }, 100);
    }
  }, [isModalInactive]);

  const onPressCancel = useCallback(() => {
    setCurrentSearchText('');
    onCancel && onCancel();
  }, [onCancel]);

  return (
    <SwModal
      className={`${className}`}
      destroyOnClose={true}
      id={modalId}
      onCancel={onPressCancel}
      title={t('Select token')}
    >
      <Search
        autoFocus={true}
        className={'__search-box'}
        onSearch={handleSearch}
        placeholder={t<string>('Enter token name or network name')}
        searchValue={currentSearchText}
      />
      <SwList
        className={'__list-container'}
        list={listItems}
        renderItem={renderItem}
        renderWhenEmpty={renderEmpty}
        searchableMinCharactersCount={2}
      />
    </SwModal>
  );
}

export const TokenSelectorModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-modal-content': {
      height: '100vh'
    },

    '.ant-sw-modal-body': {
      overflow: 'auto',
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      paddingBottom: 0
    },

    '.ant-sw-list-section': {
      flex: 1
    },

    '.ant-sw-list': {
      paddingBottom: 0
    },

    '.__search-box': {
      marginBottom: token.marginXS
    },

    '.__list-container': {
      flex: 1,
      overflow: 'auto',

      '> div + div': {
        marginTop: token.marginXS
      }
    },

    '.ant-sw-modal-footer.ant-sw-modal-footer': {
      borderTop: 0
    },

    '.token-selector-item + .token-selector-item': {
      marginTop: token.marginXS
    }
  });
});
