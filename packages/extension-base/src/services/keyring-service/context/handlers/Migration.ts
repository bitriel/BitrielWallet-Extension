// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { RequestMigrateSoloAccount, RequestMigrateUnifiedAndFetchEligibleSoloAccounts, RequestPingSession, ResponseMigrateSoloAccount, ResponseMigrateUnifiedAndFetchEligibleSoloAccounts, SoloAccountToBeMigrated } from '@bitriel/extension-base/background/KoniTypes';
import { AccountBaseHandler } from '@bitriel/extension-base/services/keyring-service/context/handlers/Base';
import { AccountChainType, AccountProxy, SUPPORTED_ACCOUNT_CHAIN_TYPES } from '@bitriel/extension-base/types';
import { createAccountProxyId, getDefaultKeypairTypeFromAccountChainType, getSuri } from '@bitriel/extension-base/utils';
import { generateRandomString } from '@bitriel/extension-base/utils/getId';
import { keyring } from '@subwallet/ui-keyring';

import { keyExtractSuri } from '@polkadot/util-crypto';

export const SESSION_TIMEOUT = 10000;

interface SessionInfo {
  password: string,
  timeoutId: NodeJS.Timeout
}

interface UnifiedAccountGroup {
  derivedUnifiedAccounts: AccountProxy[],
  masterUnifiedAccounts: AccountProxy[]
}

export class AccountMigrationHandler extends AccountBaseHandler {
  private sessionIdToPassword: Record<string, SessionInfo> = {};

  public pingSession ({ sessionId }: RequestPingSession) {
    if (!this.sessionIdToPassword[sessionId]) { // todo: if no persistent sessionId, should we jump to enter password again?
      throw Error(`Session ID ${sessionId} not found.`);
    }

    clearTimeout(this.sessionIdToPassword[sessionId].timeoutId);
    this.sessionIdToPassword[sessionId].timeoutId = setTimeout(() => {
      delete this.sessionIdToPassword[sessionId];
    }, SESSION_TIMEOUT);

    return true;
  }

  public async migrateUnifiedAndFetchEligibleSoloAccounts (request: RequestMigrateUnifiedAndFetchEligibleSoloAccounts, setMigratingModeFn: () => void): Promise<ResponseMigrateUnifiedAndFetchEligibleSoloAccounts> {
    // Migrate unified -> unified
    const password = request.password;
    const allAccountProxies = Object.values(this.state.accounts);
    const UACanBeMigrated = this.getUACanBeMigrated(allAccountProxies);
    const UACanBeMigratedSortedByParent = this.sortUAByParent(UACanBeMigrated); // master account must be migrated before derived account
    const migratedUnifiedAccountIds = await this.migrateUnifiedToUnifiedAccount(password, UACanBeMigratedSortedByParent, setMigratingModeFn);

    // Get solo accounts can be migrated
    const soloAccountsNeedToBeMigrated = this.getSoloAccountsNeedToBeMigrated(allAccountProxies);
    const soloAccountsNeedToBeMigratedGroup = this.groupSoloAccountByMnemonic(password, soloAccountsNeedToBeMigrated);
    const eligibleSoloAccountMap = this.accountProxiesToEligibleSoloAccountMap(soloAccountsNeedToBeMigratedGroup);

    // Create persistent mapping sessionId <-> password
    const uniqueId = Date.now().toString();
    const timeoutId = setTimeout(() => delete this.sessionIdToPassword[uniqueId], SESSION_TIMEOUT * 2);

    this.sessionIdToPassword[uniqueId] = {
      password,
      timeoutId
    };

    return {
      migratedUnifiedAccountIds,
      soloAccounts: eligibleSoloAccountMap,
      sessionId: uniqueId
    };
  }

  public async migrateUnifiedToUnifiedAccount (password: string, accountProxies: AccountProxy[], setMigratingModeFn: () => void): Promise<string[]> {
    keyring.unlockKeyring(password);
    this.parentService.updateKeyringState();
    setMigratingModeFn();

    const unifiedAccountIds: string[] = [];
    const modifiedPairs = structuredClone(this.state.modifyPairs);

    const { derivedUnifiedAccounts, masterUnifiedAccounts } = accountProxies.reduce((accountInfo, account: AccountProxy) => {
      const isDerivedAccount = !!account.parentId;

      isDerivedAccount ? accountInfo.derivedUnifiedAccounts.push(account) : accountInfo.masterUnifiedAccounts.push(account);

      return accountInfo;
    }, { derivedUnifiedAccounts: [], masterUnifiedAccounts: [] } as unknown as UnifiedAccountGroup);

    try {
      for (const unifiedAccount of masterUnifiedAccounts) {
        const proxyId = unifiedAccount.id;
        const mnemonic = this.parentService.context.exportAccountProxyMnemonic({
          password,
          proxyId
        }).result;

        const newChainTypes = Object.values(AccountChainType).filter((type) => !unifiedAccount.chainTypes.includes(type) && SUPPORTED_ACCOUNT_CHAIN_TYPES.includes(type));
        const keypairTypes = newChainTypes.map((chainType) => getDefaultKeypairTypeFromAccountChainType(chainType));

        keypairTypes.forEach((type) => {
          const suri = getSuri(mnemonic, type);
          const pair = keyring.createFromUri(suri, {}, type);
          const address = pair.address;

          modifiedPairs[address] = { accountProxyId: proxyId, migrated: true, key: address };
        });

        keypairTypes.forEach((type) => {
          const suri = getSuri(mnemonic, type);
          const { derivePath } = keyExtractSuri(suri);
          const metadata = {
            name: unifiedAccount.name,
            derivationPath: derivePath ? derivePath.substring(1) : undefined
          };

          const rs = keyring.addUri(suri, metadata, type);
          const address = rs.pair.address;

          this.state._addAddressToAuthList(address, true);
        });

        this.state.upsertModifyPairs(modifiedPairs);

        unifiedAccountIds.push(proxyId);
      }

      await new Promise((resolve) => setTimeout(resolve, 1800)); // Wait last master unified account migrated. // todo: can be optimized later by await a promise resolve if master account is migrating

      for (const unifiedAccount of derivedUnifiedAccounts) {
        this.parentService.context.derivationAccountProxyCreate({
          name: unifiedAccount.name,
          suri: unifiedAccount.suri || '',
          proxyId: unifiedAccount.parentId || ''
        }, true);
        unifiedAccountIds.push(unifiedAccount.id);
      }
    } catch (error) {
      console.error('Migration unified account failed with error:', error);
    } finally {
      keyring.lockAll(false);
      this.parentService.updateKeyringState();
    }

    return unifiedAccountIds;
  }

  public getUACanBeMigrated (accountProxies: AccountProxy[]): AccountProxy[] {
    return accountProxies.filter((account) => this.state.isUnifiedAccount(account.id) && account.isNeedMigrateUnifiedAccount);
  }

  public getSoloAccountsNeedToBeMigrated (accountProxies: AccountProxy[]): AccountProxy[] {
    return accountProxies.filter((account) => !this.state.isUnifiedAccount(account.id) && account.isNeedMigrateUnifiedAccount);
  }

  public groupSoloAccountByMnemonic (password: string, accountProxies: AccountProxy[]) {
    const parentService = this.parentService;

    return accountProxies.reduce(function (rs: Record<string, AccountProxy[]>, item) {
      const oldProxyId = item.id;
      const mnemonic = parentService.context.exportAccountProxyMnemonic({
        password,
        proxyId: oldProxyId
      }).result;
      const upcomingProxyId = createAccountProxyId(mnemonic);

      if (!rs[upcomingProxyId]) {
        rs[upcomingProxyId] = [];
      }

      rs[upcomingProxyId].push(item);

      return rs;
    }, {});
  }

  public accountProxiesToEligibleSoloAccountMap (accountProxyMap: Record<string, AccountProxy[]>): Record<string, SoloAccountToBeMigrated[]> {
    const eligibleSoloAccountMap: Record<string, SoloAccountToBeMigrated[]> = {};

    Object.entries(accountProxyMap).forEach(([upcomingProxyId, accounts]) => {
      eligibleSoloAccountMap[upcomingProxyId] = accounts.map((account) => {
        return {
          upcomingProxyId,
          proxyId: account.accounts[0].proxyId,
          address: account.accounts[0].address,
          name: account.name,
          chainType: account.chainTypes[0]
        } as SoloAccountToBeMigrated;
      });
    });

    return eligibleSoloAccountMap;
  }

  public sortUAByParent (accountProxies: AccountProxy[]): AccountProxy[] {
    const undefinedToStr = (str: string | undefined) => str ?? '';

    return accountProxies.sort((a, b) => undefinedToStr(a.parentId) < undefinedToStr(b.parentId) ? -1 : undefinedToStr(a.parentId) > undefinedToStr(b.parentId) ? 1 : 0);
  }

  public migrateSoloToUnifiedAccount (request: RequestMigrateSoloAccount): ResponseMigrateSoloAccount {
    const { accountName, sessionId, soloAccounts } = request;
    const password = this.sessionIdToPassword[sessionId].password;

    keyring.unlockKeyring(password);
    this.parentService.updateKeyringState();
    const modifiedPairs = structuredClone(this.state.modifyPairs);
    const firstAccountInfo = soloAccounts[0];
    const upcomingProxyId = firstAccountInfo.upcomingProxyId;
    const firstAccountOldProxyId = firstAccountInfo.proxyId;

    try {
      const mnemonic = this.parentService.context.exportAccountProxyMnemonic({ password, proxyId: firstAccountOldProxyId }).result;

      const keypairTypes = SUPPORTED_ACCOUNT_CHAIN_TYPES.map((chainType) => getDefaultKeypairTypeFromAccountChainType(chainType as AccountChainType));

      keypairTypes.forEach((type) => {
        const suri = getSuri(mnemonic, type);
        const pair = keyring.createFromUri(suri, {}, type);
        const address = pair.address;

        modifiedPairs[address] = { accountProxyId: upcomingProxyId, migrated: true, key: address };
      });

      this.state.upsertAccountProxyByKey({ id: upcomingProxyId, name: accountName, isMigrationDone: false });

      const soloAccountProxyIds: string[] = [];

      keypairTypes.forEach((type) => {
        const suri = getSuri(mnemonic, type);
        const { derivePath } = keyExtractSuri(suri);
        const metadata = {
          name: accountName.concat(' - ').concat(generateRandomString()),
          derivationPath: derivePath ? derivePath.substring(1) : undefined
        };

        const rs = keyring.addUri(suri, metadata, type);

        soloAccountProxyIds.push(rs.json.address);
        const address = rs.pair.address;

        this.state._addAddressToAuthList(address, true);
      });

      this.state.upsertModifyPairs(modifiedPairs);
      this.migrateDerivedSoloAccountRelationship(soloAccounts);
      this.state.upsertAccountProxyByKey({ id: upcomingProxyId, name: accountName, isMigrationDone: true });

      // Re-update account name
      soloAccountProxyIds.forEach((oldProxyId) => {
        const pair = keyring.getPair(oldProxyId);

        keyring.saveAccountMeta(pair, { ...pair.meta, name: accountName });
      });

      // Update current account after migrating
      const currentAccountProxyId = this.state.currentAccount.proxyId;

      if (soloAccountProxyIds.includes(currentAccountProxyId)) {
        this.state.saveCurrentAccountProxyId(upcomingProxyId);
      }
    } catch (error) {
      console.error('Migration solo account failed with error', error);
    } finally {
      keyring.lockAll(false);
      this.parentService.updateKeyringState();
    }

    return {
      migratedUnifiedAccountId: upcomingProxyId
    };
  }

  public migrateDerivedSoloAccountRelationship (soloAccounts: SoloAccountToBeMigrated[]) {
    const accountProxies = this.state.accountProxies;

    // Use Set.has & Map.get to optimize search performance
    const proxyIdsSet = new Set(soloAccounts.map((account) => account.proxyId));
    const proxyIdToUpcomingProxyIdMap = new Map(soloAccounts.map((account) => [account.proxyId, account.upcomingProxyId]));

    for (const account of Object.values(accountProxies)) {
      const currentParent = account.parentId;

      if (currentParent && proxyIdsSet.has(currentParent)) {
        accountProxies[account.id].parentId = proxyIdToUpcomingProxyIdMap.get(currentParent);
      }
    }

    this.state.upsertAccountProxy(accountProxies);
  }
}
