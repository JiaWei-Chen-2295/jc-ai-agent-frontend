/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AiModelConfigRequest } from '../models/AiModelConfigRequest';
import type { BaseResponseAiModelVO } from '../models/BaseResponseAiModelVO';
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseListAiModelVO } from '../models/BaseResponseListAiModelVO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiService {
  /**
   * 【管理员】更新模型配置
   * @returns BaseResponseAiModelVO OK
   * @throws ApiError
   */
  public static updateModel({
    id,
    requestBody,
  }: {
    id: number,
    requestBody: AiModelConfigRequest,
  }): CancelablePromise<BaseResponseAiModelVO> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/ai/admin/models/{id}',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 【管理员】删除模型配置
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static deleteModel({
    id,
  }: {
    id: number,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/ai/admin/models/{id}',
      path: {
        'id': id,
      },
    });
  }
  /**
   * 【管理员】获取全部模型（含禁用）
   * @returns BaseResponseListAiModelVO OK
   * @throws ApiError
   */
  public static listAllModels(): CancelablePromise<BaseResponseListAiModelVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai/admin/models',
    });
  }
  /**
   * 【管理员】新增模型配置
   * @returns BaseResponseAiModelVO OK
   * @throws ApiError
   */
  public static createModel({
    requestBody,
  }: {
    requestBody: AiModelConfigRequest,
  }): CancelablePromise<BaseResponseAiModelVO> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/ai/admin/models',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * 【管理员】启用 / 禁用模型
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static toggleModel({
    id,
  }: {
    id: number,
  }): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/ai/admin/models/{id}/toggle',
      path: {
        'id': id,
      },
    });
  }
  /**
   * 获取可用模型列表
   * 返回所有已启用的 AI 模型，供前端下拉框展示。
   * @returns BaseResponseListAiModelVO OK
   * @throws ApiError
   */
  public static listModels(): CancelablePromise<BaseResponseListAiModelVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/ai/models',
    });
  }
}
