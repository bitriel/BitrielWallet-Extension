// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@bitriel/extension-koni-ui/hooks';
import useNotification from '@bitriel/extension-koni-ui/hooks/common/useNotification';
import { copyToClipboard } from '@bitriel/extension-koni-ui/utils/common/dom';
import { useCallback } from 'react';

const useCopy = (value: string): () => void => {
  const notify = useNotification();
  const { t } = useTranslation();

  return useCallback(() => {
    copyToClipboard(value);
    notify({
      message: t('Copied to clipboard')
    });
  }, [value, notify, t]);
};

export default useCopy;
