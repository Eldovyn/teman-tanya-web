import { axiosInstance } from '@/lib/axios';

export const userService = {
    async getUserMe(accessToken: string, etag?: string) {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        };
        if (etag) {
            headers["If-None-Match"] = etag;
        }

        const response = await axiosInstance.get("/users/@me", {
            headers,
            validateStatus: () => true,
        });

        return { response: response, data: response.data };
    },
};
