/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 用户查询请求
 */
export type UserQueryRequest = {
  current?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  /**
   * 用户 id
   */
  id?: number;
  /**
   * 账号
   */
  userAccount?: string;
  /**
   * 昵称
   */
  userName?: string;
  /**
   * 角色
   */
  userRole?: string;
};

