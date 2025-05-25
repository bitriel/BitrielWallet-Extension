// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

const PRODUCTION_BRANCHES = ['master', 'webapp', 'webapp-dev'];
const branchName = process.env.BRANCH_NAME || 'subwallet-dev';

export const isProductionMode = PRODUCTION_BRANCHES.indexOf(branchName) > -1;
export const BACKEND_API_URL = process.env.BITRIEL_API || (isProductionMode ? 'https://sw-services.bitriel.app/api' : 'https://be-dev.bitriel.app/api');
export const BACKEND_PRICE_HISTORY_URL = process.env.BITRIEL_PRICE_HISTORY_API || (isProductionMode ? 'https://price-history.bitriel.app/api' : 'https://price-history-dev.bitriel.app/api');
