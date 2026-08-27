-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN "user_id" INTEGER;

-- CreateIndex
CREATE INDEX "inquiries_user_id_idx" ON "inquiries"("user_id");
