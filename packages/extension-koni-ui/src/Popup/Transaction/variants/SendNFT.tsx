// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, NftCollection, NftItem } from '@bitriel/extension-base/background/KoniTypes';
import { validateRecipientAddress } from '@bitriel/extension-base/core/logic-validation/recipientAddress';
import { ActionType } from '@bitriel/extension-base/core/types';
import { SWTransactionResponse } from '@bitriel/extension-base/services/transaction-service/types';
import { isSameAddress } from '@bitriel/extension-base/utils';
import { AddressInputNew, ChainSelector, HiddenInput, PageWrapper } from '@bitriel/extension-koni-ui/components';
import { ADDRESS_INPUT_AUTO_FORMAT_VALUE, DEFAULT_MODEL_VIEWER_PROPS, SHOW_3D_MODELS_CHAIN } from '@bitriel/extension-koni-ui/constants';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import { useFocusFormItem, useGetChainPrefixBySlug, useHandleSubmitTransaction, useInitValidateTransaction, usePreCheckAction, useRestoreTransaction, useSelector, useSetCurrentPage, useTransactionContext, useWatchTransaction } from '@bitriel/extension-koni-ui/hooks';
import { evmNftSubmitTransaction, substrateNftSubmitTransaction } from '@bitriel/extension-koni-ui/messaging';
import { FormCallbacks, FormRule, SendNftParams, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { findAccountByAddress, noop, reformatAddress } from '@bitriel/extension-koni-ui/utils';
import { Button, Form, Icon, Image, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { nftParamsHandler } from '../helper';
import { FreeBalance, TransactionContent, TransactionFooter } from '../parts';

type Props = ThemeProps;

const DEFAULT_COLLECTION: NftCollection = {
  collectionId: 'unknown',
  chain: 'unknown'
};

const DEFAULT_ITEM: NftItem = {
  collectionId: 'unknown',
  chain: 'unknown',
  owner: 'unknown',
  id: 'unknown'
};

const hiddenFields: Array<keyof SendNftParams> = ['from', 'chain', 'asset', 'itemId', 'collectionId', 'fromAccountProxy'];
const validateFields: Array<keyof SendNftParams> = ['to'];

const Component: React.FC = () => {
  useSetCurrentPage('/transaction/send-nft');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { defaultData, persistData } = useTransactionContext<SendNftParams>();

  const { collectionId, itemId } = defaultData;

  const [form] = Form.useForm<SendNftParams>();
  const formDefault = useMemo(() => {
    return {
      ...defaultData
    };
  }, [defaultData]);

  const from = useWatchTransaction('from', form, defaultData);
  const chain = useWatchTransaction('chain', form, defaultData);

  const { chainInfoMap, ledgerGenericAllowNetworks } = useSelector((state) => state.chainStore);
  const { nftCollections, nftItems } = useSelector((state) => state.nft);
  const { accounts } = useSelector((state) => state.accountState);
  const [isBalanceReady, setIsBalanceReady] = useState(true);
  const [autoFormatValue] = useLocalStorage(ADDRESS_INPUT_AUTO_FORMAT_VALUE, false);

  const nftItem = useMemo((): NftItem =>
    nftItems.find(
      (item) =>
        isSameAddress(item.owner, from) &&
        chain === item.chain &&
        item.collectionId === collectionId &&
        item.id === itemId
    ) || DEFAULT_ITEM
  , [collectionId, itemId, chain, nftItems, from]);

  const collectionInfo = useMemo((): NftCollection =>
    nftCollections.find(
      (item) =>
        chain === item.chain &&
      item.collectionId === collectionId
    ) || DEFAULT_COLLECTION
  , [collectionId, chain, nftCollections]);

  const chainInfo = useMemo(() => chainInfoMap[chain], [chainInfoMap, chain]);
  const addressPrefix = useGetChainPrefixBySlug(chain);

  const { onError, onSuccess } = useHandleSubmitTransaction();
  const [loading, setLoading] = useState(false);

  const recipientValidator = useCallback((rule: FormRule, _recipientAddress: string): Promise<void> => {
    const { chain, from } = form.getFieldsValue();
    const destChainInfo = chainInfoMap[chain];
    const account = findAccountByAddress(accounts, _recipientAddress);

    return validateRecipientAddress({ srcChain: chain,
      destChainInfo,
      fromAddress: from,
      toAddress: _recipientAddress,
      account,
      actionType: ActionType.SEND_NFT,
      autoFormatValue,
      allowLedgerGenerics: ledgerGenericAllowNetworks });
  }, [accounts, autoFormatValue, chainInfoMap, form, ledgerGenericAllowNetworks]);

  const onValuesChange: FormCallbacks<SendNftParams>['onValuesChange'] = useCallback((part: Partial<SendNftParams>, values: SendNftParams) => {
    if (part.to) {
      form.setFields([
        {
          name: 'to',
          errors: []
        }
      ]);
    }

    persistData(form.getFieldsValue());
  }, [form, persistData]);

  // Submit transaction
  const onSubmit: FormCallbacks<SendNftParams>['onFinish'] = useCallback(
    (values: SendNftParams) => {
      const { chain, from: _from, to } = values;
      const isEthereumInterface = isEthereumAddress(_from);

      const from = reformatAddress(_from, addressPrefix);

      const params = nftParamsHandler(nftItem, chain);
      let sendPromise: Promise<SWTransactionResponse>;

      if (isEthereumInterface) {
        // Send NFT with EVM interface
        sendPromise = evmNftSubmitTransaction({
          senderAddress: from,
          networkKey: chain,
          recipientAddress: to,
          nftItemName: nftItem?.name,
          params,
          nftItem
        });
      } else {
        // Send NFT with substrate interface
        sendPromise = substrateNftSubmitTransaction({
          networkKey: chain,
          recipientAddress: to,
          senderAddress: from,
          nftItemName: nftItem?.name,
          params,
          nftItem
        });
      }

      setLoading(true);

      setTimeout(() => {
        // Handle transfer action
        sendPromise
          .then(onSuccess)
          .catch(onError)
          .finally(() => {
            setLoading(false);
          });
      }, 300);
    },
    [nftItem, onError, onSuccess, addressPrefix]
  );

  const checkAction = usePreCheckAction(from);

  useEffect(() => {
    if (nftItem === DEFAULT_ITEM || collectionInfo === DEFAULT_COLLECTION) {
      navigate('/home/nfts/collections');
    }
  }, [collectionInfo, navigate, nftItem]);

  // enable button at first time
  useEffect(() => {
    if (defaultData.to) {
      // First time the form is empty, so need time out
      setTimeout(() => {
        form.validateFields().finally(noop);
      }, 500);
    }
  }, [form, defaultData]);

  // Focus to the first field
  useFocusFormItem(form, 'to');
  useRestoreTransaction(form);
  useInitValidateTransaction(validateFields, form, defaultData);

  const show3DModel = SHOW_3D_MODELS_CHAIN.includes(nftItem.chain);

  return (
    <>
      <TransactionContent className={CN('-transaction-content')}>
        <div className={'nft_item_detail text-center'}>
          <Image
            height={120}
            modelViewerProps={show3DModel ? DEFAULT_MODEL_VIEWER_PROPS : undefined}
            src={nftItem.image}
            width={120}
          />
          <Typography.Title level={5}>
            {nftItem.name}
          </Typography.Title>
        </div>

        <Form
          className={'form-container form-space-sm'}
          form={form}
          initialValues={formDefault}
          onFinish={onSubmit}
          onValuesChange={onValuesChange}
        >
          <HiddenInput fields={hiddenFields} />
          <Form.Item
            name={'to'}
            rules={[
              {
                validator: recipientValidator
              }
            ]}
            statusHelpAsTooltip={true}
            validateTrigger={false}
          >
            <AddressInputNew
              chainSlug={chain}
              dropdownHeight={227}
              label={t('Send to')}
              placeholder={t('Account address')}
              saveAddress={true}
              showAddressBook={true}
              showScanner={true}
            />
          </Form.Item>

          <Form.Item>
            <ChainSelector
              disabled={true}
              items={chainInfo ? [{ name: chainInfo.name, slug: chainInfo.slug }] : []}
              label={t('Network')}
              value={collectionInfo.chain}
            />
          </Form.Item>
        </Form>

        <FreeBalance
          address={from}
          chain={chain}
          label={t('Sender transferable balance')}
          onBalanceReady={setIsBalanceReady}
        />
      </TransactionContent>
      <TransactionFooter
        className={'send-nft-transaction-footer'}
      >
        <Button
          disabled={!isBalanceReady}
          icon={(
            <Icon
              phosphorIcon={ArrowCircleRight}
              weight={'fill'}
            />
          )}
          loading={loading}
          onClick={checkAction(form.submit, ExtrinsicType.SEND_NFT)}
        >
          {t('Next')}
        </Button>
      </TransactionFooter>
    </>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Component />
    </PageWrapper>
  );
};

const SendNFT = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',

    '.nft_item_detail h5': {
      marginTop: token.marginXS,
      marginBottom: token.margin
    },

    '.nft_item_detail': {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',

      '.ant-image-img': {
        maxWidth: '100%',
        objectFit: 'cover'
      }
    }
  };
});

export default SendNFT;
