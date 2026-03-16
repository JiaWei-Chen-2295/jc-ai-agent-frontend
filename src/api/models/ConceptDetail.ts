/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 单个概念的覆盖详情
 */
export type ConceptDetail = {
  /**
   * 概念名称
   */
  name?: string;
  /**
   * 状态: UNTESTED / TESTING / MASTERED
   */
  status?: string;
  /**
   * 理解深度 (0-100)，未测时为 null
   */
  understandingDepth?: number;
  /**
   * 认知负荷 (0-100)，未测时为 null
   */
  cognitiveLoad?: number;
  /**
   * 稳定性 (0-100)，未测时为 null
   */
  stability?: number;
  /**
   * 该概念的答题数
   */
  questionCount?: number;
};

