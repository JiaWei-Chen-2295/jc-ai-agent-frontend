/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatSessionVO } from './ChatSessionVO';
/**
 * 通用响应包装，所有接口保持相同结构
 */
export type BaseResponseChatSessionVO = {
  /**
   * 业务状态码，0 表示成功，其余表示失败
   */
  code?: number;
  data?: ChatSessionVO;
  /**
   * 人类可读的补充信息，失败时包含错误原因
   */
  message?: string;
};

