<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="card col-span-12">
            <div class="flex justify-between items-center mb-4">
                <div class="font-semibold text-xl">User Details</div>
                <div>
                    <Button icon="pi pi-arrow-left" label="Back to Users" outlined class="mr-2" @click="goBack" />
                    <Button icon="pi pi-check" label="Save Changes" @click="saveUser" :loading="saving" />
                </div>
            </div>

            <div v-if="loading" class="flex justify-center my-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="error" class="text-red-500 p-4 border border-red-300 rounded bg-red-50">
                {{ error }}
            </div>

            <div v-else class="grid grid-cols-12 gap-6">
                <!-- User ID and Role -->
                <div class="col-span-12 md:col-span-6">
                    <div class="field">
                        <label for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-400">User ID</label>
                        <InputText id="id" v-model="user.id" class="w-full" disabled />
                    </div>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <div class="field">
                        <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Role</label>
                        <Dropdown id="role" v-model="user.role" :options="roleOptions" optionLabel="label" 
                            optionValue="value" class="w-full" placeholder="Select Role" />
                        <small v-if="validationErrors.role" class="text-red-500">{{ validationErrors.role }}</small>
                    </div>
                </div>

                <!-- Username -->
                <div class="col-span-12">
                    <div class="field">
                        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Username</label>
                        <InputText id="username" v-model="user.username" class="w-full" disabled />
                    </div>
                </div>

                <!-- Email -->
                <div class="col-span-12">
                    <div class="field">
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                        <InputText id="email" v-model="user.email" class="w-full" />
                        <small v-if="validationErrors.email" class="text-red-500">{{ validationErrors.email }}</small>
                    </div>
                </div>

                <!-- First Name and Last Name -->
                <div class="col-span-12 md:col-span-6">
                    <div class="field">
                        <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-400">First Name</label>
                        <InputText id="firstName" v-model="user.firstName" class="w-full" />
                        <small v-if="validationErrors.firstName" class="text-red-500">{{ validationErrors.firstName }}</small>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <div class="field">
                        <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Last Name</label>
                        <InputText id="lastName" v-model="user.lastName" class="w-full" />
                        <small v-if="validationErrors.lastName" class="text-red-500">{{ validationErrors.lastName }}</small>
                    </div>
                </div>

                <!-- Status and Notifications -->
                <div class="col-span-12 md:col-span-6">
                    <div class="field-checkbox">
                        <Checkbox id="isActive" v-model="user.isActive" :binary="true" />
                        <label for="isActive" class="ml-2">Active Account</label>
                    </div>
                </div>

                <div class="col-span-12 md:col-span-6">
                    <div class="field-checkbox">
                        <Checkbox id="isNotificationsEnabled" v-model="user.isNotificationsEnabled" :binary="true" />
                        <label for="isNotificationsEnabled" class="ml-2">Enable Notifications</label>
                    </div>
                </div>

                <!-- Account Information -->
                <div class="col-span-12">
                    <div class="p-4 rounded border">
                        <h3 class="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Account Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500  dark:text-gray-400">Last Login:</span>
                                <span class="ml-2">{{ formatDate(user.lastLogin) }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500  dark:text-gray-400">Created At:</span>
                                <span class="ml-2">{{ formatDate(user.createdAt) }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500  dark:text-gray-400">Updated At:</span>
                                <span class="ml-2">{{ formatDate(user.updatedAt) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const user = ref({
    id: '',
    username: '',
    email: '',
    role: '',
    firstName: '',
    lastName: '',
    isActive: false,
    isNotificationsEnabled: false,
    lastLogin: null,
    createdAt: null,
    updatedAt: null
});

const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const validationErrors = ref({});

const roleOptions = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
    { label: 'Viewer', value: 'VIEWER' }
];

// Manual validation function
const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!user.value.email) {
        errors.email = 'Email is required';
    } else if (!isValidEmail(user.value.email)) {
        errors.email = 'Email format is invalid';
    }
    
    // First name validation
    if (!user.value.firstName) {
        errors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!user.value.lastName) {
        errors.lastName = 'Last name is required';
    }
    
    // Role validation
    if (!user.value.role) {
        errors.role = 'Role is required';
    } else if (!['ADMIN', 'USER', 'VIEWER'].includes(user.value.role)) {
        errors.role = 'Role must be one of: ADMIN, USER, VIEWER';
    }
    
    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
};

// Email validation helper
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Load user data
const loadUser = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const userId = route.params.id;
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load user data: ${response.statusText}`);
        }
        
        const userData = await response.json();
        user.value = userData;
    } catch (err) {
        error.value = `Error loading user: ${err.message}`;
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Save user changes
const saveUser = async () => {
    const isValid = validateForm();
    
    if (!isValid) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Please correct the errors before saving.', life: 3000 });
        return;
    }
    
    saving.value = true;
    
    try {
        const userId = route.params.id;
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.value.email,
                firstName: user.value.firstName,
                lastName: user.value.lastName,
                isActive: user.value.isActive,
                isNotificationsEnabled: user.value.isNotificationsEnabled,
                role: user.value.role
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update user');
        }
        
        toast.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully', life: 3000 });
        
        // Reload user data to get updated timestamps
        await loadUser();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message, life: 3000 });
        console.error(err);
    } finally {
        saving.value = false;
    }
};

const goBack = () => {
    router.push('/users');
};

const formatDate = (value) => {
    if (value) {
        return new Date(value).toLocaleString();
    }
    return 'N/A';
};

onMounted(() => {
    loadUser();
});
</script>