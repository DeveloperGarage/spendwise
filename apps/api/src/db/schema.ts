import {
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("users_email_idx").on(table.email)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const groups = pgTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("INR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const groupInvites = pgTable(
  "group_invites",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("group_invites_group_id_idx").on(table.groupId),
    uniqueIndex("group_invites_token_idx").on(table.token),
  ],
);

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  note: text("note").notNull().default(""),
  occurredOn: date("occurred_on").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  grossPaise: integer("gross_paise").notNull(),
  currency: text("currency").notNull().default("INR"),
  splitMode: text("split_mode").notNull(),
  version: integer("version").notNull().default(1),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenseFundingLines = pgTable("expense_funding_lines", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id),
  memberId: text("member_id")
    .notNull()
    .references(() => users.id),
  amountPaise: integer("amount_paise").notNull(),
  accountId: text("account_id"),
});

export const expenseAllocationLines = pgTable("expense_allocation_lines", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id),
  memberId: text("member_id")
    .notNull()
    .references(() => users.id),
  amountPaise: integer("amount_paise").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
});

export const settlements = pgTable("settlements", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  fromMemberId: text("from_member_id")
    .notNull()
    .references(() => users.id),
  toMemberId: text("to_member_id")
    .notNull()
    .references(() => users.id),
  amountPaise: integer("amount_paise").notNull(),
  occurredOn: date("occurred_on").notNull(),
  note: text("note").notNull().default(""),
  version: integer("version").notNull().default(1),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  accountId: text("account_id"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activity = pgTable("activity", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  actorId: text("actor_id")
    .notNull()
    .references(() => users.id),
  kind: text("kind").notNull(),
  action: text("action").notNull(),
  subjectId: text("subject_id").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
