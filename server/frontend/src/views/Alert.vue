<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div v-if="loading" class="flex justify-center items-center h-64">
        <i class="pi pi-spin pi-spinner text-4xl"></i>
        <span class="ml-2">Loading alert details...</span>
      </div>

      <div v-else-if="error" class="flex justify-center items-center h-64 text-red-500">
        <i class="pi pi-exclamation-triangle text-4xl"></i>
        <span class="ml-2">{{ error }}</span>
      </div>

      <div v-else>
        <!-- Header with basic info -->
        <ConfirmDialog></ConfirmDialog>
        <Toast />
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold mb-2">Alert #{{ alert.id }}</h1>
            <div class="text-gray-500">{{ formatDate(alert.timestamp) }}</div>
          </div>
          <div>
            <Button v-if="alert['Report'] == null" severity="info" label="Generate Report"
              :loading="reportGenerationBusy" icon="pi pi-bolt" class="mr-5" @click="generateReport(false)" />
            <Button label="Back to List" icon="pi pi-arrow-left" @click="goBack" />
          </div>
        </div>

        <!-- Quick summary cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" v-if="alert.document">
          <Card class="shadow-sm">
            <template #title>Domain</template>
            <template #content>
              <div class="flex items-center">
                <i class="pi pi-globe text-xl mr-2"></i>
                <span class="font-medium">{{ alert.document.domain }}</span>
              </div>
            </template>
          </Card>

          <Card class="shadow-sm">
            <template #title>URL</template>
            <template #content>
              <div class="truncate">
                <i class="pi pi-link text-xl mr-2"></i>
                <span class="font-medium">{{ alert.document.URL }}</span>
              </div>
            </template>
          </Card>

          <Card class="shadow-sm" v-if="alert.timezone">
            <template #title>Timezone</template>
            <template #content>
              <div class="flex items-center">
                <i class="pi pi-clock text-xl mr-2"></i>
                <span class="font-medium">{{ alert.timezone }}</span>
              </div>
            </template>
          </Card>
        </div>

        <!-- Tabbed interface for all the details -->
        <TabView>
          <!-- Overview Tab -->
          <TabPanel header="Overview">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-medium mb-3">Browser Details</h3>
                <div class="p-4 rounded-lg mb-4">
                  <div class="mb-2">
                    <span class="font-medium text-gray-700 dark:text-gray-400">IP Address:</span>
                    <p><a
                        class="text-sm mt-2 ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-100 dark:hover:text-blue-400"
                        :href="`https://ipinfo.io/${alert.ip}`" target="_blank">{{ alert.ip }}</a></p>
                  </div>
                  <div class="mb-2">
                    <span class="font-medium text-gray-700 dark:text-gray-400">User Agent:</span>
                    <div class="text-sm mt-1 p-2 rounded break-all ">{{ alert.userAgent }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">In Iframe:</span>
                    <br>
                    <Badge class="mt-1 ml-2" :value="alert.isInIframe ? 'Yes' : 'No'"
                      :severity="alert.isInIframe ? 'warning' : 'info'" />
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-medium mb-3">Document Information</h3>
                <div class="p-4 rounded-lg">
                  <div class="grid grid-cols-2 gap-x-4 gap-y-2" v-if="alert.document">
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Title:</span> {{
                      alert.document.title }}
                    </div>
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Ready State:</span> {{
                      alert.document.readyState }}</div>
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Character Set:</span> {{
                      alert.document.characterSet }}</div>
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Content Type:</span> {{
                      alert.document.contentType }}</div>
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Design Mode:</span> {{
                      alert.document.designMode }}</div>
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Children:</span> {{
                      alert.document.children
                    }}</div>
                    <div><span class="font-medium text-gray-700 dark:text-gray-400">Last Modified:</span> {{
                      alert.document.lastModified }}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-medium mb-3">Cookies</h3>
                <div class="p-4 rounded-lg mb-4">
                  <div class="mb-6">
                    <span class="font-medium text-gray-700 dark:text-gray-400">Raw Cookies</span>
                    <div class="text-sm mt-1"><code>{{ alert.cookies }}</code></div>
                  </div>
                  <div class="mb-2">
                    <span class="font-medium text-gray-700 dark:text-gray-400">Parsed:</span>
                    <div class="text-sm mt-1">
                      <div class="border rounded max-h-24 overflow-y-auto">
                        <table class="min-w-full">
                          <tbody>
                            <tr v-for="(value, key) in alert.cookiesObj" :key="key"
                              class="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td class="py-2 px-3 font-medium">{{ key }}:</td>
                              <td class="py-2 px-3 text-green-700 dark:text-green-300 break-all">{{ value }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div class="text-xs text-gray-500 mt-1 italic" v-if="Object.keys(alert.cookiesObj).length > 3">
                        Scroll to see all cookies
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>

                <h3 class="text-lg font-medium mb-3">Time Information</h3>
                <div class="p-4 rounded-lg mb-4">
                  <div class="mb-2">
                    <span class="font-medium text-gray-700 dark:text-gray-400">Current Time:</span>
                    <div class="text-sm mt-1">{{ alert.currentTime }}</div>
                  </div>
                  <div class="mb-2">
                    <span class="font-medium text-gray-700 dark:text-gray-400">Timezone:</span>
                    <div class="text-sm mt-1">{{ alert.timezone }} ({{ alert.timezoneName }})</div>
                  </div>
                </div>
              </div>


              <!-- Screenshot -->
              <div v-if="alert.containsScreenshot" class="col-span-2">
                <h3 class="text-lg font-medium mb-3">Screenshot</h3>
                <div class="p-4 rounded-lg">
                  <img :src="`/api/alerts/${alert.id}/screenshot`" alt="Screenshot" class="mb-4" />
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Location Tab -->
          <TabPanel header="Location" v-if="alert.location">
            <div class="mb-4">
              <div class="flex items-center mb-2">
                <i class="pi pi-link text-lg mr-2"></i>
                <h3 class="text-lg font-medium">URL Breakdown</h3>
              </div>
              <div class="p-4 rounded-lg">
                <div class="mb-2">
                  <span class="font-medium text-gray-700 dark:text-gray-400">Full URL:</span>
                  <div class="text-sm mt-1 p-2 rounded break-all">{{ alert.location.href }}</div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Protocol:</span>
                    <br>
                    <Badge :value="alert.location.protocol" severity="info" class="mt-1" />
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Origin:</span>
                    <div class="text-sm mt-1">{{ alert.location.origin }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Host:</span>
                    <div class="text-sm mt-1">{{ alert.location.host }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Hostname:</span>
                    <div class="text-sm mt-1">{{ alert.location.hostname }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Port:</span>
                    <div class="text-sm mt-1">{{ alert.location.port || '(default)' }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Pathname:</span>
                    <div class="text-sm mt-1">{{ alert.location.pathname }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Search:</span>
                    <div class="text-sm mt-1 p-2 rounded" v-if="alert.location.search">{{ alert.location.search }}</div>
                    <div class="text-sm mt-1 text-gray-300" v-else>(none)</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-400">Hash:</span>
                    <div class="text-sm mt-1 p-2 rounded" v-if="alert.location.hash">{{ alert.location.hash }}</div>
                    <div class="text-sm mt-1 text-gray-300" v-else>(none)</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="alert.document.referrer">
              <div class="flex items-center">
                <i class="pi pi-arrow-right text-lg mr-2"></i>
                <h3 class="text-lg font-medium">Referrer</h3>
              </div>
              <div class="pl-4 rounded-lg">
                <div class="text-sm p-2 rounded break-all">{{ alert.document.referrer }}</div>
              </div>
            </div>
          </TabPanel>

          <!-- Scripts Tab -->
          <TabPanel header="Scripts" :badge="alert.scripts.length">
            <DataTable :value="alert.scripts" class="p-datatable-sm" showGridlines dataKey="id">
              <Column field="id" header="ID" style="width: 5rem;"></Column>
              <Column field="src" header="Source">
                <template #body="{ data }">
                  <div v-if="data.src" class="break-all">{{ data.src }}</div>
                  <div v-else class="text-gray-500 italic">(inline script)</div>
                </template>
              </Column>
              <Column field="type" header="Type">
                <template #body="{ data }">
                  <div v-if="data.type">{{ data.type }}</div>
                  <div v-else class="text-gray-500 italic">(default)</div>
                </template>
              </Column>
              <Column field="async" header="Async">
                <template #body="{ data }">
                  <i :class="data.async ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
              </Column>
              <Column field="defer" header="Defer">
                <template #body="{ data }">
                  <i :class="data.defer ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Meta Tags Tab -->
          <TabPanel v-if="alert.metaTags" header="Meta Tags" :badge="alert.metaTags.length">
            <DataTable :value="alert.metaTags" class="p-datatable-sm" showGridlines dataKey="id">
              <Column field="id" header="ID" style="width: 5rem;"></Column>
              <Column field="name" header="Name">
                <template #body="{ data }">
                  <div v-if="data.name">{{ data.name }}</div>
                  <div v-else class="text-gray-500 italic">(not set)</div>
                </template>
              </Column>
              <Column field="httpEquiv" header="HTTP-Equiv">
                <template #body="{ data }">
                  <div v-if="data.httpEquiv">{{ data.httpEquiv }}</div>
                  <div v-else class="text-gray-500 italic">(not set)</div>
                </template>
              </Column>
              <Column field="property" header="Property">
                <template #body="{ data }">
                  <div v-if="data.property">{{ data.property }}</div>
                  <div v-else class="text-gray-500 italic">(not set)</div>
                </template>
              </Column>
              <Column field="content" header="Content">
                <template #body="{ data }">
                  <div v-if="data.content" class="break-all">{{ data.content }}</div>
                  <div v-else class="text-gray-500 italic">(empty)</div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Document Source -->
          <TabPanel v-if="alert['DocumentSource']" header="Source (HTML)" class="flex flex-col h-screen">
            <div class="p-4 rounded-lg overflow-auto flex-grow">
              <div class="flex justify-end mb-2">
                <Button label="Copy Source" icon="pi pi-copy" class="p-button-sm"
                  @click="copyToClipboard(alert['DocumentSource']['document'])" />
              </div>
              <iframe :srcdoc="documentSourceParsed" style="width: 100%; height: 80vh;"></iframe>
            </div>
          </TabPanel>

          <!-- TrackedRequest Source -->
          <TabPanel v-if="alert['TrackingID']" header="Injection Point" class="flex flex-col h-screen">
            <div class="p-4 rounded-lg overflow-auto flex-grow">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium">Injection Point Details</h3>
                  <Badge :value="alert.TrackingID.trackingId" severity="warning" />
                </div>

                <Card class="shadow-sm">
                  <template #title>
                    <div class="flex items-center">
                      <i class="pi pi-globe text-xl mr-2"></i>
                      Request Information
                    </div>
                  </template>
                  <template #content>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span class="font-medium text-gray-700 dark:text-gray-400">URL:</span>
                        <p class="text-sm mt-1 break-all">{{ alert.TrackingID.url }}</p>
                      </div>
                      <div>
                        <span class="font-medium text-gray-700 dark:text-gray-400">Method:</span>
                        <Badge class="mt-1 ml-2" :value="alert.TrackingID.method" severity="info" />
                      </div>
                      <div>
                        <span class="font-medium text-gray-700 dark:text-gray-400">Content Type:</span>
                        <p class="text-sm mt-1">{{ alert.TrackingID.contentType }}</p>
                      </div>
                      <div>
                        <span class="font-medium text-gray-700 dark:text-gray-400">Timestamp:</span>
                        <p class="text-sm mt-1">{{ formatDate(alert.TrackingID.createdAt) }}</p>
                      </div>
                    </div>
                  </template>
                </Card>

                <Card class="shadow-sm">
                  <template #title>
                    <div class="flex items-center">
                      <i class="pi pi-database text-xl mr-2"></i>
                      Request Data
                    </div>
                  </template>
                  <template #content>
                    <div class="overflow-auto">
                      <pre
                        class="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{{ JSON.stringify(JSON.parse(alert.TrackingID.data), null, 2) }}</pre>
                      <div class="flex justify-end mt-2">
                        <Button label="Copy Data" icon="pi pi-copy" class="p-button-sm p-button-outlined"
                          @click="copyToClipboard(alert.TrackingID.data)" />
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </TabPanel>

          <!-- Report -->
          <TabPanel v-if="alert['Report']" header="Report" class="flex flex-col h-screen">
            <div class="p-4 rounded-lg overflow-auto flex-grow">
              <div class="space-y-4">
                <div class="flex justify-end mb-2">
                  <Button severity="info" label="Regenerate Report" :loading="reportGenerationBusy" icon="pi pi-bolt"
                    class="mr-2" @click="generateReport(true)" />
                  <Button label="Copy Source" icon="pi pi-copy" class="p-button-sm mr-2"
                    @click="copyToClipboard(alert['Report']['description'])" />
                  <Button severity="success" label="Download PDF" icon="pi pi-file-pdf" class=""
                    @click="generatePDF" />
                </div>
                <iframe id="report-iframe" :srcdoc="reportSourceParsed" style="width: 100%; height: 80vh;"></iframe>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfirm } from 'primevue';
import { useToast } from "primevue/usetoast";
import { marked } from 'marked';


// primevue functions
const toast = useToast();
const confirm = useConfirm();

const route = useRoute();
const router = useRouter();
const alert = ref(null);
const loading = ref(true);
const error = ref(null);
const reportGenerationBusy = ref(false);
const documentSourceParsed = ref(null);
const reportSourceParsed = ref(null);

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(date);
};

// Navigate back to the alerts list
const goBack = () => {
  router.push('/alerts');
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

// Generate PDF from iframe content
const generatePDF = () => {

  var script = document.createElement('script');
  script.type = 'application/javascript';
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  document.head.appendChild(script);
  script.onload = async () => {
    const iframe = document.querySelector('#report-iframe');
    const content = iframe.contentDocument.documentElement.outerHTML;

    // Create a temporary container with the iframe content
    const container = document.createElement('div');
    container.innerHTML = content.replace('class="markdown-body"', 'style="color: black; background-color: white;"');
    const pdfStyles = `<style>
    h1, h2, h3, h4, h5, h6 {
      color: #1f2937; /* Dark gray */
    }
    </style>`;
    container.innerHTML = container.innerHTML.replace('<!-- REPLACE-WITH-STYLES -->', pdfStyles);
    // Change img size to fit PDF
    const images = container.querySelectorAll('img');

    images.forEach(async (img) => {
      if (img.src.includes('screenshot')) {

        const imageContent = await fetch(`/api/alerts/${alert.value.id}/screenshot`);
        const blob = await imageContent.blob();
        const imgUrl = URL.createObjectURL(blob);

        img.src = imgUrl;
        // get current width and height
        const width = img.width;
        const height = img.height;
        console.log(`Image dimensions: ${width}x${height}`);

        // if image width is over 1200px then scale both width and height relatively until width is 1200px
        if (width > 1200) {
          const scale = 1200 / width;
          img.style.width = `${width * scale}px`;
          img.style.height = `${height * scale}px`;
          img.width = `${width * scale}px`;
          img.height = `${height * scale}px`;
          console.log(`Scaled image dimensions: ${img.style.width}x${img.style.height}`);
        }
      }
    });

    // Configure pdf options
    const options = {
      margin: 10,
      filename: `alert-report-${alert.value.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'portrait' }
    };

    html2pdf().from(container).set(options).save();
  };


};

// generate ai report
const generateReport = async (force = false) => {
  confirm.require({
    message: 'Proceeding may use AI credits. Would you like to continue?',
    header: 'Confirmation',
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Confirm'
    },
    accept: async () => {
      reportGenerationBusy.value = true;
      try {
        const alertId = route.params.id;
        const response = await fetch(`/api/alerts/${alertId}/report${force ? '?force=true' : ''}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.status == 400) {
          const jObj = await response.json();
          throw new Error(jObj['message'])
        }

        if (!response.ok) {
          throw new Error('Failed to generate report');
        }

        const data = await response.json();
        alert.value['Report'] = data['report'];
        parseMarkdown();
      } catch (err) {
        console.error('Error generating report:', err);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Failed to generate report',
          life: 3000
        });
      } finally {
        reportGenerationBusy.value = false;
      }
    },
    reject: () => {

    }
  });
}

// parse markdown
const parseMarkdown = () => {
  if (alert.value['DocumentSource']) {
    documentSourceParsed.value = marked.parse(`\`\`\`html\n${alert.value['DocumentSource']['document']}\n\`\`\``);
    const bgColor = '#18181b';
    documentSourceParsed.value = `
        <html>
        <head>
        <script src="/app/assets/js/highlightjs/highlight.min.js"><\/script>
        <link rel="stylesheet" href="/app/assets/js/highlightjs/styles/atom-one-dark.css">
        </head>
        <body style='background-color: ${bgColor}; color: white; padding: 1rem;'>
        ${documentSourceParsed.value}
        <script>hljs.highlightAll();<\/script>
        </body>
        `
  }

  if (alert.value['Report']) {
    // Replace {IMAGE_PLACERHOLDER} with markdown image
    const markPrep = alert.value['Report']['description'].replace(
      '{IMAGE_PLACERHOLDER}',
      `  \n![Screenshot](/api/alerts/${alert.value.id}/screenshot)`
    );
    reportSourceParsed.value = marked.parse(markPrep);
    const bgColor = '#18181b';
    reportSourceParsed.value = `
        <html>
        <head>
        <script src="/app/assets/js/highlightjs/highlight.min.js"><\/script>
        <link rel="stylesheet" href="/app/assets/js/highlightjs/styles/atom-one-dark.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
        <style>
        * { 
          font-family: "Inconsolata", monospace;
        }
        pre > code {
          font-family: "Ubuntu Mono", monospace;
        }
        code {
          font-family: "Ubuntu Mono", monospace;
          font-weight: 700;
          color: #34d399;
        }
        </style>
        <!-- REPLACE-WITH-STYLES -->
        </head>
        <body style='background-color: ${bgColor}; color: white; padding: 1rem;'>
          <div class="markdown-body">
            ${reportSourceParsed.value}
          </div>
        <script>hljs.highlightAll();<\/script>
        </body>
        `
  }
}

// Fetch alert details
const fetchAlertDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const alertId = route.params.id;
    const response = await fetch(`/api/alerts/${alertId}`);

    if (!response.ok) {
      // redirect to /app/
      router.push("/")
    }

    alert.value = await response.json();
    alert.value['cookiesObj'] = alert.value['cookies'].split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {});
    parseMarkdown();
  } catch (err) {
    console.error('Error fetching alert details:', err);
    error.value = err.message || 'Failed to load alert data';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAlertDetails();
});
</script>