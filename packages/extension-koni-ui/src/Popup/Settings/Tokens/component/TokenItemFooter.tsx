// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@bitriel/chain-list/types';
import { AssetSetting } from '@bitriel/extension-base/background/KoniTypes';
import { _isNativeToken } from '@bitriel/extension-base/services/chain-service/utils';
import useNotification from '@bitriel/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@bitriel/extension-koni-ui/hooks/common/useTranslation';
import { updateAssetSetting } from '@bitriel/extension-koni-ui/messaging';
import { ThemeProps } from '@bitriel/extension-koni-ui/types';
import { Button, Icon, Switch } from '@subwallet/react-ui';
import { PencilSimpleLine } from 'phosphor-react';
import React, { useCallback, useMemo, useState } from 'react';
import { NavigateFunction } from 'react-router';
import styled from 'styled-components';

interface Props extends ThemeProps {
  assetSetting: AssetSetting | undefined,
  tokenInfo: _ChainAsset,
  navigate: NavigateFunction
}

function Component ({ assetSetting, className = '', navigate, tokenInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(false);

  const isNativeToken = useMemo(() => {
    return _isNativeToken(tokenInfo);
  }, [tokenInfo]);

  const onSwitchTokenVisible = useCallback((checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading) {
      setLoading(true);
      setTimeout(() => {
        updateAssetSetting({
          tokenSlug: tokenInfo.slug,
          assetSetting: {
            visible: checked
          },
          autoEnableNativeToken: !isNativeToken
        })
          .then((result) => {
            if (!result) {
              showNotification({
                message: t('Error'),
                type: 'error'
              });
            }
          })
          .catch(() => {
            showNotification({
              message: t('Error'),
              type: 'error'
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    }
  }, [isNativeToken, loading, showNotification, t, tokenInfo.slug]);

  const onClick = useCallback(() => {
    navigate('/settings/tokens/detail', { state: tokenInfo.slug });
  }, [navigate, tokenInfo]);

  return (
    <div className={`manage_tokens__right_item_container ${className}`}>
      <Switch
        checked={!!assetSetting?.visible}
        loading={loading}
        onClick={onSwitchTokenVisible}
      />
      <Button
        icon={<Icon
          phosphorIcon={PencilSimpleLine}
          size='sm'
          type='phosphor'
        />}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={onClick}
        size={'xs'}
        type={'ghost'}
      />
    </div>
  );
}

const TokenItemFooter = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({});
});

export default TokenItemFooter;
