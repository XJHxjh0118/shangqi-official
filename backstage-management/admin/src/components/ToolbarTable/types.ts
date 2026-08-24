import type { ButtonType } from "element-plus";
import type { Component } from "vue";

export type ToolbarButtonType = ButtonType | "default";

export interface ToolbarButtonItem {
  key?: string;
  label: string;
  icon?: Component | string;
  type?: ToolbarButtonType;
  plain?: boolean;
  disabled?: boolean | (() => boolean);
  hidden?: boolean | (() => boolean);
  loading?: boolean | (() => boolean);
  divided?: boolean;
}

export type ToolbarButtonsTrigger = "hover" | "click";

export interface ToolbarTableColumn {
  /** 列唯一标识（显隐同步用；无则回退 prop） */
  key?: string;
  /** 字段名 */
  prop?: string;
  /** 列标题 */
  label?: string;
  /** 是否显示，默认 true */
  visible?: boolean;
  /** 列宽度 */
  width?: string | number;
  /** 最小列宽 */
  minWidth?: string | number;
  /** 对齐方式；未设置时：首个内容列默认 left，其余 center */
  align?: "left" | "center" | "right";
  /** 表头对齐方式；未设置时跟随 align */
  headerAlign?: "left" | "center" | "right";
  /** 是否固定 */
  fixed?: boolean | "left" | "right";
  /** 超出是否 tooltip；未设置时使用组件 defaultShowOverflowTooltip */
  showOverflowTooltip?: boolean;
  /** 列 class */
  className?: string;
  /** 特殊列类型 */
  type?: "selection" | "index" | "expand" | "datetime";
  /** 自定义列插槽；true 时用 prop/key 作为插槽名 */
  slot?: boolean | string;
  /** 是否可排序 */
  sortable?: boolean | "custom";
  /** 表头插槽名 */
  headerSlot?: boolean | string;
  /** 格式化函数 */
  formatter?: (
    row: any,
    column: any,
    cellValue: any,
    index: number
  ) => string;
  /** 是否参与列显隐；默认 true */
  toggleable?: boolean;
  /** selection 列宽度 */
  selectionWidth?: number;
  /** selection 列行是否可选 */
  selectable?: (row: any, index: number) => boolean;
  /** selection 列跨页保留勾选（需配合 row-key） */
  reserveSelection?: boolean;
  /** index 列标题 */
  indexLabel?: string;
  /**
   * datetime 列展示格式
   * 默认 `{y}-{m}-{d} {h}:{i}:{s}`
   */
  datetimePattern?: string;
}

export interface ToolbarColumnVisible {
  label: string;
  visible: boolean;
}

export type ToolbarColumnsMap = Record<string, ToolbarColumnVisible>;
