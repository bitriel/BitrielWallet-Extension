// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CURRENT_PAGE } from '@bitriel/extension-web-ui/constants/localStorage';
import { useLocalStorage } from 'usehooks-ts';

const useGetCurrentPage = () => {
  const [storage] = useLocalStorage<string>(CURRENT_PAGE, '/home/tokens');

  return storage;
};

export default useGetCurrentPage;
