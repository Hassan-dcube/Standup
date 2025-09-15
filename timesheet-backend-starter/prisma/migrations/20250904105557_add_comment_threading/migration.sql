-- AlterTable
ALTER TABLE "ManagerComment" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "ManagerComment_parentId_idx" ON "ManagerComment"("parentId");

-- AddForeignKey
ALTER TABLE "ManagerComment" ADD CONSTRAINT "ManagerComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ManagerComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
