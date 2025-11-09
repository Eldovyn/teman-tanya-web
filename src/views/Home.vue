<script setup lang="ts">
import Textarea from '@/components/ui/textarea/Textarea.vue';
import { io } from "socket.io-client";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { VueMarkdown } from "@crazydos/vue-markdown";
import remarkGfm from "remark-gfm";
import { BxSolidSend } from 'vue-icons-lib/bx'

const socket = io("http://localhost:5000/chat-bot", { path: "/socket.io", autoConnect: true });

type Msg = { role: "system" | "assistant" | "user"; text: string; ts?: number };

const state = reactive({ isConnected: false, items: [] as Msg[], socketId: "" });
const text = ref("");
const listRef = ref<HTMLElement | null>(null);

const isConnected = computed(() => state.isConnected);
const items = computed(() => state.items);

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
        <main ref="listRef" class="overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" aria-atomic="false"
            aria-label="Riwayat percakapan">
            <div v-for="(m, i) in items" :key="i" class="rounded-md w-212 px-4 py-3" :class="{
                'border': m.role === 'assistant' || m.role === 'user',
                '': m.role === 'system',
            }">
                <div class="mb-1 flex items-center gap-2 text-xs text-black">
                    <span class="uppercase tracking-wider">{{ m.role }}</span>
                    <span>•</span>
                    <span>{{ formatTs(m.ts) }}</span>
                </div>

                <VueMarkdown :markdown="m.text" :remark-plugins="[remarkGfm]" class="
        prose prose-invert max-w-none wrap-break-word
        prose-p:my-2 prose-headings:my-3 prose-li:my-1
        prose-pre:whitespace-pre-wrap prose-pre:text-sm
        prose-code:before:content-[''] prose-code:after:content-['']
      " />
            </div>
        </main>

        <form class="w-full flex justify-center items-center">
            <div class="flex w-full justify-center items-center gap-10">
                <div class="relative w-[60%]">
                    <Textarea class="w-full pr-12" placeholder="ask me anything" v-model="text" />
                    <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-2 z-10 pointer-events-auto"
                        aria-label="Send" @click="onSubmit">
                        <BxSolidSend class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </form>
    </div>
</template>