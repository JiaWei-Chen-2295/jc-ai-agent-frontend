/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionVO } from './QuestionVO';
/**
 * 测验会话状态
 */
export type QuizSessionStatusVO = {
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 会话状态
   */
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'TIMEOUT' | 'ABANDONED';
  /**
   * 当前题号
   */
  currentQuestionNo?: number;
  /**
   * 总题目数
   */
  totalQuestions?: number;
  /**
   * 得分
   */
  score?: number;
  /**
   * 正确率
   */
  accuracy?: number;
  /**
   * 是否可以继续
   */
  canContinue?: boolean;
  currentQuestion?: QuestionVO;
};

