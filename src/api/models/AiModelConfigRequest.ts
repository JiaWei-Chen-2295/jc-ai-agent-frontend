/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * AI 模型配置请求
 */
export type AiModelConfigRequest = {
  /**
   * 提供商标识（dashscope / openai / deepseek / kimi / glm）
   */
  provider: string;
  /**
   * 模型业务 ID（全局唯一）
   */
  modelId: string;
  /**
   * 发送给 API 的实际模型名
   */
  modelName: string;
  /**
   * 前端展示名称
   */
  displayName: string;
  /**
   * OpenAI 兼容端点（非 DashScope 必填）
   */
  baseUrl?: string;
  /**
   * 自定义 completions 路径（如智谱 /v4/chat/completions）；为空则使用默认 /v1/chat/completions
   */
  completionsPath?: string;
  /**
   * 明文 API Key（创建时必填；更新时留空则保留原值）
   */
  apiKeyPlain?: string;
  /**
   * 最大输出 token 数
   */
  maxTokens?: number;
  /**
   * 默认温度（0.0 ~ 1.0）
   */
  temperature?: number;
  /**
   * 模型描述
   */
  description?: string;
  /**
   * 模型图标 URL
   */
  iconUrl?: string;
  /**
   * 排序权重（升序）
   */
  sortOrder?: number;
  /**
   * 是否启用
   */
  enabled?: boolean;
};

