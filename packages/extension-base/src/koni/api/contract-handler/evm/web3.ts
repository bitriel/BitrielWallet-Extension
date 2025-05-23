// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _Address } from '@bitriel/extension-base/background/KoniTypes';
import { _ERC20_ABI } from '@bitriel/extension-base/koni/api/contract-handler/utils';
import { _EvmApi } from '@bitriel/extension-base/services/chain-service/types';
import { calculateGasFeeParams } from '@bitriel/extension-base/services/fee-service/utils';
import { EvmFeeInfo } from '@bitriel/extension-base/types';
import { combineEthFee } from '@bitriel/extension-base/utils';
import BigNumber from 'bignumber.js';
import { TransactionConfig } from 'web3-core';
import { Contract, ContractSendMethod } from 'web3-eth-contract';

export const getERC20Contract = (assetAddress: string, evmApi: _EvmApi, options = {}): Contract => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApi.api.eth.Contract(_ERC20_ABI, assetAddress, options);
};

export function getWeb3Contract (contractAddress: _Address, evmApi: _EvmApi, contractAbi: Record<string, any>, options = {}): Contract {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
  return new evmApi.api.eth.Contract(contractAbi, contractAddress, options);
}

export async function getERC20Allowance (spender: _Address, owner: _Address, contractAddress: _Address, evmApi: _EvmApi): Promise<string> {
  const tokenContract = getERC20Contract(contractAddress, evmApi);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const allowanceCall = tokenContract.methods.allowance(owner, spender) as ContractSendMethod;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  return (await allowanceCall.call()) as string;
}

export async function getERC20SpendingApprovalTx (spender: _Address, owner: _Address, contractAddress: _Address, evmApi: _EvmApi, amount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'): Promise<TransactionConfig> {
  const tokenContract = getERC20Contract(contractAddress, evmApi);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const approveCall = tokenContract.methods.approve(spender, amount); // TODO: need test
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const approveEncodedCall = approveCall.encodeABI() as string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const gasLimit = await approveCall.estimateGas({ from: owner }) as number;
  const priority = await calculateGasFeeParams(evmApi, evmApi.chainSlug);
  const feeCombine = combineEthFee(priority);

  return {
    from: owner,
    to: contractAddress,
    data: approveEncodedCall,
    gas: gasLimit,
    gasPrice: priority.gasPrice,
    ...feeCombine
  } as TransactionConfig;
}

export async function estimateTxFee (tx: TransactionConfig, evmApi: _EvmApi, feeInfo: EvmFeeInfo): Promise<string> {
  const gasLimit = tx.gas || await evmApi.api.eth.estimateGas(tx);
  const feeCombine = combineEthFee(feeInfo);

  let estimatedFee: string;

  if (tx.maxFeePerGas) {
    estimatedFee = BigNumber(tx.maxFeePerGas.toString()).multipliedBy(gasLimit).toFixed(0);
  } else if (tx.gasPrice) {
    estimatedFee = BigNumber(tx.gasPrice.toString()).multipliedBy(gasLimit).toFixed(0);
  } else {
    if (feeCombine.maxFeePerGas) {
      estimatedFee = BigNumber(feeCombine.maxFeePerGas).multipliedBy(gasLimit).toFixed(0);
    } else if (feeCombine.gasPrice) {
      estimatedFee = BigNumber((feeCombine.gasPrice)).multipliedBy(gasLimit).toFixed(0);
    }

    estimatedFee = '0';
  }

  return estimatedFee;
}
