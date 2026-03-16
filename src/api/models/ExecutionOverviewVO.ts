/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PhaseCount } from './PhaseCount';
import type { TimeoutLogInfo } from './TimeoutLogInfo';
/**
 * 会话执行概览
 */
export type ExecutionOverviewVO = {
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 总迭代次数
   */
  totalIterations?: number;
  /**
   * 总日志条数
   */
  totalLogCount?: number;
  /**
   * 总执行耗时 (毫秒)
   */
  totalExecutionTimeMs?: number;
  /**
   * 平均执行耗时 (毫秒)
   */
  avgExecutionTimeMs?: number;
  /**
   * 各阶段数量统计
   */
  phaseCounts?: Array<PhaseCount>;
  /**
   * 超时日志数量
   */
  timeoutLogCount?: number;
  /**
   * 超时日志列表
   */
  timeoutLogs?: Array<TimeoutLogInfo>;
};

