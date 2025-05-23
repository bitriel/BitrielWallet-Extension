// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ProcessTransactionData } from '@bitriel/extension-base/types';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';

export type TransactionInfoBlockProps = ThemeProps & {
  processData: ProcessTransactionData
}
