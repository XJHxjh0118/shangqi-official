import type { Component } from "vue";

/** 表单项布局：inline 标签与控件同一行；vertical 标签在上、控件在下 */
export type SearchFilterLayout = "inline" | "vertical";

export type SearchFilterFieldType =
  | "input"
  | "select"
  | "remote-select"
  | "tree-select"
  | "date"
  | "daterange"
  | "datetime"
  | "datetimerange"
  | "slot";

export interface SearchFilterOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

/** 树形选项（支持嵌套） */
export interface SearchFilterTreeOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
  children?: SearchFilterTreeOption[];
}

export interface SearchFilterColSpan {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface SearchFilterField {
  /** 字段键，对应 model 中的 key */
  prop: string;
  /** 标签文案，未传或为空时不展示 */
  label?: string;
  /** 控件类型，slot 时使用插槽 */
  type?: SearchFilterFieldType;
  /** 单项布局，优先级高于组件全局 layout */
  layout?: SearchFilterLayout;
  placeholder?: string;
  /** 输入框前缀图标 */
  prefixIcon?: Component;
  /** 输入框后缀图标 */
  suffixIcon?: Component;
  /** 是否显示清除按钮；未设置时跟随组件 clearable */
  clearable?: boolean;
  /** 远程搜索方法，type 为 remote-select 时使用 */
  remoteMethod?: (query: string) => void | Promise<void>;
  /** 远程搜索 loading 状态 */
  remoteLoading?: boolean;
  /** 远程搜索时是否保留关键词，默认 true */
  reserveKeyword?: boolean;
  /** 树形选项，type 为 tree-select 时使用 */
  treeOptions?: SearchFilterTreeOption[];
  /** 控件宽度 */
  width?: string | number;
  /** 控件最小宽度 */
  minWidth?: string | number;
  /** 栅格占位 */
  col?: SearchFilterColSpan;
  /** 隐藏该项 */
  hidden?: boolean;
  /** 展开收起：为 true 时仅在展开状态显示 */
  expandOnly?: boolean;
  /** 插槽名，type 为 slot 时使用，默认为 prop */
  slot?: string;
  /** 静态下拉选项 */
  options?: SearchFilterOption[];
  /** select 是否可搜索 */
  filterable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 透传给 Element Plus 控件的属性 */
  componentProps?: Record<string, unknown>;
}

export interface SearchFiltersProps {
  fields: SearchFilterField[];
  layout?: SearchFilterLayout;
  controlWidth?: string | number;
  controlMinWidth?: string | number;
  gutter?: number;
  colSpan?: SearchFilterColSpan;
  defaultValues?: Record<string, unknown>;
  showActions?: boolean;
  clearable?: boolean;
  queryText?: string;
  resetText?: string;
  expandable?: boolean;
  collapsedRows?: number;
  collapsedCount?: number;
  defaultCollapsed?: boolean;
  expandText?: string;
  collapseText?: string;
  loading?: boolean;
  displayMode?: "grid" | "inline" | "block";
  embedded?: boolean;
  bordered?: boolean;
  showLabel?: boolean;
  labelWidth?: string | number;
}

export type SearchFilterFieldChangePayload = {
  prop: string;
  value: unknown;
  field: SearchFilterField;
};

export type SearchFilterRemoteSearchPayload = {
  prop: string;
  query: string;
  field: SearchFilterField;
};

export type SearchFiltersSearchPayload = Record<string, unknown>;
