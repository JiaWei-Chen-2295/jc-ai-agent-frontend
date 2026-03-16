/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionVO } from './QuestionVO';
/**
 * 测验会话信息
 */
export type QuizSessionVO = {
  /**
   * 会话ID
   */
  sessionId?: string;
  /**
   * 测验模式
   */
  quizMode?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
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
   * 开始时间
   */
  startedAt?: string;
  /**
   * 完成时间
   */
  completedAt?: string;
  /**
   * 创建时间
   */
  createTime?: string;
  firstQuestion?: QuestionVO;
};

