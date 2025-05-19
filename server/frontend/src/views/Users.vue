<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="card col-span-12">
            <div class="font-semibold text-xl mb-4">Users</div>
            <CreateUserDialog></CreateUserDialog>
            <DataTable :value="users" :paginator="true" :rows="10" dataKey="id" :rowHover="true"
                v-model:filters="filters" filterDisplay="menu" :loading="loading" :globalFilterFields="['id', 'username', 'email', 'role', 'lastLogin']"
                showGridlines :totalRecords="totalRecords" lazy :rowsPerPageOptions="[10, 25, 50]" 
                @page="onPage" v-model:first="first" v-model:rows="rows">
                <template #header>
                    <div class="flex justify-between">
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                        </IconField>
                    </div>
                </template>
                <template #empty> No users found. </template>
                <template #loading> Loading users data. Please wait. </template>
                <Column field="id" header="ID" style="min-width: 5rem">
                    <template #body="{ data }">
                        {{ data.id }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by ID" />
                    </template>
                </Column>
                <Column field="username" header="Username" style="min-width: 10rem">
                    <template #body="{ data }">
                        <div class="text-sm">
                            {{ data.username }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by username" />
                    </template>
                </Column>
                <Column field="email" header="Email" style="min-width: 15rem">
                    <template #body="{ data }">
                        <div class="text-sm">
                            {{ data.email }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by email" />
                    </template>
                </Column>
                <Column field="isActive" header="Status" style="min-width: 8rem">
                    <template #body="{ data }">
                        <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', 
                            data.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                            {{ data.isActive ? 'Active' : 'Inactive' }}
                        </span>
                    </template>
                    <template #filter="{ filterModel }">
                        <Dropdown v-model="filterModel.value" :options="[{label: 'Active', value: true}, {label: 'Inactive', value: false}]" 
                            placeholder="Select Status" />
                    </template>
                </Column>
                <Column field="role" header="Role" style="min-width: 8rem">
                    <template #body="{ data }">
                        <div class="text-sm">
                            {{ data.role }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by role" />
                    </template>
                </Column>
                <Column field="lastLogin" header="Last Login" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.lastLogin) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                    </template>
                </Column>
                <Column field="actions" header="Actions" style="min-width: 8rem">
                    <template #body="{ data }">
                        <Button icon="pi pi-pencil" type="button" class="p-button-text" @click="editUser(data.id)"></Button>
                        <Button icon="pi pi-trash text-red" type="button" class="p-button-text" @click="deleteUser(data.id)"></Button>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import CreateUserDialog from '@/components/users/CreateUserDialog.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

const router = useRouter();
const currentUser = ref({});
const users = ref([]);
const loading = ref(true);
const totalRecords = ref(0);
const first = ref(0);
const rows = ref(10);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: { value: null, matchMode: FilterMatchMode.EQUALS },
    username: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    isActive: { value: null, matchMode: FilterMatchMode.EQUALS },
    role: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lastLogin: { value: null, matchMode: FilterMatchMode.DATE_IS }
});

const loadUsers = async (offset, limit) => {
    loading.value = true;
    try {
        const response = await fetch(`/api/users?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        users.value = data;
        totalRecords.value = data.length;
    } catch (error) {
        console.error('Error loading users:', error);
    } finally {
        loading.value = false;
    }
};

const onPage = (event) => {
    const offset = event.first;
    const limit = event.rows;
    loadUsers(offset, limit);
};

const clearFilter = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.EQUALS },
        username: { value: null, matchMode: FilterMatchMode.CONTAINS },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        isActive: { value: null, matchMode: FilterMatchMode.EQUALS },
        role: { value: null, matchMode: FilterMatchMode.CONTAINS },
        lastLogin: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
    first.value = 0;
    loadUsers(0, rows.value);
};

const formatDate = (value) => {
    if (value) {
        return new Date(value).toLocaleString();
    }
    return '';
};

const deleteUser = async (id) => {
    const response = confirm('Are you sure you want to delete this user?');
    if (!response) return;

    try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadUsers(0, rows.value);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
};

const editUser = (id) => {

    if (currentUser.value.id == id){
        router.push(`/account`);
    } else {
        router.push(`/user/${id}`);
    }

};

onMounted(() => {
    loadUsers(0, rows.value);
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        currentUser.value = user;
    } else {
        window.location.href = '/login';
    }
});
</script>