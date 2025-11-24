import { useQuery } from "@tanstack/vue-query";
import { axiosInstance } from "@/lib/axios";

export const useGetAllRoom = (
    accessToken: string,
) => {
    return useQuery<GetAllRoomResponse>({
        queryKey: ["get-all-room", accessToken],
        queryFn: async () => {
            const response = await axiosInstance.get<GetAllRoomResponse>(
                "/rooms",
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        },
        enabled: !!accessToken,
        refetchOnWindowFocus: false,
        retry: false,
    });
};
