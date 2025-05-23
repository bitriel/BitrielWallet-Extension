// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SessionStorage } from '@bitriel/extension-koni-ui/types';

export const DEFAULT_SESSION_VALUE: SessionStorage = {
  remind: false,
  timeBackup: 1209600000,
  timeCalculate: Date.now(),
  isFinished: true
};
