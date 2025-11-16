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
import { BxSolidExit, BxSolidChat } from 'vue-icons-lib/bx'
import { useCookies } from "@/composables/useCookies";
import { ref, watch } from "vue";
import { useGetAllRoom } from "@/services/room/useGetAllRoom";
import { useRouter } from "vue-router";

const router = useRouter();

const roomChat = ref<RoomChat[]>([]);

const cookies = useCookies();
const accessToken = cookies.get("access_token") || "";

const { data: dataAllRoom } = useGetAllRoom(accessToken);

watch(
    () => dataAllRoom.value,
    (val) => {
        roomChat.value = val?.data || [];
    },
    { immediate: true }
);

const onLogout = () => {
    cookies.remove("access_token");
    cookies.remove("me-data");
    cookies.remove("me-etag");
    router.push("/login");
};


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
                        <SidebarGroupLabel>Room Chat</SidebarGroupLabel>
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
            <div class="flex gap-5 cursor-pointer" @click="onLogout">
                <BxSolidExit class="w-6 h-6" />
                Sign Out
            </div>
        </SidebarFooter>
    </Sidebar>
</template>