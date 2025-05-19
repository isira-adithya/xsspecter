<script setup>
import { ref, onMounted } from 'vue';
import router from '@/router';

import AlertsStatsWidget from '@/components/dashboard/AlertsStatsWidget.vue';
import AlertTrendWidget from '@/components/dashboard/AlertTrendWidget.vue';
import RecentAlertsWidget from '@/components/dashboard/RecentAlertsWidget.vue';
import XSSPayloadsWidget from '@/components/dashboard/XSSPayloads.vue';

const statistics = ref(null);
const loadStatistics = async () => {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            console.error('Network response was not ok');
        }
        if (response.status == 403){
            router.push('/auth/login');
            return;
        }
        statistics.value = await response.json();
    } catch (error) {
        console.error('Error fetching statistics:', error);
    }
};
onMounted(() => {
    loadStatistics();
});

</script>

<template>
    <div class="grid grid-cols-12 gap-8" v-if="statistics">
        <AlertsStatsWidget :top-level-stats="statistics['topLevelStats']" />

        <div class="col-span-12 xl:col-span-6">
            <AlertTrendWidget :time-based-analytics="statistics['timeBasedAnalytics']"/>
            <RecentAlertsWidget :recent-alerts="statistics['detailedLists']['recentAlerts']" />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <XSSPayloadsWidget />
        </div>
    </div>
</template>