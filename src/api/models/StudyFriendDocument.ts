/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 学习助手文档信息
 */
export type StudyFriendDocument = {
  /**
   * 主键 ID
   */
  id?: number;
  /**
   * 租户 ID
   */
  tenantId?: number;
  /**
   * 归属用户 ID
   */
  ownerUserId?: number;
  /**
   * 文件名
   */
  fileName?: string;
  /**
   * 文件存储路径（相对路径）
   */
  filePath?: string;
  /**
   * 文件类型 (pdf/pptx/docx/image/md)
   */
  fileType?: string;
  /**
   * 文档处理状态
   */
  status?: 'UPLOADED' | 'INDEXING' | 'INDEXED' | 'FAILED';
  /**
   * 失败原因，仅在处理失败时返回
   */
  errorMessage?: string;
  /**
   * 创建时间
   */
  createdAt?: string;
  /**
   * 更新时间
   */
  updatedAt?: string;
};

