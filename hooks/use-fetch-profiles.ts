import { useQuery } from "@tanstack/react-query";
import { getRandomProfiles } from "@/lib/actions";
import { useUser } from "@clerk/nextjs";

export interface Profiles {
  clerk_user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  image_url: string;
  bio: string | null;
  created_at: Date;
}

export function useFetchProfiles() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["profiles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const data = await getRandomProfiles(user?.id);
      return data as unknown as Profiles[];
    },
  });
}
