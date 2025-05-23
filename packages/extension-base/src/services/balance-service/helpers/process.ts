// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@bitriel/chain-list';
import { _ChainAsset } from '@bitriel/chain-list/types';
import { _Address } from '@bitriel/extension-base/background/KoniTypes';
import { _EvmApi } from '@bitriel/extension-base/services/chain-service/types';
import { CommonOptimalTransferPath, CommonStepType, DEFAULT_FIRST_STEP, MOCK_STEP_FEE } from '@bitriel/extension-base/types/service-base';

export interface RequestOptimalTransferProcess {
  originChain: string,
  destChain?: string,
  tokenSlug: string,
  address: _Address,
  amount: string
}

export function getDefaultTransferProcess (): CommonOptimalTransferPath {
  return {
    totalFee: [MOCK_STEP_FEE, MOCK_STEP_FEE],
    steps: [
      DEFAULT_FIRST_STEP,
      {
        id: 1,
        type: CommonStepType.TRANSFER,
        name: 'Transfer'
      }
    ]
  };
}

export async function getSnowbridgeTransferProcessFromEvm (address: string, evmApi: _EvmApi, tokenInfo: _ChainAsset, amount: string): Promise<CommonOptimalTransferPath> { // todo: refactor, AvailBridge also go into this function
  if (![COMMON_CHAIN_SLUGS.ETHEREUM as string, COMMON_CHAIN_SLUGS.ETHEREUM_SEPOLIA as string].includes(tokenInfo.originChain)) {
    throw new Error('Snowbridge or AvailBridge only has support for Ethereum');
  }

  const result: CommonOptimalTransferPath = {
    totalFee: [MOCK_STEP_FEE],
    steps: [DEFAULT_FIRST_STEP]
  };
  // const allowance = await getERC20Allowance(getSnowBridgeGatewayContract(evmApi.chainSlug), address, _getContractAddressOfToken(tokenInfo), evmApi);

  result.steps.push({ // always approve spending because sometimes allowance check fails
    id: result.steps.length,
    type: CommonStepType.TOKEN_APPROVAL,
    name: 'Approve spending'
  });
  result.totalFee.push(MOCK_STEP_FEE);
  // if (!allowance || BigInt(allowance) < BigInt(amount)) {
  // }

  result.steps.push({
    id: result.steps.length,
    type: CommonStepType.TRANSFER,
    name: 'Transfer'
  });
  result.totalFee.push(MOCK_STEP_FEE);

  return Promise.resolve(result);
}

export async function getAcrossbridgeTransferProcessFromEvm (SpokePoolAddress: string): Promise<CommonOptimalTransferPath> {
  const result: CommonOptimalTransferPath = {
    totalFee: [MOCK_STEP_FEE],
    steps: [DEFAULT_FIRST_STEP]
  };

  result.steps.push({
    id: result.steps.length,
    type: CommonStepType.TOKEN_APPROVAL,
    name: 'Approve spending',
    metadata: { SpokePoolAddress }
  });
  result.totalFee.push(MOCK_STEP_FEE);

  result.steps.push({
    id: result.steps.length,
    type: CommonStepType.TRANSFER,
    name: 'Transfer'
  });
  result.totalFee.push(MOCK_STEP_FEE);

  return Promise.resolve(result);
}
