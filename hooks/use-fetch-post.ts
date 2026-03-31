import { useQuery } from "@tanstack/react-query";
import { getPostDetail } from "@/lib/actions";

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

export default function useFetchPost(postId: string | undefined) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      if (!postId) return null;
      const post = await getPostDetail(postId);

      if (!post) return null;

      return {
        ...post,
        profiles: post.user ? {
          username: post.user.username || "",
          first_name: post.user.first_name || "",
          last_name: post.user.last_name || "",
          image_url: post.user.image_url || "",
        } : null
      } as unknown as Post;
    },
    enabled: !!postId,
  });
}
