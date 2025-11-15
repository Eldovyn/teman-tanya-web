<script setup lang="ts">
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"
import Separator from "./ui/separator/Separator.vue";
import { BxSolidExit } from 'vue-icons-lib/bx'
import { BxSolidChat } from 'vue-icons-lib/bx'
import { useCookies } from "@/composables/useCookies";
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { io } from "socket.io-client";
import { useGetAllRoom } from "@/services/room/useGetAllRoom";

const roomChat = ref<RoomChat[]>([]);

const cookies = useCookies();
const accessToken = cookies.get("access_token") || "";

const { data: dataAllRoom } = useGetAllRoom(accessToken);

watch(
    () => dataAllRoom.value,
    (val) => {
        roomChat.value = val?.data || [];
        console.log("dataAllRoom updated:", val?.data);
    },
    { immediate: true }
);

const router = useRoute();

const initialRoom = router.query.room || "";

const socket = io(`${import.meta.env.VITE_API_URL}/chat-bot`, {
    path: "/socket.io",
    autoConnect: true,
    auth: {
        token: accessToken,
        room: initialRoom,
    },
});
if (!socket) {
    throw new Error('Socket not provided');
}

onMounted(() => {
    socket.on('connect', () => {
        console.log('socket connected (setup)');
    });
    socket.on('rooms_updated', (data: RoomChat) => {
        roomChat.value = [data];
    });
});

onBeforeUnmount(() => {
    socket.off('connect');
    socket.off('validation');
});

const items = [
    {
        title: "New Chat",
        url: "/",
        icon: BxSolidChat,
    },
];
</script>

<template>
    <Sidebar>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Teman Tanya</SidebarGroupLabel>
                <Separator />
                <SidebarGroupContent class="pt-5 pb-5">
                    <SidebarMenu>
                        <SidebarMenuItem v-for="item in items" :key="item.title">
                            <SidebarMenuButton asChild>
                                <a :href="item.url" class="flex gap-5">
                                    <component :is="item.icon" />
                                    <span>{{ item.title }}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
                <Separator />
                <SidebarGroupContent class="pt-5 pb-5">
                    <SidebarMenu>
                        <SidebarMenuItem v-for="item in roomChat" :key="item.title">
                            <SidebarMenuButton asChild>
                                <a :href="`?room=${item.title}`" class="flex gap-5">
                                    <span>{{ item.title }}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
            <div class="flex gap-5 cursor-pointer">
                <BxSolidExit class="w-6 h-6" />
                Sign Out
            </div>
        </SidebarFooter>
    </Sidebar>
</template>