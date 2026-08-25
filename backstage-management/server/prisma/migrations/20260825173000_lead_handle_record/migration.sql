-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN "handle_method" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN "handle_result" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN "handle_remark" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN "handled_by" TEXT;
ALTER TABLE "contact_messages" ADD COLUMN "handled_by_id" INTEGER;
ALTER TABLE "contact_messages" ADD COLUMN "handled_at" DATETIME;

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN "handle_method" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "handle_result" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "handle_remark" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "handled_by" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "handled_by_id" INTEGER;
ALTER TABLE "inquiries" ADD COLUMN "handled_at" DATETIME;
