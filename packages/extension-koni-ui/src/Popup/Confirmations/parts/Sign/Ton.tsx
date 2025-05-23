// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ConfirmationDefinitionsTon, ConfirmationResult, ExtrinsicType } from '@bitriel/extension-base/background/KoniTypes';
import { useNotification } from '@bitriel/extension-koni-ui/hooks';
import useUnlockChecker from '@bitriel/extension-koni-ui/hooks/common/useUnlockChecker';
import { completeConfirmationTon } from '@bitriel/extension-koni-ui/messaging';
import { PhosphorIcon, ThemeProps, TonSignatureSupportType } from '@bitriel/extension-koni-ui/types';
import { removeTransactionPersist } from '@bitriel/extension-koni-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  id: string;
  type: TonSignatureSupportType;
  payload: ConfirmationDefinitionsTon[TonSignatureSupportType][0];
  extrinsicType?: ExtrinsicType;
  txExpirationTime?: number;
}

// todo: Need UI review and update more.

const handleConfirm = async (type: TonSignatureSupportType, id: string, payload: string) => {
  return await completeConfirmationTon(type, {
    id,
    isApproved: true,
    payload
  } as ConfirmationResult<string>);
};

const handleCancel = async (type: TonSignatureSupportType, id: string) => {
  return await completeConfirmationTon(type, {
    id,
    isApproved: false
  } as ConfirmationResult<string>);
};

// const handleSignature = async (type: TonSignatureSupportType, id: string, signature: string) => {
//   return await completeConfirmationTon(type, {
//     id,
//     isApproved: true,
//     payload: signature
//   } as ConfirmationResult<string>);
// };

const Component: React.FC<Props> = (props: Props) => {
  const { className, extrinsicType, id, txExpirationTime, type } = props;

  const { t } = useTranslation();
  const notify = useNotification();

  const checkUnlock = useUnlockChecker();

  const [showQuoteExpired, setShowQuoteExpired] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  const approveIcon = useMemo((): PhosphorIcon => {
    return CheckCircle;
  }, []);

  // Handle buttons actions
  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(type, id).finally(() => {
      setLoading(false);
    });
  }, [id, type]);

  const onApprovePassword = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      handleConfirm(type, id, '').finally(() => {
        setLoading(false);
      });
    }, 1000);
  }, [id, type]);

  // todo: implement later
  // const onApproveSignature = useCallback((signature: SigData) => {
  //   setLoading(true);
  //
  //   setTimeout(() => {
  //     handleSignature(type, id, signature.signature)
  //       .catch((e) => {
  //         console.log(e);
  //       })
  //       .finally(() => {
  //         setLoading(false);
  //       });
  //   }, 300);
  // }, [id, type]);

  const onConfirm = useCallback(() => {
    removeTransactionPersist(extrinsicType);

    if (txExpirationTime) {
      const currentTime = +Date.now();

      if (currentTime >= txExpirationTime) {
        notify({
          message: t('Transaction expired'),
          type: 'error'
        });
        onCancel();
      }
    }

    checkUnlock().then(() => {
      onApprovePassword();
    }).catch(() => {
      // Unlock is cancelled
    });
  }, [extrinsicType, txExpirationTime, notify, t, onCancel, checkUnlock, onApprovePassword]);

  useEffect(() => {
    let timer: NodeJS.Timer;

    if (txExpirationTime) {
      timer = setInterval(() => {
        if (Date.now() >= txExpirationTime) {
          setShowQuoteExpired(true);
          clearInterval(timer);
        }
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [txExpirationTime]);

  return (
    <div className={CN(className, 'confirmation-footer')}>
      <Button
        disabled={loading}
        icon={(
          <Icon
            phosphorIcon={XCircle}
            weight='fill'
          />
        )}
        onClick={onCancel}
        schema={'secondary'}
      >
        {t('Cancel')}
      </Button>
      <Button
        disabled={showQuoteExpired}
        icon={(
          <Icon
            phosphorIcon={approveIcon}
            weight='fill'
          />
        )}
        loading={loading}
        onClick={onConfirm}
      >
        {t('Approve')}
      </Button>
    </div>
  );
};

const TonSignArea = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default TonSignArea;
