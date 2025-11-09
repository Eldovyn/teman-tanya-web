<template>
    <div class="min-h-screen bg-slate-950 text-slate-50 grid grid-rows-[auto_1fr_auto]">
        <header class="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <span class="size-2.5 rounded-full transition-colors"
                :class="isConnected ? 'bg-emerald-500' : 'bg-rose-500'" aria-hidden="true" />
            <strong class="text-sm">/chat-bot</strong>
            <span class="ml-auto text-xs text-slate-400">
                {{ isConnected ? `terhubung (sid: ${socketId})` : "terputus" }}
            </span>
        </header>

        <main ref="listRef" class="overflow-y-auto p-4 space-y-3" aria-live="polite" aria-atomic="false">
            <p v-if="!items.length" class="italic text-slate-400">
                Belum ada pesan. Mulai ngobrol di bawah ✨
            </p>

            <div v-for="(m, i) in items" :key="i" class="rounded-xl border bg-slate-900/60 px-4 py-3" :class="{
                'border-emerald-700/60 shadow-[inset_4px_0_var(--color-emerald-500)]': m.role === 'assistant',
                'border-sky-700/60 shadow-[inset_4px_0_var(--color-sky-500)]': m.role === 'user',
                'border-violet-700/60 shadow-[inset_4px_0_var(--color-violet-500)] opacity-95': m.role === 'system',
            }">
                <div class="mb-1 flex items-center gap-2 text-xs text-slate-400">
                    <span class="uppercase tracking-wider">{{ m.role }}</span>
                    <span>•</span>
                    <span>{{ formatTs(m.ts) }}</span>
                </div>

                <VueMarkdown :markdown="m.text" :remark-plugins="[remarkGfm]"
                    class="prose prose-invert max-w-none prose-pre:whitespace-pre-wrap" />
            </div>
        </main>

        <form class="flex gap-2 border-t border-slate-800 p-3" @submit.prevent="onSubmit" autocomplete="off">
            <input v-model="text" type="text" placeholder="Tulis pesan kamu… (markdown didukung)"
                class="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-600"
                :disabled="!isConnected" @keyup.enter.exact.prevent="onSubmit" />
            <button type="submit"
                class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm disabled:opacity-50 hover:bg-slate-700"
                :disabled="!isConnected || !text.trim()">
                Kirim
            </button>
        </form>
    </div>
</template>

<script setup lang="ts">
import { io } from "socket.io-client";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";

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
