-- AlterTable
ALTER TABLE "ManagerComment" ADD COLUMN     "responseId" TEXT;

-- CreateIndex
CREATE INDEX "ManagerComment_responseId_idx" ON "ManagerComment"("responseId");

-- AddForeignKey
ALTER TABLE "ManagerComment" ADD CONSTRAINT "ManagerComment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "StandupResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
