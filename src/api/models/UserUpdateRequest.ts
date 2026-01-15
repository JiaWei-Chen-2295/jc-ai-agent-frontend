/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 管理员更新用户请求
 */
export type UserUpdateRequest = {
  /**
   * 用户 id
   */
  id?: number;
  /**
   * 账号
   */
  userAccount?: string;
  /**
   * 密码
   */
  userPassword?: string;
  /**
   * 昵称
   */
  userName?: string;
  /**
   * 头像 URL
   */
  userAvatar?: string;
  /**
   * 用户简介
   */
  userProfile?: string;
  /**
   * 角色：user/admin/ban
   */
  userRole?: string;
  /**
   * 微信开放平台 id
   */
  unionId?: string;
  /**
   * 公众号 openId
   */
  mpOpenId?: string;
};

