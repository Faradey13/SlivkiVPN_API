-- CreateTable
CREATE TABLE "user_protocol" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "protocol_id" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_protocol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_protocol_user_id_key" ON "user_protocol"("user_id");
