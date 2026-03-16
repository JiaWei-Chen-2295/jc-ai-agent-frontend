/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 提交答案请求
 */
export type SubmitAnswerRequest = {
  /**
   * 题目ID
   */
  questionId: string;
  /**
   * 用户答案
   */
  answer: string;
  /**
   * 响应时间 (毫秒)
   */
  responseTimeMs?: number;
};

