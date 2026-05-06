import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260505043948 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "stylist_session" ("id" text not null, "customer_id" text not null, "prompt" text not null, "reasoning" text null, "status" text not null default 'processing', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stylist_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stylist_session_deleted_at" ON "stylist_session" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "stylist_session_item" ("id" text not null, "session_id" text not null, "product_id" text not null, "replaces_item_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stylist_session_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stylist_session_item_session_id" ON "stylist_session_item" ("session_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stylist_session_item_deleted_at" ON "stylist_session_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "stylist_session_item" add constraint "stylist_session_item_session_id_foreign" foreign key ("session_id") references "stylist_session" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "stylist_session_item" drop constraint if exists "stylist_session_item_session_id_foreign";`);

    this.addSql(`drop table if exists "stylist_session" cascade;`);

    this.addSql(`drop table if exists "stylist_session_item" cascade;`);
  }

}
