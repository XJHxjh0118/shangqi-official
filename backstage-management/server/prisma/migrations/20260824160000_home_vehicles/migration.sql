-- CreateTable
CREATE TABLE "home_vehicles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicle_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "home_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "home_vehicles_vehicle_id_key" ON "home_vehicles"("vehicle_id");

-- CreateIndex
CREATE INDEX "home_vehicles_enabled_sort_idx" ON "home_vehicles"("enabled", "sort");
