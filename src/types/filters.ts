/**
 * @file Filter Types
 * @description Tipos específicos para filtragem
 */

import {
    FilterOption,
    FilterState
} from './search';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'checkbox';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  default?: any;
}

export interface FilterGroup {
  name: string;
  filters: FilterConfig[];
}

export interface AppliedFilters {
  active: (keyof Omit<FilterState, 'search' | 'sort'>)[];
  count: number;
  values: Record<string, any>;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  icon?: string;
  description?: string;
}

export enum FilterChangeType {
  SET = 'SET',
  CLEAR = 'CLEAR',
  RESET = 'RESET',
  TOGGLE = 'TOGGLE',
}

export interface FilterChangeEvent {
  type: FilterChangeType;
  filter: keyof FilterState;
  value?: any;
  timestamp: number;
}
