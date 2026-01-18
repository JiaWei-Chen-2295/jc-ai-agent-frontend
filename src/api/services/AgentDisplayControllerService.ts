/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SseEmitter } from '../models/SseEmitter';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgentDisplayControllerService {
  /**
   * @returns SseEmitter OK
   * @throws ApiError
   */
  public static stream({
    sessionId,
    message,
  }: {
    sessionId: string,
    message: string,
  }): CancelablePromise<SseEmitter> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/agent/display/stream',
      query: {
        'sessionId': sessionId,
        'message': message,
      },
    });
  }
}
