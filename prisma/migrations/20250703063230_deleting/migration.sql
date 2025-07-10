-- DropForeignKey
ALTER TABLE "SymptomLog" DROP CONSTRAINT "SymptomLog_userId_fkey";

-- AddForeignKey
ALTER TABLE "SymptomLog" ADD CONSTRAINT "SymptomLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
