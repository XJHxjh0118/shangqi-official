export const SYSTEM_ROLE = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  DEALER: 'DEALER',
} as const;

export type SystemRoleCode = (typeof SYSTEM_ROLE)[keyof typeof SYSTEM_ROLE];

export const ALL_PERMISSION = '*:*:*';
