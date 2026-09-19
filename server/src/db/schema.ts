import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const tripsTable = pgTable("trips", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  creatorId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  destination: varchar({ length: 255 }),
  imageUrl: text(),
  isActive: boolean().default(true).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const tripDaysTable = pgTable("trip_days", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tripId: integer()
    .notNull()
    .references(() => tripsTable.id, { onDelete: "cascade" }),
  day: date().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const userDaySelectionsTable = pgTable(
  "user_day_selections",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => usersTable.id, { onDelete: "cascade" }),
    guestName: varchar({ length: 255 }),
    tripDayId: integer()
      .notNull()
      .references(() => tripDaysTable.id, { onDelete: "cascade" }),
    notes: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    // One selection per person per day (NULLs are distinct in Postgres)
    uniqueIndex("user_day_selections_user_day_unique").on(
      table.tripDayId,
      table.userId,
    ),
    uniqueIndex("user_day_selections_guest_day_unique").on(
      table.tripDayId,
      table.guestName,
    ),
  ],
);
