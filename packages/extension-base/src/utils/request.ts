// Copyright 2019-2022 @bitriel/extension-base
// SPDX-License-Identifier: Apache-2.0

import { EXTENSION_REQUEST_URL } from '@bitriel/extension-base/services/request-service/constants';

export function isInternalRequest (url: string): boolean {
  return url === EXTENSION_REQUEST_URL;
}
