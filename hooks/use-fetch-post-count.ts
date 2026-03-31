import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { getPostCount } from "@/lib/actions";

export default function useFetchPostCount() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["post-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return await getPostCount(user.id);
    },
    enabled: !!user?.id,
  });
}
