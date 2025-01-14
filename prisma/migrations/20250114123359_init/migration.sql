-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "telegram_user_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "telegram_name" TEXT,
    "password" TEXT NOT NULL,
    "is_activated" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JWT_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "deletion_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JWT_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "activation_code" TEXT NOT NULL,
    "deletion_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_free" BOOLEAN NOT NULL,
    "subscription_status" BOOLEAN NOT NULL,
    "is_warning_sent" BOOLEAN NOT NULL,
    "subscription_start" TIMESTAMP(3) NOT NULL,
    "subscription_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_subscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_last_free_sub" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "free_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_statictic" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total_day_subscription" INTEGER NOT NULL,
    "total_day_free_subscription" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,

    CONSTRAINT "subscription_statictic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message_id" INTEGER NOT NULL,
    "processed" BOOLEAN,
    "subscription_period" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vpn_keys" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "key_id" INTEGER NOT NULL,
    "region_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vpn_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region" (
    "id" SERIAL NOT NULL,
    "region_name" TEXT NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol" (
    "id" SERIAL NOT NULL,
    "protocol_name" TEXT NOT NULL,

    CONSTRAINT "protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_system" (
    "id" SERIAL NOT NULL,
    "OS_name" TEXT NOT NULL,

    CONSTRAINT "operating_system_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_statistic" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "region_id" INTEGER NOT NULL,
    "traffic" INTEGER NOT NULL,
    "time_connection" INTEGER NOT NULL,
    "vpn_key_id" INTEGER NOT NULL,
    "os_id" INTEGER NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_statistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_user" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code_in_id" INTEGER NOT NULL,
    "code_out_id" INTEGER NOT NULL,

    CONSTRAINT "referral_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promocodes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code_id" INTEGER NOT NULL,
    "apply_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_promocodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_user_id_key" ON "user"("telegram_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_name_key" ON "user"("telegram_name");

-- CreateIndex
CREATE UNIQUE INDEX "JWT_tokens_refresh_token_key" ON "JWT_tokens"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_user_id_key" ON "activation_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_activation_code_key" ON "activation_codes"("activation_code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_user_id_key" ON "subscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "free_subscription_user_id_key" ON "free_subscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_statictic_user_id_key" ON "subscription_statictic"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_id_key" ON "payments"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "region_region_name_key" ON "region"("region_name");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_user_user_id_key" ON "referral_user"("user_id");

-- AddForeignKey
ALTER TABLE "JWT_tokens" ADD CONSTRAINT "JWT_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_subscription" ADD CONSTRAINT "free_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_statictic" ADD CONSTRAINT "subscription_statictic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_keys" ADD CONSTRAINT "vpn_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_keys" ADD CONSTRAINT "vpn_keys_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_keys" ADD CONSTRAINT "vpn_keys_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_vpn_key_id_fkey" FOREIGN KEY ("vpn_key_id") REFERENCES "vpn_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "operating_system"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_user" ADD CONSTRAINT "referral_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_user" ADD CONSTRAINT "referral_user_code_in_id_fkey" FOREIGN KEY ("code_in_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_user" ADD CONSTRAINT "referral_user_code_out_id_fkey" FOREIGN KEY ("code_out_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promocodes" ADD CONSTRAINT "user_promocodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promocodes" ADD CONSTRAINT "user_promocodes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
