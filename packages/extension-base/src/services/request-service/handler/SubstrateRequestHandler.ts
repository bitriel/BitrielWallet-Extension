// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import RequestExtrinsicSign from '@bitriel/extension-base/background/RequestExtrinsicSign';
import { RequestSign, Resolver, ResponseSigning, SigningRequest } from '@bitriel/extension-base/background/types';
import RequestService from '@bitriel/extension-base/services/request-service';
import { SignRequest } from '@bitriel/extension-base/services/request-service/types';
import { getId } from '@bitriel/extension-base/utils/getId';
import { isInternalRequest } from '@bitriel/extension-base/utils/request';
import { BehaviorSubject } from 'rxjs';

import { SignerPayloadJSON } from '@polkadot/types/types/extrinsic';
import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export default class SubstrateRequestHandler {
  readonly #logger: Logger;
  readonly #requestService: RequestService;
  readonly #substrateRequests: Record<string, SignRequest> = {};
  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject<SigningRequest[]>([]);

  constructor (requestService: RequestService) {
    this.#requestService = requestService;
    this.#logger = createLogger('SubstrateRequestHandler');
  }

  public getSignRequest (id: string): SignRequest | undefined {
    return this.#substrateRequests[id];
  }

  public get allSubstrateRequests (): SigningRequest[] {
    return Object
      .values(this.#substrateRequests)
      .map(({ address, id, request, url }) => ({ address, id, request, url, isInternal: isInternalRequest(url) }));
  }

  private updateIconSign (shouldClose?: boolean): void {
    this.signSubject.next(this.allSubstrateRequests);
    this.#requestService.updateIconV2(shouldClose);
  }

  private signComplete = (id: string, resolve: (result: ResponseSigning) => void, reject: (error: Error) => void): Resolver<ResponseSigning> => {
    const complete = (): void => {
      delete this.#substrateRequests[id];
      this.updateIconSign(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        this.#logger.log(error);
        reject(error);
      },
      resolve: (result: ResponseSigning): void => {
        complete();
        resolve(result);
      }
    };
  };

  public get numSubstrateRequests (): number {
    return Object.keys(this.#substrateRequests).length;
  }

  public async sign (url: string, request: RequestSign, _id?: string): Promise<ResponseSigning> {
    const id = _id || getId();
    const isAlwaysRequired = await this.#requestService.settingService.isAlwaysRequired;

    if (isAlwaysRequired) {
      this.#requestService.keyringService.lock();
    }

    return new Promise((resolve, reject): void => {
      this.#substrateRequests[id] = {
        ...this.signComplete(id, resolve, reject),
        address: request.payload.address,
        id,
        request,
        url
      };

      this.updateIconSign();
      this.#requestService.popupOpen();
    });
  }

  public async signTransaction (id: string, address: string, url: string, payload: SignerPayloadJSON, onSign?: (id: string) => void): Promise<ResponseSigning> {
    const isAlwaysRequired = await this.#requestService.settingService.isAlwaysRequired;

    if (isAlwaysRequired && !onSign) {
      this.#requestService.keyringService.lock();
    }

    return new Promise((resolve, reject): void => {
      this.#substrateRequests[id] = {
        ...this.signComplete(id, resolve, reject),
        address,
        id,
        request: new RequestExtrinsicSign(payload),
        url: url
      };

      this.updateIconSign();

      if (!isInternalRequest(url) && !onSign) {
        this.#requestService.popupOpen();
      }

      onSign?.(id);
    });
  }

  public resetWallet () {
    for (const request of Object.values(this.#substrateRequests)) {
      request.reject(new Error('Reset wallet'));
    }

    this.signSubject.next([]);
  }
}
