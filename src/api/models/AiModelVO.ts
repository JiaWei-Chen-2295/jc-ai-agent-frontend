/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * AI 模型信息
 */
export type AiModelVO = {
  /**
   * 主键 ID
   */
  id?: number;
  /**
   * 提供商标识
   */
  provider?: string;
  /**
   * 模型业务 ID
   */
  modelId?: string;
  /**
   * 模型展示名称
   */
  displayName?: string;
  /**
   * 模型描述
   */
  description?: string;
  /**
   * 模型图标 URL
   */
  iconUrl?: string;
  /**
   * 排序权重
   */
  sortOrder?: number;
  /**
   * 是否启用
   */
  enabled?: boolean;
  /**
   * API 实际模型名（管理员可见）
   */
  modelName?: string;
  /**
   * OpenAI 兼容端点（管理员可见）
   */
  baseUrl?: string;
  /**
   * 自定义 completions 路径（管理员可见）
   */
  completionsPath?: string;
  /**
   * API Key 脱敏展示（管理员可见）
   */
  apiKeyMasked?: string;
};

