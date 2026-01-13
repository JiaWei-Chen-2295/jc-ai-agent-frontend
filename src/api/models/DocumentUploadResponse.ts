/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 文档上传成功后的返回内容
 */
export type DocumentUploadResponse = {
  /**
   * 文档唯一标识 ID
   */
  documentId?: number;
  /**
   * 上传时的原始文件名
   */
  filename?: string;
  /**
   * 文档当前处理状态
   */
  status?: string;
  /**
   * 给前端的提示信息
   */
  message?: string;
};

