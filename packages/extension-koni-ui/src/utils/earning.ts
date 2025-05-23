// Copyright 2019-2022 @bitriel/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _STAKING_CHAIN_GROUP } from '@bitriel/extension-base/services/earning-service/constants';
import { ValidatorInfo, YieldPoolType } from '@bitriel/extension-base/types';
import { detectTranslate } from '@bitriel/extension-base/utils';
import { EarningTagType } from '@bitriel/extension-koni-ui/types';
import { shuffle } from '@bitriel/extension-koni-ui/utils';
import { CirclesThreePlus, Database, HandsClapping, Leaf, User, Users } from 'phosphor-react';

// todo: after supporting Astar v3, remove this
export function isRelatedToAstar (slug: string) {
  return [
    'ASTR___native_staking___astar',
    'SDN___native_staking___shiden',
    'SBY___native_staking___shibuya',
    'SDN-Shiden',
    'ASTR-Astar',
    'shibuya-NATIVE-SBY'
  ].includes(slug);
}

// todo: About label, will convert to key for i18n later
export const createEarningTypeTags = (chain: string): Record<YieldPoolType, EarningTagType> => {
  return {
    [YieldPoolType.LIQUID_STAKING]: {
      label: 'Liquid staking',
      icon: Leaf,
      color: 'magenta',
      weight: 'bold'
    },
    [YieldPoolType.LENDING]: {
      label: 'Lending',
      icon: HandsClapping,
      color: 'green',
      weight: 'bold'
    },
    [YieldPoolType.SINGLE_FARMING]: {
      label: 'Single farming',
      icon: User,
      color: 'green',
      weight: 'bold'
    },
    [YieldPoolType.NOMINATION_POOL]: {
      label: 'Nomination pool',
      icon: Users,
      color: 'cyan',
      weight: 'bold'
    },
    [YieldPoolType.PARACHAIN_STAKING]: {
      label: 'Parachain staking',
      icon: User,
      color: 'yellow',
      weight: 'bold'
    },
    [YieldPoolType.NATIVE_STAKING]: {
      label: _STAKING_CHAIN_GROUP.astar.includes(chain) ? 'dApp staking' : 'Direct nomination',
      icon: Database,
      color: 'gold',
      weight: 'fill'
    },
    [YieldPoolType.SUBNET_STAKING]: {
      label: 'Subnet staking',
      icon: CirclesThreePlus,
      color: 'blue',
      weight: 'fill'
    }
  };
};

export function autoSelectValidatorOptimally (validators: ValidatorInfo[], maxCount = 1, simple = false, preSelectValidators?: string): ValidatorInfo[] {
  if (!validators.length) {
    return [];
  }

  const preSelectValidatorAddresses = preSelectValidators ? preSelectValidators.split(',') : [];

  const result: ValidatorInfo[] = [];
  const notPreSelected: ValidatorInfo[] = [];

  for (const v of validators) {
    if (preSelectValidatorAddresses.includes(v.address)) {
      result.push(v);
    } else {
      notPreSelected.push(v);
    }
  }

  if (result.length >= maxCount) {
    shuffle<ValidatorInfo>(result);

    return result.slice(0, maxCount);
  }

  shuffle<ValidatorInfo>(notPreSelected);

  for (const v of notPreSelected) {
    if (result.length === maxCount) {
      break;
    }

    if (v.commission !== 100 && !v.blocked && (!simple ? v.identity && v.topQuartile : true)) {
      result.push(v);
    }
  }

  return result;
}

export const getEarningTimeText = (hours?: number) => {
  if (hours !== undefined) {
    const isDay = hours > 24;
    const isHour = hours >= 1 && !isDay;

    let time, unit;

    if (isDay) {
      time = Math.floor(hours / 24);
      unit = detectTranslate(time > 1 ? 'days' : 'day');
    } else if (isHour) {
      time = hours;
      unit = detectTranslate(time > 1 ? 'hours' : 'hour');
    } else {
      time = hours * 60;
      unit = detectTranslate(time > 1 ? 'minutes' : 'minute');
    }

    return [time, unit].join(' ');
  } else {
    return detectTranslate('unknown time');
  }
};
