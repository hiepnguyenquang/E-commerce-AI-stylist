import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260506143808 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vton_job" ("id" text not null, "customer_id" text not null, "parent_job_id" text null, "step" text null, "status" text not null default 'pending', "result_image_url" text null, "error_message" text null, "retry_count" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vton_job_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vton_job_deleted_at" ON "vton_job" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vton_job" cascade;`);
  }

}
