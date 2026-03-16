/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IterationRecord } from './IterationRecord';
/**
 * Agent 执行时间线
 */
export type ExecutionTimelineVO = {
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 迭代记录列表，按迭代次数分组
   */
  iterations?: Array<IterationRecord>;
};

