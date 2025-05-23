// Copyright 2019-2022 @bitriel/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export function isEmptyObject (input: Record<any, any>): boolean {
  return Object.keys(input).length === 0;
}
