/*
  Warnings:

  - A unique constraint covering the columns `[name,orgId,department]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Teacher_name_orgId_department_key" ON "Teacher"("name", "orgId", "department");
