"use server";

import { db } from "./db";
import { profiles, posts, comments } from "./db/schema";
import { eq, desc, asc, count, ne } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- Profiles ---

export async function upsertProfile() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) throw new Error("Unauthorized");

  const [profile] = await db
    .insert(profiles)
    .values({
      clerk_user_id: userId,
      username: user.username || `${user.firstName}${user.lastName}`,
      first_name: user.firstName,
      last_name: user.lastName,
      image_url: user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress,
    })
    .onConflictDoUpdate({
      target: profiles.clerk_user_id,
      set: {
        username: user.username || `${user.firstName}${user.lastName}`,
        first_name: user.firstName,
        last_name: user.lastName,
        image_url: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress,
      },
    })
    .returning();

  return profile;
}

export async function getProfile(identifier: string, isUsername = false) {
  if (isUsername) {
    const cleanUsername = decodeURIComponent(identifier).replace(/^@/, "");
    return await db.query.profiles.findFirst({
      where: eq(profiles.username, cleanUsername),
    });
  }

  return await db.query.profiles.findFirst({
    where: eq(profiles.clerk_user_id, identifier),
  });
}

export async function getRandomProfiles(excludeUserId?: string) {
  const result = await db.query.profiles.findMany({
    where: excludeUserId ? ne(profiles.clerk_user_id, excludeUserId) : undefined,
  });
  
  // Sort randomly and take 3
  return result.sort(() => Math.random() - 0.5).slice(0, 3);
}

// --- Posts ---

export async function getPosts() {
  return await db.query.posts.findMany({
    with: {
      user: true,
    },
    orderBy: [desc(posts.created_at)],
  });
}

export async function getUserPosts(userId: string) {
  return await db.query.posts.findMany({
    where: eq(posts.clerk_user_id, userId),
    with: {
      user: true,
    },
    orderBy: [desc(posts.created_at)],
  });
}

export async function getPostDetail(postId: string) {
  return await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      user: true,
    },
  });
}

export async function getPostCount(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.clerk_user_id, userId));
  return result.count;
}

export async function createPost(data: {
  content: string;
  link?: string | null;
  media_type?: string | null;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Ensure profile exists
  const profile = await upsertProfile();

  const [post] = await db
    .insert(posts)
    .values({
      user_id: profile.id,
      clerk_user_id: userId,
      content: data.content,
      link: data.link,
      media_type: data.media_type,
    })
    .returning();

  revalidatePath("/");
  return post;
}

export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(posts)
    .where(eq(posts.id, postId));

  revalidatePath("/");
}

// --- Comments ---

export async function getComments(postId: string) {
  return await db.query.comments.findMany({
    where: eq(comments.post_id, postId),
    with: {
      post: true,
      user: true,
    },
    orderBy: [asc(comments.created_at)],
  });
}

export async function createComment(data: {
  postId: string;
  parentId?: string | null;
  content: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [comment] = await db
    .insert(comments)
    .values({
      post_id: data.postId,
      parent_id: data.parentId,
      clerk_user_id: userId,
      content: data.content,
    })
    .returning();

  return comment;
}

export async function deleteComment(commentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(comments).where(eq(comments.id, commentId));
}

// --- Search ---

export async function searchUsers(query: string) {
  // Simple search for now, can be improved with ILIKE
  return await db.query.profiles.findMany({
    where: (profiles, { or, ilike }) => 
      or(
        ilike(profiles.username, `%${query}%`),
        ilike(profiles.first_name, `%${query}%`),
        ilike(profiles.last_name, `%${query}%`)
      ),
    limit: 10,
  });
}
