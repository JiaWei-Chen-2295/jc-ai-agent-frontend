/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 观察阶段日志
 */
export type PhaseLog = {
  /**
   * 日志ID
   */
  id?: string;
  /**
   * 阶段类型: THOUGHT/ACTION/OBSERVATION
   */
  phase?: string;
  /**
   * 工具名称 (仅 ACTION 阶段)
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
};

