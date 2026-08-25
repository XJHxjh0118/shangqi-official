import { Workbook } from 'exceljs';
import type { Cell, DataValidation, Worksheet } from 'exceljs';
import { ProductStatus } from '@prisma/client';

export type ColumnKey =
  | 'sku'
  | 'slug'
  | 'category'
  | 'nameZh'
  | 'nameEn'
  | 'status'
  | 'installLevel'
  | 'isNew'
  | 'isHot'
  | 'isFeatured'
  | 'vehicles'
  | 'descriptionZh'
  | 'descriptionEn'
  | 'materialZh'
  | 'materialEn'
  | 'sizeZh'
  | 'sizeEn'
  | 'colorZh'
  | 'colorEn'
  | 'seoTitleZh'
  | 'seoTitleEn'
  | 'seoKeywordsZh'
  | 'seoKeywordsEn'
  | 'seoDescriptionZh'
  | 'seoDescriptionEn';

export type ColumnDef = {
  key: ColumnKey;
  header: string;
  required: boolean;
  aliases: string[];
  note: string;
  input: 'text' | 'select' | 'multi-select' | 'yesno';
};

export type CategoryOption = {
  id: number;
  code: string;
  nameZh: string;
  nameEn: string;
  enabled: boolean;
  parent?: { code: string; nameZh: string } | null;
};

export type VehicleOption = {
  id: number;
  code: string;
  brandZh: string;
  modelZh: string;
  yearFrom: number | null;
  yearTo: number | null;
  enabled: boolean;
};

export type ProductExcelRow = Partial<Record<ColumnKey, string>> & {
  vehicleLabels?: string[];
};

export const VEHICLE_SLOT_COUNT = 8;
export const DATA_ROW_COUNT = 500;
export const PRODUCT_XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const STATUS_LABELS = ['草稿', '已发布', '已归档'] as const;
export const YES_NO_LABELS = ['是', '否'] as const;

const STATUS_VALUES = new Set<string>(Object.values(ProductStatus));
const STATUS_ALIAS: Record<string, ProductStatus> = {
  草稿: ProductStatus.DRAFT,
  已发布: ProductStatus.PUBLISHED,
  已归档: ProductStatus.ARCHIVED,
  draft: ProductStatus.DRAFT,
  published: ProductStatus.PUBLISHED,
  archived: ProductStatus.ARCHIVED,
};

export const COLUMNS: ColumnDef[] = [
  {
    key: 'sku',
    header: 'SKU',
    required: true,
    aliases: ['sku', '货号'],
    note: '手动填写。产品唯一编码，已存在的 SKU 会更新原产品。',
    input: 'text',
  },
  {
    key: 'slug',
    header: 'Slug',
    required: true,
    aliases: ['slug', 'url别名'],
    note: '手动填写。前台链接标识，全局唯一。',
    input: 'text',
  },
  {
    key: 'category',
    header: '分类',
    required: true,
    aliases: ['category', 'categorycode', '分类编码'],
    note: '下拉选择，选项来自当前后台分类，请勿手填。',
    input: 'select',
  },
  {
    key: 'nameZh',
    header: '中文名',
    required: true,
    aliases: ['namezh', '名称中文', '产品中文名'],
    note: '手动填写，与新建产品一致，中文名必填。',
    input: 'text',
  },
  {
    key: 'nameEn',
    header: '英文名',
    required: true,
    aliases: ['nameen', '名称英文', '产品英文名'],
    note: '手动填写，与新建产品一致，英文名必填。',
    input: 'text',
  },
  {
    key: 'status',
    header: '状态',
    required: false,
    aliases: ['status'],
    note: '下拉选择：草稿 / 已发布 / 已归档。默认草稿。',
    input: 'select',
  },
  {
    key: 'installLevel',
    header: '规格标签',
    required: false,
    aliases: ['installlevel', '规格'],
    note: '选填，如：标准版。',
    input: 'text',
  },
  {
    key: 'isNew',
    header: '新品',
    required: false,
    aliases: ['isnew'],
    note: '下拉选择：是 / 否。',
    input: 'yesno',
  },
  {
    key: 'isHot',
    header: '热销',
    required: false,
    aliases: ['ishot'],
    note: '下拉选择：是 / 否。',
    input: 'yesno',
  },
  {
    key: 'isFeatured',
    header: '首页主推',
    required: false,
    aliases: ['isfeatured', '主推'],
    note: '下拉选择：是 / 否。',
    input: 'yesno',
  },
  {
    key: 'vehicles',
    header: '适配车型',
    required: false,
    aliases: ['vehicles', 'vehiclecodes', '车型', '车型编码', '适配车型编码'],
    note: '下拉多选：请在「适配车型1」至「适配车型8」中分别选择，选项来自当前车型数据。',
    input: 'multi-select',
  },
  {
    key: 'descriptionZh',
    header: '中文描述',
    required: false,
    aliases: ['descriptionzh', '描述中文'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'descriptionEn',
    header: '英文描述',
    required: false,
    aliases: ['descriptionen', '描述英文'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'materialZh',
    header: '材质中文',
    required: false,
    aliases: ['materialzh'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'materialEn',
    header: '材质英文',
    required: false,
    aliases: ['materialen'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'sizeZh',
    header: '尺寸中文',
    required: false,
    aliases: ['sizezh'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'sizeEn',
    header: '尺寸英文',
    required: false,
    aliases: ['sizeen'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'colorZh',
    header: '颜色中文',
    required: false,
    aliases: ['colorzh'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'colorEn',
    header: '颜色英文',
    required: false,
    aliases: ['coloren'],
    note: '选填。',
    input: 'text',
  },
  {
    key: 'seoTitleZh',
    header: 'SEO标题中文',
    required: false,
    aliases: ['seotitlezh'],
    note: '选填，空则回退产品名。',
    input: 'text',
  },
  {
    key: 'seoTitleEn',
    header: 'SEO标题英文',
    required: false,
    aliases: ['seotitleen'],
    note: '选填，空则回退产品名。',
    input: 'text',
  },
  {
    key: 'seoKeywordsZh',
    header: 'SEO关键词中文',
    required: false,
    aliases: ['seokeywordszh'],
    note: '选填，逗号分隔。',
    input: 'text',
  },
  {
    key: 'seoKeywordsEn',
    header: 'SEO关键词英文',
    required: false,
    aliases: ['seokeywordsen'],
    note: '选填，逗号分隔。',
    input: 'text',
  },
  {
    key: 'seoDescriptionZh',
    header: 'SEO描述中文',
    required: false,
    aliases: ['seodescriptionzh'],
    note: '选填，空则回退产品描述。',
    input: 'text',
  },
  {
    key: 'seoDescriptionEn',
    header: 'SEO描述英文',
    required: false,
    aliases: ['seodescriptionen'],
    note: '选填，空则回退产品描述。',
    input: 'text',
  },
];

type SheetColumn = {
  key: ColumnKey | `vehicle${number}`;
  header: string;
  required: boolean;
  width: number;
  dropdown?: 'category' | 'status' | 'yesno' | 'vehicle';
};

const HEADER_FILL = 'FF1F4E79';
const HEADER_TEXT = 'FFFFFFFF';
const STAR_RED = 'FFFF4D4F';
const FONT_NAME = 'Microsoft YaHei';

const ALIAS_TO_KEY = new Map<string, ColumnKey>();
for (const col of COLUMNS) {
  ALIAS_TO_KEY.set(normalizeHeader(col.header), col.key);
  ALIAS_TO_KEY.set(normalizeHeader(`${col.header}*`), col.key);
  for (const alias of col.aliases) {
    ALIAS_TO_KEY.set(normalizeHeader(alias), col.key);
  }
}
for (let i = 1; i <= VEHICLE_SLOT_COUNT; i += 1) {
  ALIAS_TO_KEY.set(normalizeHeader(`适配车型${i}`), 'vehicles');
  ALIAS_TO_KEY.set(normalizeHeader(`车型${i}`), 'vehicles');
}

export function normalizeHeader(raw: string) {
  return String(raw || '')
    .trim()
    .replace(/[*＊]+/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function cellText(value: unknown) {
  if (value == null) return '';
  if (typeof value === 'object' && value && 'richText' in value) {
    const rich = (value as { richText?: Array<{ text?: string }> }).richText;
    return (rich || []).map((item) => item.text || '').join('').trim();
  }
  return String(value).trim();
}

export function displayHeader(col: { header: string; required: boolean }) {
  return col.required ? `${col.header}*` : col.header;
}

export function statusLabel(status: string) {
  if (status === ProductStatus.PUBLISHED) return '已发布';
  if (status === ProductStatus.ARCHIVED) return '已归档';
  return '草稿';
}

export function yesNoLabel(value: boolean) {
  return value ? '是' : '否';
}

export function categoryLabel(item: CategoryOption) {
  const name = item.parent?.nameZh
    ? `${item.parent.nameZh} / ${item.nameZh}`
    : item.nameZh;
  return `${name} (${item.code})`;
}

export function vehicleLabel(item: VehicleOption) {
  const year =
    item.yearFrom && item.yearTo
      ? `${item.yearFrom}-${item.yearTo}`
      : item.yearFrom || item.yearTo || '';
  const name = `${item.brandZh} ${item.modelZh}${year ? ` ${year}` : ''}`.trim();
  return `${name} (${item.code})`;
}

export function extractCode(text: string) {
  const match = cellText(text).match(/\(([^()]+)\)\s*$/);
  return (match?.[1] || text).trim();
}

export function parseBoolean(value: unknown, field: string) {
  const text = cellText(value);
  if (!text) return false;
  const normalized = text.toLowerCase();
  if (['1', 'true', 'yes', 'y', '是', '真'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', '否', '假'].includes(normalized)) return false;
  throw new Error(`${field} 请从下拉中选择「是」或「否」`);
}

export function parseStatus(value: unknown) {
  const text = cellText(value);
  if (!text) return ProductStatus.DRAFT;
  if (STATUS_VALUES.has(text)) return text as ProductStatus;
  const mapped = STATUS_ALIAS[text] || STATUS_ALIAS[text.toLowerCase()];
  if (mapped) return mapped;
  throw new Error('状态请从下拉中选择：草稿 / 已发布 / 已归档');
}

export function splitList(value: unknown) {
  return cellText(value)
    .split(/[,，;；、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function optionalText(value: unknown) {
  const text = cellText(value);
  return text || undefined;
}

export function mapImportedRow(row: Record<string, unknown>) {
  const values: Partial<Record<ColumnKey, unknown>> = {};
  const vehicleParts: string[] = [];
  for (const [rawKey, value] of Object.entries(row)) {
    const key = ALIAS_TO_KEY.get(normalizeHeader(rawKey));
    if (!key) continue;
    if (key === 'vehicles') {
      vehicleParts.push(...splitList(value));
      continue;
    }
    values[key] = value;
  }
  if (vehicleParts.length) values.vehicles = vehicleParts.join(',');
  return values;
}

export function isEmptyImportedRow(
  values: Partial<Record<ColumnKey, unknown>>,
) {
  return COLUMNS.every((col) => !cellText(values[col.key]));
}

function sheetColumns(): SheetColumn[] {
  const cols: SheetColumn[] = [];
  for (const col of COLUMNS) {
    if (col.key === 'vehicles') {
      for (let i = 1; i <= VEHICLE_SLOT_COUNT; i += 1) {
        cols.push({
          key: `vehicle${i}`,
          header: `适配车型${i}`,
          required: false,
          width: 32,
          dropdown: 'vehicle',
        });
      }
      continue;
    }
    cols.push({
      key: col.key,
      header: col.header,
      required: col.required,
      width: col.key === 'category' ? 28 : Math.max(12, col.header.length * 2 + 2),
      dropdown:
        col.input === 'yesno'
          ? 'yesno'
          : col.key === 'category'
            ? 'category'
            : col.key === 'status'
              ? 'status'
              : undefined,
    });
  }
  return cols;
}

function listFormula(sheetName: string, column: string, count: number) {
  const last = Math.max(2, count + 1);
  return `='${sheetName}'!$${column}$2:$${column}$${last}`;
}

function inlineList(values: readonly string[]) {
  return `"${values.join(',')}"`;
}

function applyHeaderCell(
  cell: Cell,
  header: string,
  required: boolean,
) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_FILL },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: HEADER_FILL } },
    left: { style: 'thin', color: { argb: HEADER_FILL } },
    bottom: { style: 'thin', color: { argb: HEADER_FILL } },
    right: { style: 'thin', color: { argb: HEADER_FILL } },
  };
  if (required) {
    cell.value = {
      richText: [
        {
          text: header,
          font: { bold: true, color: { argb: HEADER_TEXT }, size: 11, name: FONT_NAME },
        },
        {
          text: '*',
          font: { bold: true, color: { argb: STAR_RED }, size: 12, name: FONT_NAME },
        },
      ],
    };
    return;
  }
  cell.value = header;
  cell.font = {
    bold: true,
    color: { argb: HEADER_TEXT },
    size: 11,
    name: FONT_NAME,
  };
}

function applyDataValidation(
  sheet: Worksheet,
  colNumber: number,
  formula: string,
  error: string,
) {
  const letter = sheet.getColumn(colNumber).letter;
  const validations = (
    sheet as Worksheet & {
      dataValidations: { add(address: string, spec: DataValidation): void };
    }
  ).dataValidations;
  validations.add(`${letter}2:${letter}${DATA_ROW_COUNT + 1}`, {
    type: 'list',
    allowBlank: true,
    formulae: [formula],
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: '请选择',
    error,
    showInputMessage: true,
    promptTitle: '请选择',
    prompt: error,
  });
}

export async function writeProductWorkbook(input: {
  rows: ProductExcelRow[];
  categories: CategoryOption[];
  vehicles: VehicleOption[];
}): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = 'Shangqi Official';
  workbook.created = new Date();

  const enabledCategories = input.categories.filter(
    (item) => item.enabled !== false,
  );
  const enabledVehicles = input.vehicles.filter(
    (item) => item.enabled !== false,
  );
  const categoryOptions = enabledCategories.map((item) => categoryLabel(item));
  const vehicleOptions = enabledVehicles.map((item) => vehicleLabel(item));

  const columns = sheetColumns();
  const productSheet = workbook.addWorksheet('产品', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  productSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  productSheet.getRow(1).height = 24;

  columns.forEach((col, index) => {
    const colNumber = index + 1;
    productSheet.getColumn(colNumber).width = col.width;
    applyHeaderCell(productSheet.getCell(1, colNumber), col.header, col.required);
    if (col.dropdown === 'category' && categoryOptions.length) {
      applyDataValidation(
        productSheet,
        colNumber,
        listFormula('分类', 'A', categoryOptions.length),
        '请从下拉列表选择分类',
      );
    }
    if (col.dropdown === 'status') {
      applyDataValidation(
        productSheet,
        colNumber,
        inlineList(STATUS_LABELS),
        '请从下拉列表选择状态',
      );
    }
    if (col.dropdown === 'yesno') {
      applyDataValidation(
        productSheet,
        colNumber,
        inlineList(YES_NO_LABELS),
        '请从下拉列表选择是或否',
      );
    }
    if (col.dropdown === 'vehicle' && vehicleOptions.length) {
      applyDataValidation(
        productSheet,
        colNumber,
        listFormula('车型', 'A', vehicleOptions.length),
        '请从下拉列表选择适配车型',
      );
    }
  });

  input.rows.forEach((row, rowIndex) => {
    const excelRow = productSheet.getRow(rowIndex + 2);
    columns.forEach((col, index) => {
      if (col.key.startsWith('vehicle')) {
        const slot = Number(String(col.key).replace('vehicle', '')) - 1;
        excelRow.getCell(index + 1).value = row.vehicleLabels?.[slot] || '';
        return;
      }
      excelRow.getCell(index + 1).value = row[col.key as ColumnKey] || '';
    });
  });

  const guide = workbook.addWorksheet('填写说明');
  ['列名', '填写方式', '是否必填', '说明'].forEach((header, index) => {
    applyHeaderCell(guide.getCell(1, index + 1), header, false);
  });
  guide.getColumn(1).width = 16;
  guide.getColumn(2).width = 14;
  guide.getColumn(3).width = 10;
  guide.getColumn(4).width = 72;
  COLUMNS.forEach((col, index) => {
    const excelRow = guide.getRow(index + 2);
    excelRow.getCell(1).value = displayHeader(col);
    excelRow.getCell(2).value =
      col.input === 'text'
        ? '手动填写'
        : col.input === 'multi-select'
          ? '下拉多选'
          : '下拉选择';
    excelRow.getCell(3).value = col.required ? '必填' : '选填';
    excelRow.getCell(4).value = col.note;
  });
  const tipRow = guide.getRow(COLUMNS.length + 3);
  tipRow.getCell(1).value = '说明';
  tipRow.getCell(4).value =
    '红色 * 为新建产品必填项。分类、状态、新品/热销/首页主推、适配车型请用单元格下拉选择，选项随后台数据实时生成。适配车型最多选 8 个，分别填在「适配车型1」到「适配车型8」。请勿修改表头。';

  const categorySheet = workbook.addWorksheet('分类');
  ['下拉选项', '分类编码', '中文名', '英文名', '上级分类'].forEach((header, index) => {
    applyHeaderCell(categorySheet.getCell(1, index + 1), header, false);
  });
  [36, 18, 18, 22, 16].forEach((width, index) => {
    categorySheet.getColumn(index + 1).width = width;
  });
  enabledCategories.forEach((item, index) => {
    const excelRow = categorySheet.getRow(index + 2);
    excelRow.getCell(1).value = categoryLabel(item);
    excelRow.getCell(2).value = item.code;
    excelRow.getCell(3).value = item.nameZh;
    excelRow.getCell(4).value = item.nameEn;
    excelRow.getCell(5).value = item.parent?.nameZh || '';
  });

  const vehicleSheet = workbook.addWorksheet('车型');
  ['下拉选项', '车型编码', '品牌', '车型', '年款', '启用'].forEach((header, index) => {
    applyHeaderCell(vehicleSheet.getCell(1, index + 1), header, false);
  });
  [36, 16, 14, 16, 14, 10].forEach((width, index) => {
    vehicleSheet.getColumn(index + 1).width = width;
  });
  enabledVehicles.forEach((item, index) => {
    const excelRow = vehicleSheet.getRow(index + 2);
    const year =
      item.yearFrom && item.yearTo
        ? `${item.yearFrom}-${item.yearTo}`
        : item.yearFrom || item.yearTo || '';
    excelRow.getCell(1).value = vehicleLabel(item);
    excelRow.getCell(2).value = item.code;
    excelRow.getCell(3).value = item.brandZh;
    excelRow.getCell(4).value = item.modelZh;
    excelRow.getCell(5).value = year;
    excelRow.getCell(6).value = item.enabled ? '是' : '否';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildCategoryIndex(categories: CategoryOption[]) {
  const byCode = new Map<string, CategoryOption>();
  const byLabel = new Map<string, CategoryOption>();
  for (const item of categories) {
    byCode.set(item.code.trim().toLowerCase(), item);
    byLabel.set(categoryLabel(item).trim().toLowerCase(), item);
    byLabel.set(item.nameZh.trim().toLowerCase(), item);
  }
  return { byCode, byLabel };
}

export function buildVehicleIndex(vehicles: VehicleOption[]) {
  const byCode = new Map<string, VehicleOption>();
  const byLabel = new Map<string, VehicleOption>();
  for (const item of vehicles) {
    byCode.set(item.code.trim().toLowerCase(), item);
    byLabel.set(vehicleLabel(item).trim().toLowerCase(), item);
  }
  return { byCode, byLabel };
}

export function resolveCategory(
  raw: string,
  index: ReturnType<typeof buildCategoryIndex>,
) {
  const text = cellText(raw);
  if (!text) return undefined;
  const code = extractCode(text).toLowerCase();
  return (
    index.byLabel.get(text.toLowerCase()) ||
    index.byCode.get(code) ||
    index.byCode.get(text.toLowerCase())
  );
}

export function resolveVehicle(
  raw: string,
  index: ReturnType<typeof buildVehicleIndex>,
) {
  const text = cellText(raw);
  if (!text) return undefined;
  const code = extractCode(text).toLowerCase();
  return (
    index.byLabel.get(text.toLowerCase()) ||
    index.byCode.get(code) ||
    index.byCode.get(text.toLowerCase())
  );
}
