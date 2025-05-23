// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AppPopupData } from '@bitriel/extension-base/services/mkt-campaign-service/types';
import { EXTENSION_VERSION } from '@bitriel/extension-koni-ui/constants';
import { RootState } from '@bitriel/extension-koni-ui/stores';
import { updatePopupHistoryData } from '@bitriel/extension-koni-ui/stores/base/StaticContent';
import { MktCampaignHistoryData } from '@bitriel/extension-koni-ui/types/staticContent';
import { satisfies } from 'compare-versions';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export interface AppPopupHookType {
  updatePopupHistoryMap: (id: string) => void;
  appPopupMap: Record<string, AppPopupData[]>;
}

export const useHandleAppPopupMap = (): AppPopupHookType => {
  const { appPopupData, popupHistoryMap } = useSelector((state: RootState) => state.staticContent);
  const popupHistoryMapRef = useRef<Record<string, MktCampaignHistoryData>>(popupHistoryMap);
  const dispatch = useDispatch();

  useEffect(() => {
    popupHistoryMapRef.current = popupHistoryMap;
  }, [popupHistoryMap]);

  useEffect(() => {
    const newData: Record<string, MktCampaignHistoryData> = appPopupData && appPopupData.length
      ? appPopupData.reduce(
        (o, key) =>
          Object.assign(o, {
            [`${key.position}-${key.id}`]: {
              lastShowTime: 0,
              showTimes: 0
            }
          }),
        {}
      )
      : {};
    const result: Record<string, MktCampaignHistoryData> = { ...newData, ...popupHistoryMapRef.current };

    dispatch(updatePopupHistoryData(result));
  }, [appPopupData, dispatch]);

  const updatePopupHistoryMap = useCallback(
    (id: string) => {
      dispatch(
        updatePopupHistoryData({
          ...popupHistoryMap,
          [id]: { lastShowTime: Date.now(), showTimes: popupHistoryMap[id].showTimes + 1 }
        })
      );
    },
    [dispatch, popupHistoryMap]
  );

  const filteredData = useMemo(() => {
    return appPopupData.filter(({ app_version_range: appVersionRange, info }) => {
      if (appVersionRange) {
        return info?.platforms.includes('extension') && satisfies(EXTENSION_VERSION, appVersionRange);
      } else {
        return info?.platforms.includes('extension');
      }
    });
  }, [appPopupData]);

  const appPopupMap = useMemo(() => {
    if (filteredData) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Record<string, AppPopupData[]> = filteredData.reduce((r, a) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        r[a.position] = r[a.position] || [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        r[a.position].push(a);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return r;
      }, Object.create(null));

      return result;
    } else {
      return {};
    }
  }, [filteredData]);

  return {
    updatePopupHistoryMap,
    appPopupMap
  };
};
