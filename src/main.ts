import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { VueQueryPlugin } from '@tanstack/vue-query';
import VueCookies from 'vue-cookies';
import { io } from 'socket.io-client';
import './style.css';

const socket = io(import.meta.env.VITE_API_URL);

const app = createApp(App);

app.provide('socket', socket).use(VueCookies).use(VueQueryPlugin).use(router).mount('#app');