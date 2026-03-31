import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { createPost } from "@/lib/actions";
import { toast } from "sonner";

interface CreatePostInput {
  content: string;
  link: string | null;
  media_type?: string | null;
}

export default function useCreatePost() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, link, media_type }: CreatePostInput) => {
      if (!user) throw new Error("User not authenticated");

      return await createPost({
        content: content.trim(),
        link: link?.trim() || null,
        media_type: media_type || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["post-count", user?.id] });
      toast.success("Post created successfully! 🚀");
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    },
  });
}
