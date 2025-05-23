// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { AssetRefMap, ChainAssetMap, ChainInfoMap } from '@bitriel/chain-list';
import { _AssetRef, _AssetRefPath } from '@bitriel/chain-list/types';
import { createXcmExtrinsic } from '@bitriel/extension-base/services/balance-service/transfer/xcm';
import { SubstrateChainHandler } from '@bitriel/extension-base/services/chain-service/handler/SubstrateChainHandler';
import { _SubstrateApi } from '@bitriel/extension-base/services/chain-service/types';
import { _isChainEvmCompatible } from '@bitriel/extension-base/services/chain-service/utils';
import { SubstrateFeeInfo } from '@bitriel/extension-base/types';

import { cryptoWaitReady } from '@polkadot/util-crypto';

jest.setTimeout(1000 * 60 * 10);

const destAddress1 = '5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL';
const destAddress2 = '0x49E46fc304a448A2132d2DBEd6df47D0084cE92f';

const uniqueArray = (array: string[]): string[] => {
  const map: Record<string, string> = {};

  array.forEach((v) => {
    map[v] = v;
  });

  return Object.keys(map);
};

describe('test token transfer', () => {
  let substrateChainHandler: SubstrateChainHandler;
  const substrateApiMap: Record<string, _SubstrateApi> = {};

  beforeAll(async () => {
    await cryptoWaitReady();

    substrateChainHandler = new SubstrateChainHandler();
  });

  it('substrate transfer', async () => {
    const rawSrcChains = Object.values(AssetRefMap).map((value) => value.srcChain);
    const srcChains = uniqueArray(rawSrcChains);
    const errorList: string[] = [];

    console.log('srcChains', srcChains);

    for (const srcChain of srcChains) {
      const assetRef = Object.values(AssetRefMap).find((ref) => ref.srcChain === srcChain);

      if (!assetRef) {
        continue;
      }

      const chain = ChainInfoMap[srcChain];

      const api = await substrateChainHandler.initApi(srcChain, chain.providers[Object.keys(chain.providers)[0]]);
      const substrateApi = await api.isReady;

      const originTokenInfo = ChainAssetMap[assetRef.srcAsset];
      const destinationTokenInfo = ChainAssetMap[assetRef.destAsset];
      const originChain = ChainInfoMap[assetRef.srcChain];
      const destChain = ChainInfoMap[assetRef.destChain];
      const isDestChainEvm = _isChainEvmCompatible(destChain);
      const destAddress = isDestChainEvm ? destAddress2 : destAddress1;
      const feeInfo: SubstrateFeeInfo = {
        type: 'substrate',
        options: {
          slow: {
            tip: '0'
          },
          fast: {
            tip: '0'
          },
          average: {
            tip: '0'
          },
          default: 'slow'
        },
        busyNetwork: false
      };

      try {
        await createXcmExtrinsic({
          destinationTokenInfo,
          originTokenInfo,
          sendingValue: '0',
          recipient: destAddress,
          substrateApi,
          sender: '5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL',
          feeInfo,
          originChain,
          destinationChain: destChain
        });
      } catch (e) {
        console.log(e);
        errorList.push(srcChain);
      }
    }

    console.log(errorList);
  });

  it('xcm check', async () => {
    const rawChainsMap: Record<string, string> = {};

    Object.values(AssetRefMap).forEach((value) => {
      if (value.path === _AssetRefPath.XCM) {
        rawChainsMap[value.srcChain] = value.srcChain;
      }
    });
    const rawSrcChains = Object.keys(rawChainsMap).map((value) => value);
    const errorList: _AssetRef[] = [];

    await Promise.all(rawSrcChains.map(async (srcChain) => {
      const chainInfo = ChainInfoMap[srcChain];

      const providerIndex = chainInfo.slug !== 'astar' ? 0 : 1;
      const provider = chainInfo.providers[Object.keys(chainInfo.providers)[providerIndex]];

      substrateApiMap[chainInfo.slug] = await substrateChainHandler.initApi(srcChain, provider);
    }));

    for (const assetRef of Object.values(AssetRefMap)) {
      if (assetRef.path !== 'SWAP') {
        const substrateApi = await substrateApiMap[assetRef.srcChain].isReady;
        const destinationTokenInfo = ChainAssetMap[assetRef.destAsset];
        const originTokenInfo = ChainAssetMap[assetRef.srcAsset];
        const destinationChainInfo = ChainInfoMap[assetRef.destChain];
        const originChainInfo = ChainInfoMap[assetRef.srcChain];
        const isDestChainEvm = _isChainEvmCompatible(destinationChainInfo);
        const destAddress = isDestChainEvm ? destAddress2 : destAddress1;
        const feeInfo: SubstrateFeeInfo = {
          type: 'substrate',
          options: {
            slow: {
              tip: '0'
            },
            fast: {
              tip: '0'
            },
            average: {
              tip: '0'
            },
            default: 'slow'
          },
          busyNetwork: false
        };

        try {
          const extrinsic = await createXcmExtrinsic({
            destinationTokenInfo,
            originTokenInfo,
            sendingValue: '0',
            recipient: destAddress,
            substrateApi,
            sender: '5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL',
            feeInfo,
            originChain: originChainInfo,
            destinationChain: destinationChainInfo
          });

          console.log(assetRef, extrinsic.toHex());
        } catch (e) {
          console.log('error', e);
          errorList.push(assetRef);
        }
      }
    }

    console.log('errorList', errorList);
  });
});
