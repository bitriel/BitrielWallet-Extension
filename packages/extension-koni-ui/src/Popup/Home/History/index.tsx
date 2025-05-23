// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@bitriel/extension-base/background/KoniTypes';
import { YIELD_EXTRINSIC_TYPES } from '@bitriel/extension-base/koni/api/yield/helper/utils';
import { _isChainEvmCompatible } from '@bitriel/extension-base/services/chain-service/utils';
import { quickFormatAddressToCompare } from '@bitriel/extension-base/utils';
import { AccountAddressSelector, BasicInputEvent, ChainSelector, EmptyList, FilterModal, HistoryItem, Layout, PageWrapper } from '@bitriel/extension-koni-ui/components';
import { DEFAULT_SESSION_VALUE, HISTORY_DETAIL_MODAL, LATEST_SESSION, REMIND_BACKUP_SEED_PHRASE_MODAL } from '@bitriel/extension-koni-ui/constants';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useHistorySelection, useSelector, useSetCurrentPage } from '@bitriel/extension-koni-ui/hooks';
import { cancelSubscription, subscribeTransactionHistory } from '@bitriel/extension-koni-ui/messaging';
import { SessionStorage, ThemeProps, TransactionHistoryDisplayData, TransactionHistoryDisplayItem } from '@bitriel/extension-koni-ui/types';
import { customFormatDate, formatHistoryDate, isTypeStaking, isTypeTransfer } from '@bitriel/extension-koni-ui/utils';
import { ButtonProps, Icon, ModalContext, SwIconProps, SwList, SwSubHeader } from '@subwallet/react-ui';
import { Aperture, ArrowDownLeft, ArrowsLeftRight, ArrowUpRight, Clock, ClockCounterClockwise, Database, FadersHorizontal, Rocket, Spinner } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { HistoryDetailModal } from './Detail';

type Props = ThemeProps

const IconMap: Record<string, SwIconProps['phosphorIcon']> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  claim_reward: ClockCounterClockwise,
  staking: Database,
  crowdloan: Rocket,
  nft: Aperture,
  processing: Spinner,
  default: ClockCounterClockwise,
  timeout: ClockCounterClockwise,
  swap: ArrowsLeftRight
};

function getIcon (item: TransactionHistoryItem): SwIconProps['phosphorIcon'] {
  if (item.status === ExtrinsicStatus.PROCESSING || item.status === ExtrinsicStatus.SUBMITTING) {
    return IconMap.processing;
  }

  if (item.status === ExtrinsicStatus.TIMEOUT) {
    return IconMap.timeout;
  }

  if (item.type === ExtrinsicType.SEND_NFT) {
    return IconMap.nft;
  }

  if (item.type === ExtrinsicType.CROWDLOAN) {
    return IconMap.crowdloan;
  }

  if (item.type === ExtrinsicType.STAKING_CLAIM_REWARD) {
    return IconMap.claim_reward;
  }

  if (item.type === ExtrinsicType.SWAP) {
    return IconMap.swap;
  }

  if (isTypeStaking(item.type)) {
    return IconMap.staking;
  }

  return IconMap.default;
}

function getDisplayData (item: TransactionHistoryItem, nameMap: Record<string, string>, titleMap: Record<string, string>): TransactionHistoryDisplayData {
  let displayData: TransactionHistoryDisplayData;
  const time = customFormatDate(item.time, '#hhhh#:#mm#');

  const displayStatus = item.status === ExtrinsicStatus.FAIL ? 'fail' : '';

  if (item.type === ExtrinsicType.TRANSFER_BALANCE || item.type === ExtrinsicType.TRANSFER_TOKEN || item.type === ExtrinsicType.TRANSFER_XCM || item.type === ExtrinsicType.EVM_EXECUTE) {
    if (item.direction === TransactionDirection.RECEIVED) {
      displayData = {
        className: `-receive -${item.status}`,
        title: titleMap.received,
        name: nameMap.received,
        typeName: `${nameMap.received} ${displayStatus} - ${time}`,
        icon: IconMap.receive
      };
    } else {
      displayData = {
        className: `-send -${item.status}`,
        title: titleMap.send,
        name: nameMap.send,
        typeName: `${nameMap.send} ${displayStatus} - ${time}`,
        icon: IconMap.send
      };
    }
  } else {
    const typeName = nameMap[item.type] || nameMap.default;

    displayData = {
      className: `-${item.type} -${item.status}`,
      title: titleMap[item.type],
      typeName: `${typeName} ${displayStatus} - ${time}`,
      name: nameMap[item.type],
      icon: getIcon(item)
    };
  }

  if (item.status === ExtrinsicStatus.PROCESSING) {
    displayData.className = '-processing';
    displayData.typeName = nameMap.processing;
  }

  if (item.status === ExtrinsicStatus.TIMEOUT) {
    displayData.className = '-processing';
    displayData.typeName = nameMap.timeout;
  }

  if (item.status === ExtrinsicStatus.SUBMITTING) {
    displayData.className = '-processing';
    displayData.typeName = nameMap.submitting;
  }

  return displayData;
}

const FILTER_MODAL_ID = 'history-filter-id';

enum FilterValue {
  ALL = 'all',
  TOKENS = 'tokens',
  SEND = 'send',
  RECEIVED = 'received',
  NFT = 'nft',
  STAKE = 'stake',
  CLAIM = 'claim',
  CROWDLOAN = 'crowdloan',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  EARN = 'earn',
  SWAP = 'swap'
}

function getHistoryItemKey (item: Pick<TransactionHistoryItem, 'chain' | 'address' | 'extrinsicHash' | 'transactionId'>) {
  return `${item.chain}-${item.address}-${item.transactionId || item.extrinsicHash}`;
}

function filterDuplicateItems (items: TransactionHistoryItem[]): TransactionHistoryItem[] {
  const result: TransactionHistoryItem[] = [];

  const exclusionMap: Record<string, boolean> = {};

  const getExclusionKey = (i: TransactionHistoryItem): string => {
    if (i.type === ExtrinsicType.TRANSFER_TOKEN) {
      return `${i.direction}_${i.blockNumber}_${ExtrinsicType.TRANSFER_BALANCE}_${i.from}_${i.to}`.toLowerCase();
    }

    return `${i.direction}_${i.blockNumber}_${i.type}_${i.from}_${i.to}`.toLowerCase();
  };

  items.forEach((i) => {
    if (i.origin === 'app' && i.blockNumber > 0 && (i.type === ExtrinsicType.TRANSFER_BALANCE || i.type === ExtrinsicType.TRANSFER_TOKEN)) {
      exclusionMap[getExclusionKey(i)] = true;
    }
  });

  if (!Object.keys(exclusionMap).length) {
    return items;
  }

  items.forEach((i) => {
    if (i.origin === 'subscan' && exclusionMap[getExclusionKey(i)]) {
      return;
    }

    result.push(i);
  });

  return result;
}

const modalId = HISTORY_DETAIL_MODAL;
const remindSeedPhraseModalId = REMIND_BACKUP_SEED_PHRASE_MODAL;
const DEFAULT_ITEMS_COUNT = 20;
const NEXT_ITEMS_COUNT = 10;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  useSetCurrentPage('/home/history');
  const dataContext = useContext(DataContext);
  const { t } = useTranslation();
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { accounts, currentAccountProxy, isAllAccount } = useSelector((root) => root.accountState);
  const { chainInfoMap } = useSelector((root) => root.chainStore);
  const { language } = useSelector((root) => root.settings);
  const [loading, setLoading] = useState<boolean>(true);
  const [rawHistoryList, setRawHistoryList] = useState<TransactionHistoryItem[]>([]);
  const isActive = checkActive(modalId);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: TransactionHistoryItem) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.SEND) {
          if (isTypeTransfer(item.type) && item.direction === TransactionDirection.SEND) {
            return true;
          }
        } else if (filter === FilterValue.RECEIVED) {
          if (isTypeTransfer(item.type) && item.direction === TransactionDirection.RECEIVED) {
            return true;
          }
        } else if (filter === FilterValue.NFT) {
          if (item.type === ExtrinsicType.SEND_NFT) {
            return true;
          }
        } else if (filter === FilterValue.STAKE) {
          if (isTypeStaking(item.type)) {
            return true;
          }
        } else if (filter === FilterValue.CLAIM) {
          if (item.type === ExtrinsicType.STAKING_CLAIM_REWARD) {
            return true;
          }
        } else if (filter === FilterValue.CROWDLOAN) {
          if (item.type === ExtrinsicType.CROWDLOAN) {
            return true;
          }
        } else if (filter === FilterValue.SWAP) {
          if (item.type === ExtrinsicType.SWAP) {
            return true;
          }
        } else if (filter === FilterValue.SUCCESSFUL) {
          if (item.status === ExtrinsicStatus.SUCCESS) {
            return true;
          }
        } else if (filter === FilterValue.FAILED) {
          if (item.status === ExtrinsicStatus.FAIL) {
            return true;
          }
        } else if (filter === FilterValue.EARN) {
          if (YIELD_EXTRINSIC_TYPES.includes(item.type)) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const filterOptions = useMemo(() => {
    return [
      { label: t('Send token'), value: FilterValue.SEND },
      { label: t('Receive token'), value: FilterValue.RECEIVED },
      { label: t('NFT transaction'), value: FilterValue.NFT },
      { label: t('Earning transaction'), value: FilterValue.STAKE },
      { label: t('Claim reward'), value: FilterValue.CLAIM },
      { label: t('Swap'), value: FilterValue.SWAP },
      // { label: t('Crowdloan transaction'), value: FilterValue.CROWDLOAN }, // support crowdloan later
      { label: t('Successful'), value: FilterValue.SUCCESSFUL },
      { label: t('Failed'), value: FilterValue.FAILED }
    ];
  }, [t]);

  const accountMap = useMemo(() => {
    return accounts.reduce((accMap, cur) => {
      accMap[cur.address.toLowerCase()] = cur.name || '';

      return accMap;
    }, {} as Record<string, string>);
  }, [accounts]);

  const typeNameMap: Record<string, string> = useMemo((): Record<ExtrinsicType | 'default' | 'submitting' | 'processing' | 'timeout' | 'send' | 'received', string> => ({
    default: t('Transaction'),
    submitting: t('Submitting...'),
    processing: t('Processing...'),
    timeout: t('Time-out'),
    send: t('Send'),
    received: t('Receive'),
    [ExtrinsicType.TRANSFER_BALANCE]: t('Send token'),
    [ExtrinsicType.TRANSFER_TOKEN]: t('Send token'),
    [ExtrinsicType.TRANSFER_XCM]: t('Send token'),
    [ExtrinsicType.SEND_NFT]: t('NFT'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Stake'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unstake'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim Reward'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_POOL_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: t('Cancel unstake'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compound'),
    [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: t('Cancel compound'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Transaction'),
    [ExtrinsicType.JOIN_YIELD_POOL]: t('Stake'),
    [ExtrinsicType.MINT_QDOT]: t('Mint qDOT'),
    [ExtrinsicType.MINT_SDOT]: t('Mint sDOT'),
    [ExtrinsicType.MINT_LDOT]: t('Mint LDOT'),
    [ExtrinsicType.MINT_VDOT]: t('Mint vDOT'),
    [ExtrinsicType.MINT_VMANTA]: t('Mint vMANTA'),
    [ExtrinsicType.MINT_STDOT]: t('Mint stDOT'),
    [ExtrinsicType.REDEEM_QDOT]: t('Redeem qDOT'),
    [ExtrinsicType.REDEEM_SDOT]: t('Redeem sDOT'),
    [ExtrinsicType.REDEEM_LDOT]: t('Redeem LDOT'),
    [ExtrinsicType.REDEEM_VDOT]: t('Redeem vDOT'),
    [ExtrinsicType.REDEEM_VMANTA]: t('Redeem vMANTA'),
    [ExtrinsicType.REDEEM_STDOT]: t('Redeem stDOT'),
    [ExtrinsicType.UNSTAKE_QDOT]: t('Unstake qDOT'),
    [ExtrinsicType.UNSTAKE_VDOT]: t('Unstake vDOT'),
    [ExtrinsicType.UNSTAKE_VMANTA]: t('Unstake vMANTA'),
    [ExtrinsicType.UNSTAKE_LDOT]: t('Unstake LDOT'),
    [ExtrinsicType.UNSTAKE_SDOT]: t('Unstake sDOT'),
    [ExtrinsicType.UNSTAKE_STDOT]: t('Unstake stDOT'),
    [ExtrinsicType.TOKEN_SPENDING_APPROVAL]: t('Token approve'),
    [ExtrinsicType.SWAP]: t('Swap'),
    [ExtrinsicType.CLAIM_BRIDGE]: t('Claim token'),
    [ExtrinsicType.UNKNOWN]: t('Unknown')
  }), [t]);

  const typeTitleMap: Record<string, string> = useMemo((): Record<ExtrinsicType | 'default' | 'send' | 'received', string> => ({
    default: t('Transaction'),
    send: t('Send token'),
    received: t('Receive token'),
    [ExtrinsicType.TRANSFER_BALANCE]: t('Send token'),
    [ExtrinsicType.TRANSFER_TOKEN]: t('Send token'),
    [ExtrinsicType.TRANSFER_XCM]: t('Send token'),
    [ExtrinsicType.SEND_NFT]: t('NFT transaction'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan transaction'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake transaction'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake transaction'),
    [ExtrinsicType.STAKING_BOND]: t('Stake transaction'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unstake transaction'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim Reward transaction'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw transaction'),
    [ExtrinsicType.STAKING_POOL_WITHDRAW]: t('Withdraw transaction'),
    [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: t('Cancel unstake transaction'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compound transaction'),
    [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: t('Cancel compound transaction'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Transaction'),
    [ExtrinsicType.JOIN_YIELD_POOL]: t('Stake transaction'),
    [ExtrinsicType.MINT_QDOT]: t('Mint qDOT transaction'),
    [ExtrinsicType.MINT_SDOT]: t('Mint sDOT transaction'),
    [ExtrinsicType.MINT_LDOT]: t('Mint LDOT transaction'),
    [ExtrinsicType.MINT_VDOT]: t('Mint vDOT transaction'),
    [ExtrinsicType.MINT_VMANTA]: t('Mint vMANTA transaction'),
    [ExtrinsicType.MINT_STDOT]: t('Mint stDOT transaction'),
    [ExtrinsicType.REDEEM_QDOT]: t('Redeem qDOT transaction'),
    [ExtrinsicType.REDEEM_SDOT]: t('Redeem sDOT transaction'),
    [ExtrinsicType.REDEEM_LDOT]: t('Redeem LDOT transaction'),
    [ExtrinsicType.REDEEM_VDOT]: t('Redeem vDOT transaction'),
    [ExtrinsicType.REDEEM_VMANTA]: t('Redeem vMANTA transaction'),
    [ExtrinsicType.REDEEM_STDOT]: t('Redeem stDOT transaction'),
    [ExtrinsicType.UNSTAKE_QDOT]: t('Unstake qDOT tranasction'),
    [ExtrinsicType.UNSTAKE_VDOT]: t('Unstake vDOT tranasction'),
    [ExtrinsicType.UNSTAKE_VMANTA]: t('Unstake vMANTA tranasction'),
    [ExtrinsicType.UNSTAKE_LDOT]: t('Unstake LDOT tranasction'),
    [ExtrinsicType.UNSTAKE_SDOT]: t('Unstake sDOT tranasction'),
    [ExtrinsicType.UNSTAKE_STDOT]: t('Unstake stDOT tranasction'),
    [ExtrinsicType.TOKEN_SPENDING_APPROVAL]: t('Token approve transaction'),
    [ExtrinsicType.SWAP]: t('Swap transaction'),
    [ExtrinsicType.CLAIM_BRIDGE]: t('Claim token transaction'),
    [ExtrinsicType.UNKNOWN]: t('Unknown transaction')
  }), [t]);

  // Fill display data to history list
  const historyMap = useMemo(() => {
    const finalHistoryMap: Record<string, TransactionHistoryDisplayItem> = {};

    rawHistoryList.forEach((item: TransactionHistoryItem) => {
      // Format display name for account by address
      const fromName = accountMap[quickFormatAddressToCompare(item.from) || ''];
      const toName = accountMap[quickFormatAddressToCompare(item.to) || ''];
      const key = getHistoryItemKey(item);

      finalHistoryMap[key] = { ...item, fromName, toName, displayData: getDisplayData(item, typeNameMap, typeTitleMap) };
    });

    return finalHistoryMap;
  }, [accountMap, rawHistoryList, typeNameMap, typeTitleMap]);

  const [currentItemDisplayCount, setCurrentItemDisplayCount] = useState<number>(DEFAULT_ITEMS_COUNT);

  const getHistoryItems = useCallback((count: number) => {
    return Object.values(historyMap).filter(filterFunction).sort((a, b) => (b.time - a.time)).slice(0, count);
  }, [filterFunction, historyMap]);

  const [historyItems, setHistoryItems] = useState<TransactionHistoryDisplayItem[]>(getHistoryItems(DEFAULT_ITEMS_COUNT));

  const [currentAccountProxyid] = useState(currentAccountProxy?.id);

  // Handle detail modal
  const { chain, extrinsicHashOrId } = useParams();
  const [selectedItem, setSelectedItem] = useState<TransactionHistoryDisplayItem | null>(null);
  const [openDetailLink, setOpenDetailLink] = useState<boolean>(!!chain && !!extrinsicHashOrId);

  const onOpenDetail = useCallback((item: TransactionHistoryDisplayItem) => {
    return () => {
      setSelectedItem(item);
      activeModal(modalId);
    };
  }, [activeModal]);

  const onCloseDetail = useCallback(() => {
    const infoSession = Date.now();

    const { remind, timeBackup, timeCalculate } = (JSON.parse(localStorage.getItem(LATEST_SESSION) || JSON.stringify(DEFAULT_SESSION_VALUE))) as SessionStorage;

    inactiveModal(modalId);

    if (infoSession - timeCalculate >= timeBackup && remind) {
      activeModal(REMIND_BACKUP_SEED_PHRASE_MODAL);
    }

    setSelectedItem(null);
    setOpenDetailLink(false);
  }, [activeModal, inactiveModal]);

  const onClickFilter = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  useEffect(() => {
    if (extrinsicHashOrId && chain && openDetailLink) {
      const existed = Object.values(historyMap).find((item) => item.chain === chain && (item.transactionId === extrinsicHashOrId || item.extrinsicHash === extrinsicHashOrId));

      if (existed) {
        setSelectedItem(existed);
        inactiveModal(REMIND_BACKUP_SEED_PHRASE_MODAL);
        activeModal(modalId);
      }
    }
  }, [activeModal, chain, extrinsicHashOrId, openDetailLink, historyMap, inactiveModal]);

  useEffect(() => {
    if (isActive) {
      setSelectedItem((selected) => {
        if (selected) {
          const key = getHistoryItemKey(selected);

          return historyMap[key] || null;
        } else {
          return selected;
        }
      });
      inactiveModal(remindSeedPhraseModalId);
    }
  }, [isActive, historyMap, inactiveModal]);

  useEffect(() => {
    if (currentAccountProxy?.id !== currentAccountProxyid) {
      inactiveModal(modalId);
      setSelectedItem(null);
    }
  }, [currentAccountProxyid, currentAccountProxy?.id, inactiveModal]);

  const { accountAddressItems, chainItems, selectedAddress, selectedChain, setSelectedAddress,
    setSelectedChain } = useHistorySelection();

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your transactions will show up here')}
        emptyTitle={t('No transactions found')}
        phosphorIcon={Clock}
      />
    );
  }, [t]);

  const renderItem = useCallback(
    (item: TransactionHistoryDisplayItem) => {
      return (
        <HistoryItem
          item={item}
          key={`${item.extrinsicHash}-${item.address}-${item.direction}`}
          onClick={onOpenDetail(item)}
        />
      );
    },
    [onOpenDetail]
  );

  const groupBy = useCallback((item: TransactionHistoryItem) => {
    return formatHistoryDate(item.time, language, 'list');
  }, [language]);

  const groupSeparator = useCallback((group: TransactionHistoryItem[], idx: number, groupLabel: string) => {
    return (
      <div className='__group-separator'>{groupLabel}</div>
    );
  }, []);

  const onSelectAccount = useCallback((event: BasicInputEvent) => {
    setSelectedAddress(event.target.value);
  }, [setSelectedAddress]);

  const onSelectChain = useCallback((event: BasicInputEvent) => {
    setSelectedChain(event.target.value);
  }, [setSelectedChain]);

  const isChainSelectorEmpty = !chainItems.length;

  const historySelectorsNode = (
    <>
      <ChainSelector
        className={'__history-chain-selector'}
        disabled={isChainSelectorEmpty}
        items={chainItems}
        loading={loading}
        onChange={onSelectChain}
        title={t('Select chain')}
        value={selectedChain}
      />

      {
        (isAllAccount || accountAddressItems.length > 1) && (
          <AccountAddressSelector
            className={'__history-address-selector'}
            items={accountAddressItems}
            onChange={onSelectAccount}
            value={selectedAddress}
          />
        )
      }
    </>
  );

  const _onApplyFilter = useCallback(() => {
    onApplyFilter();
    setCurrentItemDisplayCount(DEFAULT_ITEMS_COUNT);
  }, [onApplyFilter]);

  const onLoadMoreItems = useCallback(() => {
    setCurrentItemDisplayCount((prev) => {
      const rawItemsLength = rawHistoryList.filter(filterFunction).length;

      if (prev + NEXT_ITEMS_COUNT > rawItemsLength) {
        return rawItemsLength;
      } else {
        return prev + NEXT_ITEMS_COUNT;
      }
    });
  }, [filterFunction, rawHistoryList]);

  const hasMoreItems = useMemo(() => {
    return rawHistoryList.filter(filterFunction).length > historyItems.length;
  }, [filterFunction, historyItems.length, rawHistoryList]);

  const listSection = useMemo(() => (
    <>
      <div className={'__page-list-area'}>
        <SwList
          groupBy={groupBy}
          groupSeparator={groupSeparator}
          hasMoreItems={hasMoreItems}
          list={historyItems}
          loadMoreItems={onLoadMoreItems}
          renderItem={renderItem}
          renderOnScroll={false}
          renderWhenEmpty={emptyList}
        />
      </div>
    </>
  ), [emptyList, groupBy, groupSeparator, hasMoreItems, historyItems, onLoadMoreItems, renderItem]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={FadersHorizontal}
            type='phosphor'
          />
        ),
        onClick: onClickFilter
      }
    ];
  }, [onClickFilter]);

  const isSelectedChainEvm = useMemo(() => {
    const selectedChainInfo = chainInfoMap[selectedChain];

    return selectedChainInfo && _isChainEvmCompatible(selectedChainInfo);
  }, [chainInfoMap, selectedChain]);

  useEffect(() => {
    let id: string;
    let isSubscribed = true;

    setLoading(true);

    setCurrentItemDisplayCount(DEFAULT_ITEMS_COUNT);

    subscribeTransactionHistory(
      selectedChain,
      selectedAddress,
      (items: TransactionHistoryItem[]) => {
        if (isSubscribed) {
          setRawHistoryList(isSelectedChainEvm ? filterDuplicateItems(items) : items);
        }

        setLoading(false);
      }
    ).then((res) => {
      id = res.id;

      if (isSubscribed) {
        setRawHistoryList(isSelectedChainEvm ? filterDuplicateItems(res.items) : res.items);
      } else {
        cancelSubscription(id).catch(console.log);
      }
    }).catch((e) => {
      console.log('subscribeTransactionHistory error:', e);
    });

    return () => {
      isSubscribed = false;

      if (id) {
        cancelSubscription(id).catch(console.log);
      }
    };
  }, [isSelectedChainEvm, selectedAddress, selectedChain]);

  useEffect(() => {
    setHistoryItems(getHistoryItems(currentItemDisplayCount));
  }, [currentItemDisplayCount, getHistoryItems]);

  return (
    <>
      <PageWrapper
        className={`history ${className}`}
        resolve={dataContext.awaitStores(['price', 'chainStore', 'assetRegistry', 'balance', 'mantaPay'])}
      >
        <Layout.Base>
          <SwSubHeader
            background={'transparent'}
            center={false}
            className={'history-header'}
            paddingVertical
            rightButtons={headerIcons}
            showBackButton={false}
            title={t('History')}
          />

          <div className={'__page-background'}></div>

          <div className={'__page-tool-area'}>
            {historySelectorsNode}
          </div>

          {listSection}
        </Layout.Base>
      </PageWrapper>

      <HistoryDetailModal
        data={selectedItem}
        onCancel={onCloseDetail}
      />

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={_onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />
    </>
  );
}

const History = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    flexDirection: 'column',

    '.__page-background': {
      position: 'relative',
      zIndex: 1,

      '&:before': {
        content: '""',
        display: 'block',
        height: 190,
        top: 0,
        left: 0,
        right: 0,
        position: 'absolute',
        background: 'linear-gradient(180deg, rgba(76, 234, 172, 0.10) 0%, rgba(76, 234, 172, 0.00) 94.17%)'
      }
    },

    '.__page-tool-area': {
      display: 'flex',
      padding: token.padding,
      paddingTop: 0,
      borderBottomLeftRadius: token.size,
      borderBottomRightRadius: token.size,
      backgroundColor: token.colorBgDefault,
      gap: token.sizeSM,
      position: 'relative',
      zIndex: 2,

      '.__history-address-selector, .__history-chain-selector': {
        height: 40,
        flex: 1,
        flexBasis: '50%',
        borderRadius: 32,
        overflow: 'hidden',

        '&:before': {
          display: 'none'
        },

        '.ant-select-modal-input-wrapper': {
          paddingLeft: token.padding,
          paddingRight: token.padding
        }
      },

      '.__history-address-selector': {
        '.__selected-item-address': {
          display: 'none'
        },

        '.ant-field-container:before': {
          display: 'none'
        },

        '.ant-field-wrapper': {
          minHeight: 40,
          paddingTop: 0,
          paddingBottom: 0
        }
      }
    },

    '.__loading-area': { display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },

    '.__page-list-area': {
      flex: 1,
      overflow: 'auto',
      position: 'relative',
      zIndex: 2
    },

    '.ant-sw-list': {
      height: '100%',
      overflow: 'auto',
      paddingBottom: token.padding,
      paddingLeft: token.padding,
      paddingRight: token.padding,
      paddingTop: token.paddingSM,

      '.__infinite-loader': {
        opacity: 0
      }
    },

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.history-header.ant-sw-sub-header-container': {
      marginBottom: 0
    },

    '.ant-sw-list-section': {
      flex: 1
    },
    '.ant-sw-sub-header-container': {
      marginBottom: token.marginXS
    },
    '.history-item + .history-item, .history-item + .___list-separator': {
      marginTop: token.marginXS
    },
    '.___list-separator': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight3,
      fontWeight: token.headingFontWeight,
      marginBottom: token.marginXS
    }
  });
});

export default History;
