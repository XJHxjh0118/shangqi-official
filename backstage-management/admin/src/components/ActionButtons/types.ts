import type { ButtonType } from "element-plus";
import type { Component } from "vue";

export type ActionButtonType = ButtonType | "default";

export interface ActionButtonItem {
  /** 唯一标识，用于 @action 事件 */
  key?: string;
  label: string;
  /** 图标组件，或 Element Plus 图标名 */
  icon?: Component | string;
  type?: ActionButtonType;
  /** 自定义文字/链接色 */
  color?: string;
  plain?: boolean;
  link?: boolean;
  disabled?: boolean | (() => boolean);
  hidden?: boolean | (() => boolean);
  /** 权限字符，同 hasPerms，满足其一即可 */
  permi?: string | string[];
  /** 角色权限，满足其一即可 */
  roles?: string | string[];
  /** 下拉项分隔线（仅折叠区生效） */
  divided?: boolean;
  /** 图标按钮提示 */
  tooltip?: string;
  /** 禁用时的 hover 提示 */
  disabledTooltip?: string;
  /** 是否仅显示图标；false 时以文字按钮为准 */
  showIcon?: boolean;
}

export type ActionButtonsTrigger = "hover" | "click";

export interface ActionButtonsProps {
  buttons: ActionButtonItem[];
  /** 超出后收入「更多」。0 或不传表示全部展示在同一行 */
  max?: number;
  size?: "large" | "default" | "small";
  moreTrigger?: ActionButtonsTrigger;
  link?: boolean;
  showIcon?: boolean;
  gap?: number;
  teleported?: boolean;
}
