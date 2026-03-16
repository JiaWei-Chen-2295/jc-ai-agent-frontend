/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
import type { UserVO } from './UserVO';
/**
 * 真实业务数据载荷，可以是对象、列表或字符串
 */
export type PageUserVO = {
  totalElements?: number;
  totalPages?: number;
  size?: number;
  content?: Array<UserVO>;
  number?: number;
  sort?: SortObject;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  pageable?: PageableObject;
  empty?: boolean;
};

