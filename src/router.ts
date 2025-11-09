import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/auth/Login.vue'
import Register from './views/auth/Register.vue'
import Home from './views/Home.vue'
import AccountActive from './views/auth/Account-Active.vue'
import { useCookies } from 'vue3-cookies'
import { authService } from './services/authService'
import { userService } from './services/userService'

const routes = [
    { path: '/register', component: Register, meta: { sidebar: false } },
    { path: '/login', component: Login, meta: { sidebar: false } },
    { path: '/', component: Home, meta: { sidebar: true, requiresAuth: false } },
    { path: '/account-active', component: AccountActive, meta: { sidebar: false } }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    const { cookies } = useCookies()
    const accessToken = cookies.get('access_token')
    const clientETag = cookies.get("me-etag")
    const token = to.query.token as string | undefined

    if (to.meta.requiresAuth && !accessToken || accessToken === 'undefined') {
        cookies.remove('access_token')
        return next('/login')
    }

    if ((to.path === '/login' || to.path === '/register') && accessToken) {
        return next('/')
    }

    if (to.path === '/account-active') {
        if (!token) return next('/login')

        try {
            const { response } = await authService.getAccountActive(token)

            if (response.status === 404) {
                return next('/login')
            }
        } catch (err) {
            return next('/login')
        }
    }

    if (to.path === '/') {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        };
        if (clientETag) headers["If-None-Match"] = clientETag;


        const { response } = await userService.getUserMe(accessToken, clientETag)

        if (response.status === 200) {
            const newETag = response.headers["etag"];

            if (newETag) {
                cookies.set("me-etag", newETag);
                cookies.set("me-data", JSON.stringify(response.data));
            }
        } else if (response.status === 429) {
            // 
        } else if (response.status === 401) {
            cookies.remove('access_token')
        } else if (response.status !== 304) {
            cookies.remove("accessToken");
            cookies.remove("me-etag");
        }
    }

    return next()
})

export default router
