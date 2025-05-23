// Copyright 2019-2022 @bitriel/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftItem } from '@bitriel/extension-base/background/KoniTypes';
import { ORDINAL_COLLECTION } from '@bitriel/extension-base/constants';
import { OrdinalNftProperties } from '@bitriel/extension-base/types';
import { EmptyList, Layout, PageWrapper } from '@bitriel/extension-web-ui/components';
import NoContent, { PAGE_TYPE } from '@bitriel/extension-web-ui/components/NoContent';
import { DataContext } from '@bitriel/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@bitriel/extension-web-ui/contexts/ScreenContext';
import { useSelector, useSetCurrentPage, useTranslation } from '@bitriel/extension-web-ui/hooks';
import { IInscriptionItemDetail } from '@bitriel/extension-web-ui/Popup/Home/Inscriptions/types';
import { INftItemDetail } from '@bitriel/extension-web-ui/Popup/Home/Nfts/utils';
import { ThemeProps } from '@bitriel/extension-web-ui/types';
import { SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Image } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';

import { InscriptionGalleryWrapper } from './components/InscriptionGalleryWrapper';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  useSetCurrentPage('/home/inscriptions');

  const { className } = props;

  const outletContext: {
    searchInput: string,
    setDetailTitle: React.Dispatch<React.SetStateAction<React.ReactNode>>,
    setSearchPlaceholder: React.Dispatch<React.SetStateAction<React.ReactNode>>
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>
  } = useOutletContext();
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);
  const { nftItems } = useSelector((state) => state.nft);

  const nftList = useMemo(() => {
    return nftItems.filter((item) => item.collectionId === ORDINAL_COLLECTION);
  }, [nftItems]);

  const handleOnClickNft = useCallback((state: INftItemDetail) => {
    navigate('/home/inscriptions/item-detail', { state });
  }, [navigate]);

  const renderNft = useCallback((nftItem: NftItem) => {
    const routingParams = { nftItem } as IInscriptionItemDetail;

    return (
      <InscriptionGalleryWrapper
        handleOnClick={handleOnClickNft}
        key={`${nftItem.chain}_${nftItem.collectionId}_${nftItem.id}`}
        name={nftItem.name as string}
        properties={nftItem.properties as OrdinalNftProperties}
        routingParams={routingParams}
      />
    );
  }, [handleOnClickNft]);

  const emptyNft = useCallback(() => {
    if (isWebUI) {
      return (
        <NoContent
          className={'__no-content-block'}
          pageType={PAGE_TYPE.INSCRIPTION}
        />
      );
    }

    return (
      <EmptyList
        emptyMessage={t('Your inscriptions will appear here')}
        emptyTitle={t('No inscription found')}
        phosphorIcon={Image}
      />
    );
  }, [isWebUI, t]);

  useEffect(() => {
    if (outletContext) {
      outletContext.setShowSearchInput(false);
    }
  }, [outletContext]);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['nft'])}
    >
      <Layout.Base
        {...!isWebUI && {
          showBackButton: true,
          showSubHeader: true,
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderPaddingVertical: true,
          title: t('Inscriptions')
        }}
      >
        {isWebUI
          ? (
            <>
              <div className={'nft-item-list-wrapper'}>
                <SwList
                  className={CN('nft_item_list')}
                  displayGrid={true}
                  gridGap={'14px'}
                  list={nftList}
                  minColumnWidth={'160px'}
                  renderItem={renderNft}
                  renderOnScroll={true}
                  renderWhenEmpty={emptyNft}
                />
              </div>
            </>
          )
          : (
            <SwList.Section
              autoFocusSearch={false}
              className={CN('nft_item_list__container')}
              displayGrid={true}
              gridGap={'14px'}
              list={nftList}
              minColumnWidth={'160px'}
              renderItem={renderNft}
              renderOnScroll={true}
              renderWhenEmpty={emptyNft}
            />
          )}
      </Layout.Base>
    </PageWrapper>
  );
};

const InscriptionItemList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.header-content': {
      color: token.colorTextBase,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden'
    },

    '.collection-name': {
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.nft_item_list__container': {
      paddingTop: 14,
      flex: 1,
      height: '100%',

      '.ant-sw-list': {
        paddingBottom: 1,
        marginBottom: -1
      }
    },

    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.nft-item-list-wrapper': {
      flex: 1
    },

    '.web-ui-enable &': {
      '.nft-item-list-wrapper': {
        flexGrow: 0
      },

      '.__no-content-block': {
        paddingTop: 92,
        paddingBottom: 132,
        height: 'auto'
      },

      '.__delete-nft-button-wrapper': {
        display: 'flex',
        justifyContent: 'center'
      },

      '.__delete-nft-button': {
        '&:not(:hover)': {
          color: token.colorTextLight4
        }
      }
    }
  });
});

export default InscriptionItemList;
