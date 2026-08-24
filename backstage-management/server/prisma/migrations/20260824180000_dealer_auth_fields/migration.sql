-- AlterTable
ALTER TABLE "users" ADD COLUMN "regional_manager" TEXT;

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "verification_codes_account_purpose_idx" ON "verification_codes"("account", "purpose");
