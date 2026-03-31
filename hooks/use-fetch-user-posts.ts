import { useQuery } from "@tanstack/react-query";
import { getUserPosts } from "@/lib/actions";

interface Post {
  id: string;
  clerk_user_id: string;
  content: string;
  link: string | null;
  media_type: string | null;
  created_at: Date;
  profiles: {
    username: string;
    first_name: string;
    last_name: string;
    image_url: string;
  } | null;
}

export default function useFetchUserPosts(userId?: string) {
  return useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const data = await getUserPosts(userId);
      
      return data.map((post) => ({
        ...post,
        profiles: post.user ? {
          username: post.user.username || "",
          first_name: post.user.first_name || "",
          last_name: post.user.last_name || "",
          image_url: post.user.image_url || "",
        } : null
      })) as unknown as Post[];
    },
    enabled: !!userId,
  });
}
