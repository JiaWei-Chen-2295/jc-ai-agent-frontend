/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 知识缺口查询请求
 */
export type KnowledgeGapQueryRequest = {
  /**
   * 状态筛选
   */
  status?: 'ACTIVE' | 'RESOLVED';
  /**
   * 严重程度筛选
   */
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  /**
   * 页码
   */
  pageNum?: number;
  /**
   * 每页大小
   */
  pageSize?: number;
};

