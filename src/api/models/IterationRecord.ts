/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PhaseLog } from './PhaseLog';
/**
 * 迭代记录列表，按迭代次数分组
 */
export type IterationRecord = {
  /**
   * 迭代次数
   */
  iteration?: number;
  thought?: PhaseLog;
  action?: PhaseLog;
  observation?: PhaseLog;
};

