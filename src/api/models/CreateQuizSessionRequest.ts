/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 创建测验会话请求
 */
export type CreateQuizSessionRequest = {
  /**
   * 文档ID列表 (为空则使用全部文档)
   */
  documentIds?: Array<number>;
  /**
   * 测验模式
   */
  quizMode?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  /**
   * 题目数量 (0表示自适应)
   */
  questionCount?: number;
};

