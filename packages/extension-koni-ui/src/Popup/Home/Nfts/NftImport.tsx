// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainInfo } from '@bitriel/chain-list/types';
import { _getNftTypesSupportedByChain, _isChainTestNet, _parseMetadataForSmartContractAsset } from '@bitriel/extension-base/services/chain-service/utils';
import { isValidSubstrateAddress } from '@bitriel/extension-base/utils';
import { AddressInput, ChainSelector, Layout, PageWrapper, TokenTypeSelector } from '@bitriel/extension-koni-ui/components';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import { useChainChecker, useGetChainPrefixBySlug, useGetNftContractSupportedChains, useNotification, useTranslation } from '@bitriel/extension-koni-ui/hooks';
import { upsertCustomToken, validateCustomToken } from '@bitriel/extension-koni-ui/messaging';
import { FormCallbacks, FormFieldData, FormRule, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { convertFieldToError, convertFieldToObject, reformatAddress, simpleCheckForm } from '@bitriel/extension-koni-ui/utils';
import { reformatContractAddress } from '@bitriel/extension-koni-ui/utils/account/reformatContractAddress';
import { Form, Icon, Input } from '@subwallet/react-ui';
import { PlusCircle } from 'phosphor-react';
import { RuleObject } from 'rc-field-form/lib/interface';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isAddress, isEthereumAddress } from '@polkadot/util-crypto';

type Props = ThemeProps;

interface NftImportFormType {
  contractAddress: string;
  chain: string;
  collectionName: string;
  type: _AssetType;
  symbol: string;
}

interface NftTypeOption {
  label: string,
  value: _AssetType
}

function getNftTypeSupported (chainInfo: _ChainInfo) {
  if (!chainInfo) {
    return [];
  }

  const nftTypes = _getNftTypesSupportedByChain(chainInfo);
  const result: NftTypeOption[] = [];

  nftTypes.forEach((nftType) => {
    result.push({
      label: nftType.toString(),
      value: nftType
    });
  });

  return result;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const showNotification = useNotification();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);

  const chainInfoMap = useGetNftContractSupportedChains();

  const [form] = Form.useForm<NftImportFormType>();
  const selectedChain = Form.useWatch('chain', form);
  const selectedNftType = Form.useWatch('type', form);
  const collectionName = Form.useWatch('collectionName', form);

  const chains = useMemo(() => Object.values(chainInfoMap), [chainInfoMap]);
  const chainNetworkPrefix = useGetChainPrefixBySlug(selectedChain);

  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [nameDisabled, setNameDisabled] = useState(true);

  const nftTypeOptions = useMemo(() => {
    return getNftTypeSupported(chainInfoMap[selectedChain]);
  }, [chainInfoMap, selectedChain]);

  const checkChain = useChainChecker();

  const goBack = useCallback(() => {
    navigate('/home/nfts/collections');
  }, [navigate]);

  const onFieldsChange: FormCallbacks<NftImportFormType>['onFieldsChange'] = useCallback((changedFields: FormFieldData[], allFields: FormFieldData[]) => {
    const { error } = simpleCheckForm(allFields);

    const changes = convertFieldToObject<NftImportFormType>(changedFields);
    const all = convertFieldToObject<NftImportFormType>(allFields);
    const allError = convertFieldToError<NftImportFormType>(allFields);

    const empty = Object.entries(all).some(([key, value]) => key !== 'symbol' ? !value : false);

    const { chain, contractAddress, type } = changes;
    const { chain: selectedChain } = all;

    if (chain) {
      const nftTypes = getNftTypeSupported(chainInfoMap[chain]);

      if (nftTypes.length === 1) {
        form.setFieldValue('type', nftTypes[0].value);
      } else {
        form.resetFields(['type']);
      }

      form.resetFields(['contractAddress', 'collectionName']);
    }

    if (type) {
      form.resetFields(['contractAddress', 'collectionName']);
    }

    if (contractAddress) {
      form.setFieldValue('contractAddress', reformatContractAddress(selectedChain, contractAddress));
    }

    if (allError.contractAddress.length > 0) {
      form.resetFields(['collectionName']);
    }

    setNameDisabled(!all.chain || !all.type || allError.contractAddress.length > 0);
    setIsDisabled(empty || error);
  }, [chainInfoMap, form]);

  const onSubmit: FormCallbacks<NftImportFormType>['onFinish'] = useCallback((formValues: NftImportFormType) => {
    const { chain, contractAddress, symbol, type } = formValues;
    const formattedCollectionName = collectionName.replaceAll(' ', '').toUpperCase();
    const reformattedAddress = reformatAddress(contractAddress, chainNetworkPrefix);

    setLoading(true);

    setTimeout(() => {
      upsertCustomToken({
        originChain: chain,
        slug: '',
        name: collectionName,
        symbol: symbol !== '' ? symbol : formattedCollectionName,
        decimals: null,
        priceId: null,
        minAmount: null,
        assetType: type,
        metadata: _parseMetadataForSmartContractAsset(reformattedAddress),
        multiChainAsset: null,
        hasValue: _isChainTestNet(chainInfoMap[chain]),
        icon: ''
      })
        .then((result) => {
          if (result.error === 'incompatibleNFT') {
            showNotification({
              type: 'error',
              message: t('Failed to import. Incompatible NFT')
            });
          } else if (result.success) {
            showNotification({
              type: 'success',
              message: t('Imported NFT successfully')
            });
            goBack();
          } else {
            showNotification({
              type: 'error',
              message: t('An error occurred, please try again')
            });
          }
        })
        .catch(() => {
          showNotification({
            message: t('An error occurred, please try again')
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  }, [collectionName, chainNetworkPrefix, chainInfoMap, showNotification, t, goBack]);

  const collectionNameValidator = useCallback((rule: RuleObject, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const parsedValue = value.replaceAll(' ', '');

      if (parsedValue.length >= 3) {
        resolve();
      } else {
        reject(new Error(t('Collection name must have at least 3 characters')));
      }
    });
  }, [t]);

  const contractRules = useMemo((): FormRule[] => {
    return [
      ({ getFieldValue }) => ({
        transform: (contractAddress: string) => {
          const selectedChain = getFieldValue('chain') as string;

          return reformatContractAddress(selectedChain, contractAddress);
        },
        validator: (_, contractAddress: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            if (!isAddress(contractAddress)) {
              reject(t('Invalid contract address'));
            } else {
              const selectedChain = getFieldValue('chain') as string;
              const selectedNftType = getFieldValue('type') as _AssetType;
              const isValidEvmContract = [_AssetType.ERC721].includes(selectedNftType) && isEthereumAddress(contractAddress);
              const isValidWasmContract = [_AssetType.PSP34].includes(selectedNftType) && isValidSubstrateAddress(contractAddress);
              const reformattedAddress = reformatAddress(contractAddress, chainNetworkPrefix);

              if (isValidEvmContract || isValidWasmContract) {
                setLoading(true);
                validateCustomToken({
                  contractAddress: reformattedAddress,
                  originChain: selectedChain,
                  type: selectedNftType
                })
                  .then((validationResult) => {
                    setLoading(false);

                    if (validationResult.isExist) {
                      reject(t('Existed NFT'));
                    }

                    if (validationResult.contractError) {
                      reject(t('Invalid contract for the selected chain'));
                    }

                    if (!validationResult.isExist && !validationResult.contractError) {
                      form.setFieldValue('collectionName', validationResult.name);
                      form.setFieldValue('symbol', validationResult.symbol);
                      resolve();
                    }
                  })
                  .catch(() => {
                    setLoading(false);
                    reject(t('Invalid contract for the selected chain'));
                  });
              } else {
                reject(t('Invalid contract address'));
              }
            }
          });
        }
      })
    ];
  }, [chainNetworkPrefix, form, t]);

  useEffect(() => {
    selectedChain && checkChain(selectedChain);
  }, [selectedChain, checkChain]);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(['nft', 'balance'])}
    >
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        rightFooterButton={{
          disabled: isDisabled,
          icon: (
            <Icon
              phosphorIcon={PlusCircle}
              weight='fill'
            />
          ),
          loading: loading,
          onClick: form.submit,
          children: t('Import')
        }}
        title={t<string>('Import NFT')}
      >
        <div className={'nft_import__container'}>
          <Form
            className='form-space-xs'
            form={form}
            initialValues={{
              contractAddress: '',
              chain: '',
              collectionName: '',
              type: ''
            }}
            name='nft-import'
            onFieldsChange={onFieldsChange}
            onFinish={onSubmit}
          >
            <Form.Item
              name='chain'
            >
              <ChainSelector
                items={chains}
                label={t<string>('Network')}
                placeholder={t('Select network')}
                title={t('Select network')}
              />
            </Form.Item>

            <Form.Item
              name='type'
            >
              <TokenTypeSelector
                className={className}
                disabled={!selectedChain}
                items={nftTypeOptions}
                label={t<string>('Type')}
                placeholder={t('Select NFT type')}
                title={t('Select NFT type')}
              />
            </Form.Item>

            <Form.Item
              name='contractAddress'
              rules={contractRules}
              statusHelpAsTooltip={true}
            >
              <AddressInput
                addressPrefix={chainNetworkPrefix}
                disabled={!selectedNftType}
                label={t<string>('Contract address')}
                placeholder={t('Enter or paste an address')}
                showScanner={true}
              />
            </Form.Item>

            <Form.Item
              name='collectionName'
              required={true}
              rules={[{ validator: collectionNameValidator }]}
              statusHelpAsTooltip={true}
            >
              <Input
                disabled={nameDisabled}
                label={t<string>('NFT collection name')}
              />
            </Form.Item>
          </Form>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

const NftImport = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.nft_import__container': {
      marginTop: token.margin,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },

    '.nft_import__Qr': {
      cursor: 'pointer'
    },

    '.ant-web3-block-right-item': {
      marginRight: 0
    },

    '.ant-input-suffix': {
      marginRight: 0
    },

    '.nft_import__selected_option': {
      color: token.colorTextHeading
    }
  });
});

export default NftImport;
