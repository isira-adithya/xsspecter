<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="card col-span-12">
      <Toast />
      <ConfirmDialog group="positioned"></ConfirmDialog>
      <div class="card-body p-6">
        <h2 class="text-2xl font-semibold mb-6">Account Details</h2>

        <form @submit.prevent="updateAccountDetails">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Username -->
            <div class="field">
              <label for="username" class="block text-sm font-medium mb-2">Username</label>
              <InputText id="username" v-model="accountDetails.username" class="w-full" disabled
                :class="{ 'p-invalid': errors.username }" @blur="validateField('username')" />
              <small v-if="errors.username" class="p-error">{{ errors.username }}</small>
            </div>

            <!-- Email -->
            <div class="field">
              <label for="email" class="block text-sm font-medium mb-2">Email</label>
              <InputText id="email" v-model="accountDetails.email" type="email" class="w-full"
                :class="{ 'p-invalid': errors.email }" @blur="validateField('email')" />
              <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
            </div>

            <!-- First Name -->
            <div class="field">
              <label for="firstName" class="block text-sm font-medium mb-2">First Name</label>
              <InputText id="firstName" v-model="accountDetails.firstName" class="w-full"
                :class="{ 'p-invalid': errors.firstName }" @blur="validateField('firstName')" />
              <small v-if="errors.firstName" class="p-error">{{ errors.firstName }}</small>
            </div>

            <!-- Last Name -->
            <div class="field">
              <label for="lastName" class="block text-sm font-medium mb-2">Last Name</label>
              <InputText id="lastName" v-model="accountDetails.lastName" class="w-full"
                :class="{ 'p-invalid': errors.lastName }" @blur="validateField('lastName')" />
              <small v-if="errors.lastName" class="p-error">{{ errors.lastName }}</small>
            </div>

            <!-- Role Display (not editable) -->
            <div class="field">
              <label for="role" class="block text-sm font-medium mb-2">Role</label>
              <Dropdown id="role" v-model="accountDetails.role" :options="roles" optionLabel="name" optionValue="code"
                placeholder="Select Role" class="w-full" disabled />
            </div>

            <!-- Account Status (only editable for ADMIN) -->
            <div class="field"
              v-if="accountDetails.role === 'ADMIN' && router.currentRoute.value.fullPath !== '/account'">
              <label for="isActive" class="block text-sm font-medium mb-2">Account Status</label>
              <div class="flex align-items-center">
                <InputSwitch id="isActive" v-model="accountDetails.isActive" class="mr-2" />
                <span>{{ accountDetails.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
            </div>

            <!-- Email Notifications -->
            <div class="field flex items-center justify-between">
              <label for="notifications_enabled" class="font-medium">Email Notifications</label>
              <InputSwitch id="notifications_enabled" v-model="accountDetails.isNotificationsEnabled" />
            </div>
          </div>

          <div class="mt-8 flex justify-end">
            <Button type="button" label="Cancel" class="p-button-outlined mr-3" @click="resetForm" />
            <Button type="submit" label="Save Changes" :loading="saving" />
          </div>
        </form>

        <Divider />

        <div>
          <h2 class="text-2xl font-semibold mb-6">Change Password</h2>
          <p class="text-sm text-gray-600">
            To change your password, enter a new password and confirm it.
          </p>
          <form @submit.prevent="changePassword">
            <div class="grid grid-rows-1 gap-6">

              <!-- Current Password -->
              <div class="field">
                <label for="currentPassword" class="block text-sm font-medium mb-2">Current Password</label>
                <Password id="currentPassword" v-model="oldPassword" :feedback="false" toggleMask
                  :class="{ 'p-invalid': errors.password }" @blur="validateField('password')" />
                <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
                <!-- New Password -->
                <div class="field">
                  <label for="newPassword" class="block text-sm font-medium mb-2">New Password</label>
                  <Password id="newPassword" v-model="newPassword" :feedback="false" toggleMask
                    :class="{ 'p-invalid': errors.password }" @blur="validateField('password')" />
                  <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
                </div>

                <!-- Confirm New Password -->
                <div class="field">
                  <label for="confirmNewPassword" class="block text-sm font-medium mb-2">Confirm New Password</label>
                  <Password id="confirmNewPassword" v-model="confirmPassword" :feedback="false" toggleMask
                    :class="{ 'p-invalid': errors.confirmPassword }" @blur="validateField('confirmPassword')" />
                  <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
                </div>
              </div>
            </div>

            <div class="mt-8 flex justify-end">
              <Button type="button" label="Cancel" class="p-button-outlined mr-3" @click="resetForm" />
              <Button type="submit" label="Change Password" :loading="saving" />
            </div>
          </form>
        </div>

        <Divider />

        <div class="mb-12">
          <h2 class="text-2xl font-semibold mb-6">API Token</h2>
          <p class="text-sm text-gray-600">
            Your API token is used to authenticate requests to the API. Keep it secret!
          </p>
          <p class="text-sm text-gray-600">
            <strong>Note:</strong> If you generate a new token, the old one will be invalidated.
          </p>
          <div class="field" v-if="accountDetails.role !== 'VIEWER'">
            <label for="apiToken" class="block text-sm font-medium mb-2">API Token</label>
            <div class="p-inputgroup">
              <InputText id="apiToken" v-model="accountDetails.apiToken" class="w-full" readonly />
              <Button icon="pi pi-copy" @click="copyApiToken" class="p-button-secondary" title="Copy to clipboard" />
              <Button icon="pi pi-refresh" @click="generateNewApiToken" class="p-button-secondary"
                title="Generate new token" />
            </div>
          </div>
        </div>


        <Divider />

        <div class="mb-12">
          <h2 class="text-2xl font-semibold mb-6">Account Activity</h2>
          <p class="text-sm text-gray-600">Last login: {{ accountDetails.lastLogin || 'N/A' }}</p>
          <p class="text-sm text-gray-600">Account created: {{ accountDetails.createdAt || 'N/A' }}</p>
        </div>

        <Divider />

        <div>
          <h2 class="text-2xl font-semibold mb-6">Danger Zone</h2>
          <p class="text-sm text-gray-600">
            If you want to delete your account, you can delete by clicking the below button. This action cannot be
            undone.
          </p>
          <div class="mt-8 flex justify-start">
            <Button type="button" label="Delete Account" class="p-button-danger" @click="deleteAccount" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue';
import { Divider } from 'primevue';

// Components import
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import router from '@/router';

const toast = useToast();
const confirm = useConfirm();
const saving = ref(false);

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const accountDetails = ref({
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  apiToken: '',
  role: '',
  isActive: true
});

const errors = ref({
  username: '',
  email: '',
  firstName: '',
  lastName: ''
});

const originalAccountDetails = ref({});

// Role options
const roles = [
  { name: 'Administrator', code: 'ADMIN' },
  { name: 'User', code: 'USER' },
  { name: 'Viewer', code: 'VIEWER' }
];

// Manual validation functions
const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  return '';
};

const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Please enter a valid email address';
  return '';
};

const validateName = (name, fieldName) => {
  if (!name) return `${fieldName} is required`;
  return '';
};

const validateField = (fieldName) => {
  switch (fieldName) {
    case 'username':
      errors.value.username = validateUsername(accountDetails.value.username);
      break;
    case 'email':
      errors.value.email = validateEmail(accountDetails.value.email);
      break;
    case 'firstName':
      errors.value.firstName = validateName(accountDetails.value.firstName, 'First name');
      break;
    case 'lastName':
      errors.value.lastName = validateName(accountDetails.value.lastName, 'Last name');
      break;
  }
};

const validateForm = () => {
  // Validate all fields
  errors.value.username = validateUsername(accountDetails.value.username);
  errors.value.email = validateEmail(accountDetails.value.email);
  errors.value.firstName = validateName(accountDetails.value.firstName, 'First name');
  errors.value.lastName = validateName(accountDetails.value.lastName, 'Last name');

  // Check if there are any errors
  return !Object.values(errors.value).some(error => error);
};

const retrieveAccountDetails = async () => {
  try {
    const response = await fetch('/api/users/me');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    if (data.apiToken == null) {
      data.apiToken = 'Not available';
    }
    accountDetails.value = data;
    originalAccountDetails.value = { ...data };
  } catch (error) {
    console.error('Error fetching account details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load account details',
      life: 3000
    });
  }
};

const updateAccountDetails = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please check the form for errors',
      life: 3000
    });
    return;
  }

  saving.value = true;

  try {
    // Don't send confirmPassword to the API
    const dataToSend = { ...accountDetails.value };
    delete dataToSend.confirmPassword;

    // Only send password if it was changed
    if (!dataToSend.password) {
      delete dataToSend.password;
    }

    const response = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // Reset all errors
    Object.keys(errors.value).forEach(key => {
      errors.value[key] = '';
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Account details updated successfully',
      life: 3000
    });

    retrieveAccountDetails();
  } catch (error) {
    console.error('Error updating account details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update account details',
      life: 3000
    });
    retrieveAccountDetails();
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  accountDetails.value = { ...originalAccountDetails.value };

  // Clear all validation errors
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = '';
  });
};

const copyApiToken = () => {
  navigator.clipboard.writeText(accountDetails.value.apiToken)
    .then(() => {
      toast.add({
        severity: 'info',
        summary: 'Copied',
        detail: 'API token copied to clipboard',
        life: 2000
      });
    })
    .catch(err => {
      console.error('Could not copy text: ', err);
    });
};

const generateNewApiToken = async () => {
  try {
    const response = await fetch('/api/users/generate-token', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    accountDetails.value.apiToken = data.apiToken;

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'New API token generated',
      life: 3000
    });
  } catch (error) {
    console.error('Error generating new API token:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to generate new API token',
      life: 3000
    });
  }
};

const validatePasswords = () => {
  if (!oldPassword.value) return 'Current password is required';
  if (!newPassword.value) return 'New password is required';
  if (newPassword.value !== confirmPassword.value) return 'Passwords do not match';
  return '';
};

const changePassword = async () => {
  const passwordError = validatePasswords();
  if (passwordError) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: passwordError,
      life: 3000
    });
    return;
  }

  saving.value = true;

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Current password is incorrect',
          life: 3000
        });
        return;
      }
      throw new Error('Network response was not ok');
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password changed successfully',
      life: 3000
    });

    resetForm();
  } catch (error) {
    console.error('Error changing password:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to change password',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
}

const deleteAccount = async () => {
  confirm.require({
    group: 'positioned',
    message: 'Are you sure you want to delete your account? This action cannot be undone.',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    position: 'top',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      text: true
    },
    acceptProps: {
      label: 'Delete',
      text: true,
      severity: 'danger'
    },
    accept: async () => {
      try {
        const response = await fetch('/api/users/me', {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: errorData.message,
              life: 3000
            });
            return;
          }

          throw new Error('Network response was not ok');
        }

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Account deleted successfully',
          life: 3000
        });

        window.setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete account',
          life: 3000
        });
      }
    },
    reject: () => {

    }
  });
};

onMounted(() => {
  retrieveAccountDetails();
});
</script>