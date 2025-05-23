// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { COINBASE_PAY_ID } from '@bitriel/extension-koni-ui/constants';
import { CreateBuyOrderFunction } from '@bitriel/extension-koni-ui/types';
import { generateOnRampURL } from '@coinbase/cbpay-js';

export const createCoinbaseOrder: CreateBuyOrderFunction = (symbol, address, network) => {
  return new Promise((resolve) => {
    const onRampURL = generateOnRampURL({
      appId: COINBASE_PAY_ID,
      destinationWallets: [
        { address: address, supportedNetworks: [network], assets: [symbol] }
      ]
    });

    resolve(onRampURL);
  });
};
