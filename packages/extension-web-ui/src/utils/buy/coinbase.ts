// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { generateOnRampURL } from '@coinbase/cbpay-js';
import { COINBASE_PAY_ID } from '@bitriel/extension-web-ui/constants';
import { CreateBuyOrderFunction } from '@bitriel/extension-web-ui/types';

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
