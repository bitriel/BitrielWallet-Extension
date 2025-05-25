// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletUnlockType } from '@bitriel/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@bitriel/extension-base/constants';
import { isSameAddress } from '@bitriel/extension-base/utils';
import { Logo2D } from '@bitriel/extension-koni-ui/components/Logo';
import { CURRENT_PAGE, TRANSACTION_STORAGES } from '@bitriel/extension-koni-ui/constants';
import { DEFAULT_ROUTER_PATH } from '@bitriel/extension-koni-ui/constants/router';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import { usePredefinedModal, WalletModalContextProvider } from '@bitriel/extension-koni-ui/contexts/WalletModalContextProvider';
import { useExtensionDisplayModes, useGetCurrentPage, useSubscribeLanguage } from '@bitriel/extension-koni-ui/hooks';
import useNotification from '@bitriel/extension-koni-ui/hooks/common/useNotification';
import useUILock from '@bitriel/extension-koni-ui/hooks/common/useUILock';
import { subscribeNotifications } from '@bitriel/extension-koni-ui/messaging';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { isNoAccount, removeStorage } from '@bitriel/extension-koni-ui/utils';
import { changeHeaderLogo } from '@subwallet/react-ui';
import { NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import { MainWrapper } from './MainWrapper';

changeHeaderLogo(<Logo2D />);

export const RouteState = {
  prevDifferentPathNum: -1,
  lastPathName: '/'
};

const welcomeUrl = '/welcome';
const tokenUrl = '/home/tokens';
const migrateAccountNotionUrl = '/migrate-account?is-notion=true';
const forcedAccountMigrationUrl = '/migrate-account?is-forced-migration=true';
const loginUrl = '/keyring/login';
const phishingUrl = '/phishing-page-detected';
// const remindExportAccountUrl = '/remind-export-account';
const createPasswordUrl = '/keyring/create-password';
const migratePasswordUrl = '/keyring/migrate-password';
const accountNewSeedPhrase = '/accounts/new-seed-phrase';
const securityUrl = '/settings/security';
const createDoneUrl = '/create-done';
const settingImportNetwork = '/settings/chains/import';

const baseAccountPath = '/accounts';
const allowImportAccountPaths = ['new-seed-phrase', 'import-seed-phrase', 'import-private-key', 'restore-json', 'import-by-qr', 'attach-read-only', 'connect-polkadot-vault', 'connect-keystone', 'connect-ledger'];
const allowBlackScreenWS = [welcomeUrl, loginUrl];
const allowImportAccountUrls = allowImportAccountPaths.map((path) => `${baseAccountPath}/${path}`);

function removeLoadingPlaceholder (animation: boolean): void {
  const element = document.getElementById('loading-placeholder');

  if (element) {
    if (animation) {
      // Add transition effect
      element.style.transition = 'opacity 0.1s ease-in-out';
      // Set opacity to 0
      element.style.opacity = '0';
      // Callback after 1 second
      setTimeout(() => {
        // Remove element
        element.parentNode?.removeChild(element);
      }, 150);
    } else {
      element.parentNode?.removeChild(element);
    }
  }
}

function DefaultRoute ({ children }: { children: React.ReactNode }): React.ReactElement {
  const dataContext = useContext(DataContext);
  const location = useLocation();
  const { isOpenPModal, openPModal } = usePredefinedModal();
  const notify = useNotification();
  const [rootLoading, setRootLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const initDataRef = useRef<Promise<boolean>>(dataContext.awaitStores(['accountState', 'chainStore', 'assetRegistry', 'requestState', 'settings', 'mantaPay']));
  const currentPage = useGetCurrentPage();
  const [, setCurrentPage] = useLocalStorage<string>(CURRENT_PAGE, DEFAULT_ROUTER_PATH);
  const firstRender = useRef(true);

  useSubscribeLanguage();

  const { unlockType } = useSelector((state: RootState) => state.settings);
  const { hasConfirmations, hasInternalConfirmations } = useSelector((state: RootState) => state.requestState);
  const { accounts, currentAccount, hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);
  const isAcknowledgedUnifiedAccountMigration = useSelector((state: RootState) => state.settings.isAcknowledgedUnifiedAccountMigration);
  const isUnifiedAccountMigrationInProgress = useSelector((state: RootState) => state.settings.isUnifiedAccountMigrationInProgress);
  const [initAccount, setInitAccount] = useState(currentAccount);
  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);
  const { isUILocked } = useUILock();
  const needUnlock = isUILocked || (isLocked && unlockType === WalletUnlockType.ALWAYS_REQUIRED);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();
  const { isPopupMode } = useExtensionDisplayModes();

  const needMasterPasswordMigration = useMemo(
    () => !!accounts
      .filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal && !acc.isInjected && !acc.pendingMigrate)
      .filter((acc) => !acc.isMasterPassword)
      .length
    , [accounts]
  );

  const activePriorityPath = useMemo(() => {
    if (isPopupMode && !isAcknowledgedUnifiedAccountMigration) {
      return migrateAccountNotionUrl;
    }

    if (isPopupMode && isUnifiedAccountMigrationInProgress) {
      return forcedAccountMigrationUrl;
    }

    return undefined;
  }, [isAcknowledgedUnifiedAccountMigration, isPopupMode, isUnifiedAccountMigrationInProgress]);

  const redirectPath = useMemo<string | null>(() => {
    const pathName = location.pathname;
    let redirectTarget: string | null = null;

    // Wait until data loaded
    if (!dataLoaded) {
      return null;
    }

    const requireLogin = !pathName.startsWith(phishingUrl);

    if (!requireLogin) {
      // Do nothing
    } else if (needMasterPasswordMigration && hasMasterPassword && !needUnlock) {
      redirectTarget = migratePasswordUrl;
    } else if (hasMasterPassword && needUnlock) {
      redirectTarget = loginUrl;
    } else if (hasMasterPassword && pathName === createPasswordUrl) {
      redirectTarget = DEFAULT_ROUTER_PATH;
    } else if (!hasMasterPassword) {
      if (noAccount) {
        if (![...allowImportAccountUrls, welcomeUrl, createPasswordUrl, securityUrl].includes(pathName)) {
          redirectTarget = welcomeUrl;
        }
      } else if (pathName !== createDoneUrl) {
        redirectTarget = createPasswordUrl;
      }
    } else if (noAccount) {
      if (![...allowImportAccountUrls, welcomeUrl, createPasswordUrl, securityUrl].includes(pathName)) {
        redirectTarget = welcomeUrl;
      }
    } else if (pathName === DEFAULT_ROUTER_PATH) {
      if (hasConfirmations) {
        openPModal('confirmations');
      } else if (activePriorityPath) {
        redirectTarget = activePriorityPath;
      } else if (firstRender.current && currentPage) {
        redirectTarget = currentPage;
      } else {
        redirectTarget = tokenUrl;
      }
    } else if (pathName === loginUrl && !needUnlock) {
      redirectTarget = DEFAULT_ROUTER_PATH;
    } else if (pathName === welcomeUrl && !noAccount) {
      redirectTarget = DEFAULT_ROUTER_PATH;
    } else if (pathName === migratePasswordUrl && !needMasterPasswordMigration) {
      if (noAccount) {
        redirectTarget = welcomeUrl;
      } else {
        redirectTarget = DEFAULT_ROUTER_PATH;
      }
    } else if (hasInternalConfirmations && pathName === accountNewSeedPhrase) {
      openPModal(null);
    } else if (hasInternalConfirmations && pathName === settingImportNetwork) {
      openPModal(null);
    } else if (hasInternalConfirmations) {
      openPModal('confirmations');
    } else if (!hasInternalConfirmations && isOpenPModal('confirmations')) {
      openPModal(null);
    }

    // Remove loading on finished first compute
    firstRender.current && setRootLoading((val) => {
      if (val) {
        removeLoadingPlaceholder(!needUnlock);
        firstRender.current = false;
      }

      return false;
    });

    if (redirectTarget && redirectTarget !== pathName) {
      return redirectTarget;
    } else {
      return null;
    }
  }, [location.pathname, dataLoaded, needMasterPasswordMigration, hasMasterPassword, needUnlock, noAccount, hasInternalConfirmations, isOpenPModal, hasConfirmations, activePriorityPath, currentPage, openPModal]);

  useEffect(() => {
    initDataRef.current.then(() => {
      setDataLoaded(true);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let cancel = false;
    let lastNotifyTime = new Date().getTime();

    subscribeNotifications((rs) => {
      rs.sort((a, b) => a.id - b.id)
        .forEach(({ action, id, message, title, type }) => {
          if (!cancel && id > lastNotifyTime) {
            const notificationItem: NotificationProps = { message: title || message, type };

            if (action?.url) {
              notificationItem.onClick = () => {
                window.open(action.url);
              };
            }

            notify(notificationItem);
            lastNotifyTime = id;
          }
        });
    }).catch(console.error);

    return () => {
      cancel = true;
    };
  }, [notify]);

  // Update goBack number
  useEffect(() => {
    if (location.pathname === RouteState.lastPathName) {
      RouteState.prevDifferentPathNum -= 1;
    } else {
      RouteState.prevDifferentPathNum = -1;
    }

    RouteState.lastPathName = location.pathname;
  }, [location]);

  // Remove transaction persist state
  useEffect(() => {
    if (!dataLoaded && initAccount === null && currentAccount !== null) {
      setInitAccount(currentAccount);

      return;
    }

    if (!isSameAddress(initAccount?.address || '', currentAccount?.address || '')) {
      for (const key of TRANSACTION_STORAGES) {
        removeStorage(key);
      }

      setInitAccount(currentAccount);
    }
  }, [currentAccount, dataLoaded, initAccount]);

  useEffect(() => {
    if (rootLoading || redirectPath) {
      if (redirectPath && currentPage !== redirectPath && allowBlackScreenWS.includes(redirectPath)) {
        setCurrentPage(redirectPath);
      }

      setShouldRedirect(true);
    } else {
      setShouldRedirect(false);
    }
  }, [rootLoading, redirectPath, currentPage, setCurrentPage]);

  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      navigate(redirectPath);
    }
  }, [shouldRedirect, redirectPath, navigate]);

  if (rootLoading || shouldRedirect) {
    return <></>;
  } else {
    return (
      <MainWrapper className='main-page-container'>
        {children}
      </MainWrapper>
    );
  }
}

export function Root (): React.ReactElement {
  // Implement WalletModalContext in Root component to make it available for all children and can use react-router-dom and ModalContextProvider

  return (
    <WalletModalContextProvider>
      <DefaultRoute>
        <Outlet />
      </DefaultRoute>
    </WalletModalContextProvider>
  );
}
