// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWApiResponse } from '../types';

type Timeframe = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export interface PriceChartPoint {
  time: number;
  value: number;
}

interface HistoryTokenPriceJSON {
  history: PriceChartPoint[];
}

export class PriceHistoryApi {
  private baseUrl: string;

  constructor (baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getPriceHistory (token: string, type: Timeframe): Promise<HistoryTokenPriceJSON> {
    const url = `${this.baseUrl}/price-history?token=${token}&type=${type}`;

    try {
      const rawResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await rawResponse.json() as SWApiResponse<HistoryTokenPriceJSON>;

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get token slug : ${(error as Error).message}`);
    }
  }
}
