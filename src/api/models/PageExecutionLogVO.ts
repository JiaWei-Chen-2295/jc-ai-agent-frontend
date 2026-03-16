/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExecutionLogVO } from './ExecutionLogVO';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
/**
 * 真实业务数据载荷，可以是对象、列表或字符串
 */
export type PageExecutionLogVO = {
  totalElements?: number;
  totalPages?: number;
  size?: number;
  content?: Array<ExecutionLogVO>;
  number?: number;
  sort?: SortObject;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  pageable?: PageableObject;
  empty?: boolean;
};

