import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory('/app/'),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/account',
                    name: 'formlayout',
                    component: () => import('@/views/Account.vue')
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/Users.vue')
                },
                {
                    path: '/user/:id',
                    name: 'user',
                    component: () => import('@/views/User.vue')
                },
                {
                    path: '/settings',
                    name: 'input',
                    component: () => import('@/views/Settings.vue')
                },
                {
                    path: '/logout',
                    name: 'button',
                    component: () => import('@/views/Logout.vue')
                },
                {
                    path: '/alerts',
                    name: 'alerts',
                    component: () => import('@/views/Alerts.vue')
                },
                {
                    path: '/alert/:id',
                    name: 'alert',
                    component: () => import('@/views/Alert.vue')
                }
            ]
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

export default router;
