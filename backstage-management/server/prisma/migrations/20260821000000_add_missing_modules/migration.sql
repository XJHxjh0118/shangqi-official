-- AlterTable
ALTER TABLE "users" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "products" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "banners" ADD COLUMN "start_at" DATETIME;
ALTER TABLE "banners" ADD COLUMN "end_at" DATETIME;

-- CreateTable
CREATE TABLE "vehicles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "brand_zh" TEXT NOT NULL,
    "brand_en" TEXT NOT NULL,
    "model_zh" TEXT NOT NULL,
    "model_en" TEXT NOT NULL,
    "year_from" INTEGER,
    "year_to" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_vehicles" (
    "product_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    PRIMARY KEY ("product_id", "vehicle_id"),
    CONSTRAINT "product_vehicles_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page_seos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "page_key" TEXT NOT NULL,
    "title_zh" TEXT,
    "title_en" TEXT,
    "keywords_zh" TEXT,
    "keywords_en" TEXT,
    "description_zh" TEXT,
    "description_en" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "title_zh" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "body_zh" TEXT,
    "body_en" TEXT,
    "icon_url" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "title" TEXT,
    "created_by_id" INTEGER,
    "product_ids" TEXT NOT NULL,
    "expires_at" DATETIME,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "share_links_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "username" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "status_code" INTEGER,
    "detail" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_code_key" ON "vehicles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "page_seos_page_key_key" ON "page_seos"("page_key");

-- CreateIndex
CREATE UNIQUE INDEX "service_items_code_key" ON "service_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_created_by_id_idx" ON "share_links"("created_by_id");

-- CreateIndex
CREATE INDEX "operation_logs_created_at_idx" ON "operation_logs"("created_at");

-- CreateIndex
CREATE INDEX "operation_logs_username_idx" ON "operation_logs"("username");
