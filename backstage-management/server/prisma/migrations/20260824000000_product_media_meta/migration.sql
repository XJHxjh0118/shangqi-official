-- AlterTable
ALTER TABLE "products" ADD COLUMN "cover_name" TEXT;
ALTER TABLE "products" ADD COLUMN "promo_video_name" TEXT;
ALTER TABLE "products" ADD COLUMN "install_video_name" TEXT;

-- AlterTable
ALTER TABLE "product_assets" ADD COLUMN "size" INTEGER;
