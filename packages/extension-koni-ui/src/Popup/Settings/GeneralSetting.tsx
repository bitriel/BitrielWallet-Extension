// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserConfirmationType, CurrencyJson, CurrencyType, LanguageType, ThemeNames } from '@bitriel/extension-base/background/KoniTypes';
import { ENABLE_LANGUAGES, languageOptions } from '@bitriel/extension-base/constants/i18n';
import { staticData, StaticKey } from '@bitriel/extension-base/utils/staticData';
import DefaultLogosMap from '@bitriel/extension-koni-ui/assets/logo';
import { GeneralEmptyList, Layout, PageWrapper } from '@bitriel/extension-koni-ui/components';
import { DataContext } from '@bitriel/extension-koni-ui/contexts/DataContext';
import useDefaultNavigate from '@bitriel/extension-koni-ui/hooks/router/useDefaultNavigate';
import { saveBrowserConfirmationType, saveLanguage, savePriceCurrency, saveTheme } from '@bitriel/extension-koni-ui/messaging';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { PhosphorIcon, Theme, ThemeProps } from '@bitriel/extension-koni-ui/types';
import { noop } from '@bitriel/extension-koni-ui/utils';
import { getCurrencySymbol } from '@bitriel/extension-koni-ui/utils/currency';
import { BackgroundIcon, Icon, Image, SelectModal, SettingItem, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowSquareUpRight, BellSimpleRinging, CaretRight, CheckCircle, CornersOut, CurrencyCircleDollar, GlobeHemisphereEast, Layout as LayoutIcon, MoonStars, Sun } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

type SelectionItemType = {
  key: string,
  leftIcon: SwIconProps['phosphorIcon'] | React.ReactNode,
  leftIconBgColor: string,
  title: string,
  subTitle?: string,
  disabled?: boolean,
};

const renderEmpty = () => <GeneralEmptyList />;

function renderSelectionItem (item: SelectionItemType, _selected: boolean) {
  const getURLSymbol = (() => {
    if (typeof item.leftIcon === 'string') {
      return `currency_${item.leftIcon.toLowerCase()}`;
    }

    return undefined;
  })();
  const logoSrc = getURLSymbol ? DefaultLogosMap[getURLSymbol] : undefined;

  return (
    <SettingItem
      className={CN('__selection-item', {
        'item-disabled': item.disabled,
        '-subTitle-container': !!item.subTitle
      })}
      key={item.key}
      leftItemIcon={
        typeof item.leftIcon === 'string'
          ? (
            <div className={'__label-item'}>
              <Image
                height={20}
                src={logoSrc}
                width={20}
              />
            </div>
          )
          : (
            <div
              className={'__label-item'}
              style={{ backgroundColor: item.leftIconBgColor }}
            >
              <Icon
                customSize={'20px'}
                phosphorIcon={item.leftIcon as unknown as PhosphorIcon}
                type='phosphor'
                weight='fill'
              />
            </div>
          )
      }
      name={item.title}
      rightItem={
        _selected
          ? (
            <Icon
              className='__right-icon'
              customSize={'20px'}
              phosphorIcon={CheckCircle}
              type='phosphor'
              weight='fill'
            />
          )
          : null
      }
    />
  );
}

function renderModalTrigger (item: SelectionItemType) {
  return (
    <SettingItem
      className={CN('__trigger-item setting-item', { '-subTitle-container': !!item.subTitle })}
      key={item.key}
      leftItemIcon={
        <BackgroundIcon
          backgroundColor={item.leftIconBgColor}
          phosphorIcon={item.leftIcon as unknown as PhosphorIcon}
          size='sm'
          type='phosphor'
          weight='fill'
        />
      }
      name={item.title}
      rightItem={
        <div className={'__trigger-right-item'}>
          <div className={'__trigger-item-currency-code'}>
            {!!item.subTitle && item.subTitle}
          </div>
          <Icon
            className='__right-icon'
            customSize={'20px'}
            phosphorIcon={CaretRight}
            type='phosphor'
          />
        </div>

      }
    />
  );
}

type LoadingMap = {
  language: boolean;
  browserConfirmationType: boolean;
  currency: boolean;
};
// "TODO: Will be shown when support for the LIGHT theme is implemented."
const isShowWalletTheme = false;
const SettingsListUrl = '/settings/list';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const navigate = useNavigate();
  const theme = useSelector((state: RootState) => state.settings.theme);
  const _language = useSelector((state: RootState) => state.settings.language);
  const _browserConfirmationType = useSelector((state: RootState) => state.settings.browserConfirmationType);
  const { currency } = useSelector((state: RootState) => state.price);
  const [loadingMap, setLoadingMap] = useState<LoadingMap>({
    browserConfirmationType: false,
    language: false,
    currency: false
  });

  const goBack = useDefaultNavigate().goBack;
  const { token } = useTheme() as Theme;

  const themeItems = useMemo<SelectionItemType[]>(() => {
    return [
      {
        key: ThemeNames.DARK,
        leftIcon: MoonStars,
        leftIconBgColor: token.colorPrimary,
        title: t('Dark theme')
      },
      {
        key: ThemeNames.LIGHT,
        leftIcon: Sun,
        leftIconBgColor: token.colorPrimary,
        title: t('Light theme'),
        disabled: true
      }
    ];
  }, [t, token]);

  const languageItems = useMemo<SelectionItemType[]>(() => {
    return languageOptions.map((item) => ({
      key: item.value,
      leftIcon: GlobeHemisphereEast,
      leftIconBgColor: token['green-6'],
      title: item.text,
      disabled: !ENABLE_LANGUAGES.includes(item.value)
    }));
  }, [token]);

  // TODO: 'after will be update data online or refactor this function'
  const staticDataCurrencySymbol = useMemo<Record<string, CurrencyJson> | undefined>(() => {
    return staticData[StaticKey.CURRENCY_SYMBOL] as Record<string, CurrencyJson>;
  }, []);

  const currencyItems = useMemo<SelectionItemType[]>(() => {
    return staticDataCurrencySymbol
      ? Object.keys(staticDataCurrencySymbol).map((item) => ({
        key: item,
        leftIcon: getCurrencySymbol(item).icon,
        leftIconBgColor: token.colorBgBorder,
        title: `${item} - ${staticDataCurrencySymbol[item].label}`,
        subTitle: staticDataCurrencySymbol[item].symbol
      }))
      : [];
  }, [staticDataCurrencySymbol, token]);

  const browserConfirmationItems = useMemo<SelectionItemType[]>(() => {
    return [
      {
        key: 'popup',
        leftIcon: ArrowSquareUpRight,
        leftIconBgColor: token['volcano-6'],
        title: t('Popup')
      },
      {
        key: 'extension',
        leftIcon: LayoutIcon,
        leftIconBgColor: token['volcano-6'],
        title: t('Extension')
      },
      {
        key: 'window',
        leftIcon: CornersOut,
        leftIconBgColor: token['volcano-6'],
        title: t('Window')
      }
    ];
  }, [t, token]);

  const onSelectLanguage = useCallback((value: string) => {
    setLoadingMap((prev) => ({
      ...prev,
      language: true
    }));
    saveLanguage(value as LanguageType)
      .finally(() => {
        setLoadingMap((prev) => ({
          ...prev,
          language: false
        }));
      });
  }, []);

  const goBackToSettingList = useCallback(() => {
    goBack(SettingsListUrl);
  }, [goBack]);

  const onSelectCurrency = useCallback((value: string) => {
    setLoadingMap((prev) => ({
      ...prev,
      currency: true
    }));
    savePriceCurrency(value as CurrencyType)
      .finally(() => {
        setLoadingMap((prev) => ({
          ...prev,
          currency: false
        }));
      });
  }, []);

  const searchFunction = useCallback((item: SelectionItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item ? item.key.toLowerCase().includes(searchTextLowerCase) || item.title.toLowerCase().includes(searchTextLowerCase) : false);
  }, []);

  const onSelectBrowserConfirmationType = useCallback((value: string) => {
    setLoadingMap((prev) => ({
      ...prev,
      browserConfirmationType: true
    }));
    saveBrowserConfirmationType(value as BrowserConfirmationType)
      .catch((e) => {
        console.log('saveBrowserConfirmationType error', e);
      })
      .finally(() => {
        setLoadingMap((prev) => ({
          ...prev,
          browserConfirmationType: false
        }));
      });
  }, []);

  const onSelectTheme = useCallback((value: string) => {
    saveTheme(value as ThemeNames).finally(noop);
  }, []);

  const onClickEnableNotification = useCallback(() => {
    navigate('/settings/notification-config');
  }, [navigate]);

  return (
    <PageWrapper
      className={`general-setting ${className}`}
      hideLoading={true}
      resolve={dataContext.awaitStores(['price'])}
    >
      <Layout.WithSubHeaderOnly
        onBack={goBackToSettingList}
        title={t('General settings')}
      >
        <div className={'__scroll-container'}>
          {isShowWalletTheme &&
            <SelectModal
              background={'default'}
              className={`__modal ${className}`}
              customInput={renderModalTrigger({
                key: 'wallet-theme-trigger',
                leftIcon: Image as unknown as PhosphorIcon,
                leftIconBgColor: token.colorPrimary,
                title: t('Wallet theme')
              })}
              id='wallet-theme-select-modal'
              inputWidth={'100%'}
              itemKey='key'
              items={themeItems}
              onSelect={onSelectTheme}
              renderItem={renderSelectionItem}
              searchFunction={searchFunction}
              selected={theme}
              shape='round'
              title={t('Wallet theme')}
            />}
          <SelectModal
            background={'default'}
            className={`__modal ${className}`}
            customInput={renderModalTrigger({
              key: 'price-currency-trigger',
              leftIcon: CurrencyCircleDollar,
              leftIconBgColor: token['gold-6'],
              title: t('Currency'),
              subTitle: currency
            })}
            disabled={loadingMap.currency}
            id='currency-select-modal'
            inputWidth={'100%'}
            itemKey='key'
            items={currencyItems}
            onSelect={onSelectCurrency}
            renderItem={renderSelectionItem}
            renderWhenEmpty={renderEmpty}
            searchFunction={searchFunction}
            searchMinCharactersCount={2}
            searchPlaceholder={t<string>('Search currency')}
            selected={currency}
            shape='round'
            size='small'
            title={t('Select a currency')}
          />

          <SelectModal
            background={'default'}
            className={`__modal ${className}`}
            customInput={renderModalTrigger({
              key: 'languages-trigger',
              leftIcon: GlobeHemisphereEast,
              leftIconBgColor: token['green-6'],
              title: t('Language')
            })}
            disabled={loadingMap.language}
            id='languages-select-modal'
            inputWidth={'100%'}
            itemKey='key'
            items={languageItems}
            onSelect={onSelectLanguage}
            renderItem={renderSelectionItem}
            selected={_language}
            shape='round'
            size='small'
            title={t('Language')}
          />

          <SelectModal
            background={'default'}
            className={`__modal ${className}`}
            customInput={renderModalTrigger({
              key: 'browser-confirmation-type-trigger',
              leftIcon: BellSimpleRinging,
              leftIconBgColor: token['volcano-6'],
              title: t('Browser notifications')
            })}
            disabled={loadingMap.browserConfirmationType}
            id='browser-confirmation-type-select-modal'
            inputWidth={'100%'}
            itemKey='key'
            items={browserConfirmationItems}
            onSelect={onSelectBrowserConfirmationType}
            renderItem={renderSelectionItem}
            selected={_browserConfirmationType}
            shape='round'
            size='small'
            title={t('View notifications in')}
          />
          <SettingItem
            className={CN('__trigger-item setting-item', 'notification-item')}
            leftItemIcon={(
              <BackgroundIcon
                backgroundColor={token['magenta-7']}
                phosphorIcon={BellSimpleRinging}
                size='sm'
                type='phosphor'
                weight='fill'
              />
            )}
            name={t('In-app notifications')}
            onPressItem={onClickEnableNotification}
            rightItem={(
              <div className={'__trigger-right-item'}>
                <Icon
                  className='__right-icon'
                  customSize={'20px'}
                  phosphorIcon={CaretRight}
                  type='phosphor'
                />
              </div>
            )}
          />
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
}

export const GeneralSetting = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-web3-block-right-item': {
      minWidth: 40,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: -token.marginXS
    },
    '.notification-item': {
      marginTop: token.marginXS
    },
    '.__trigger-item': {
      height: 52,
      alignItems: 'center',
      display: 'flex'
    },
    '.__label-item': {
      borderRadius: '50%',
      padding: 4,
      maxHeight: 28
    },
    '.-subTitle-container .__label-item': {
      backgroundColor: token.colorBgBorder,
      padding: 4,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center'
    },

    '.-subTitle-container .ant-image-img': {
      display: 'block'
    },

    '.item-disabled': {
      '.ant-setting-item-content': {
        cursor: 'not-allowed',
        backgroundColor: `${token.colorBgSecondary} !important`
      }
    },

    '&.general-setting': {
      height: '100%',
      backgroundColor: token.colorBgDefault,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',

      '.ant-sw-header-bg-default': {
        // backgroundColor: 'transparent'
      },

      '.ant-select-modal-input-custom + .ant-select-modal-input-custom': {
        marginTop: token.marginXS
      },

      '.ant-select-modal-input-custom': {
        width: 'unset'
      },

      '.__trigger-item .ant-web3-block-right-item': {
        color: token.colorTextLight4
      },

      '.__trigger-item:hover .ant-web3-block-right-item': {
        color: token.colorTextLight2
      },

      '.__scroll-container': {
        overflow: 'auto',
        paddingTop: token.padding,
        paddingRight: token.padding,
        paddingLeft: token.padding,
        paddingBottom: token.paddingLG
      }
    },

    '.__trigger-item.setting-item.-subTitle-container .ant-web3-block-middle-item': {
      width: 'auto'
    },

    '.__selection-item.-subTitle-container': {
      backgroundColor: token.colorTextDark1,
      '.ant-setting-item-name': {
        fontWeight: 500,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6
      }
    },

    '.__subTitle-setting-item': {
      minWidth: 48,
      borderRadius: 8,
      textAlign: 'center',
      padding: '2px 8px 2px 8px',
      backgroundColor: token.colorBgSecondary,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      fontWeight: 600
    },

    '.__trigger-right-item': {
      display: 'flex',
      gap: token.paddingSM + token.paddingMD,
      alignItems: 'center',

      '.__trigger-item-currency-code': {
        fontWeight: 500,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6
      }
    },

    '.ant-setting-item-name, .__subTitle-setting-item': {
      color: token.colorTextLight2
    },

    '&.__modal': {
      '.__selection-item .ant-web3-block-right-item': {
        color: token.colorSuccess
      }
    }
  });
});

export default GeneralSetting;
