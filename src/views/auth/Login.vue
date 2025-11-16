<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AiOutlineEye } from 'vue-icons-lib/ai'
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue"
import { AiOutlineEyeInvisible } from 'vue-icons-lib/ai'
import { useMutation } from '@tanstack/vue-query'
import { AxiosError } from 'axios'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'
import { useCookies } from '@/composables/useCookies'
import { io } from 'socket.io-client';
import { Spinner } from '@/components/ui/spinner'

const formErrors = reactive<FormErrorsLogin>({
    email: [],
    password: [],
});

const socket = io(`${import.meta.env.VITE_API_URL}/validate-login`);
if (!socket) {
    throw new Error('Socket not provided');
}

onMounted(() => {
    socket.on('connect', () => {
        console.log('socket connected (setup)');
    });
    socket.on('validation', (data: { errors: FormErrorsLogin; success: boolean }) => {
        handleValidation(data.errors);
    });
});

onBeforeUnmount(() => {
    socket.off('connect');
    socket.off('validation');
});

function validateField(payload: { email?: string; password?: string }) {
    socket.emit('validation', {
        email: payload.email ?? inputFormLogin.email,
        password: payload.password ?? inputFormLogin.password,
        provider: 'auth_internal'
    });
}

const onEmailInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    inputFormLogin.email = val;
    validateField({ email: val });
}

const onPasswordInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    inputFormLogin.password = val;
    validateField({ password: val });
}

const cookies = useCookies()

const router = useRouter()

const goToHome = async () => {
    router.push('/')
}

const showPassword = ref(false)

function togglePassword() {
    showPassword.value = !showPassword.value
}

const inputFormLogin = reactive<LoginInput>({
    email: '',
    password: '',
    provider: ''
})

const isEmailError = computed(() => {
    return (formErrors.email ?? []).length > 0;
});

const isPasswordError = computed(() => {
    return (formErrors.password ?? []).length > 0;
});

const emailErrorMessage = computed(() => {
    const err = formErrors.email?.[0];
    switch (err) {
        case 'IS_REQUIRED':
            return 'email is required';
        case 'IS_INVALID':
            return 'invalid email';
        default:
            return 'invalid email';
    }
});

const passwordErrorMessage = computed(() => {
    const err = formErrors.password?.[0];
    switch (err) {
        case 'IS_REQUIRED':
            return 'password is required';
        case 'IS_INVALID':
            return 'invalid password';
        default:
            return 'invalid password';
    }
});

const isSubmitting = ref(false)

const handleValidation = (errors: FormErrorsLogin) => {
    formErrors.email = errors.email || []
    formErrors.password = errors.password || []
};

const clearValidation = () => {
    formErrors.email = []
    formErrors.password = []
}

const clearForm = () => {
    inputFormLogin.email = ''
    inputFormLogin.password = ''
    inputFormLogin.provider = ''
}

const apiLogin = async (input: LoginInput) => {
    const response = await axiosInstance.post('/auth/login', input)
    return response.data
}

const { mutate } = useMutation({
    mutationFn: async (input: LoginInput) => {
        input.provider = 'auth_internal'
        const response = apiLogin(input)
        return response
    },
    onError: async (error) => {
        const err = error as AxiosError<ErrorResponse>;
        if (err.response?.status === 400 && err.response.data.errors) {
            handleValidation({
                email: err.response?.data?.errors?.email ?? [],
                password: err.response?.data?.errors?.password ?? [],
            });
            toast.error(err.response?.data?.message);
            isSubmitting.value = false
            return;
        }
        if (err.response?.status === 403) {
            clearValidation();
            clearForm();
            toast.error('check your email for verification');
            isSubmitting.value = false
            return;
        }
        toast.error((err.response?.data?.message as string) || '');
        isSubmitting.value = false
        return;
    },
    onSuccess: async (data) => {
        toast.success(data.message);
        clearForm();
        clearValidation();
        cookies.set('access_token', data.token.access_token);
        goToHome();
        isSubmitting.value = false
    },
})

const onSubmit = () => {
    if (isSubmitting.value) return;

    isSubmitting.value = true;
    mutate({ ...inputFormLogin })
}
</script>

<template>
    <section class="login h-screen bg-[#f5f5f5] flex justify-center items-center">
        <div class="flex flex-col xl:w-[30%] lg:w-[50%] md:w-[50%] w-[80%] p-10 bg-white rounded-md text-black">
            <h1 class="text-3xl font-bold text-center">Welcome back to Teman Tanya</h1>
            <p class="text-sm text-center">Sign in to your account</p>
            <br>
            <br>
            <form @submit.prevent="onSubmit" :disabled="isSubmitting" class="flex flex-col p-5">
                <div class="input-email w-full flex flex-col gap-1 mb-5">
                    <Label for="email">Email</Label>
                    <Input type="text" v-model="inputFormLogin.email" placeholder="your email"
                        :class="{ 'border border-red-500': isEmailError }" @input="onEmailInput" />
                    <p v-if="isEmailError" class="text-[10px] text-right me-3 text-[#C10007]">
                        {{ emailErrorMessage }}
                    </p>
                </div>
                <div class="input-password w-full flex flex-col gap-1 mb-5">
                    <Label for="password">Password</Label>
                    <div class="relative">
                        <Input id="password" v-model="inputFormLogin.password"
                            :type="showPassword ? 'text' : 'password'" placeholder="your password"
                            @input="onPasswordInput" :class="{ 'border border-red-500': isPasswordError }" />
                        <button type="button"
                            class="absolute inset-y-0 right-3 flex items-center text-gray-500 cursor-pointer">
                            <AiOutlineEye @click="togglePassword" v-if="!showPassword"
                                :class="{ 'w-4 h-4': true, 'text-red-500': isPasswordError }" />
                            <AiOutlineEyeInvisible @click="togglePassword" v-else
                                :class="{ 'w-4 h-4': true, 'text-red-500': isPasswordError }" />
                        </button>
                    </div>
                    <p v-if="isPasswordError" class="text-[10px] text-right me-3 text-[#C10007]">
                        {{ passwordErrorMessage }}
                    </p>
                </div>
                <Button type="submit"
                    class="bg-blue-600 hover:bg-blue-700 cursor-pointer mb-3 w-full  flex justify-center items-center gap-3">
                    <Spinner v-if="isSubmitting" />
                    <p>Sign In</p>
                </Button>
                <p class="text-[12px] text-right mb-5">dont have an account? <router-link to="/register"
                        class="text-blue-600 underline">sign up</router-link>
                </p>
                <div class="flex flex-row items-center justify-center w-[42%] mx-auto gap-5 mb-5">
                    <Separator />
                    <p class="px-2">or</p>
                    <Separator />
                </div>
                <div class="flex flex-row gap-5 justify-center w-[95%] mx-auto">
                    <Button type="button"
                        class="bg-black hover:bg-black flex justify-center items-center xl:w-1/2 md:w-[50%] cursor-pointer">
                        <img src="/icon-google.png" alt="" class="xl:w-8 lg:w-6 w-5">
                        <p>Sign In With Google</p>
                    </Button>
                    <Button type="button"
                        class="bg-white hover:bg-white flex justify-center items-center xl:w-1/2 md:w-[50%] border border-black cursor-pointer">
                        <img src="/icon-github.png" alt="" class="xl:w-6 lg:w-4 w-2">
                        <p class="text-black">Sign In With Github</p>
                    </Button>
                </div>
            </form>
        </div>
    </section>
</template>