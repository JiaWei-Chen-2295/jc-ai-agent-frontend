/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 团队信息
 */
export type TenantVO = {
  /**
   * 团队 ID
   */
  id?: number;
  /**
   * 团队名称
   */
  tenantName?: string;
  /**
   * 团队类型：personal/team
   */
  tenantType?: string;
  /**
   * 团队管理员用户 ID
   */
  ownerUserId?: number;
  /**
   * 当前用户在团队中的角色：admin/member
   */
  role?: string;
  /**
   * 创建时间
   */
  createTime?: string;
  /**
   * 更新时间
   */
  updateTime?: string;
};

