import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerk_user_id: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  first_name: varchar("first_name", { length: 255 }),
  last_name: varchar("last_name", { length: 255 }),
  image_url: text("image_url"),
  email: varchar("email", { length: 255 }),
  bio: text("bio"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => profiles.id, {
    onDelete: "cascade",
  }),
  clerk_user_id: varchar("clerk_user_id", { length: 255 }),
  content: text("content").notNull(),
  link: text("link"),
  media_type: varchar("media_type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  post_id: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  parent_id: uuid("parent_id"), // For threaded comments
  clerk_user_id: varchar("clerk_user_id", { length: 255 })
    .notNull()
    .references(() => profiles.clerk_user_id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(profiles, {
    fields: [posts.user_id],
    references: [profiles.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.post_id],
    references: [posts.id],
  }),
  user: one(profiles, {
    fields: [comments.clerk_user_id],
    references: [profiles.clerk_user_id],
  }),
  parent: one(comments, {
    fields: [comments.parent_id],
    references: [comments.id],
    relationName: "thread",
  }),
  replies: many(comments, {
    relationName: "thread",
  }),
}));
