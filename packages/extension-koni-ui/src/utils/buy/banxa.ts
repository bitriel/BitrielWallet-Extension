// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BANXA_URL } from '@bitriel/extension-koni-ui/constants';
import { CreateBuyOrderFunction } from '@bitriel/extension-koni-ui/types';
import qs from 'querystring';

export const createBanxaOrder: CreateBuyOrderFunction = (token, address, network) => {
  return new Promise((resolve) => {
    const params = {
      coinType: token,
      blockchain: network,
      walletAddress: address,
      orderType: 'BUY'
    };

    const query = qs.stringify(params);

    resolve(`${BANXA_URL}?${query}`);
  });
};
