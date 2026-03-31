import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/actions";

export interface Profile {
  clerk_user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  image_url: string;
  bio: string | null;
  created_at: Date;
}

export function useFetchProfile(identifier: string, isUsername = false) {
  return useQuery({
    queryKey: ["profile", identifier],
    queryFn: async () => {
      if (!identifier) return null;
      const data = await getProfile(identifier, isUsername);
      return data as unknown as Profile;
    },
    enabled: !!identifier,
  });
}
