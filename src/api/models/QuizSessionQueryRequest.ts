/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 测验会话查询请求
 */
export type QuizSessionQueryRequest = {
  /**
   * 会话状态筛选
   */
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'TIMEOUT' | 'ABANDONED';
  /**
   * 页码
   */
  pageNum?: number;
  /**
   * 每页大小
   */
  pageSize?: number;
};

