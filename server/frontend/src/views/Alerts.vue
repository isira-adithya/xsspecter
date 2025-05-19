<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="card col-span-12">
            <div class="font-semibold text-xl mb-4">Alerts</div>
            <DataTable :value="alerts" :paginator="true" :rows="10" dataKey="id" :rowHover="true"
                v-model:filters="filters" filterDisplay="menu" :loading="loading" :globalFilterFields="['id', 'userAgent', 'document.URL', 'timestamp']"
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
                <template #empty> No alerts found. </template>
                <template #loading> Loading alerts data. Please wait. </template>
                <Column field="id" header="ID" style="min-width: 5rem">
                    <template #body="{ data }">
                        {{ data.id }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by ID" />
                    </template>
                </Column>
                <Column field="document.URL" header="URL" style="min-width: 20rem">
                    <template #body="{ data }">
                        <div class="text-sm truncate max-w-lg" :title="data.document.URL">
                            {{ data.document.URL }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by URL" />
                    </template>
                </Column>
                <Column field="timestamp" header="Timestamp" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.timestamp) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />
                    </template>
                </Column>
                <Column field="userAgent" header="User Agent" style="min-width: 20rem">
                    <template #body="{ data }">
                        <div class="text-sm truncate max-w-lg" :title="data.userAgent">
                            {{ data.userAgent }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by user agent" />
                    </template>
                </Column>
                <Column field="ip" header="IP Address" style="min-width: 20rem">
                    <template #body="{ data }">
                        <div class="text-sm truncate max-w-lg" :title="data.userAgent">
                            {{ data.ip }}
                        </div>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search by user agent" />
                    </template>
                </Column>
                <Column field="document" header="Actions" style="min-width: 5rem">
                    <template #body="{ data }">
                        <router-link :to="`/alert/${data.id}`"><Button icon="pi pi-search" type="button" class="p-button-text"></Button></router-link>
                        <Button icon="pi pi-trash text-red" type="button" class="p-button-text" @click="deleteAlert(data.id)"></Button>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

const alerts = ref([]);
const loading = ref(true);
const totalRecords = ref(0);
const first = ref(0);
const rows = ref(10);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: { value: null, matchMode: FilterMatchMode.EQUALS },
    'document.URL': { value: null, matchMode: FilterMatchMode.CONTAINS },
    userAgent: { value: null, matchMode: FilterMatchMode.CONTAINS },
    timestamp: { value: null, matchMode: FilterMatchMode.DATE_IS }
});

const loadAlerts = async (offset, limit) => {
    loading.value = true;
    try {
        const response = await fetch(`/api/alerts?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        alerts.value = data.data;
        totalRecords.value = data.totalCount;
    } catch (error) {
        console.error('Error loading alerts:', error);
    } finally {
        loading.value = false;
    }
};

const onPage = (event) => {
    const offset = event.first;
    const limit = event.rows;
    loadAlerts(offset, limit);
};

const clearFilter = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.EQUALS },
        'document.URL': { value: null, matchMode: FilterMatchMode.CONTAINS },
        userAgent: { value: null, matchMode: FilterMatchMode.CONTAINS },
        timestamp: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
    first.value = 0;
    loadAlerts(0, rows.value);
};

const formatDate = (value) => {
    if (value) {
        return new Date(value).toLocaleString();
    }
    return '';
};

const deleteAlert = async (id) => {
    const response = confirm('Are you sure you want to delete this alert?');
    if (!response) return;

    try {
        const response = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadAlerts(0, rows.value);
        }
    } catch (error) {
        console.error('Error deleting alert:', error);
    }
};

onMounted(() => {
    loadAlerts(0, rows.value);
});
</script>