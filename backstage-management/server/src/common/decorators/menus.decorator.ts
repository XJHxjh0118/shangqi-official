import { SetMetadata } from '@nestjs/common';

export const MENUS_KEY = 'menus';
export const Menus = (...menus: string[]) => SetMetadata(MENUS_KEY, menus);
