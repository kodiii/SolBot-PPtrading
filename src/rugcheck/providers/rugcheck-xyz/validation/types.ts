/**
 * @file Validation types
 */

import { RugCheckXYZResponse } from '../types';

export interface ValidationResult {
  category: string;
  rule: string;
  passed: boolean;
  message?: string;
}

export type ValidationFunction = (data: RugCheckXYZResponse) => ValidationResult[];
