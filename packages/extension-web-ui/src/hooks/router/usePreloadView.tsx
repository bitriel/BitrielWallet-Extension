// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { lazyLoaderMap } from '@bitriel/extension-web-ui/Popup/router';
import { useEffect } from 'react';

export default function usePreloadView (paths: string[]) {
  useEffect(() => {
    paths.forEach((path) => {
      const loader = lazyLoaderMap[path];

      loader?.loadElement().catch(console.error);
    });
  }, [paths]);
}
