import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/auth/Login.vue'
import Register from './views/auth/Register.vue'
import { useCookies } from 'vue3-cookies'
import { userService } from './services/userService'
import Testing from './views/Testing.vue'
import Testing1 from './views/Testing1.vue'

const routes = [
    { path: '/', component: Home, meta: { sidebar: true, requiresAuth: true } },
    { path: '/login', component: Login, meta: { sidebar: false } },
    { path: '/register', component: Register, meta: { sidebar: false } },
    { path: '/test', component: Testing },
    { path: '/test1', component: Testing1 },
]

const router = createRouter({ history: createWebHistory(), routes })

const isAuthPage = (p: string) => p === '/login' || p === '/register'
const hasToken = (t: unknown) => typeof t === 'string' && t !== '' && t !== 'undefined'

router.beforeEach(async (to) => {
    const { cookies } = useCookies()
    const accessToken = cookies.get('access_token') as string | undefined
    const clientETag = cookies.get('me-etag') as string | undefined

    if (to.meta.requiresAuth && !hasToken(accessToken)) {
        cookies.remove('access_token')
        cookies.remove('me-etag')
        return { path: '/login' }
    }

    if (isAuthPage(to.path) && hasToken(accessToken)) {
        try {
            const { response } = await userService.getUserMe(accessToken || '', clientETag)
            if (response.status === 200 || response.status === 304) {
                if (response.status === 200) {
                    const newETag = response.headers['etag']
                    if (newETag) {
                        cookies.set('me-etag', newETag)
                        cookies.set('me-data', JSON.stringify(response.data))
                    }
                }
                return { path: '/' }
            }
        } catch {
            // kalau gagal validasi, biarkan tetap di halaman auth
        }
        return true
    }

    if (to.path === '/' && hasToken(accessToken)) {
        try {
            const { response } = await userService.getUserMe(accessToken || '', clientETag)

            if (response.status === 200) {
                const newETag = response.headers['etag']
                if (newETag) {
                    cookies.set('me-etag', newETag)
                    cookies.set('me-data', JSON.stringify(response.data))
                }
                return true
            }

            if (response.status === 304) return true

            cookies.remove('access_token')
            cookies.remove('me-etag')
            return { path: '/login' }
        } catch {
            cookies.remove('access_token')
            cookies.remove('me-etag')
            return { path: '/login' }
        }
    }

    return true
})

export default router
