// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionFormBaseProps } from '@bitriel/extension-koni-ui/types';
import { noop } from '@bitriel/extension-koni-ui/utils';
import { FormInstance } from '@subwallet/react-ui';
import { useEffect } from 'react';

const useInitValidateTransaction = <T extends TransactionFormBaseProps, K extends keyof T>(keys: K[], form: FormInstance<T>, defaultData: T) => {
  // validate at first time
  useEffect(() => {
    const fields: string[] = [];

    for (const key of keys) {
      if (defaultData[key]) {
        fields.push(key as string);
      }
    }

    // First time the form is empty, so need time out
    setTimeout(() => {
      form.validateFields(fields).finally(noop);
    }, 500);
  }, [form, defaultData, keys]);
};

export default useInitValidateTransaction;
