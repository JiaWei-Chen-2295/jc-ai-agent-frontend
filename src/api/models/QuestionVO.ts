/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 测验题目
 */
export type QuestionVO = {
  /**
   * 题目ID
   */
  id?: string;
  /**
   * 题目编号
   */
  questionNo?: number;
  /**
   * 题目类型
   */
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'SHORT_ANSWER' | 'EXPLANATION' | 'MATCHING' | 'ORDERING' | 'CODE_COMPLETION';
  /**
   * 题目文本
   */
  questionText?: string;
  /**
   * 选项列表
   */
  options?: Array<string>;
  /**
   * 难度
   */
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  /**
   * 关联知识点
   */
  relatedConcept?: string;
  /**
   * 是否已作答
   */
  answered?: boolean;
};

