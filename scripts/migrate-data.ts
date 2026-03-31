import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { put } from "@vercel/blob";
import * as dotenv from "dotenv";
import * as schema from "../lib/db/schema";
import { profiles, posts, comments } from "../lib/db/schema";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

if (!supabaseUrl || !supabaseServiceRoleKey || !databaseUrl) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function migrate() {
  console.log("🚀 Starting migration...");

  // 1. Migrate Profiles
  console.log("👥 Migrating profiles...");
  const { data: supabaseProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*");

  if (profilesError) throw profilesError;

  for (const profile of supabaseProfiles) {
    await db.insert(profiles).values({
      id: profile.id, // Keep the same serial ID if possible
      clerk_user_id: profile.clerk_user_id,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      image_url: profile.image_url,
      email: profile.email,
      bio: profile.bio,
      created_at: new Date(profile.created_at),
    }).onConflictDoNothing();
  }
  console.log(`✅ Migrated ${supabaseProfiles.length} profiles.`);

  // 2. Migrate Posts
  console.log("📝 Migrating posts and attachments...");
  const { data: supabasePosts, error: postsError } = await supabase
    .from("posts")
    .select("*");

  if (postsError) throw postsError;

  for (const post of supabasePosts) {
    let finalLink = post.link;

    // Check if it's a Supabase storage link
    if (post.link && post.link.includes("supabase.co") && post.media_type) {
      console.log(`🖼️ Migrating image for post ${post.id}...`);
      try {
        // Download from Supabase
        const response = await fetch(post.link);
        const buffer = await response.arrayBuffer();
        
        // Upload to Vercel Blob
        const fileName = post.link.split("/").pop() || "attachment";
        const blob = await put(fileName, buffer, {
          access: "public",
        });

        finalLink = blob.url;
        console.log(`✅ Image migrated to: ${finalLink}`);
      } catch (e) {
        console.error(`❌ Failed to migrate image for post ${post.id}:`, e);
      }
    }

    await db.insert(posts).values({
      id: post.id,
      user_id: post.user_id,
      clerk_user_id: post.clerk_user_id,
      content: post.content,
      link: finalLink,
      media_type: post.media_type,
      created_at: new Date(post.created_at),
    }).onConflictDoNothing();
  }
  console.log(`✅ Migrated ${supabasePosts.length} posts.`);

  // 3. Migrate Comments
  console.log("💬 Migrating comments...");
  const { data: supabaseComments, error: commentsError } = await supabase
    .from("comments")
    .select("*");

  if (commentsError) throw commentsError;

  for (const comment of supabaseComments) {
    await db.insert(comments).values({
      id: comment.id,
      post_id: comment.post_id,
      parent_id: comment.parent_id,
      clerk_user_id: comment.clerk_user_id,
      content: comment.content,
      created_at: new Date(comment.created_at),
    }).onConflictDoNothing();
  }
  console.log(`✅ Migrated ${supabaseComments.length} comments.`);

  console.log("🎉 Migration completed successfully!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
