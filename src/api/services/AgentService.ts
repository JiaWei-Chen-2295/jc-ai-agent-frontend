/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseExecutionOverviewVO } from '../models/BaseResponseExecutionOverviewVO';
import type { BaseResponseExecutionTimelineVO } from '../models/BaseResponseExecutionTimelineVO';
import type { BaseResponseListRagRetrievalTrace } from '../models/BaseResponseListRagRetrievalTrace';
import type { BaseResponsePageExecutionLogVO } from '../models/BaseResponsePageExecutionLogVO';
import type { BaseResponseRagRetrievalTrace } from '../models/BaseResponseRagRetrievalTrace';
import type { BaseResponseToolStatsVO } from '../models/BaseResponseToolStatsVO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AgentService {
  /**
   * 查询租户执行日志
   * 分页查询当前租户下所有执行日志
   * @returns BaseResponsePageExecutionLogVO OK
   * @throws ApiError
   */
  public static getTenantLogs({
    page,
    size = 20,
  }: {
    /**
     * 页码，从0开始
     */
    page?: number,
    /**
     * 每页大小
     */
    size?: number,
  }): CancelablePromise<BaseResponsePageExecutionLogVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/v1/agent/observability/tenant/logs',
      query: {
        'page': page,
        'size': size,
      },
    });
  }
  /**
   * 获取工具调用统计
   * 返回会话中各工具的调用次数和耗时统计
   * @returns BaseResponseToolStatsVO OK
   * @throws ApiError
   */
  public static getToolStats({
    sessionId,
  }: {
    /**
     * 会话ID
     */
    sessionId: string,
  }): CancelablePromise<BaseResponseToolStatsVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/v1/agent/observability/session/{sessionId}/tools',
      path: {
        'sessionId': sessionId,
      },
    });
  }
  /**
   * 获取执行时间线
   * 返回会话的完整 ReAct 执行时间线，按迭代次数分组
   * @returns BaseResponseExecutionTimelineVO OK
   * @throws ApiError
   */
  public static getExecutionTimeline({
    sessionId,
  }: {
    /**
     * 会话ID
     */
    sessionId: string,
  }): CancelablePromise<BaseResponseExecutionTimelineVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/v1/agent/observability/session/{sessionId}/timeline',
      path: {
        'sessionId': sessionId,
      },
    });
  }
  /**
   * 获取执行概览
   * 返回会话的执行概览，包含迭代次数、耗时统计、阶段分布
   * @returns BaseResponseExecutionOverviewVO OK
   * @throws ApiError
   */
  public static getExecutionOverview({
    sessionId,
  }: {
    /**
     * 会话ID
     */
    sessionId: string,
  }): CancelablePromise<BaseResponseExecutionOverviewVO> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/v1/agent/observability/session/{sessionId}/overview',
      path: {
        'sessionId': sessionId,
      },
    });
  }
  /**
   * 查询单条 RAG 检索轨迹
   * 开发观测接口：按 traceId 查看完整检索细节
   * @returns BaseResponseRagRetrievalTrace OK
   * @throws ApiError
   */
  public static getRagTraceById({
    traceId,
  }: {
    /**
     * RAG 轨迹ID
     */
    traceId: string,
  }): CancelablePromise<BaseResponseRagRetrievalTrace> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/v1/agent/observability/rag/{traceId}',
      path: {
        'traceId': traceId,
      },
    });
  }
  /**
   * 查询最近 RAG 检索轨迹
   * 开发观测接口：查看 Vector/ES/RRF 的命中与耗时
   * @returns BaseResponseListRagRetrievalTrace OK
   * @throws ApiError
   */
  public static getLatestRagTraces({
    limit = 20,
  }: {
    /**
     * 返回数量，默认20，最大200
     */
    limit?: number,
  }): CancelablePromise<BaseResponseListRagRetrievalTrace> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/v1/agent/observability/rag/latest',
      query: {
        'limit': limit,
      },
    });
  }
}
