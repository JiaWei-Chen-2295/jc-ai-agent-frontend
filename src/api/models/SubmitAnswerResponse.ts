/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuestionVO } from './QuestionVO';
/**
 * 提交答案响应
 */
export type SubmitAnswerResponse = {
  /**
   * 是否正确
   */
  isCorrect?: boolean;
  /**
   * 得分
   */
  score?: number;
  /**
   * 正确答案
   */
  correctAnswer?: string;
  /**
   * 答案解释
   */
  explanation?: string;
  /**
   * 反馈信息
   */
  feedback?: string;
  /**
   * 概念掌握程度
   */
  conceptMastery?: string;
  /**
   * 是否有下一题
   */
  hasNextQuestion?: boolean;
  nextQuestion?: QuestionVO;
  /**
   * 是否测验结束
   */
  quizCompleted?: boolean;
  /**
   * 当前总分
   */
  totalScore?: number;
  /**
   * 当前题号
   */
  currentQuestionNo?: number;
  /**
   * 总题目数
   */
  totalQuestions?: number;
};

