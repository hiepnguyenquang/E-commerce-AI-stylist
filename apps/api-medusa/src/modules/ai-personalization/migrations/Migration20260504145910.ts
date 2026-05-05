import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260504145910 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ai_profile" ("id" text not null, "customer_id" text not null, "height" numeric null, "weight" numeric null, "base_body_image_url" text null, "raw_height" jsonb null, "raw_weight" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_profile_deleted_at" ON "ai_profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "user_closet_item" ("id" text not null, "customer_id" text not null, "image_url" text not null, "category" text not null, "metadata" jsonb null, "vector_status" text not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "user_closet_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_user_closet_item_deleted_at" ON "user_closet_item" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ai_profile" cascade;`);

    this.addSql(`drop table if exists "user_closet_item" cascade;`);
  }

}
