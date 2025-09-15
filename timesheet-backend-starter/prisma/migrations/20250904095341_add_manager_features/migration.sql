-- CreateTable
CREATE TABLE "ManagerComment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandupSeen" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StandupSeen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagerComment_sessionId_idx" ON "ManagerComment"("sessionId");

-- CreateIndex
CREATE INDEX "ManagerComment_managerId_idx" ON "ManagerComment"("managerId");

-- CreateIndex
CREATE INDEX "StandupSeen_sessionId_idx" ON "StandupSeen"("sessionId");

-- CreateIndex
CREATE INDEX "StandupSeen_managerId_idx" ON "StandupSeen"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "StandupSeen_sessionId_managerId_key" ON "StandupSeen"("sessionId", "managerId");

-- AddForeignKey
ALTER TABLE "ManagerComment" ADD CONSTRAINT "ManagerComment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StandupSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerComment" ADD CONSTRAINT "ManagerComment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandupSeen" ADD CONSTRAINT "StandupSeen_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StandupSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandupSeen" ADD CONSTRAINT "StandupSeen_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
