/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 工具统计列表
 */
export type ToolStatItem = {
  /**
   * 工具名称
   */
  toolName?: string;
  /**
   * 调用次数
   */
  callCount?: number;
  /**
   * 平均执行耗时 (毫秒)
   */
  avgExecutionTimeMs?: number;
  /**
   * 总执行耗时 (毫秒)
   */
  totalExecutionTimeMs?: number;
  /**
   * 最大执行耗时 (毫秒)
   */
  maxExecutionTimeMs?: number;
  /**
   * 最小执行耗时 (毫秒)
   */
  minExecutionTimeMs?: number;
};

