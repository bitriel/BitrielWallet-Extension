// Copyright 2019-2022 @bitriel/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataRequest, Resolver } from '@bitriel/extension-base/background/types';
import RequestService from '@bitriel/extension-base/services/request-service';
import { extractMetadata } from '@bitriel/extension-base/services/request-service/helper';
import { MetaRequest } from '@bitriel/extension-base/services/request-service/types';
import { MetadataStore } from '@bitriel/extension-base/stores';
import { addMetadata, knownMetadata } from '@bitriel/extension-chains';
import { MetadataDef } from '@bitriel/extension-inject/types';
import { BehaviorSubject } from 'rxjs';

export default class MetadataRequestHandler {
  readonly #requestService: RequestService;
  readonly #metaStore: MetadataStore = new MetadataStore();
  readonly #metaRequests: Record<string, MetaRequest> = {};
  public readonly metaSubject: BehaviorSubject<MetadataRequest[]> = new BehaviorSubject<MetadataRequest[]>([]);

  constructor (requestService: RequestService) {
    this.#requestService = requestService;

    extractMetadata(this.#metaStore);
  }

  public get knownMetadata (): MetadataDef[] {
    return knownMetadata();
  }

  public get allMetaRequests (): MetadataRequest[] {
    return Object
      .values(this.#metaRequests)
      .map(({ id, request, url }): MetadataRequest => ({ id, request, url }));
  }

  public get numMetaRequests (): number {
    return Object.keys(this.#metaRequests).length;
  }

  public getMetaRequest (id: string): MetaRequest {
    return this.#metaRequests[id];
  }

  public saveMetadata (meta: MetadataDef): void {
    this.#metaStore.set(meta.genesisHash, meta);

    addMetadata(meta);
  }

  private updateIconMeta (shouldClose?: boolean): void {
    this.metaSubject.next(this.allMetaRequests);
    this.#requestService.updateIconV2(shouldClose);
  }

  // @ts-ignore
  private metaComplete = (id: string, resolve: (result: boolean) => void, reject: (error: Error) => void): Resolver<boolean> => {
    const complete = (): void => {
      delete this.#metaRequests[id];
      this.updateIconMeta(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        reject(error);
      },
      resolve: (result: boolean): void => {
        complete();
        resolve(result);
      }
    };
  };

  public injectMetadata (request: MetadataDef): boolean {
    this.saveMetadata(request);

    return true;
  }

  public resetWallet () {
    for (const request of Object.values(this.#metaRequests)) {
      request.reject(new Error('Reset wallet'));
    }

    this.metaSubject.next([]);
  }
}
