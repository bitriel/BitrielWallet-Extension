// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@bitriel/chain-list/types';
import { TransactionError } from '@bitriel/extension-base/background/errors/TransactionError';
import { _Address, AmountData, ExtrinsicDataTypeMap, ExtrinsicType, FeeData } from '@bitriel/extension-base/background/KoniTypes';
import { TransactionWarning } from '@bitriel/extension-base/background/warnings/TransactionWarning';
import { _SUPPORT_TOKEN_PAY_FEE_GROUP, LEDGER_SIGNING_COMPATIBLE_MAP, SIGNING_COMPATIBLE_MAP, XCM_MIN_AMOUNT_RATIO } from '@bitriel/extension-base/constants';
import { _canAccountBeReaped, _isAccountActive } from '@bitriel/extension-base/core/substrate/system-pallet';
import { FrameSystemAccountInfo } from '@bitriel/extension-base/core/substrate/types';

import { isBounceableAddress } from '@bitriel/extension-base/services/balance-service/helpers/subscribe/ton/utils';
import { _TRANSFER_CHAIN_GROUP } from '@bitriel/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi, _TonApi } from '@bitriel/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getAssetPriceId, _getAssetSymbol, _getChainNativeTokenBasicInfo, _getContractAddressOfToken, _getTokenMinAmount, _isNativeToken, _isNativeTokenBySlug, _isTokenEvmSmartContract, _isTokenTonSmartContract } from '@bitriel/extension-base/services/chain-service/utils';
import { calculateToAmountByReservePool, FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE } from '@bitriel/extension-base/services/fee-service/utils';
import { isSubstrateTransaction, isTonTransaction } from '@bitriel/extension-base/services/transaction-service/helpers';
import { OptionalSWTransaction, SWTransactionInput, SWTransactionResponse } from '@bitriel/extension-base/services/transaction-service/types';
import { AccountSignMode, BasicTxErrorType, BasicTxWarningCode, EvmEIP1559FeeOption, EvmFeeInfo, TransferTxErrorType } from '@bitriel/extension-base/types';
import { balanceFormatter, combineEthFee, formatNumber, pairToAccount } from '@bitriel/extension-base/utils';
import { isTonAddress } from '@subwallet/keyring';
import { KeyringPair } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import { t } from 'i18next';

import { isEthereumAddress } from '@polkadot/util-crypto';

// normal transfer
export function validateTransferRequest (tokenInfo: _ChainAsset, from: _Address, to: _Address, value: string | undefined, transferAll: boolean | undefined): TransactionError[] {
  const errors: TransactionError[] = [];

  if (!transferAll) {
    if (value === undefined) {
      errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Transfer amount is required')));
    }
  }

  if (!tokenInfo) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Not found token from registry')));
  }

  if (isEthereumAddress(from) && isEthereumAddress(to) && _isTokenEvmSmartContract(tokenInfo) && _getContractAddressOfToken(tokenInfo).length === 0) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Not found ERC20 address for this token')));
  }

  if (isTonAddress(from) && isTonAddress(to) && _isTokenTonSmartContract(tokenInfo) && _getContractAddressOfToken(tokenInfo).length === 0) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Not found TEP74 address for this token')));
  }

  return errors;
}

export function additionalValidateTransferForRecipient (
  sendingTokenInfo: _ChainAsset,
  nativeTokenInfo: _ChainAsset,
  extrinsicType: ExtrinsicType,
  receiverSendingTokenKeepAliveBalance: bigint,
  transferAmount: bigint,
  senderSendingTokenTransferable?: bigint,
  receiverSystemAccountInfo?: FrameSystemAccountInfo,
  isSendingTokenSufficient?: boolean
): [TransactionWarning[], TransactionError[]] {
  const sendingTokenMinAmount = BigInt(_getTokenMinAmount(sendingTokenInfo));
  const sendingTokenMinAmountXCM = new BigN(_getTokenMinAmount(sendingTokenInfo)).multipliedBy(XCM_MIN_AMOUNT_RATIO);
  const nativeTokenMinAmount = _getTokenMinAmount(nativeTokenInfo);

  const warnings: TransactionWarning[] = [];
  const errors: TransactionError[] = [];

  const remainingSendingTokenOfSenderEnoughED = senderSendingTokenTransferable ? senderSendingTokenTransferable - transferAmount >= sendingTokenMinAmount : false;
  const isReceiverAliveByNativeToken = receiverSystemAccountInfo ? _isAccountActive(receiverSystemAccountInfo) : false;
  const isReceivingAmountPassED = receiverSendingTokenKeepAliveBalance + transferAmount >= sendingTokenMinAmount;
  const enoughAmountForXCM = extrinsicType === ExtrinsicType.TRANSFER_XCM ? new BigN(transferAmount.toString()).gte(sendingTokenMinAmountXCM) : true;

  if (!enoughAmountForXCM) {
    const minXCMStr = formatNumber(sendingTokenMinAmountXCM.toString(), _getAssetDecimals(sendingTokenInfo), balanceFormatter, { maxNumberFormat: _getAssetDecimals(sendingTokenInfo) || 6 });

    const error = new TransactionError(
      TransferTxErrorType.NOT_ENOUGH_VALUE,
      t('You must transfer at least {{amount}} {{symbol}} to keep the recipient account alive. Increase amount and try again', { replace: { amount: minXCMStr, symbol: sendingTokenInfo.symbol } })
    );

    errors.push(error);
  }

  if (!_isNativeToken(sendingTokenInfo)) {
    if (!remainingSendingTokenOfSenderEnoughED) {
      const warning = new TransactionWarning(BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT);

      warnings.push(warning);
    }

    if (!isReceiverAliveByNativeToken && !isSendingTokenSufficient) {
      const balanceKeepAlive = formatNumber(nativeTokenMinAmount, _getAssetDecimals(nativeTokenInfo), balanceFormatter, { maxNumberFormat: _getAssetDecimals(nativeTokenInfo) || 6 });

      const error = new TransactionError(
        TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT,
        t('The recipient account has less than {{amount}} {{nativeSymbol}}, which can lead to your {{localSymbol}} being lost. Change recipient account and try again', { replace: { amount: balanceKeepAlive, nativeSymbol: nativeTokenInfo.symbol, localSymbol: sendingTokenInfo.symbol } })
      );

      errors.push(error);
    }

    if (!isReceivingAmountPassED) {
      const atLeast = sendingTokenMinAmount - receiverSendingTokenKeepAliveBalance;

      const atLeastStr = formatNumber(atLeast.toString(), _getAssetDecimals(sendingTokenInfo), balanceFormatter, { maxNumberFormat: _getAssetDecimals(sendingTokenInfo) || 6 });

      const error = new TransactionError(
        TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT,
        t('You must transfer at least {{amount}} {{symbol}} to avoid losing funds on the recipient account. Increase amount and try again', { replace: { amount: atLeastStr, symbol: sendingTokenInfo.symbol } })
      );

      errors.push(error);
    }
  }

  if (!isReceivingAmountPassED) {
    const atLeast = sendingTokenMinAmount - receiverSendingTokenKeepAliveBalance;

    const atLeastStr = formatNumber(atLeast.toString(), _getAssetDecimals(sendingTokenInfo), balanceFormatter, { maxNumberFormat: _getAssetDecimals(sendingTokenInfo) || 6 });

    const error = new TransactionError(
      TransferTxErrorType.RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT,
      t('You must transfer at least {{amount}} {{symbol}} to keep the recipient account alive. Increase amount and try again', { replace: { amount: atLeastStr, symbol: sendingTokenInfo.symbol } })
    );

    errors.push(error);
  }

  return [warnings, errors];
}

// xcm transfer
export function validateXcmTransferRequest (destTokenInfo: _ChainAsset | undefined, sender: _Address, sendingValue: string): [TransactionError[], KeyringPair | undefined] {
  const errors = [] as TransactionError[];
  const keypair = keyring.getPair(sender);

  if (!destTokenInfo) {
    errors.push(new TransactionError(TransferTxErrorType.INVALID_TOKEN, t('Not found token from registry')));
  }

  return [errors, keypair];
}

export function checkSupportForFeature (validationResponse: SWTransactionResponse, blockedFeaturesList: string[], chainInfo: _ChainInfo) {
  const extrinsicType = validationResponse.extrinsicType;
  const chain = validationResponse.chain;
  const currentFeature = `${extrinsicType}___${chain}`;

  if (blockedFeaturesList.includes(currentFeature)) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.UNSUPPORTED, t(`Feature under maintenance on ${chainInfo.name} network. Try again later`)));
  }
}

export function checkSupportForAction (validationResponse: SWTransactionResponse, blockedActionsMap: Record<ExtrinsicType, string[]>) {
  const extrinsicType = validationResponse.extrinsicType;
  let currentAction = '';

  switch (extrinsicType) {
    case ExtrinsicType.TRANSFER_BALANCE:

    // eslint-disable-next-line no-fallthrough
    case ExtrinsicType.TRANSFER_TOKEN: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_BALANCE];
      const tokenSlug = data.tokenSlug;

      currentAction = `${extrinsicType}___${tokenSlug}`;
      break;
    }

    case ExtrinsicType.TRANSFER_XCM: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_XCM];
      const tokenSlug = data.tokenSlug;
      const destinationNetworkKey = data.destinationNetworkKey;

      currentAction = `${extrinsicType}___${tokenSlug}___${destinationNetworkKey}`;
      break;
    }

    case ExtrinsicType.SEND_NFT: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.SEND_NFT];
      const networkKey = data.networkKey;
      const collectionId = data.nftItem.collectionId;

      currentAction = `${extrinsicType}___${networkKey}___${collectionId}`;
      break;
    }

    case ExtrinsicType.SWAP: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.SWAP];
      const pairSlug = data.quote.pair.slug;
      const providerId = data.provider.id;

      currentAction = `${extrinsicType}___${pairSlug}___${providerId}`;
      break;
    }

    case ExtrinsicType.STAKING_BOND: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_BOND];
      const chain = data.chain;

      currentAction = `${extrinsicType}___${chain}`;
      break;
    }

    case ExtrinsicType.STAKING_LEAVE_POOL: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_LEAVE_POOL];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.STAKING_UNBOND: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_UNBOND];
      const chain = data.chain;

      currentAction = `${extrinsicType}___${chain}`;
      break;
    }

    case ExtrinsicType.STAKING_CLAIM_REWARD: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_CLAIM_REWARD];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.STAKING_WITHDRAW: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_WITHDRAW];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.STAKING_COMPOUNDING: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_COMPOUNDING];
      const networkKey = data.networkKey;

      currentAction = `${extrinsicType}___${networkKey}`;
      break;
    }

    case ExtrinsicType.STAKING_CANCEL_COMPOUNDING: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_CANCEL_COMPOUNDING];
      const networkKey = data.networkKey;

      currentAction = `${extrinsicType}___${networkKey}`;
      break;
    }

    case ExtrinsicType.STAKING_CANCEL_UNSTAKE: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.STAKING_CANCEL_UNSTAKE];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.JOIN_YIELD_POOL: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.JOIN_YIELD_POOL];
      const slug = data.data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.MINT_VDOT:
    case ExtrinsicType.MINT_LDOT:
    case ExtrinsicType.MINT_SDOT:
    case ExtrinsicType.MINT_QDOT:
    case ExtrinsicType.MINT_STDOT:

    // eslint-disable-next-line no-fallthrough
    case ExtrinsicType.MINT_VMANTA: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.MINT_VMANTA];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.REDEEM_VDOT:
    case ExtrinsicType.REDEEM_LDOT:
    case ExtrinsicType.REDEEM_SDOT:
    case ExtrinsicType.REDEEM_QDOT:
    case ExtrinsicType.REDEEM_STDOT:

    // eslint-disable-next-line no-fallthrough
    case ExtrinsicType.REDEEM_VMANTA: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.REDEEM_VMANTA];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.UNSTAKE_VDOT:
    case ExtrinsicType.UNSTAKE_LDOT:
    case ExtrinsicType.UNSTAKE_SDOT:
    case ExtrinsicType.UNSTAKE_QDOT:
    case ExtrinsicType.UNSTAKE_STDOT:

    // eslint-disable-next-line no-fallthrough
    case ExtrinsicType.UNSTAKE_VMANTA: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.UNSTAKE_VMANTA];
      const slug = data.slug;

      currentAction = `${extrinsicType}___${slug}`;
      break;
    }

    case ExtrinsicType.TOKEN_SPENDING_APPROVAL: {
      const data = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.TOKEN_SPENDING_APPROVAL];
      const chain = data.chain;

      currentAction = `${extrinsicType}___${chain}`;
      break;
    }
  }

  const blockedActionsList = Object.values(blockedActionsMap).flat();

  if (blockedActionsList.includes(currentAction)) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.UNSUPPORTED, t('Feature under maintenance. Try again later')));
  }
}

// general validations
export function checkSupportForTransaction (validationResponse: SWTransactionResponse, transaction: OptionalSWTransaction) {
  const { extrinsicType } = validationResponse;

  if (!transaction) {
    if (extrinsicType === ExtrinsicType.SEND_NFT) {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.UNSUPPORTED, t('This feature is not yet available for this NFT')));
    } else {
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.UNSUPPORTED));
    }
  }
}

export async function estimateFeeForTransaction (validationResponse: SWTransactionResponse, transaction: OptionalSWTransaction, chainInfo: _ChainInfo, evmApi: _EvmApi, substrateApi: _SubstrateApi, priceMap: Record<string, number>, feeInfo: EvmFeeInfo, nativeTokenInfo: _ChainAsset, nonNativeTokenPayFeeInfo: _ChainAsset | undefined, isTransferLocalTokenAndPayThatTokenAsFee: boolean | undefined): Promise<FeeData> {
  const estimateFee: FeeData = {
    symbol: '',
    decimals: 0,
    value: '0',
    tooHigh: false
  };
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  estimateFee.decimals = decimals;
  estimateFee.symbol = symbol;

  if (transaction) {
    try {
      if (isSubstrateTransaction(transaction)) {
        estimateFee.value = validationResponse.xcmFeeDryRun ?? (await transaction.paymentInfo(validationResponse.address)).partialFee.toString();
      } else if (isTonTransaction(transaction)) {
        estimateFee.value = transaction.estimateFee; // todo: might need to update logic estimate fee inside for future actions excluding normal transfer Ton and Jetton
      } else {
        const gasLimit = transaction.gas || await evmApi.api.eth.estimateGas(transaction);

        const feeCombine = combineEthFee(feeInfo, validationResponse.feeOption, validationResponse.feeCustom as EvmEIP1559FeeOption);

        if (transaction.maxFeePerGas) {
          estimateFee.value = new BigN(transaction.maxFeePerGas.toString()).multipliedBy(gasLimit).toFixed(0);
        } else if (transaction.gasPrice) {
          estimateFee.value = new BigN(transaction.gasPrice.toString()).multipliedBy(gasLimit).toFixed(0);
        } else {
          if (feeCombine.maxFeePerGas) {
            const maxFee = new BigN(feeCombine.maxFeePerGas); // TODO: Need review

            estimateFee.value = maxFee.multipliedBy(gasLimit).toFixed(0);
          } else if (feeCombine.gasPrice) {
            estimateFee.value = new BigN((feeCombine.gasPrice || 0)).multipliedBy(gasLimit).toFixed(0);
          }
        }

        estimateFee.tooHigh = feeInfo.busyNetwork;
      }
    } catch (e) {
      const error = e as Error;

      if (error.message.includes('gas required exceeds allowance') && error.message.includes('insufficient funds')) {
        validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE));
      }
    }
  }

  const isCustomTokenPayFeeAssetHub = !!nonNativeTokenPayFeeInfo && _SUPPORT_TOKEN_PAY_FEE_GROUP.assetHub.includes(nonNativeTokenPayFeeInfo.originChain);
  const isCustomTokenPayFeeHydration = !!nonNativeTokenPayFeeInfo && _SUPPORT_TOKEN_PAY_FEE_GROUP.hydration.includes(nonNativeTokenPayFeeInfo.originChain);

  if (isCustomTokenPayFeeAssetHub) {
    const estimatedFeeAmount = isTransferLocalTokenAndPayThatTokenAsFee ? (BigInt(estimateFee.value) * BigInt(FEE_COVERAGE_PERCENTAGE_SPECIAL_CASE) / BigInt(100)).toString() : estimateFee.value;

    estimateFee.decimals = _getAssetDecimals(nonNativeTokenPayFeeInfo);
    estimateFee.symbol = _getAssetSymbol(nonNativeTokenPayFeeInfo);
    estimateFee.value = await calculateToAmountByReservePool(substrateApi.api, nativeTokenInfo, nonNativeTokenPayFeeInfo, estimatedFeeAmount);
  }

  if (isCustomTokenPayFeeHydration) {
    const nativePriceId = _getAssetPriceId(nativeTokenInfo);
    const nativeDecimals = _getAssetDecimals(nativeTokenInfo);
    const nativePrice = priceMap[nativePriceId];

    const tokenPriceId = _getAssetPriceId(nonNativeTokenPayFeeInfo);
    const tokenDecimals = _getAssetDecimals(nonNativeTokenPayFeeInfo);
    const tokenPrice = priceMap[tokenPriceId];

    const rate = new BigN(nativePrice).div(tokenPrice).multipliedBy(10 ** (tokenDecimals - nativeDecimals)).toFixed();

    estimateFee.decimals = _getAssetDecimals(nonNativeTokenPayFeeInfo);
    estimateFee.symbol = _getAssetSymbol(nonNativeTokenPayFeeInfo);
    estimateFee.value = new BigN(estimateFee.value).multipliedBy(rate).toFixed(0);
  }

  return estimateFee;
}

export function checkSigningAccountForTransaction (validationResponse: SWTransactionResponse, chainInfoMap: Record<string, _ChainInfo>) {
  const { address, chain, chainType, extrinsicType } = validationResponse;
  const pair = keyring.getPair(address);

  if (!pair) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, t('Unable to find account')));
  } else {
    const accountJson = pairToAccount(pair, chainInfoMap);

    if (!accountJson.transactionActions.includes(extrinsicType)) { // check if the account can sign the transaction type
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('This feature is not available with this account')));
    } else if (accountJson.specialChain && accountJson.specialChain !== chain) { // check if the account can only be used on a specific chain (for ledger legacy)
      validationResponse.errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('This feature is not available with this account')));
    } else {
      const compatibleMap = [AccountSignMode.LEGACY_LEDGER, AccountSignMode.GENERIC_LEDGER].includes(accountJson.signMode) ? LEDGER_SIGNING_COMPATIBLE_MAP : SIGNING_COMPATIBLE_MAP;

      if (!compatibleMap[chainType].includes(accountJson.chainType)) { // check if the account chain type is compatible with the transaction chain type
        validationResponse.errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('This feature is not available with this account')));
      }
    }
  }
}

export function checkBalanceWithTransactionFee (validationResponse: SWTransactionResponse, transactionInput: SWTransactionInput, nativeTokenInfo: _ChainAsset, nativeTokenAvailable: AmountData) {
  if (!validationResponse.estimateFee) { // todo: estimateFee should be must-have, need to refactor interface
    return;
  }

  const { edAsWarning, extrinsicType, isTransferAll, skipFeeValidation, tokenPayFeeSlug } = transactionInput;

  if (skipFeeValidation || (tokenPayFeeSlug && !_isNativeTokenBySlug(tokenPayFeeSlug))) { // todo: need improve: input should be balance of fee token and check this again
    return;
  }

  const bnFee = new BigN(validationResponse.estimateFee.value);
  const bnNativeTokenAvailable = new BigN(nativeTokenAvailable.value);
  const bnNativeTokenTransferAmount = new BigN(validationResponse.transferNativeAmount || '0');

  if (!bnNativeTokenAvailable.gt(0)) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE));
  }

  const isChainNotSupportTransferAll = [
    ..._TRANSFER_CHAIN_GROUP.acala,
    ..._TRANSFER_CHAIN_GROUP.genshiro,
    ..._TRANSFER_CHAIN_GROUP.bitcountry,
    ..._TRANSFER_CHAIN_GROUP.statemine
  ].includes(nativeTokenInfo.originChain);

  if (bnNativeTokenTransferAmount.plus(bnFee).gt(bnNativeTokenAvailable) && (!isTransferAll || isChainNotSupportTransferAll)) {
    validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE)); // todo: should be generalized and reused in all features
  }

  // todo: only system.pallet has metadata, we should add for other pallets and mechanisms as well
  const isNeedCheckRemainingBalance = !isTransferAll && extrinsicType === ExtrinsicType.TRANSFER_BALANCE && nativeTokenAvailable.metadata && _canAccountBeReaped(nativeTokenAvailable.metadata as FrameSystemAccountInfo);
  const isRemainingBalanceValid = bnNativeTokenAvailable.minus(bnNativeTokenTransferAmount).minus(bnFee).lt(_getTokenMinAmount(nativeTokenInfo));

  if (isNeedCheckRemainingBalance && isRemainingBalanceValid) {
    edAsWarning
      ? validationResponse.warnings.push(new TransactionWarning(BasicTxWarningCode.NOT_ENOUGH_EXISTENTIAL_DEPOSIT))
      : validationResponse.errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_EXISTENTIAL_DEPOSIT));
  }
}

export async function checkTonAddressBounceableAndAccountNotActive (tonApi: _TonApi, validationResponse: SWTransactionResponse) {
  const { to } = validationResponse.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_BALANCE];
  const isActive = await isAccountActive(tonApi, to);

  if (isTonAddressBounceable(to) && !isActive) {
    validationResponse.warnings.push(new TransactionWarning(BasicTxWarningCode.IS_BOUNCEABLE_ADDRESS));
  }
}

function isTonAddressBounceable (address: string) {
  return isBounceableAddress(address);
}

async function isAccountActive (tonApi: _TonApi, address: string) {
  const state = await tonApi.getAccountState(address);

  return state === 'active';
}

export function validateXcmMinAmountToMythos (destChain: string, destToken: string, amount: string) {
  const MYTHOS_DESTINATION_FEE = '2500000000000000000';
  const errorMsg = 'Enter an amount higher than 2.5 MYTH to pay cross-chain fee and avoid your MYTH being lost after the transaction';

  if (destChain === 'mythos' && destToken === 'mythos-NATIVE-MYTH') {
    if (BigN(amount).lte(MYTHOS_DESTINATION_FEE)) {
      return new TransactionError(TransferTxErrorType.NOT_ENOUGH_VALUE, t(errorMsg));
    }
  }

  return undefined;
}
