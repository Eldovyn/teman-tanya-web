<script setup lang="ts">
import Textarea from '@/components/ui/textarea/Textarea.vue';
import { io } from "socket.io-client";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import Button from '@/components/ui/button/Button.vue';
import { VueMarkdown } from "@crazydos/vue-markdown";
import remarkGfm from "remark-gfm";

const socket = io("http://localhost:5000/chat-bot", { path: "/socket.io", autoConnect: true });

type Msg = { role: "system" | "assistant" | "user"; text: string; ts?: number };

const state = reactive({ isConnected: false, items: [] as Msg[], socketId: "" });
const text = ref("");
const listRef = ref<HTMLElement | null>(null);

const isConnected = computed(() => state.isConnected);
const items = computed(() => state.items);
const socketId = computed(() => state.socketId);

const formatTs = (ts?: number) => new Date(ts ?? Date.now()).toLocaleString();

async function pushMsg(m: Msg) {
    state.items.push(m);
    await nextTick();
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
}

function bindEvents() {
    socket.on("connect", () => {
        state.isConnected = true;
        state.socketId = socket.id ?? "";
    });
    socket.on("disconnect", () => {
        state.isConnected = false;
    });
    socket.on("chat", (payload: any) => {
        if (!payload || !payload.type) return;

        if (payload.type === "history") {
            const rows = Array.isArray(payload.items) ? payload.items : [];
            rows.forEach((it: any) =>
                pushMsg({ role: (it.role || "system") as Msg["role"], text: it.text || "", ts: it.ts || Date.now() })
            );
            return;
        }
        pushMsg({ role: payload.type as Msg["role"], text: payload.text || "", ts: payload.ts || Date.now() });
    });
}

function unbindEvents() {
    socket.off();
}

function onSubmit() {
    const t = text.value.trim();
    if (!t || !isConnected.value) return;
    socket.emit("chat", { text: t });
    text.value = "";
}

onMounted(() => {
    unbindEvents();
    bindEvents();
});
onBeforeUnmount(() => {
    unbindEvents();
});
</script>

<template>
    <div class="h-screen w-full flex flex-col gap-10 justify-center items-center">
        <h1 class="text-3xl font-bold text-center">Welcome Back To Teman Tanya</h1>
        <form action="" class="w-full flex justify-center items-center">
            <div class="flex w-full justify-center items-center gap-10">
                <Textarea class="w-[60%]" placeholder="ask me anything" />
            </div>
        </form>
    </div>
</template>