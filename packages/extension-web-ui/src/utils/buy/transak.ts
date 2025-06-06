// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TRANSAK_API_KEY, TRANSAK_URL } from '@bitriel/extension-web-ui/constants';
import { CreateBuyOrderFunction } from '@bitriel/extension-web-ui/types';
import qs from 'querystring';

export const createTransakOrder: CreateBuyOrderFunction = (symbol, address, network) => {
  return new Promise((resolve) => {
    const params = {
      apiKey: TRANSAK_API_KEY,
      defaultCryptoCurrency: symbol,
      networks: network,
      cryptoCurrencyList: symbol,
      walletAddress: address
    };

    const query = qs.stringify(params);

    resolve(`${TRANSAK_URL}?${query}`);
  });
};
