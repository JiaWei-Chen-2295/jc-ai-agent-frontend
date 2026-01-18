/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 头像上传凭证（前端直传）
 */
export type AvatarUploadTokenResponse = {
  /**
   * 存储提供方
   */
  provider?: string;
  /**
   * 上传地址（通常为 Bucket Host）
   */
  uploadUrl?: string;
  /**
   * 对象 Key（建议保存到数据库）
   */
  objectKey?: string;
  /**
   * 过期时间（秒级时间戳）
   */
  expireAtEpochSeconds?: number;
  /**
   * 表单上传字段（前端直传时原样提交）
   */
  formFields?: Record<string, string>;
  /**
   * 文件可访问 URL（用于上传成功后预览）
   */
  fileUrl?: string;
};

