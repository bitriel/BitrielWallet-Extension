// Copyright 2019-2022 @bitriel/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PHISHING_PAGE_REDIRECT } from '@bitriel/extension-base/defaults';
import { PageWrapper } from '@bitriel/extension-web-ui/components';
import ErrorFallback from '@bitriel/extension-web-ui/Popup/ErrorFallback';
import { Root } from '@bitriel/extension-web-ui/Popup/Root';
import { i18nPromise } from '@bitriel/extension-web-ui/utils';
import React, { ComponentType } from 'react';
import { createBrowserRouter, IndexRouteObject, Outlet, useLocation, useOutletContext } from 'react-router-dom';

export const lazyLoaderMap: Record<string, LazyLoader> = {};

export class LazyLoader {
  private elemLoader;
  private loadPromise: Promise<ComponentType<any>> | undefined;

  constructor (key: string, promiseFunction: () => Promise<{ default: ComponentType<any> }>) {
    this.elemLoader = promiseFunction;
    lazyLoaderMap[key] = this;
  }

  public loadElement () {
    if (!this.loadPromise) {
      this.loadPromise = new Promise<ComponentType<any>>((resolve, reject) => {
        this.elemLoader().then((module) => {
          resolve(module.default);
        }).catch((e) => {
          if (/Loading chunk .*? failed/.test((e as Error).message)) {
            window.location.reload();
          } else {
            reject(e);
          }
        });
      });
    }

    return this.loadPromise;
  }

  public generateRouterObject (path: string, preload = false): Pick<IndexRouteObject, 'path' | 'lazy'> {
    if (preload) {
      this.loadElement().catch(console.error);
    }

    return {
      path,
      lazy: async () => {
        const Element = await this.loadElement();

        return {
          element: <Element />
        };
      }
    };
  }
}

const PhishingDetected = new LazyLoader('PhishingDetected', () => import('@bitriel/extension-web-ui/Popup/PhishingDetected'));
const Welcome = new LazyLoader('Welcome', () => import('@bitriel/extension-web-ui/Popup/Welcome'));
const CreateDone = new LazyLoader('CreateDone', () => import('@bitriel/extension-web-ui/Popup/CreateDone'));
const RedirectHandler = new LazyLoader('RedirectHandler', () => import('@bitriel/extension-web-ui/Popup/RedirectHandler'));
const BuyTokens = new LazyLoader('BuyTokens', () => import('@bitriel/extension-web-ui/Popup/BuyTokens'));

const Tokens = new LazyLoader('Tokens', () => import('@bitriel/extension-web-ui/Popup/Home/Tokens'));
const TokenDetailList = new LazyLoader('TokenDetailList', () => import('@bitriel/extension-web-ui/Popup/Home/Tokens/DetailList'));

const NftItemDetail = new LazyLoader('NftItemDetail', () => import('@bitriel/extension-web-ui/Popup/Home/Nfts/NftItemDetail'));
const NftCollections = new LazyLoader('NftCollections', () => import('@bitriel/extension-web-ui/Popup/Home/Nfts/NftCollections'));
const NftCollectionDetail = new LazyLoader('NftCollectionDetail', () => import('@bitriel/extension-web-ui/Popup/Home/Nfts/NftCollectionDetail'));
const NftImport = new LazyLoader('NftImport', () => import('@bitriel/extension-web-ui/Popup/Home/Nfts/NftImport'));
const NftEntry = new LazyLoader('NftEntry', () => import('@bitriel/extension-web-ui/Popup/Home/Nfts/NftEntry'));

const InscriptionItems = new LazyLoader('InscriptionItems', () => import('@bitriel/extension-web-ui/Popup/Home/Inscriptions/InscriptionItemList'));
const InscriptionItemDetail = new LazyLoader('InscriptionItemDetail', () => import('@bitriel/extension-web-ui/Popup/Home/Inscriptions/InscriptionItemDetail'));

const History = new LazyLoader('History', () => import('@bitriel/extension-web-ui/Popup/Home/History'));
const Crowdloans = new LazyLoader('Crowdloans', () => import('@bitriel/extension-web-ui/Popup/Home/Crowdloans'));
const Home = new LazyLoader('Home', () => import('@bitriel/extension-web-ui/Popup/Home'));
const Statistics = new LazyLoader('Statistics', () => import('@bitriel/extension-web-ui/Popup/Home/Statistics'));

const Settings = new LazyLoader('Settings', () => import('@bitriel/extension-web-ui/Popup/Settings'));
const GeneralSetting = new LazyLoader('GeneralSetting', () => import('@bitriel/extension-web-ui/Popup/Settings/GeneralSetting'));
const ManageAddressBook = new LazyLoader('ManageAddressBook', () => import('@bitriel/extension-web-ui/Popup/Settings/AddressBook'));

const ManageChains = new LazyLoader('ManageChains', () => import('@bitriel/extension-web-ui/Popup/Settings/Chains/ManageChains'));
const ChainImport = new LazyLoader('ChainImport', () => import('@bitriel/extension-web-ui/Popup/Settings/Chains/ChainImport'));
const AddProvider = new LazyLoader('AddProvider', () => import('@bitriel/extension-web-ui/Popup/Settings/Chains/AddProvider'));
const ChainDetail = new LazyLoader('ChainDetail', () => import('@bitriel/extension-web-ui/Popup/Settings/Chains/ChainDetail'));

const ManageTokens = new LazyLoader('ManageTokens', () => import('@bitriel/extension-web-ui/Popup/Settings/Tokens/ManageTokens'));
const FungibleTokenImport = new LazyLoader('FungibleTokenImport', () => import('@bitriel/extension-web-ui/Popup/Settings/Tokens/FungibleTokenImport'));
const TokenDetail = new LazyLoader('TokenDetail', () => import('@bitriel/extension-web-ui/Popup/Settings/Tokens/TokenDetail'));

const SecurityList = new LazyLoader('SecurityList', () => import('@bitriel/extension-web-ui/Popup/Settings/Security'));
const ManageWebsiteAccess = new LazyLoader('ManageWebsiteAccess', () => import('@bitriel/extension-web-ui/Popup/Settings/Security/ManageWebsiteAccess'));
const ManageWebsiteAccessDetail = new LazyLoader('ManageWebsiteAccessDetail', () => import('@bitriel/extension-web-ui/Popup/Settings/Security/ManageWebsiteAccess/Detail'));

const NewSeedPhrase = new LazyLoader('NewSeedPhrase', () => import('@bitriel/extension-web-ui/Popup/Account/NewSeedPhrase'));
const ImportSeedPhrase = new LazyLoader('ImportSeedPhrase', () => import('@bitriel/extension-web-ui/Popup/Account/ImportSeedPhrase'));
const ImportPrivateKey = new LazyLoader('ImportPrivateKey', () => import('@bitriel/extension-web-ui/Popup/Account/ImportPrivateKey'));
const RestoreJson = new LazyLoader('RestoreJson', () => import('@bitriel/extension-web-ui/Popup/Account/RestoreJson'));
const ImportQrCode = new LazyLoader('ImportQrCode', () => import('@bitriel/extension-web-ui/Popup/Account/ImportQrCode'));
const AttachReadOnly = new LazyLoader('AttachReadOnly', () => import('@bitriel/extension-web-ui/Popup/Account/AttachReadOnly'));
const ConnectPolkadotVault = new LazyLoader('ConnectPolkadotVault', () => import('@bitriel/extension-web-ui/Popup/Account/ConnectQrSigner/ConnectPolkadotVault'));
const ConnectKeystone = new LazyLoader('ConnectKeystone', () => import('@bitriel/extension-web-ui/Popup/Account/ConnectQrSigner/ConnectKeystone'));
const ConnectLedger = new LazyLoader('ConnectLedger', () => import('@bitriel/extension-web-ui/Popup/Account/ConnectLedger'));
const ExportAllDone = new LazyLoader('ExportAllDone', () => import('@bitriel/extension-web-ui/Popup/Account/ExportAllDone'));

const Login = new LazyLoader('Login', () => import('@bitriel/extension-web-ui/Popup/Keyring/Login'));
const CreatePassword = new LazyLoader('CreatePassword', () => import('@bitriel/extension-web-ui/Popup/Keyring/CreatePassword'));
const ChangePassword = new LazyLoader('ChangePassword', () => import('@bitriel/extension-web-ui/Popup/Keyring/ChangePassword'));
const ApplyMasterPassword = new LazyLoader('ApplyMasterPassword', () => import('@bitriel/extension-web-ui/Popup/Keyring/ApplyMasterPassword'));

const AccountDetail = new LazyLoader('AccountDetail', () => import('@bitriel/extension-web-ui/Popup/Account/AccountDetail'));
const AccountExport = new LazyLoader('AccountExport', () => import('@bitriel/extension-web-ui/Popup/Account/AccountExport'));

const Transaction = new LazyLoader('Transaction', () => import('@bitriel/extension-web-ui/Popup/Transaction/Transaction'));
const TransactionDone = new LazyLoader('TransactionDone', () => import('@bitriel/extension-web-ui/Popup/TransactionDone'));
const SendFund = new LazyLoader('SendFund', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/SendFund'));
const SendNFT = new LazyLoader('SendNFT', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/SendNFT'));
const Earn = new LazyLoader('Stake', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/Earn'));
const Unstake = new LazyLoader('Unstake', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/Unbond'));
const CancelUnstake = new LazyLoader('CancelUnstake', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/CancelUnstake'));
const ClaimReward = new LazyLoader('ClaimReward', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/ClaimReward'));
const Withdraw = new LazyLoader('Withdraw', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/Withdraw'));
const SwapTransaction = new LazyLoader('SwapTransaction', () => import('@bitriel/extension-web-ui/Popup/Transaction/variants/Swap'));

// Wallet Connect
const ConnectWalletConnect = new LazyLoader('ConnectWalletConnect', () => import('@bitriel/extension-web-ui/Popup/WalletConnect/ConnectWalletConnect'));
const ConnectionList = new LazyLoader('ConnectionList', () => import('@bitriel/extension-web-ui/Popup/WalletConnect/ConnectionList'));
const ConnectionDetail = new LazyLoader('ConnectionDetail', () => import('@bitriel/extension-web-ui/Popup/WalletConnect/ConnectionDetail'));

// DApps

const DApps = new LazyLoader('DApps', () => import('@bitriel/extension-web-ui/Popup/DApps'));

const EarningEntry = new LazyLoader('EarningEntry', () => import('@bitriel/extension-web-ui/Popup/Home/Earning/EarningEntry'));
const EarningPools = new LazyLoader('EarningPools', () => import('@bitriel/extension-web-ui/Popup/Home/Earning/EarningPools'));
const EarningPositionDetail = new LazyLoader('EarningPositionDetail', () => import('@bitriel/extension-web-ui/Popup/Home/Earning/EarningPositionDetail'));
const EarningPreviewOptions = new LazyLoader('EarningPreviewOptions', () => import('@bitriel/extension-web-ui/Popup/Home/Earning/EarningPreview/EarningPreviewOptions'));
const EarningPreviewPools = new LazyLoader('EarningPreviewPools', () => import('@bitriel/extension-web-ui/Popup/Home/Earning/EarningPreview/EarningPreviewPools'));
const EarningPreviewOutlet = new LazyLoader('EarningPreviewOutlet', () => import('@bitriel/extension-web-ui/Popup/Home/Earning/EarningPreview/EarningPreviewOutlet'));

// const EarningDoneOutlet = new LazyLoader('EarningDoneOutlet', () => import('@bitriel/extension-web-ui/Popup/EarningDone/Outlet'));
// const EarningDoneContent = new LazyLoader('EarningDoneContent', () => import('@bitriel/extension-web-ui/Popup/EarningDone/Content'));

const CrowdloanUnlockCampaign = new LazyLoader('CrowdloanUnlockCampaign', () => import('@bitriel/extension-web-ui/Popup/CrowdloanUnlockCampaign'));
const CheckCrowdloanContributions = new LazyLoader('CrowdloanContributionsResult', () => import('@bitriel/extension-web-ui/Popup/CrowdloanUnlockCampaign/CheckCrowdloanContributions'));
const CrowdloanContributionsResult = new LazyLoader('CrowdloanContributionsResult', () => import('@bitriel/extension-web-ui/Popup/CrowdloanUnlockCampaign/CrowdloanContributionsResult'));

const MissionPool = new LazyLoader('MissionPool', () => import('@bitriel/extension-web-ui/Popup/MissionPool'));

/* 404 */

const NotFoundContent = new LazyLoader('NotFoundContent', () => import('@bitriel/extension-web-ui/Popup/NotFound/Content'));
const NotFoundRedirect = new LazyLoader('NotFoundRedirect', () => import('@bitriel/extension-web-ui/Popup/NotFound/Redirect'));
const UnsafeAccess = new LazyLoader('UnsafeAccess', () => import('@bitriel/extension-web-ui/Popup/NotFound/Access'));
/* 404 */

// A Placeholder page
export function Example () {
  const location = useLocation();

  return <PageWrapper>
    <div style={{ padding: 16 }}>{location.pathname}</div>
  </PageWrapper>;
}

export function NestedOutlet () {
  return <Outlet context={useOutletContext()} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => i18nPromise,
    element: <Root />,
    errorElement: <ErrorFallback />,
    children: [
      {
        path: '/wc',
        element: <div />
      },
      Welcome.generateRouterObject('/welcome', true),
      BuyTokens.generateRouterObject('/buy-tokens'),
      CreateDone.generateRouterObject('/create-done'),
      RedirectHandler.generateRouterObject('/redirect-handler/:feature'),
      {
        ...Home.generateRouterObject('/home'),
        children: [
          Tokens.generateRouterObject('tokens'),
          Statistics.generateRouterObject('statistics'),
          TokenDetailList.generateRouterObject('tokens/detail/:slug'),
          {
            ...NftEntry.generateRouterObject('nfts'),
            children: [
              NftCollections.generateRouterObject('collections'),
              NftCollectionDetail.generateRouterObject('collection-detail'),
              NftItemDetail.generateRouterObject('item-detail')
            ]
          },
          {
            path: 'inscriptions',
            element: <NestedOutlet />,
            children: [
              InscriptionItems.generateRouterObject(''),
              InscriptionItemDetail.generateRouterObject('item-detail')
            ]
          },
          Crowdloans.generateRouterObject('crowdloans'),
          {
            path: 'earning',
            element: <Outlet />,
            children: [
              EarningEntry.generateRouterObject(''),
              EarningPools.generateRouterObject('pools'),
              EarningPositionDetail.generateRouterObject('position-detail')
            ]
          },
          MissionPool.generateRouterObject('mission-pools'),
          History.generateRouterObject('history'),
          History.generateRouterObject('history/:address/:chain/:extrinsicHashOrId'),
          DApps.generateRouterObject('dapps')
        ]
      },
      {
        ...Transaction.generateRouterObject('/transaction'),
        children: [
          SendFund.generateRouterObject('send-fund'),
          SendNFT.generateRouterObject('send-nft'),
          Earn.generateRouterObject('earn'),
          Unstake.generateRouterObject('unstake'),
          CancelUnstake.generateRouterObject('cancel-unstake'),
          ClaimReward.generateRouterObject('claim-reward'),
          Withdraw.generateRouterObject('withdraw'),
          SwapTransaction.generateRouterObject('swap'),
          {
            path: 'compound',
            element: <Example />
          }
        ]
      },
      {
        ...TransactionDone.generateRouterObject('transaction-done/:address/:chain/:transactionId')
      },
      {
        ...EarningPreviewOutlet.generateRouterObject('/earning-preview'),
        children: [
          EarningPreviewOptions.generateRouterObject(''),
          EarningPreviewPools.generateRouterObject('pools')
        ]
      },
      {
        path: '/keyring',
        element: <Outlet />,
        children: [
          Login.generateRouterObject('login', true),
          CreatePassword.generateRouterObject('create-password'),
          ChangePassword.generateRouterObject('change-password'),
          ApplyMasterPassword.generateRouterObject('migrate-password')
        ]
      },
      {
        path: '/settings',
        children: [
          Settings.generateRouterObject('/settings'),
          Settings.generateRouterObject('list'),
          GeneralSetting.generateRouterObject('general'),
          ManageAddressBook.generateRouterObject('address-book'),
          SecurityList.generateRouterObject('security'),
          ManageWebsiteAccess.generateRouterObject('dapp-access'),
          ManageWebsiteAccessDetail.generateRouterObject('dapp-access-edit'),
          {
            path: 'chains',
            element: <Outlet />,
            children: [
              ManageChains.generateRouterObject('manage'),
              ChainImport.generateRouterObject('import'),
              ChainDetail.generateRouterObject('detail'),
              AddProvider.generateRouterObject('add-provider')
            ]
          },
          {
            path: 'tokens',
            element: <Outlet />,
            children: [
              ManageTokens.generateRouterObject('manage'),
              FungibleTokenImport.generateRouterObject('import-token'),
              TokenDetail.generateRouterObject('detail'),
              NftImport.generateRouterObject('import-nft')
            ]
          }
        ]
      },
      {
        path: 'accounts',
        element: <Outlet />,
        children: [
          NewSeedPhrase.generateRouterObject('new-seed-phrase'),
          ImportSeedPhrase.generateRouterObject('import-seed-phrase'),
          ImportPrivateKey.generateRouterObject('import-private-key'),
          RestoreJson.generateRouterObject('restore-json'),
          ImportQrCode.generateRouterObject('import-by-qr'),
          AttachReadOnly.generateRouterObject('attach-read-only'),
          ConnectPolkadotVault.generateRouterObject('connect-polkadot-vault'),
          ConnectKeystone.generateRouterObject('connect-keystone'),
          ConnectLedger.generateRouterObject('connect-ledger'),
          AccountDetail.generateRouterObject('detail/:accountAddress'),
          AccountExport.generateRouterObject('export/:accountAddress'),
          ExportAllDone.generateRouterObject('export-all-done')
        ]
      },
      {
        path: 'wallet-connect',
        element: <Outlet />,
        children: [
          ConnectWalletConnect.generateRouterObject('connect'),
          ConnectionList.generateRouterObject('list'),
          ConnectionDetail.generateRouterObject('detail/:topic')
        ]
      },
      {
        ...CrowdloanUnlockCampaign.generateRouterObject('/crowdloan-unlock-campaign'),
        children: [
          CheckCrowdloanContributions.generateRouterObject('check-contributions'),
          CrowdloanContributionsResult.generateRouterObject('contributions-result')
        ]
      },
      NotFoundContent.generateRouterObject('not-found'),
      NotFoundRedirect.generateRouterObject('*'),
      UnsafeAccess.generateRouterObject('unsafe-access'),
      PhishingDetected.generateRouterObject(`${PHISHING_PAGE_REDIRECT}/:website`)
    ]
  }
]);
