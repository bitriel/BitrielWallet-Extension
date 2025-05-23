// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface SessionStorage {
  timeCalculate: number;
  remind: boolean;
  timeBackup: number;
  isFinished: boolean;
}

export interface SeedPhraseTermStorage {
  state: string;
  useDefaultContent?: boolean;
}
