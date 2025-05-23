// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@bitriel/chain-list';
import { _ChainAsset, _ChainInfo } from '@bitriel/chain-list/types';
import { getWeb3Contract } from '@bitriel/extension-base/koni/api/contract-handler/evm/web3';
import { _POLYGON_BRIDGE_ABI, getPolygonBridgeContract } from '@bitriel/extension-base/koni/api/contract-handler/utils';
import { _EvmApi } from '@bitriel/extension-base/services/chain-service/types';
import { _getContractAddressOfToken } from '@bitriel/extension-base/services/chain-service/utils';
import { _NotificationInfo, ClaimPolygonBridgeNotificationMetadata } from '@bitriel/extension-base/services/inapp-notification-service/interfaces';
import { EvmEIP1559FeeOption, EvmFeeInfo, FeeCustom, FeeInfo, FeeOption } from '@bitriel/extension-base/types';
import { combineEthFee } from '@bitriel/extension-base/utils';
import { TransactionConfig } from 'web3-core';
import { ContractSendMethod } from 'web3-eth-contract';

export interface gasStation{
  safeLow: number;
  standard: number;
  fastLow: number;
}

interface Proof {
  main_exit_root: string[];
  merkle_proof: string[];
  rollup_exit_root: string;
  rollup_merkle_proof: string;
}

interface ClaimNotification {
  proof: Proof;
}

export const POLYGON_PROOF_INDEXER = {
  MAINNET: 'https://api-gateway.polygon.technology/api/v3/proof/mainnet/merkle-proof',
  TESTNET: 'https://api-gateway.polygon.technology/api/v3/proof/testnet/merkle-proof'
};

export const POLYGON_GAS_INDEXER = {
  MAINNET: 'https://gasstation.polygon.technology/zkevm',
  TESTNET: 'https://gasstation.polygon.technology/zkevm/cardona'
};

async function createPolygonBridgeTransaction (
  tokenInfo: _ChainAsset,
  originChainInfo: _ChainInfo,
  sender: string,
  recipientAddress: string,
  value: string,
  destinationNetwork: number,
  evmApi: _EvmApi,
  _feeInfo: FeeInfo,
  feeCustom?: FeeCustom,
  feeOption?: FeeOption
): Promise<TransactionConfig> {
  const polygonBridgeContractAddress = getPolygonBridgeContract(originChainInfo.slug);
  const polygonBridgeContract = getWeb3Contract(polygonBridgeContractAddress, evmApi, _POLYGON_BRIDGE_ABI);
  const tokenContract = _getContractAddressOfToken(tokenInfo) || '0x0000000000000000000000000000000000000000'; // FOR Ethereum: use null address

  if (tokenContract !== '0x0000000000000000000000000000000000000000') {
    throw new Error('Only native token transfer is supported');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const transferCall: ContractSendMethod = polygonBridgeContract.methods.bridgeAsset(
    destinationNetwork,
    recipientAddress,
    value,
    tokenContract,
    true,
    '0x'
  );
  const transferEncodedCall = transferCall.encodeABI();
  const feeInfo = _feeInfo as EvmFeeInfo;

  const feeCombine = combineEthFee(feeInfo, feeOption, feeCustom as EvmEIP1559FeeOption);

  const transactionConfig: TransactionConfig = {
    from: sender,
    to: polygonBridgeContractAddress,
    value: value,
    data: transferEncodedCall,
    ...feeCombine
  };

  const gasLimit = await evmApi.api.eth.estimateGas(transactionConfig).catch(() => 200000);

  transactionConfig.gas = gasLimit.toString();

  return transactionConfig;
}

export async function _createPolygonBridgeL1toL2Extrinsic (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, sender: string, recipientAddress: string, value: string, evmApi: _EvmApi, feeInfo: FeeInfo, feeCustom?: FeeCustom, feeOption?: FeeOption): Promise<TransactionConfig> {
  return createPolygonBridgeTransaction(tokenInfo, originChainInfo, sender, recipientAddress, value, 1, evmApi, feeInfo, feeCustom, feeOption);
}

export async function _createPolygonBridgeL2toL1Extrinsic (tokenInfo: _ChainAsset, originChainInfo: _ChainInfo, sender: string, recipientAddress: string, value: string, evmApi: _EvmApi, feeInfo: FeeInfo, feeCustom?: FeeCustom, feeOption?: FeeOption): Promise<TransactionConfig> {
  return createPolygonBridgeTransaction(tokenInfo, originChainInfo, sender, recipientAddress, value, 0, evmApi, feeInfo, feeCustom, feeOption);
}

export async function getClaimPolygonBridge (chainSlug: string, notification: _NotificationInfo, evmApi: _EvmApi, feeInfo: EvmFeeInfo) {
  const polygonBridgeContractAddress = getPolygonBridgeContract(chainSlug);
  const polygonBridgeContract = getWeb3Contract(polygonBridgeContractAddress, evmApi, _POLYGON_BRIDGE_ABI);
  const metadata = notification.metadata as ClaimPolygonBridgeNotificationMetadata;

  const isTestnet = chainSlug === COMMON_CHAIN_SLUGS.ETHEREUM_SEPOLIA;
  const proofDomain = isTestnet ? POLYGON_PROOF_INDEXER.TESTNET : POLYGON_PROOF_INDEXER.MAINNET;

  const proofResponse = await fetch(`${proofDomain}?networkId=${metadata.sourceNetwork ?? ''}&depositCount=${metadata.counter ?? ''}`)
    .then((res) => res.json()) as ClaimNotification;
  const proof = proofResponse.proof;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const transferCall: ContractSendMethod = polygonBridgeContract.methods.claimAsset(proof.merkle_proof, proof.rollup_merkle_proof, metadata.counter, proof.main_exit_root, proof.rollup_exit_root, metadata.originTokenNetwork, metadata.originTokenAddress, metadata.destinationNetwork, metadata.receiver, metadata.amounts[0], '0x');
  const transferEncodedCall = transferCall.encodeABI();

  const feeCombine = combineEthFee(feeInfo);

  const transactionConfig = {
    from: metadata.userAddress,
    to: polygonBridgeContractAddress,
    value: '0',
    data: transferEncodedCall,
    ...feeCombine
  } as TransactionConfig;

  const gasLimit = await evmApi.api.eth.estimateGas(transactionConfig).catch(() => 200000);

  transactionConfig.gas = gasLimit.toString();

  return transactionConfig;
}

export async function isClaimedPolygonBridge (chainSlug: string, counter: number, sourceNetwork: number, evmApi: _EvmApi) {
  const polygonBridgeContractAddress = getPolygonBridgeContract(chainSlug);
  const polygonBridgeContract = getWeb3Contract(polygonBridgeContractAddress, evmApi, _POLYGON_BRIDGE_ABI);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
  return await polygonBridgeContract.methods.isClaimed(counter, sourceNetwork).call();
}

export function _isPolygonChainBridge (srcChain: string, destChain: string): boolean {
  if (srcChain === 'polygonzkEvm_cardona' && destChain === COMMON_CHAIN_SLUGS.ETHEREUM_SEPOLIA) {
    return true;
  } else if (srcChain === COMMON_CHAIN_SLUGS.ETHEREUM_SEPOLIA && destChain === 'polygonzkEvm_cardona') {
    return true;
  } else if (srcChain === 'polygonZkEvm' && destChain === COMMON_CHAIN_SLUGS.ETHEREUM) {
    return true;
  } else if (srcChain === COMMON_CHAIN_SLUGS.ETHEREUM && destChain === 'polygonZkEvm') {
    return true;
  }

  return false;
}
