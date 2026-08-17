import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable(
  "hospitality_businesses",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ownerClerkId: text("owner_clerk_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("hospitality_businesses_slug_idx").on(table.slug)],
);

export const branchesTable = pgTable(
  "hospitality_branches",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("hospitality_branches_business_idx").on(table.businessId)],
);

export const tablesTable = pgTable(
  "hospitality_tables",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branchesTable.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    area: text("area").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("hospitality_tables_branch_code_idx").on(
      table.branchId,
      table.code,
    ),
    index("hospitality_tables_business_idx").on(table.businessId),
  ],
);

export const servicesTable = pgTable(
  "hospitality_services",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("concierge-bell"),
    department: text("department").notNull().default("Waiters"),
    priority: text("priority").notNull().default("NORMAL"),
    active: boolean("active").notNull().default(true),
  },
  (table) => [index("hospitality_services_business_idx").on(table.businessId)],
);

export const staffProfilesTable = pgTable(
  "hospitality_staff_profiles",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    department: text("department").notNull(),
    status: text("status").notNull().default("AVAILABLE"),
  },
  (table) => [index("hospitality_staff_business_idx").on(table.businessId)],
);

export const serviceRequestsTable = pgTable(
  "hospitality_service_requests",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branchesTable.id, { onDelete: "cascade" }),
    tableId: integer("table_id")
      .notNull()
      .references(() => tablesTable.id, { onDelete: "cascade" }),
    serviceId: integer("service_id")
      .notNull()
      .references(() => servicesTable.id, { onDelete: "cascade" }),
    trackingToken: text("tracking_token")
      .notNull()
      .default(sql`gen_random_uuid()::text`),
    priority: text("priority").notNull(),
    status: text("status").notNull().default("REQUESTED"),
    note: text("note"),
    assignedTo: text("assigned_to"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("hospitality_requests_tracking_idx").on(table.trackingToken),
    index("hospitality_requests_business_status_idx").on(
      table.businessId,
      table.status,
    ),
    index("hospitality_requests_table_created_idx").on(
      table.tableId,
      table.createdAt,
    ),
  ],
);

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  id: true,
  createdAt: true,
});
export const insertBranchSchema = createInsertSchema(branchesTable).omit({
  id: true,
  createdAt: true,
});
export const insertTableSchema = createInsertSchema(tablesTable).omit({
  id: true,
  createdAt: true,
});
export const insertServiceSchema = createInsertSchema(servicesTable).omit({
  id: true,
});
export const insertStaffProfileSchema = createInsertSchema(
  staffProfilesTable,
).omit({ id: true });
export const insertServiceRequestSchema = createInsertSchema(
  serviceRequestsTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type Business = z.infer<typeof insertBusinessSchema>;
export type Branch = z.infer<typeof insertBranchSchema>;
export type HospitalityTable = typeof tablesTable.$inferSelect;
export type Service = typeof servicesTable.$inferSelect;
export type StaffProfile = typeof staffProfilesTable.$inferSelect;
export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;