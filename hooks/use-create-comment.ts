import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "@/lib/actions";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface CreateCommentData {
  postId: string;
  parentId?: string | null;
  content: string;
}

export default function useCreateComment() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, parentId, content }: CreateCommentData) => {
      if (!user) throw new Error("Unauthorized");

      return await createComment({
        postId,
        parentId: parentId || null,
        content,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      toast.success("Comment posted!");
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
      toast.error("Failed to post comment");
    },
  });
}
