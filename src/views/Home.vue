<script setup lang="ts">
import { io } from "socket.io-client";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { VueMarkdown } from "@crazydos/vue-markdown";
import remarkGfm from "remark-gfm";
import { BxSolidSend } from 'vue-icons-lib/bx'
import { useCookies } from '@/composables/useCookies';
import { useRouter } from 'vue-router';
import { roomChat } from '@/stores/roomChatStore';
import { useMutation } from '@tanstack/vue-query';
import { axiosInstance } from '@/lib/axios';
import { AxiosError } from 'axios';
import Spinner from "@/components/ui/spinner/Spinner.vue";

const isSubmitting = ref(false);

const router = useRouter()

const coockies = useCookies()

const accessToken = coockies.get("access_token") || "";

const qs = new URLSearchParams(window.location.search);
const initialRoom = (qs.get("room") || "").trim();

const NS_BASE = import.meta.env.VITE_API_URL;
const NAMESPACE = "/chat-bot";

const socket = io(NS_BASE + NAMESPACE, {
    path: "/socket.io",
    autoConnect: true,
    auth: {
        token: accessToken,
        room: initialRoom,
    },
});

const currentRoom = ref<string>(initialRoom || "");
const state = reactive({ isConnected: false, items: [] as Msg[], socketId: "" });

const listRef = ref<HTMLElement | null>(null);

const isConnected = computed(() => state.isConnected);
const items = computed(() => state.items);

const formatTs = (ts?: string | number) =>
    new Date(ts || Date.now()).toLocaleString();

async function pushMsg(m: Msg) {
    state.items.push(m);
    await nextTick();
    if (listRef.value) {
        listRef.value.scrollTop = listRef.value.scrollHeight;
    }
}

function setRoomInUrl(roomId: string) {
    if (!roomId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    window.history.replaceState({}, document.title, url.toString());
    currentRoom.value = roomId;
}

function bindEvents() {
    socket.on("connect", () => {
        state.isConnected = true;
        state.socketId = socket.id ?? "";
    });

    socket.on("disconnect", () => {
        coockies.remove("access_token");
        state.isConnected = false;
        router.push('/login');
    });

    socket.on("room_created", (payload: any) => {
        const roomId = payload?.room ? String(payload.room) : "";
        if (roomId && !currentRoom.value) {
            setRoomInUrl(roomId);
        }
    });

    socket.on("rooms_updated", (payload: { rooms: RoomChat[] }) => {
        roomChat.value = payload.rooms || [];
    });

    socket.on("chat", (payload: any) => {
        if (!payload || !payload.type) return;

        if (payload.type === "history") {
            const rows: any[] = Array.isArray(payload.items) ? payload.items : [];

            state.items = [];

            rows.forEach(it =>
                pushMsg({
                    role: it.role || "system",
                    text: it.text || "",
                    ts: it.ts || Date.now(),
                    is_image: it.is_image || false,
                })
            );

            return;
        }

        if (payload.type === "system_clear") {
            state.items = state.items.filter(m => m.role !== "system");
            return;
        }

        pushMsg({
            role: payload.type,
            text: payload.text || "",
            ts: payload.ts || Date.now(),
            is_image: payload.is_image || false,
        });
    });
}

function unbindEvents() {
    socket.off();
}

const inputChatBot = reactive<ChatInput>({
    text: '',
    room: currentRoom.value,
    file: undefined,
})

const accept = 'application/pdf'
const fileInput = ref<HTMLInputElement | null>(null)
const filePreview = ref<string>('')

function removeFile() {
    inputChatBot.file = undefined
    filePreview.value = ''
}

function isImageFile(file: File) {
    return file.type.startsWith('image/')
}

function openFilePicker() {
    fileInput.value?.click()
}

function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement | null
    const selected = target?.files ? target.files[0] : undefined
    if (!selected) return

    inputChatBot.file = selected

    if (target) target.value = ''
}

const apiChatBot = async (input: ChatInput) => {
    const fd = new FormData();
    fd.append("text", input.text);
    fd.append("room", input.room);
    if (input.file) {
        fd.append("file", input.file);
    }
    const response = await axiosInstance.post('/chat-bot/messages', fd, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    })
    return response.data
}

const { mutate } = useMutation({
    mutationFn: async (input: ChatInput) => {
        const response = apiChatBot(input)
        return response
    },
    onError: async (error) => {
        const err = error as AxiosError<ErrorResponse>;
        console.error("ChatBot Error:", err);
        isSubmitting.value = false;
    },
    onSuccess: async () => {
        inputChatBot.text = '';
        inputChatBot.file = undefined;
        isSubmitting.value = false
    },
})

const onSubmit = () => {
    if (!isConnected.value) {
        console.warn("Socket is not connected.");
        return;
    }
    if (isSubmitting.value) return;

    const trimmed = (inputChatBot.text || '').trim();
    if (!trimmed && !inputChatBot.file) return;

    const payload: ChatInput = {
        text: inputChatBot.text,
        file: inputChatBot.file,
        room: currentRoom.value,
    };

    inputChatBot.text = '';
    inputChatBot.file = undefined;

    isSubmitting.value = true;

    mutate(payload);
};

onMounted(() => {
    unbindEvents();
    bindEvents();
});
onBeforeUnmount(() => {
    unbindEvents();
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);

let defaultPaddingTop: number | null = null;
let defaultPaddingBottom: number | null = null;

function getPxNumber(value: string | null): number {
    return value ? parseFloat(value.replace("px", "")) : 0;
}

const ADDITIONAL_OFFSET = 5;

function centerCaret(): void {
    const ta = textareaRef.value;
    if (!ta) return;

    const style = getComputedStyle(ta);

    if (defaultPaddingTop === null) {
        defaultPaddingTop = getPxNumber(style.paddingTop);
        defaultPaddingBottom = getPxNumber(style.paddingBottom);
    }

    if (inputChatBot.text) {
        ta.style.paddingTop = `${defaultPaddingTop}px`;
        ta.style.paddingBottom = `${defaultPaddingBottom}px`;
        return;
    }

    const height = ta.clientHeight;

    let lineHeight: number;
    if (!style.lineHeight || style.lineHeight === "normal") {
        const fontSize = getPxNumber(style.fontSize) || 16;
        lineHeight = fontSize * 1.2;
    } else {
        lineHeight = getPxNumber(style.lineHeight);
    }

    const offset = Math.max(0, (height - lineHeight) / 2 + ADDITIONAL_OFFSET);
    ta.style.paddingTop = `${offset}px`;
    ta.style.paddingBottom = `${defaultPaddingBottom}px`;
}


function onFocusTextarea(): void {
    nextTick(() => centerCaret());
}

function onInputTextarea(): void {
    nextTick(() => centerCaret());
}

function onBlurTextarea(): void {
    nextTick(() => centerCaret());
}

onMounted(() => nextTick(() => centerCaret()));

</script>


<template>
    <div class="min-h-[70vh] w-full flex flex-col gap-10 justify-center items-center translate-y-[20%]">
        <main ref="listRef" class="overflow-y-auto p-4 space-y-3 max-h-[65vh]" role="log" aria-live="polite"
            aria-atomic="false" aria-label="Riwayat percakapan">
            <div v-for="(m, i) in items" :key="i" :class="{
                'rounded-md w-212 px-4 py-3': true,
                'border': m.role === 'assistant' || m.role === 'user',
                '': m.role === 'system',
            }">
                <div v-if="m.role !== 'system'">
                    <div class="mb-1 flex items-center gap-2 text-xs text-black">
                        <span class="uppercase tracking-wider">{{ m.role }}</span>
                        <span>•</span>
                        <span>{{ formatTs(m.ts) }}</span>
                    </div>

                    <div v-if="m.is_image" class="my-2">
                        <img :src="m.text" alt="AI generated image" class="max-w-full mx-auto rounded-md" />
                    </div>

                    <VueMarkdown v-else :markdown="m.text" :remark-plugins="[remarkGfm]" class="
          prose prose-invert max-w-none wrap-break-word
          prose-p:my-2 prose-headings:my-3 prose-li:my-1
          prose-pre:whitespace-pre-wrap prose-pre:text-sm
          prose-code:before:content-[''] prose-code:after:content-[''] 
        " />
                </div>

                <div v-else>
                    <h1 class="text-center text-2xl font-bold">{{ m.text }}</h1>
                </div>
            </div>
        </main>


        <form class="w-full flex justify-center items-center" @submit.prevent="onSubmit">
            <div class="flex w-full justify-center items-center">
                <div class="flex w-full justify-center items-center">
                    <div class="relative w-[60%]">

                        <div v-if="inputChatBot.file"
                            class="mb-2 flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                            <template v-if="isImageFile(inputChatBot.file)">
                                <img :src="filePreview" alt="preview" class="h-10 w-10 object-cover rounded" />
                            </template>
                            <span class="truncate">{{ inputChatBot.file.name }}</span>
                            <button type="button" class="ml-auto text-red-500 hover:text-red-700" @click="removeFile"
                                aria-label="Remove file">
                                ×
                            </button>
                        </div>

                        <button type="button"
                            class="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="Attach file" @click="openFilePicker">
                            <span class="text-lg font-bold select-none">+</span>
                        </button>

                        <span v-show="!inputChatBot.text"
                            class="absolute left-14 top-1/2 -translate-y-2.5 pointer-events-none text-gray-400 select-none"
                            aria-hidden="true">
                            Ask me anything...
                        </span>

                        <textarea ref="textareaRef" v-model="inputChatBot.text" placeholder=""
                            class="w-full block resize-none min-h-14 max-h-40 pr-14 pl-14 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                            :rows="2" @focus="onFocusTextarea" @input="onInputTextarea" @blur="onBlurTextarea" />

                        <button type="button"
                            class="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="Send" @click="onSubmit">
                            <BxSolidSend class="w-5 h-5" v-if="!isSubmitting" />
                            <Spinner v-else class="w-5 h-5" />
                        </button>

                        <input ref="fileInput" type="file" class="hidden" @change="onFileChange" :multiple="false"
                            :accept="accept" />
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<style scoped></style>