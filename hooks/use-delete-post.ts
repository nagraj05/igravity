import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost } from "@/lib/actions";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function useDeletePost() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("User not authenticated");
      return await deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["post-count", user?.id] });
      toast.success("Post deleted successfully! 🗑️");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post. Please try again.");
    },
  });
}
