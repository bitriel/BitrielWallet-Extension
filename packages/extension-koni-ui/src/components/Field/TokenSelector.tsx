// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { _getChainName, _isAssetFungibleToken } from '@bitriel/extension-base/services/chain-service/utils';
import { TokenSelectorItem } from '@bitriel/extension-koni-ui/components';
import { BasicInputWrapper } from '@bitriel/extension-koni-ui/components/Field/Base';
import { useSelector } from '@bitriel/extension-koni-ui/hooks';
import { useChainAssets } from '@bitriel/extension-koni-ui/hooks/assets';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import { useSelectModalInputHelper } from '@bitriel/extension-koni-ui/hooks/form/useSelectModalInputHelper';
import { Theme, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { TokenSelectorItemType } from '@bitriel/extension-koni-ui/types/field';
import { InputRef, Logo, SelectModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { GeneralEmptyList } from '../EmptyList';

interface Props extends ThemeProps, BasicInputWrapper {
  items: TokenSelectorItemType[];
  showChainInSelected?: boolean;
  prefixShape?: 'circle' | 'none' | 'squircle' | 'square';
  filterFunction?: (chainAsset: _ChainAsset) => boolean
}

const renderEmpty = () => <GeneralEmptyList />;

function Component (props: Props, ref: ForwardedRef<InputRef>): React.ReactElement<Props> {
  const { className = '', disabled, filterFunction = _isAssetFungibleToken, id = 'token-select', items, label, placeholder, showChainInSelected = false, statusHelp, tooltip, value } = props;
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const assetRegistry = useChainAssets({}).chainAssetRegistry;
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const { onSelect } = useSelectModalInputHelper(props, ref);

  const selectedItem = useMemo(() => {
    if (!value) {
      return undefined;
    }

    return items.find((i) => i.slug === value);
  }, [items, value]);

  const filteredItems = useMemo((): TokenSelectorItemType[] => {
    let result = items.filter((item) => {
      const chainAsset = assetRegistry[item.slug];

      return chainAsset ? filterFunction(chainAsset) : false;
    });

    if (selectedItem) {
      result = result.filter((i) => i.slug !== selectedItem.slug);

      result.unshift(selectedItem);
    }

    return result;
  }, [assetRegistry, filterFunction, items, selectedItem]);

  const chainLogo = useMemo(() => {
    const tokenInfo = filteredItems.find((x) => x.slug === value);

    return tokenInfo &&
      (
        <Logo
          className='token-logo'
          isShowSubLogo={true}
          shape='squircle'
          size={token.controlHeightSM}
          subNetwork={tokenInfo.originChain}
          token={tokenInfo.slug.toLowerCase()}
        />
      );
  }, [filteredItems, token.controlHeightSM, value]);

  const renderTokenSelected = useCallback((item: TokenSelectorItemType) => {
    return (
      <div className={'__selected-item'}>
        {item.symbol}
        {showChainInSelected}
      </div>
    );
  }, [showChainInSelected]);

  const searchFunction = useCallback((item: TokenSelectorItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const chainName = chainInfoMap[item.originChain]?.name?.toLowerCase();
    const symbol = item.symbol.toLowerCase();

    return (
      symbol.includes(searchTextLowerCase) ||
      chainName.includes(searchTextLowerCase)
    );
  }, [chainInfoMap]);

  const renderItem = useCallback((item: TokenSelectorItemType, selected: boolean) => {
    return (
      <TokenSelectorItem
        balanceInfo={item.balanceInfo}
        chainName={_getChainName(chainInfoMap[item.originChain])}
        chainSlug={item.originChain}
        className={CN('token-selector-item')}
        isSelected={selected}
        key={item.slug}
        showBalance={true}
        tokenSlug={item.slug}
        tokenSymbol={item.symbol}
      />
    );
  }, [chainInfoMap]);

  useEffect(() => {
    if (!value) {
      if (filteredItems[0]?.slug) {
        onSelect(filteredItems[0].slug);
      }
    } else {
      const existed = filteredItems.find((item) => item.slug === value);

      if (!existed) {
        onSelect(filteredItems[0]?.slug || '');
      }
    }
  }, [value, filteredItems, onSelect]);

  return (
    <SelectModal
      className={`${className} chain-selector-modal`}
      destroyOnClose={true}
      disabled={disabled}
      id={id}
      inputClassName={`${className} chain-selector-input`}
      itemKey={'slug'}
      items={filteredItems}
      label={label}
      onSelect={onSelect}
      placeholder={placeholder || t('Select token')}
      prefix={value !== '' && chainLogo}
      renderItem={renderItem}
      renderSelected={renderTokenSelected}
      renderWhenEmpty={renderEmpty}
      searchFunction={searchFunction}
      searchMinCharactersCount={2}
      searchPlaceholder={t<string>('Enter token name or network name')}
      selected={value || ''}
      statusHelp={statusHelp}
      title={label || placeholder || t('Select token')}
      tooltip={tooltip}
    />
  );
}

export const TokenSelector = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.ant-select-modal-input-container .ant-select-modal-input-wrapper': {
      paddingLeft: 12,
      paddingRight: 12
    },

    '&.chain-selector-input .__selected-item': {
      color: token.colorText,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      textWrap: 'nowrap',
      whiteSpace: 'nowrap'
    }

  });
});
