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
import { BxSolidExit, BxSolidChat, BxRegularUserCircle } from 'vue-icons-lib/bx'
import { useCookies } from "@/composables/useCookies";
import { ref, watch } from "vue";
import { useGetAllRoom } from "@/services/room/useGetAllRoom";
import { useRouter } from "vue-router";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import Label from "./ui/label/Label.vue";

const router = useRouter();

const roomChat = ref<RoomChat[]>([]);

const cookies = useCookies();
const accessToken = cookies.get("access_token") || "";

const userMe = cookies.get("me-data");

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
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger class="min-w-[30ch] max-w-[30ch] truncate">
                                                {{ item.title }}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{{ item.title }}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
        <Separator class="w-[95%]! mx-auto" />
        <SidebarFooter>
            <DropdownMenu>
                <DropdownMenuTrigger class="flex flex-row gap-5 cursor-pointer">
                    <Avatar>
                        <AvatarImage :src="userMe?.data?.avatar" />
                    </Avatar>
                    <div class="flex flex-col justify-end!">
                        <p class="text-sm text-start font-semibold">{{ userMe?.data?.username }}</p>
                        <p class="text-xs text-muted-foreground">
                            {{ userMe?.data?.email }}
                        </p>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="translate-y-[-3%] shadow-none w-[220px]! min-w-0!">
                    <Dialog>
                        <DropdownMenuItem @select.prevent>
                            <DialogTrigger as-child>
                                <button class="flex gap-2 items-center cursor-pointer" type="button">
                                    <BxRegularUserCircle class="w-4 h-4 me-2" />
                                    <span>Account</span>
                                </button>
                            </DialogTrigger>
                        </DropdownMenuItem>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Account Information</DialogTitle>
                            </DialogHeader>
                            <Separator />
                            <div class="flex flex-col gap-5">
                                <div class="flex flex-col gap-2">
                                    <Label>Username</Label>
                                    <div class="flex flex-row gap-2 items-center border rounded-md p-2">
                                        {{ userMe?.data?.username }}
                                    </div>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <Label>Email</Label>
                                    <div class="flex flex-row gap-2 items-center border rounded-md p-2">
                                        {{ userMe?.data?.email }}
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <DropdownMenuItem @click="onLogout" class="cursor-pointer">
                        <BxSolidExit class="w-4 h-4 me-2" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
    </Sidebar>
</template>