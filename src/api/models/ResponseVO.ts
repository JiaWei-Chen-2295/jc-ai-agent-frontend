/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 答题记录
 */
export type ResponseVO = {
  /**
   * 记录ID
   */
  id?: string;
  /**
   * 题目ID
   */
  questionId?: string;
  /**
   * 用户答案
   */
  userAnswer?: string;
  /**
   * 是否正确
   */
  isCorrect?: boolean;
  /**
   * 得分
   */
  score?: number;
  /**
   * 响应时间 (毫秒)
   */
  responseTimeMs?: number;
  /**
   * 概念掌握程度
   */
  conceptMastery?: 'MASTERED' | 'PARTIAL' | 'UNMASTERED';
  /**
   * 反馈信息
   */
  feedback?: string;
  /**
   * 创建时间
   */
  createTime?: string;
};

