import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment } from "@/lib/actions";
import { toast } from "sonner";

export default function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId,
    }: {
      commentId: string;
      postId: string;
    }) => {
      await deleteComment(commentId);
      return { commentId, postId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.postId] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    },
  });
}
