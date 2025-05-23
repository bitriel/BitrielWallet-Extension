// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

export interface OnlineEvmChainInfo {
  chain: string;
  name: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  explorers: {
    name: string;
    url: string;
    standard: string;
  }[]
}

const onlineMap: Record<number, OnlineEvmChainInfo> = {};

export async function getEVMChainInfo (chainId: number) {
  if (Object.keys(onlineMap).length === 0) {
    try {
      const rs = await fetch('https://chainid.network/chains.json');
      const data = (await rs.json()) as OnlineEvmChainInfo[];

      data.forEach((item) => {
        onlineMap[item.chainId] = item;
      });
    } catch (e) {
      console.error(e);

      return null;
    }
  }

  return onlineMap[chainId];
}
