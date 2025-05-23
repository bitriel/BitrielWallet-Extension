// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@subwallet/keyring/types';

import { _ChainAsset } from '@bitriel/chain-list/types';
import { _getAssetOriginChain, _getMultiChainAsset } from '@bitriel/extension-base/services/chain-service/utils';
import { TON_CHAINS } from '@bitriel/extension-base/services/earning-service/constants';
import { AccountActions, AccountProxyType } from '@bitriel/extension-base/types';
import { RECEIVE_MODAL_ACCOUNT_SELECTOR, RECEIVE_MODAL_TOKEN_SELECTOR } from '@bitriel/extension-koni-ui/constants';
import { WalletModalContext } from '@bitriel/extension-koni-ui/contexts/WalletModalContextProvider';
import { useGetChainSlugsByAccount, useHandleLedgerGenericAccountWarning, useHandleTonAccountWarning, useIsPolkadotUnifiedChain, useReformatAddress } from '@bitriel/extension-koni-ui/hooks';
import { useChainAssets } from '@bitriel/extension-koni-ui/hooks/assets';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { AccountAddressItemType, ReceiveModalProps } from '@bitriel/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

type HookType = {
  onOpenReceive: VoidFunction;
  receiveModalProps: ReceiveModalProps;
};

const tokenSelectorModalId = RECEIVE_MODAL_TOKEN_SELECTOR;
const accountSelectorModalId = RECEIVE_MODAL_ACCOUNT_SELECTOR;

export default function useCoreReceiveModalHelper (tokenGroupSlug?: string): HookType {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { chainAssets } = useChainAssets();

  const accountProxies = useSelector((state: RootState) => state.accountState.accountProxies);
  const isAllAccount = useSelector((state: RootState) => state.accountState.isAllAccount);
  const currentAccountProxy = useSelector((state: RootState) => state.accountState.currentAccountProxy);
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const [selectedChain, setSelectedChain] = useState<string | undefined>();
  const [selectedAccountAddressItem, setSelectedAccountAddressItem] = useState<AccountAddressItemType | undefined>();
  const { addressQrModal, selectAddressFormatModal } = useContext(WalletModalContext);
  const chainSupported = useGetChainSlugsByAccount();
  const onHandleTonAccountWarning = useHandleTonAccountWarning();
  const onHandleLedgerGenericAccountWarning = useHandleLedgerGenericAccountWarning();
  const getReformatAddress = useReformatAddress();
  const checkIsPolkadotUnifiedChain = useIsPolkadotUnifiedChain();

  // chain related to tokenGroupSlug, if it is token slug
  const specificChain = useMemo(() => {
    if (tokenGroupSlug && assetRegistryMap[tokenGroupSlug]) {
      return _getAssetOriginChain(assetRegistryMap[tokenGroupSlug]);
    }

    return undefined;
  }, [assetRegistryMap, tokenGroupSlug]);

  const openAddressQrModal = useCallback((address: string, accountType: KeypairType, accountProxyId: string, chainSlug: string, closeCallback?: VoidCallback, showQrBack = true) => {
    const processFunction = () => {
      addressQrModal.open({
        address,
        chainSlug,
        onBack: showQrBack ? addressQrModal.close : undefined,
        onCancel: () => {
          addressQrModal.close();
          closeCallback?.();
        }
      });
    };

    onHandleTonAccountWarning(accountType, () => {
      onHandleLedgerGenericAccountWarning({
        accountProxy: accountProxies.find((ap) => ap.id === accountProxyId),
        chainSlug
      }, processFunction);
    });
  }, [accountProxies, addressQrModal, onHandleLedgerGenericAccountWarning, onHandleTonAccountWarning]);

  const openAddressFormatModal = useCallback((name: string, address: string, chainSlug: string, closeCallback?: VoidCallback) => {
    const processFunction = () => {
      selectAddressFormatModal.open({
        name: name,
        address: address,
        chainSlug: chainSlug,
        onBack: selectAddressFormatModal.close,
        onCancel: () => {
          selectAddressFormatModal.close();
          closeCallback?.();
        }
      });
    };

    processFunction();
  }, [selectAddressFormatModal]);

  /* --- token Selector */

  const tokenSelectorItems = useMemo<_ChainAsset[]>(() => {
    const rawAssets = chainAssets.filter((asset) => chainSupported.includes(asset.originChain));

    if (tokenGroupSlug) {
      return rawAssets.filter((asset) => asset.slug === tokenGroupSlug || _getMultiChainAsset(asset) === tokenGroupSlug);
    }

    return rawAssets;
  }, [chainAssets, tokenGroupSlug, chainSupported]);

  const onCloseTokenSelector = useCallback(() => {
    inactiveModal(tokenSelectorModalId);
  }, [inactiveModal]);

  const onSelectTokenSelector = useCallback((item: _ChainAsset) => {
    // do not need the logic to check if item is compatible with currentAccountProxy here, it's already in tokenSelectorItems code block

    if (!currentAccountProxy) {
      return;
    }

    const chainSlug = _getAssetOriginChain(item);
    const chainInfo = chainInfoMap[chainSlug];

    if (!chainInfo) {
      console.warn(`Missing chainInfo with slug ${chainSlug}`);

      return;
    }

    setSelectedChain(chainSlug);

    if (isAllAccount) {
      setTimeout(() => {
        activeModal(accountSelectorModalId);
      }, 100);

      return;
    }

    // current account is not All, just do show QR logic
    const isPolkadotUnifiedChain = checkIsPolkadotUnifiedChain(chainSlug);

    for (const accountJson of currentAccountProxy.accounts) {
      const reformatedAddress = getReformatAddress(accountJson, chainInfo);

      if (reformatedAddress) {
        const accountAddressItem: AccountAddressItemType = {
          accountName: accountJson.name || '',
          accountProxyId: accountJson.proxyId || '',
          accountProxyType: currentAccountProxy.accountType,
          accountType: accountJson.type,
          address: reformatedAddress
        };

        setSelectedAccountAddressItem(accountAddressItem);

        if (isPolkadotUnifiedChain) {
          openAddressFormatModal(chainInfo.name, reformatedAddress, chainSlug, () => {
            inactiveModal(tokenSelectorModalId);
            setSelectedAccountAddressItem(undefined);
          });
        } else {
          openAddressQrModal(reformatedAddress, accountJson.type, currentAccountProxy.id, chainSlug, () => {
            inactiveModal(tokenSelectorModalId);
            setSelectedAccountAddressItem(undefined);
          });
        }

        break;
      }
    }
  }, [activeModal, chainInfoMap, checkIsPolkadotUnifiedChain, currentAccountProxy, inactiveModal, isAllAccount, openAddressFormatModal, openAddressQrModal, getReformatAddress]);

  /* token Selector --- */

  /* --- account Selector */

  const accountSelectorItems = useMemo<AccountAddressItemType[]>(() => {
    const targetChain = specificChain || selectedChain;
    const chainInfo = targetChain ? chainInfoMap[targetChain] : undefined;

    if (!chainInfo) {
      return [];
    }

    const result: AccountAddressItemType[] = [];

    accountProxies.forEach((ap) => {
      ap.accounts.forEach((a) => {
        const reformatedAddress = getReformatAddress(a, chainInfo);

        if (reformatedAddress) {
          result.push({
            accountName: ap.name,
            accountProxyId: ap.id,
            accountProxyType: ap.accountType,
            accountType: a.type,
            address: reformatedAddress,
            accountActions: ap.accountActions
          });
        }
      });
    });

    return result;
  }, [accountProxies, chainInfoMap, getReformatAddress, selectedChain, specificChain]);

  const onBackAccountSelector = useMemo(() => {
    // if specificChain has value, it means tokenSelector does not show up, so accountSelector does not have back action
    if (specificChain) {
      return undefined;
    }

    return () => {
      inactiveModal(accountSelectorModalId);
    };
  }, [inactiveModal, specificChain]);

  const onCloseAccountSelector = useCallback(() => {
    inactiveModal(accountSelectorModalId);
    inactiveModal(tokenSelectorModalId);
    setSelectedChain(undefined);
    setSelectedAccountAddressItem(undefined);
  }, [inactiveModal]);

  const onSelectAccountSelector = useCallback((item: AccountAddressItemType) => {
    const targetChain = specificChain || selectedChain;

    if (!targetChain) {
      return;
    }

    const chainInfo = chainInfoMap[targetChain];

    setSelectedAccountAddressItem(item);
    const isPolkadotUnifiedChain = checkIsPolkadotUnifiedChain(targetChain);

    if (isPolkadotUnifiedChain) {
      openAddressFormatModal(chainInfo.name, item.address, targetChain, onCloseAccountSelector);
    } else {
      openAddressQrModal(item.address, item.accountType, item.accountProxyId, targetChain, onCloseAccountSelector);
    }
  }, [chainInfoMap, checkIsPolkadotUnifiedChain, onCloseAccountSelector, openAddressFormatModal, openAddressQrModal, selectedChain, specificChain]);

  /* account Selector --- */

  const onOpenReceive = useCallback(() => {
    if (!currentAccountProxy) {
      return;
    }

    const handleShowQrModal = (chain: string) => {
      const chainInfo = chainInfoMap[chain];

      if (!chainInfo) {
        return;
      }

      const isPolkadotUnifiedChain = checkIsPolkadotUnifiedChain(chain);

      for (const accountJson of currentAccountProxy.accounts) {
        const reformatedAddress = getReformatAddress(accountJson, chainInfo);

        if (reformatedAddress) {
          const accountAddressItem: AccountAddressItemType = {
            accountName: accountJson.name || '',
            accountProxyId: accountJson.proxyId || '',
            accountProxyType: currentAccountProxy.accountType,
            accountType: accountJson.type,
            address: reformatedAddress
          };

          setSelectedAccountAddressItem(accountAddressItem);

          if (isPolkadotUnifiedChain) {
            openAddressFormatModal(chainInfo.name, reformatedAddress, chain, () => {
              setSelectedAccountAddressItem(undefined);
            });
          } else {
            openAddressQrModal(reformatedAddress, accountJson.type, currentAccountProxy.id, chain, () => {
              setSelectedAccountAddressItem(undefined);
            }, false);
          }

          break;
        }
      }
    };

    if (specificChain) {
      if (!chainSupported.includes(specificChain)) {
        console.warn('tokenGroupSlug does not work with current account');

        return;
      }

      // current account is All
      if (isAllAccount) {
        activeModal(accountSelectorModalId);

        return;
      }

      // current account is not All, just do show QR logic

      handleShowQrModal(specificChain);

      return;
    }

    if (tokenSelectorItems.length === 1 && tokenGroupSlug) {
      if (isAllAccount) {
        setSelectedChain(tokenSelectorItems[0].originChain);
        activeModal(accountSelectorModalId);

        return;
      }

      handleShowQrModal(tokenSelectorItems[0].originChain);

      return;
    }

    activeModal(tokenSelectorModalId);
  }, [activeModal, chainInfoMap, chainSupported, checkIsPolkadotUnifiedChain, currentAccountProxy, getReformatAddress, isAllAccount, openAddressFormatModal, openAddressQrModal, specificChain, tokenGroupSlug, tokenSelectorItems]);

  useEffect(() => {
    if (addressQrModal.checkActive() && selectedAccountAddressItem) {
      addressQrModal.update((prev) => {
        if (!prev || !TON_CHAINS.includes(prev.chainSlug)) {
          return prev;
        }

        const targetAddress = accountSelectorItems.find((i) => i.accountProxyId === selectedAccountAddressItem.accountProxyId)?.address;

        if (targetAddress) {
          return {
            ...prev,
            address: targetAddress
          };
        }

        const selectedAccount = accountSelectorItems.find((item) => item.accountName === selectedAccountAddressItem.accountName);
        const isSoloAccount = selectedAccount?.accountProxyType === AccountProxyType.SOLO;
        const hasTonChangeWalletContractVersion = selectedAccount?.accountActions?.includes(AccountActions.TON_CHANGE_WALLET_CONTRACT_VERSION);
        const latestAddress = selectedAccount?.address;

        if (isSoloAccount && hasTonChangeWalletContractVersion && latestAddress) {
          setSelectedAccountAddressItem(selectedAccount);

          return {
            ...prev,
            address: latestAddress
          };
        }

        return prev;
      });
    }
  }, [accountSelectorItems, addressQrModal, selectedAccountAddressItem]);

  return useMemo(() => ({
    onOpenReceive,
    receiveModalProps: {
      tokenSelectorItems,
      onCloseTokenSelector,
      onSelectTokenSelector,
      accountSelectorItems,
      onBackAccountSelector,
      onCloseAccountSelector,
      onSelectAccountSelector
    }
  }), [accountSelectorItems, onBackAccountSelector, onCloseAccountSelector, onCloseTokenSelector, onOpenReceive, onSelectAccountSelector, onSelectTokenSelector, tokenSelectorItems]);
}
