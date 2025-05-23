// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicInputWrapper } from '@bitriel/extension-koni-ui/components';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Input, InputRef } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { FocusEventHandler, ForwardedRef, forwardRef, useCallback, useState } from 'react';
import styled from 'styled-components';

interface Props extends BasicInputWrapper, ThemeProps {
  hideText: boolean;
}

const Component: React.ForwardRefRenderFunction<InputRef, Props> = (props: Props, ref: ForwardedRef<InputRef>) => {
  const { className, hideText, onBlur, onFocus, ...restProps } = props;
  const [focus, setFocus] = useState(false);

  const _onFocus: FocusEventHandler<HTMLInputElement> = useCallback((event) => {
    setFocus(true);
    onFocus?.(event);
  }, [onFocus]);

  const _onBlur: FocusEventHandler<HTMLInputElement> = useCallback((event) => {
    setFocus(false);
    onBlur?.(event);
  }, [onBlur]);

  return (
    <Input
      autoComplete='off'
      className={CN(className)}
      ref={ref}
      type={(hideText && !focus) ? 'password' : 'text'}
      {...restProps}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
};

const PrivateKeyInput = styled(forwardRef(Component))<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default PrivateKeyInput;
