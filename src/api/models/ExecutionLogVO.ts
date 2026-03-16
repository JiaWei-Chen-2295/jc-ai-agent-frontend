/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Agent 执行日志
 */
export type ExecutionLogVO = {
  /**
   * 日志ID
   */
  id?: string;
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 租户ID
   */
  tenantId?: number;
  /**
   * 迭代次数
   */
  iteration?: number;
  /**
   * 阶段: THOUGHT/ACTION/OBSERVATION
   */
  phase?: string;
  /**
   * 工具名称
   */
  toolName?: string;
  /**
   * 输入数据
   */
  inputData?: Record<string, Record<string, any>>;
  /**
   * 输出数据
   */
  outputData?: Record<string, Record<string, any>>;
  /**
   * 执行耗时 (毫秒)
   */
  executionTimeMs?: number;
  /**
   * 是否超时
   */
  timeout?: boolean;
  /**
   * 执行时间
   */
  timestamp?: string;
  /**
   * 创建时间
   */
  createTime?: string;
};

