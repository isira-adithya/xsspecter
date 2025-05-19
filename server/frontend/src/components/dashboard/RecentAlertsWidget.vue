<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  recentAlerts: {
    type: Array,
    default: () => []
  }
});

const recentAlerts = ref([]);

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function shortenUserAgent(ua) {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('MSIE') || ua.includes('Trident')) return 'Internet Explorer';
  return 'Other';
}

onMounted(() => {
  // Simulate fetching recent alerts from props
  recentAlerts.value = props.recentAlerts;
});
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Recent Alerts</div>
    <DataTable :value="recentAlerts" :rows="5" :paginator="true" responsiveLayout="scroll">
      <Column field="id" header="ID" :sortable="true" style="width: 10%"></Column>
      <Column field="timestamp" header="Timestamp" :sortable="true" style="width: 25%">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.timestamp) }}
        </template>
      </Column>
      <Column field="domain" header="Domain" :sortable="true" style="width: 30%"></Column>
      <Column field="userAgent" header="Browser" :sortable="true" style="width: 20%">
        <template #body="slotProps">
          {{ shortenUserAgent(slotProps.data.userAgent) }}
        </template>
      </Column>
      <Column style="width: 15%" header="Actions">
        <template #body="slotProps">
          <Button icon="pi pi-search" type="button" class="p-button-text" @click="$router.push(`/alert/${slotProps.data.id}`)"></Button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>