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

const items = [
    {
        title: "New Chat",
        url: "#",
        icon: BxSolidChat,
    },
];

const roomChat = [
    {
        title: "Room Chat",
        url: "#",
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
                                <a :href="item.url" class="flex gap-5">
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