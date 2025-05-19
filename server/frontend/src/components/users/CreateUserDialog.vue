<template>
    <div class="flex justify-end m-3">
        <Button label="Add New User" @click="visible = true" />
        <Dialog v-model:visible="visible" modal header="Create New User" :style="{ width: '30rem' }">
            <span class="text-surface-500 dark:text-surface-400 block mb-6">Create a new user account.</span>
            
            <div class="flex flex-col gap-4">
                <!-- Username -->
                <div class="flex flex-col gap-2">
                    <label for="username" class="font-semibold">Username*</label>
                    <InputText id="username" v-model="newUser.username" class="w-full" autocomplete="off" />
                    <small v-if="validationErrors.username" class="text-red-500">{{ validationErrors.username }}</small>
                </div>
                
                <!-- Email -->
                <div class="flex flex-col gap-2">
                    <label for="email" class="font-semibold">Email*</label>
                    <InputText id="email" v-model="newUser.email" class="w-full" autocomplete="off" />
                    <small v-if="validationErrors.email" class="text-red-500">{{ validationErrors.email }}</small>
                </div>
                
                <!-- First and Last Name -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="firstName" class="font-semibold">First Name (Optional)</label>
                        <InputText id="firstName" v-model="newUser.firstName" class="w-full" autocomplete="off" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="lastName" class="font-semibold">Last Name (Optional)</label>
                        <InputText id="lastName" v-model="newUser.lastName" class="w-full" autocomplete="off" />
                    </div>
                </div>
                
                <!-- Password -->
                <div class="flex flex-col gap-2">
                    <label for="password" class="font-semibold">Password*</label>
                    <Password id="password" v-model="newUser.password" class="w-full" inputClass="w-full" toggleMask />
                    <small v-if="validationErrors.password" class="text-red-500">{{ validationErrors.password }}</small>
                </div>
                
                <!-- Repeat Password -->
                <div class="flex flex-col gap-2">
                    <label for="repeatPassword" class="font-semibold">Repeat Password*</label>
                    <Password id="repeatPassword" v-model="newUser.repeatPassword" class="w-full" inputClass="w-full" toggleMask />
                    <small v-if="validationErrors.repeatPassword" class="text-red-500">{{ validationErrors.repeatPassword }}</small>
                </div>
            </div>
            
            <div v-if="submitError" class="mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded">
                {{ submitError }}
            </div>
            
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="closeDialog"/>
                <Button label="Create User" severity="primary" @click="createUser"/>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useToast } from 'primevue/usetoast';

const visible = ref(false);
const toast = useToast();
const submitError = ref('');

const newUser = reactive({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    repeatPassword: ''
});

const validationErrors = ref({});

// Validation function
const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (!newUser.username) {
        errors.username = 'Username is required';
    } else if (newUser.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
    }
    
    // Email validation
    if (!newUser.email) {
        errors.email = 'Email is required';
    } else if (!isValidEmail(newUser.email)) {
        errors.email = 'Email format is invalid';
    }
    
    // Password validation
    if (!newUser.password) {
        errors.password = 'Password is required';
    } else if (newUser.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
    }
    
    // Repeat password validation
    if (!newUser.repeatPassword) {
        errors.repeatPassword = 'Please confirm your password';
    } else if (newUser.password !== newUser.repeatPassword) {
        errors.repeatPassword = 'Passwords do not match';
    }
    
    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
};

// Email validation helper
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


// Reset form to initial state
const resetForm = () => {
    Object.keys(newUser).forEach(key => {
        newUser[key] = '';
    });
    validationErrors.value = {};
    submitError.value = '';
};

// Close dialog and reset form
const closeDialog = () => {
    visible.value = false;
    resetForm();
};

// Create user function
const createUser = async () => {
    // Validate form first
    if (!validateForm()) {
        return;
    }
    
    submitError.value = '';
    
    try {
        // Prepare user data for submission (exclude repeatPassword)
        const userData = {
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
            firstName: newUser.firstName || undefined, // Only include if not empty
            lastName: newUser.lastName || undefined    // Only include if not empty
        };
        
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (response.status === 200) {
            visible.value = false;
            resetForm();
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'User created successfully',
                life: 3000
            });
        } else {
            const errorData = await response.json();
            submitError.value = errorData.message || 'Failed to create user';
        }
    } catch (error) {
        console.error('Error creating user:', error);
        submitError.value = 'An unexpected error occurred. Please try again.';
    }
};
</script>