// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountSignMode } from '@bitriel/extension-base/types';

import { useSelector } from '../common';
import useGetAccountSignModeByAddress from './useGetAccountSignModeByAddress';

const useOneSignProcess = (address: string): boolean => {
  const signMode = useGetAccountSignModeByAddress(address);

  const allowOneSign = useSelector((state) => state.settings.allowOneSign);

  return signMode === AccountSignMode.PASSWORD && allowOneSign;
};

export default useOneSignProcess;
