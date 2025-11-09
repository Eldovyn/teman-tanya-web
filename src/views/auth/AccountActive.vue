<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue"
import { useMutation } from '@tanstack/vue-query'
import { AxiosError } from 'axios'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'vue-sonner'
import {
    PinInput,
    PinInputGroup,
    PinInputSeparator,
    PinInputSlot,
} from "@/components/ui/pin-input"
import { useRoute, useRouter } from 'vue-router'
import { useCookies } from '@/composables/useCookies'
import { io } from 'socket.io-client';
import { useAccountActivation } from "@/composables/useAccountActivation";
import { formatTime } from '@/utils/formatTime'

const { remaining } = useAccountActivation();

const duration = computed(() => {
    return formatTime(remaining.value || 0);
});

const formErrors = reactive<FormErrorsOTP>({
    otp: [],
});

const handleValidation = (errors: FormErrorsOTP) => {
    formErrors.otp = errors.otp || []
};

const socketValidationOTP = io(`${import.meta.env.VITE_API_URL}/otp-activation`);
if (!socketValidationOTP) {
    throw new Error('Socket not provided');
}

onMounted(() => {
    socketValidationOTP.on('connect', () => {
        console.log('socket connected (setup)');
    });
    socketValidationOTP.on('validation', (data: { errors: FormErrorsOTP; success: boolean }) => {
        console.log(data);
        handleValidation(data.errors);
    });
});

onBeforeUnmount(() => {
    socketValidationOTP.off('connect');
    socketValidationOTP.off('validation');
});

function validateField(payload: { otp?: string }) {
    socketValidationOTP.emit('validation', {
        otp: payload.otp, token: token
    });
}

const onOtpInput = (index: number, event: Event) => {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    value.value[index] = val;

    const otpValue = value.value.join('');
    validateField({ otp: otpValue });
}

const isOtpError = computed(() => {
    return (formErrors.otp ?? []).length > 0;
});

const cookies = useCookies()

const value = ref<string[]>([])
const handleComplete = (e: string[]) => mutate(e.join(""))

const router = useRouter()
const route = useRoute()

const token = route.query.token

const goToHome = async () => {
    router.push('/')
}

const goToLogin = async () => {
    router.push('/login')
}

const isSubmitting = ref(false)

const apiVerification = async (input: string) => {
    const response = await axiosInstance.post(`/auth/account-active/activation/${token}`, { otp: input })
    return response.data
}

const { mutate } = useMutation({
    mutationFn: async (input: string) => {
        const response = apiVerification(input)
        return response
    },
    onError: (error) => {
        const err = error as AxiosError<ErrorResponse>;
        if (err.response?.status === 404) {
            goToLogin();
            toast.error((err.response?.data?.message as string) || '');
            return;
        }
        toast.error((err.response?.data?.message as string) || '');
        return;
    },
    onSuccess: async (data) => {
        toast.success(data.message);
        cookies.set('access_token', data.token.access_token);
        goToHome();
    },
})

function onSubmit() {
    isSubmitting.value = true
    const otp = value.value.join("")
    mutate(otp)
    isSubmitting.value = false
}
</script>

<template>
    <section class="login h-screen bg-[#f5f5f5] flex justify-center items-center">
        <div class="flex flex-col w-[30%] p-10 bg-white rounded-md text-black">
            <h1 class="text-3xl font-bold text-center">Welcome Back To Chaty</h1>
            <p class="text-sm text-center">Please enter your verification code</p>
            <br>
            <form @submit.prevent="onSubmit" class="flex flex-col p-5">
                <PinInput id="pin-input" v-model="value" placeholder="○" class="mx-auto mb-5"
                    @complete="handleComplete">
                    <PinInputGroup class="gap-1">
                        <template v-for="(id, index) in 4" :key="id">
                            <PinInputSlot :class="{ 'rounded-md border': true, 'border-red-500': isOtpError }"
                                :index="index" @input="onOtpInput(index, $event)" />
                            <template v-if="index !== 3">
                                <PinInputSeparator />
                            </template>
                        </template>
                    </PinInputGroup>
                </PinInput>
                <Button type="submit"
                    class="bg-blue-600 hover:bg-blue-700 cursor-pointer mb-3 mx-auto w-[45%] flex justify-between">
                    <p>Verification</p>
                    <p>{{ duration }}</p>
                </Button>
            </form>
        </div>
    </section>
</template>