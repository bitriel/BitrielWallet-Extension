// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { wrapBytes } from '@bitriel/extension-dapp';
import DisplayPayload from '@bitriel/extension-koni-ui/components/Qr/Display/DisplayPayload';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { ExtrinsicPayload } from '@polkadot/types/interfaces';

interface Props extends ThemeProps {
  address: string;
  genesisHash: string;
  payload: ExtrinsicPayload | string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, genesisHash, payload } = props;

  const payloadU8a = useMemo(() => typeof payload === 'string' ? wrapBytes(payload) : payload.toU8a(), [payload]);
  const isMessage = useMemo(() => typeof payload === 'string', [payload]);

  return (
    <DisplayPayload
      address={address}
      genesisHash={genesisHash}
      isEthereum={false}
      isHash={false}
      isMessage={isMessage}
      payload={payloadU8a}
    />
  );
};

const SubstrateQr = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default SubstrateQr;
