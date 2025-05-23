// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionContext } from '@bitriel/extension-koni-ui/contexts/TransactionContext';
import { TransactionFormBaseProps } from '@bitriel/extension-koni-ui/types';
import { FormInstance } from '@subwallet/react-ui';
import { useContext, useEffect } from 'react';

const useRestoreTransaction = <T extends TransactionFormBaseProps>(form: FormInstance<T>) => {
  const { needPersistData, persistData } = useContext(TransactionContext);

  useEffect(() => {
    if (needPersistData) {
      persistData(form.getFieldsValue());
    }
  }, [form, needPersistData, persistData]);
};

export default useRestoreTransaction;
