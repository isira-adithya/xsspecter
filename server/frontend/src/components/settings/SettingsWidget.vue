<template>
    <div class="card-body p-6">
        <h2 class="text-2xl font-bold mb-4">Settings</h2>

        <div v-if="loading" class="flex justify-center my-8">
            <ProgressSpinner style="width: 50px; height: 50px" />
        </div>

        <div v-else>
            <form @submit.prevent="saveSettings">
                <!-- Global Notifications Toggle -->
                <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-semibold">Notifications</h3>
                            <p class="text-gray-600 dark:text-gray-300">Enable or disable all notification services</p>
                        </div>
                        <InputSwitch v-model="settings.notifications_enabled" class="ml-4" />
                    </div>
                </div>

                <Divider />

                <!-- SMTP Settings -->
                <Panel header="Email Notifications (SMTP)" :toggleable="true" class="mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field flex items-center justify-between col-span-2">
                            <label for="emails_enabled" class="font-medium">Enable Emails</label>
                            <InputSwitch id="emails_enabled" v-model="settings.emails_enabled"
                                :disabled="!settings.notifications_enabled" />
                        </div>

                        <div class="field">
                            <label for="smtp_host" class="block mb-2">SMTP Host</label>
                            <InputText id="smtp_host" v-model="settings.smtp_host" class="w-full"
                                :disabled="!settings.notifications_enabled" />
                            <small v-if="errors.smtp_host" class="p-error">{{ errors.smtp_host }}</small>
                        </div>

                        <div class="field">
                            <label for="smtp_port" class="block mb-2">SMTP Port</label>
                            <InputText id="smtp_port" v-model.number="settings.smtp_port" type="number" class="w-full"
                                :disabled="!settings.notifications_enabled" />
                            <small v-if="errors.smtp_port" class="p-error">{{ errors.smtp_port }}</small>
                        </div>

                        <div class="field">
                            <label for="smtp_user" class="block mb-2">SMTP Username</label>
                            <InputText id="smtp_user" v-model="settings.smtp_user" class="w-full"
                                :disabled="!settings.notifications_enabled" />
                            <small v-if="errors.smtp_user" class="p-error">{{ errors.smtp_user }}</small>
                        </div>

                        <div class="field">
                            <label for="smtp_pass" class="block mb-2">SMTP Password</label>
                            <Password id="smtp_pass" v-model="settings.smtp_pass" class="w-full" toggleMask
                                :feedback="false" :disabled="!settings.notifications_enabled" />
                            <small v-if="errors.smtp_pass" class="p-error">{{ errors.smtp_pass }}</small>
                        </div>

                        <div class="field">
                            <label for="smtp_from" class="block mb-2">From Email Address</label>
                            <InputText id="smtp_from" v-model="settings.smtp_from" class="w-full"
                                :disabled="!settings.notifications_enabled" />
                            <small v-if="errors.smtp_from" class="p-error">{{ errors.smtp_from }}</small>
                        </div>

                        <div class="field flex items-end">
                            <Button type="button" label="Test SMTP Connection" icon="pi pi-envelope"
                                :disabled="!settings.notifications_enabled || !settings.smtp_host"
                                @click="testSmtpConnection" class="p-button-outlined" />
                        </div>
                    </div>
                </Panel>

                <!-- Discord Settings -->
                <Panel header="Discord Notifications" :toggleable="true" class="mb-6">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field flex items-center justify-between">
                            <label for="discord_enabled" class="font-medium">Enable Discord Notifications</label>
                            <InputSwitch id="discord_enabled" v-model="settings.discord_enabled"
                                :disabled="!settings.notifications_enabled" />
                        </div>

                        <div class="field">
                            <label for="discord_webhook" class="block mb-2">Discord Webhook URL</label>
                            <InputText id="discord_webhook" v-model="settings.discord_webhook" class="w-full"
                                :disabled="!settings.notifications_enabled || !settings.discord_enabled" />
                            <small v-if="errors.discord_webhook" class="p-error">{{ errors.discord_webhook }}</small>
                        </div>

                        <div class="field">
                            <Button type="button" label="Test Discord Webhook" icon="pi pi-discord"
                                :disabled="!settings.notifications_enabled || !settings.discord_enabled || !settings.discord_webhook"
                                @click="testDiscordWebhook" class="p-button-outlined" />
                        </div>
                    </div>
                </Panel>

                <!-- Slack Settings -->
                <Panel header="Slack Notifications" :toggleable="true" class="mb-6">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field flex items-center justify-between">
                            <label for="slack_enabled" class="font-medium">Enable Slack Notifications</label>
                            <InputSwitch id="slack_enabled" v-model="settings.slack_enabled"
                                :disabled="!settings.notifications_enabled" />
                        </div>

                        <div class="field">
                            <label for="slack_webhook" class="block mb-2">Slack Webhook URL</label>
                            <InputText id="slack_webhook" v-model="settings.slack_webhook" class="w-full"
                                :disabled="!settings.notifications_enabled || !settings.slack_enabled" />
                            <small v-if="errors.slack_webhook" class="p-error">{{ errors.slack_webhook }}</small>
                        </div>

                        <div class="field">
                            <Button type="button" label="Test Slack Webhook" icon="pi pi-send"
                                :disabled="!settings.notifications_enabled || !settings.slack_enabled || !settings.slack_webhook"
                                @click="testSlackWebhook" class="p-button-outlined" />
                        </div>
                    </div>
                </Panel>

                <!-- Telegram Settings -->
                <Panel header="Telegram Notifications" :toggleable="true" class="mb-6">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field flex items-center justify-between">
                            <label for="telegram_enabled" class="font-medium">Enable Telegram Notifications</label>
                            <InputSwitch id="telegram_enabled" v-model="settings.telegram_enabled"
                                :disabled="!settings.notifications_enabled" />
                        </div>

                        <div class="field">
                            <label for="telegram_bot_token" class="block mb-2">Telegram Bot Token</label>
                            <InputText id="telegram_bot_token" v-model="settings.telegram_bot_token" class="w-full"
                                :disabled="!settings.notifications_enabled || !settings.telegram_enabled" />
                            <small v-if="errors.telegram_bot_token" class="p-error">{{ errors.telegram_bot_token
                            }}</small>
                        </div>

                        <div class="field">
                            <label for="telegram_chat_id" class="block mb-2">Telegram Chat ID</label>
                            <InputText id="telegram_chat_id" v-model="settings.telegram_chat_id" class="w-full"
                                :disabled="!settings.notifications_enabled || !settings.telegram_enabled" />
                            <small v-if="errors.telegram_chat_id" class="p-error">{{ errors.telegram_chat_id }}</small>
                        </div>

                        <div class="field">
                            <Button type="button" label="Test Telegram Bot" icon="pi pi-telegram"
                                :disabled="!settings.notifications_enabled || !settings.telegram_enabled || !settings.telegram_bot_token || !settings.telegram_chat_id"
                                @click="testTelegramBot" class="p-button-outlined" />
                        </div>
                    </div>
                </Panel>

                <!-- Advanced Settings -->
                <Panel header="Advanced Settings" :toggleable="true" class="mb-6">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field">
                            <label for="ip_header" class="block mb-2">IP Header</label>
                            <InputText id="ip_header" v-model="settings.ip_header" class="w-full" />
                            <small class="text-gray-600">Header to use for getting client IP address (e.g.
                                X-Forwarded-For)</small>
                            <small v-if="errors.ip_header" class="p-error">{{ errors.ip_header }}</small>
                        </div>
                    </div>
                </Panel>

                <!-- AI Report Generation Settings -->
                <Panel header="AI" :toggleable="true" class="mb-6">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 dark:text-gray-300 text-sm">Enable AI Features
                                </p>
                            </div>
                            <InputSwitch v-model="settings.ai_enabled" class="ml-4" />
                        </div>
                        <div class="field">
                            <label for="ip_header" class="block mb-2">OpenAI API Key</label>
                            <InputText id="ip_header" :disabled="!settings.ai_enabled" v-model="settings.openai_key" class="w-full" />
                            <small class="text-gray-600">OpenAI API Key is used to generate AI related content. <a href="https://openai.com/api/" target="_blank" class="text-slate-500"><i>[Learn more]</i></a></small>
                            <small v-if="errors.ip_header" class="p-error">{{ errors.ip_header }}</small>
                        </div>
                    </div>
                </Panel>

                <!-- Action Buttons -->
                <div class="flex justify-between mt-8">
                    <div class="gap-6"></div>
                    <div class="flex gap-2">
                        <Button type="button" label="Cancel" icon="pi pi-times" @click="loadSettings"
                            class="p-button-secondary" />
                        <Button type="submit" label="Save Settings" icon="pi pi-save" :loading="saving"
                            class="p-button-primary" />
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Divider from 'primevue/divider';

// Components import
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Panel from 'primevue/panel';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';

const toast = useToast();
const confirm = useConfirm();

// Settings state
const defaultSettings = {
    notifications_enabled: false,
    emails_enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    discord_enabled: false,
    slack_enabled: false,
    telegram_enabled: false,
    discord_webhook: '',
    slack_webhook: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    ip_header: 'X-Forwarded-For',
    ai_enabled: false,
    openai_key: ""
};

const settings = reactive({ ...defaultSettings });
const errors = reactive({});
const loading = ref(false);
const saving = ref(false);

// Load settings from the API
const loadSettings = async () => {
    loading.value = true;
    errors.value = {};

    try {
        const response = await fetch('/api/settings');

        if (!response.ok) {
            throw new Error(`Error fetching settings: ${response.statusText}`);
        }

        const data = await response.json();

        // Update settings object with fetched data
        Object.keys(settings).forEach(key => {
            if (data[key] !== undefined) {
                settings[key] = data[key];
            }
        });

        toast.add({
            severity: 'info',
            summary: 'Settings Loaded',
            detail: 'Current settings have been loaded successfully',
            life: 3000
        });
    } catch (error) {
        console.error('Failed to load settings:', error);
        toast.add({
            severity: 'error',
            summary: 'Failed to Load',
            detail: error.message || 'Could not load settings from the server',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

// Save settings to the API
const saveSettings = async () => {
    saving.value = true;
    errors.value = {};

    try {
        const response = await fetch('/api/settings/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (response.status === 400) {
            const errorData = await response.json();
            handleValidationErrors(errorData.errors);
            throw new Error('Validation failed. Please check the form for errors.');
        }

        if (!response.ok) {
            throw new Error(`Error saving settings: ${response.statusText}`);
        }

        toast.add({
            severity: 'success',
            summary: 'Settings Saved',
            detail: 'Your settings have been saved successfully',
            life: 3000
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
        toast.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: error.message || 'Could not save settings to the server',
            life: 5000
        });
    } finally {
        saving.value = false;
    }
};

// Process validation errors from the API
const handleValidationErrors = (validationErrors) => {
    if (!validationErrors || !Array.isArray(validationErrors)) return;

    validationErrors.forEach(err => {
        if (err.path) {
            errors[err.path] = err.msg;
        }
    });
};

// Test SMTP Connection
const testSmtpConnection = async () => {
    if (!settings.smtp_host || !settings.smtp_port) {
        toast.add({
            severity: 'warn',
            summary: 'Missing Information',
            detail: 'SMTP host and port are required',
            life: 3000
        });
        return;
    }

    toast.add({
        severity: 'info',
        summary: 'Testing SMTP',
        detail: 'Testing SMTP connection...',
        life: 3000
    });

    const result = await fetch(`/api/settings/test-smtp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port,
            smtp_user: settings.smtp_user,
            smtp_pass: settings.smtp_pass,
            smtp_from: settings.smtp_from
        })
    });

    if (result.status == 200) {
        toast.add({
            severity: 'success',
            summary: 'SMTP Test',
            detail: 'SMTP connection successful!',
            life: 3000
        });
    } else {
        const errorData = await result.json();
        toast.add({
            severity: 'error',
            summary: 'SMTP Test Failed',
            detail: errorData.message || 'Could not connect to SMTP server',
            life: 5000
        });
    }
};

// Test Discord Webhook
const testDiscordWebhook = async () => {
    if (!settings.discord_webhook) {
        toast.add({
            severity: 'warn',
            summary: 'Missing Information',
            detail: 'Discord webhook URL is required',
            life: 3000
        });
        return;
    }

    toast.add({
        severity: 'info',
        summary: 'Testing Discord',
        detail: 'Sending test message to Discord...',
        life: 3000
    });

    const result = await fetch("/api/settings/test-discord", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            discord_webhook: settings.discord_webhook
        })
    });

    if (result.status == 200) {
        toast.add({
            severity: 'success',
            summary: 'Discord Test',
            detail: 'Test message sent to Discord successfully!',
            life: 3000
        });
    } else {
        const errorData = await result.json();
        toast.add({
            severity: 'error',
            summary: 'Discord Test Failed',
            detail: errorData.message || 'Could not send test message to Discord',
            life: 5000
        });
    }
};

// Test Slack Webhook
const testSlackWebhook = async () => {
    if (!settings.slack_webhook) {
        toast.add({
            severity: 'warn',
            summary: 'Missing Information',
            detail: 'Slack webhook URL is required',
            life: 3000
        });
        return;
    }

    toast.add({
        severity: 'info',
        summary: 'Testing Slack',
        detail: 'Sending test message to Slack...',
        life: 3000
    });

    const result = await fetch("/api/settings/test-slack", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            slack_webhook: settings.slack_webhook
        })
    });

    if (result.status == 200) {
        toast.add({
            severity: 'success',
            summary: 'Slack Test',
            detail: 'Test message sent to Slack successfully!',
            life: 3000
        });
    } else {
        const errorData = await result.json();
        toast.add({
            severity: 'error',
            summary: 'Slack Test Failed',
            detail: errorData.message || 'Could not send test message to Slack',
            life: 5000
        });
    }
};

// Test Telegram Bot
const testTelegramBot = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
        toast.add({
            severity: 'warn',
            summary: 'Missing Information',
            detail: 'Telegram bot token and chat ID are required',
            life: 3000
        });
        return;
    }

    toast.add({
        severity: 'info',
        summary: 'Testing Telegram',
        detail: 'Sending test message to Telegram...',
        life: 3000
    });

    const result = await fetch("/api/settings/test-telegram", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            telegram_bot_token: settings.telegram_bot_token,
            telegram_chat_id: settings.telegram_chat_id
        })
    });

    if (result.status == 200) {
        toast.add({
            severity: 'success',
            summary: 'Telegram Test',
            detail: 'Test message sent to Telegram successfully!',
            life: 3000
        });
    } else {
        const errorData = await result.json();
        toast.add({
            severity: 'error',
            summary: 'Telegram Test Failed',
            detail: errorData.message || 'Could not send test message to Telegram',
            life: 5000
        });
    }
};

// Confirm reset to defaults
const confirmResetDefaults = () => {
    confirm.require({
        message: 'Are you sure you want to reset all settings to their default values?',
        header: 'Reset Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            // Reset settings to defaults
            Object.keys(defaultSettings).forEach(key => {
                settings[key] = defaultSettings[key];
            });

            toast.add({
                severity: 'info',
                summary: 'Settings Reset',
                detail: 'All settings have been reset to their default values',
                life: 3000
            });
        }
    });
};

// Load settings on component mount
onMounted(() => {
    loadSettings();
});
</script>

<style scoped>
.p-password {
    width: 100%;
}
</style>