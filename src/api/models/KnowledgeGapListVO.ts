/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KnowledgeGapVO } from './KnowledgeGapVO';
/**
 * 知识缺口列表
 */
export type KnowledgeGapListVO = {
  /**
   * 总数
   */
  total?: number;
  /**
   * 活跃缺口数
   */
  activeCount?: number;
  /**
   * 已解决数
   */
  resolvedCount?: number;
  /**
   * 缺口列表
   */
  list?: Array<KnowledgeGapVO>;
};

