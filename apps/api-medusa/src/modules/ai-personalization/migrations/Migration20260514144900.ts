import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260514144900 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ai_profile" add column if not exists "gender" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ai_profile" drop column if exists "gender";`);
  }

}
