import { useQuery } from "@tanstack/react-query";
import { getComments } from "@/lib/actions";

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  clerk_user_id: string;
  content: string;
  created_at: Date;
  profiles: {
    username: string;
    first_name: string;
    last_name: string;
    image_url: string;
  } | null;
}

export default function useFetchComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const data = await getComments(postId);
      
      return data.map((comment) => ({
        ...comment,
        profiles: comment.user ? {
          username: comment.user.username || "",
          first_name: comment.user.first_name || "",
          last_name: comment.user.last_name || "",
          image_url: comment.user.image_url || "",
        } : null
      })) as unknown as Comment[];
    },
    enabled: !!postId,
  });
}
