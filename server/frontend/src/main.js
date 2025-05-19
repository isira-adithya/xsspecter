import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';

const app = createApp(App);
const sessionMonitor = () => {
    if (window.location.pathname == '/app/auth/login') {
        return;
    }
    fetch('/api/users/me', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => {
            if (response.status === 403) {
                router.push('/auth/login');
                return;
            }
            response.json().then(data => {
                if (data.error) {
                    router.push('/auth/login');
                } else {
                    localStorage.setItem('user', JSON.stringify(data));
                }
            })
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

// session monitor
sessionMonitor();
window.setInterval(sessionMonitor, 15000);

app.mount('#app');
