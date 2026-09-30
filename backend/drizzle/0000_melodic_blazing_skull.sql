CREATE TYPE "public"."category" AS ENUM('berat', 'minuman', 'cemilan', 'sehat');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('Menunggu', 'Sedang Dibuat', 'Selesai');--> statement-breakpoint
CREATE TYPE "public"."owner_type" AS ENUM('student', 'seller');--> statement-breakpoint
CREATE TYPE "public"."transaction_kind" AS ENUM('topup', 'order', 'earning', 'withdrawal');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('Menunggu', 'Berhasil', 'Gagal');--> statement-breakpoint
CREATE TABLE "categories" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"category" "category" DEFAULT 'berat' NOT NULL,
	"image" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" integer,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"student_name" text NOT NULL,
	"student_kelas" text DEFAULT '-' NOT NULL,
	"vendor_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'Menunggu' NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"store_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"kelas" text DEFAULT '-' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"order_id" text,
	"amount" integer NOT NULL,
	"kind" "transaction_kind" NOT NULL,
	"status" "transaction_status" DEFAULT 'Menunggu' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"qris_payload" text,
	"expires_at" timestamp with time zone,
	"bank" text,
	"account_name" text,
	"account_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer,
	"name" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"time" text DEFAULT '10-15 Menit' NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_type" "owner_type" NOT NULL,
	"owner_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_items_vendor_idx" ON "menu_items" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_student_idx" ON "orders" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "orders_vendor_idx" ON "orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sellers_email_uq" ON "sellers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "students_email_uq" ON "students" USING btree ("email");--> statement-breakpoint
CREATE INDEX "transactions_wallet_idx" ON "transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_seller_uq" ON "vendors" USING btree ("seller_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_owner_uq" ON "wallets" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "wallets_owner_idx" ON "wallets" USING btree ("owner_type","owner_id");