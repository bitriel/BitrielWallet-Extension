// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { subwalletApiSdk } from '@bitriel/bitriel-api-sdk';
import { _AssetType, _ChainAsset } from '@bitriel/chain-list/types';
import { CardanoTxJson, CardanoTxOutput } from '@bitriel/extension-base/services/balance-service/helpers/subscribe/cardano/types';
import { CardanoAssetMetadata, getAdaBelongUtxo, getCardanoTxFee, splitCardanoId } from '@bitriel/extension-base/services/balance-service/helpers/subscribe/cardano/utils';
import { _CardanoApi } from '@bitriel/extension-base/services/chain-service/types';
import * as csl from '@emurgo/cardano-serialization-lib-nodejs';

export interface CardanoTransactionConfigProps {
  tokenInfo: _ChainAsset;
  nativeTokenInfo: _ChainAsset;
  from: string,
  to: string,
  networkKey: string,
  value: string,
  transferAll: boolean,
  cardanoTtlOffset: number,
  cardanoApi: _CardanoApi
}

export interface CardanoTransactionConfig {
  from: string,
  to: string,
  networkKey: string,
  value: string,
  transferAll: boolean,
  cardanoTtlOffset: number,
  estimateCardanoFee: string,
  cardanoPayload: string // hex unsigned tx
}

export async function createCardanoTransaction (params: CardanoTransactionConfigProps): Promise<[CardanoTransactionConfig | null, string]> {
  const { cardanoTtlOffset, from, networkKey, to, tokenInfo, transferAll, value } = params;

  const cardanoId = tokenInfo.metadata?.cardanoId;
  const isNativeTransfer = tokenInfo.assetType === _AssetType.NATIVE;
  const isSelfTransfer = from === to;

  if (!cardanoId) {
    throw new Error('Missing token policy id metadata');
  }

  const payload = await subwalletApiSdk.fetchUnsignedPayload({
    tokenDecimals: params.tokenInfo.decimals || 0,
    nativeTokenSymbol: params.nativeTokenInfo.symbol,
    cardanoId,
    from: params.from,
    to: params.to,
    value: params.value,
    cardanoTtlOffset: params.cardanoTtlOffset
  });

  console.log('Build cardano payload successfully!', payload);

  validatePayload(payload, params);

  const fee = getCardanoTxFee(payload);
  const adaBelongToCnaUtxo = isNativeTransfer || isSelfTransfer ? BigInt(0) : getAdaBelongUtxo(payload, to);

  const tx: CardanoTransactionConfig = {
    from,
    to,
    networkKey,
    value,
    transferAll,
    cardanoTtlOffset,
    estimateCardanoFee: (fee + adaBelongToCnaUtxo).toString(),
    cardanoPayload: payload
  };

  return [tx, value];
}

function validatePayload (payload: string, params: CardanoTransactionConfigProps) {
  const txInfo = JSON.parse(csl.Transaction.from_hex(payload).to_json()) as CardanoTxJson;
  const outputs = txInfo.body.outputs;
  const cardanoId = params.tokenInfo.metadata?.cardanoId;
  const assetType = params.tokenInfo.assetType;
  const isSendSameAddress = params.from === params.to;

  if (!cardanoId) {
    throw new Error('Missing cardano id metadata');
  }

  const cardanoAssetMetadata = splitCardanoId(cardanoId);

  if (isSendSameAddress) {
    validateAllOutputsBelongToAddress(params.from, outputs);
    validateExistOutputWithAmountSend(params.value, outputs, assetType, cardanoAssetMetadata);
  } else {
    const [outputsBelongToReceiver, outputsNotBelongToReceiver] = [
      outputs.filter((output) => output.address === params.to),
      outputs.filter((output) => output.address !== params.to)
    ];

    validateReceiverOutputsWithAmountSend(params.value, outputsBelongToReceiver, assetType, cardanoAssetMetadata);
    validateAllOutputsBelongToAddress(params.from, outputsNotBelongToReceiver);
  }
}

function validateAllOutputsBelongToAddress (address: string, outputs: CardanoTxOutput[]) {
  const found = outputs.find((output) => output.address !== address);

  if (found) {
    throw new Error('Transaction has invalid address information');
  }
}

function validateExistOutputWithAmountSend (amount: string, outputs: CardanoTxOutput[], assetType: _AssetType, cardanoAssetMetadata: CardanoAssetMetadata) {
  if (assetType === _AssetType.NATIVE) {
    const found = outputs.find((output) => output.amount.coin === amount);

    if (found) {
      return;
    }

    throw new Error('Transaction has invalid transfer amount information');
  }

  if (assetType === _AssetType.CIP26) {
    const found = outputs.find((output) => amount === output.amount.multiasset[cardanoAssetMetadata.policyId]?.[cardanoAssetMetadata.nameHex]);

    if (found) {
      return;
    }

    throw new Error('Transaction has invalid transfer amount information');
  }

  throw new Error('Invalid asset type!');
}

function validateReceiverOutputsWithAmountSend (amount: string, outputs: CardanoTxOutput[], assetType: _AssetType, cardanoAssetMetadata: CardanoAssetMetadata) {
  if (outputs.length !== 1) {
    throw new Error('Transaction has invalid transfer amount information');
  }

  const receiverOutput = outputs[0];

  if (assetType === _AssetType.NATIVE) {
    if (receiverOutput.amount.coin === amount) {
      return;
    }

    throw new Error('Transaction has invalid transfer amount information');
  }

  if (assetType === _AssetType.CIP26) {
    if (receiverOutput.amount.multiasset[cardanoAssetMetadata.policyId][cardanoAssetMetadata.nameHex] === amount) {
      return;
    }

    throw new Error('Transaction has invalid transfer amount information');
  }

  throw new Error('Invalid asset type!');
}
