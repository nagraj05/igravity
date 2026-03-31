import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/actions";

export interface UserProfile {
  clerk_user_id: string;
  username: string;
  image_url: string;
}

export default function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["search-users", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const data = await searchUsers(query);
      return data as UserProfile[];
    },
    enabled: query.length >= 2,
  });
}
