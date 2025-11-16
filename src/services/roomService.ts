import { axiosInstance } from '@/lib/axios';

export const RoomService = {
    async deleteAllRoom(accessToken: string) {
        const response = await axiosInstance.delete(`/rooms`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return { response: response, data: response.data };
    },
};
