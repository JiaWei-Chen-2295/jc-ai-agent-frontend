/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 通用响应包装，所有接口保持相同结构
 */
export type BaseResponseLong = {
  /**
   * 业务状态码，0 表示成功，其余表示失败
   */
  code?: number;
  /**
   * 真实业务数据载荷，可以是对象、列表或字符串
   */
  data?: number;
  /**
   * 人类可读的补充信息，失败时包含错误原因
   */
  message?: string;
};

