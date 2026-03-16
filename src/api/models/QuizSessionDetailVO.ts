/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CognitiveSummary } from './CognitiveSummary';
import type { QuestionVO } from './QuestionVO';
import type { QuizSessionVO } from './QuizSessionVO';
import type { ResponseVO } from './ResponseVO';
/**
 * 测验会话详情
 */
export type QuizSessionDetailVO = {
  session?: QuizSessionVO;
  /**
   * 所有题目列表
   */
  questions?: Array<QuestionVO>;
  /**
   * 答题记录
   */
  responses?: Array<ResponseVO>;
  cognitiveSummary?: CognitiveSummary;
};

