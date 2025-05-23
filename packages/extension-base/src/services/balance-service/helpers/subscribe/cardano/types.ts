// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

export interface CardanoAddressBalance {
  address: string;
  amount: CardanoBalanceItem[],
  stake_address: string,
  type: string, // todo: consider create interface for type
  script: boolean
}

export interface CardanoBalanceItem {
  unit: string,
  quantity: string
}

export interface CardanoUtxosItem {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: CardanoBalanceItem[],
  data_hash: string | null;
  inline_datum: string | null;
  reference_script_hash: string | null;
}

export interface TransactionUtxosItem {
  hash: string;
  inputs: CardanoUtxosItem[];
  outputs: CardanoUtxosItem[];
}

export interface CardanoTxJson {
  body: {
    inputs: CardanoTxInput[],
    outputs: CardanoTxOutput[],
    fee: string,
    ttl: string
  }
  witness_set: any,
  is_valid: any,
  auxiliary_data: any
}

export interface CardanoTxOutput {
  address: string,
  amount: {
    coin: string,
    multiasset: Record<string, Record<string, string>>;
  }
}

interface CardanoTxInput {
  transaction_id: string,
  index: number
}
