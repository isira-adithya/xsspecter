<template>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
        <div class="flex justify-between mb-4">
          <div>
            <span class="block text-muted-color font-medium mb-4">Total Alerts</span>
            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ topLevelStats.totalAlerts }}</div>
          </div>
          <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-exclamation-triangle text-blue-500 !text-xl"></i>
          </div>
        </div>
        <span class="text-primary font-medium">{{ topLevelStats.newAlertsToday }} new </span>
        <span class="text-muted-color">today</span>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
        <div class="flex justify-between mb-9">
          <div>
            <span class="block text-muted-color font-medium mb-4">Weekly Alerts</span>
            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ topLevelStats.newAlertsThisWeek }}</div>
          </div>
          <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-calendar text-orange-500 !text-xl"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
        <div class="flex justify-between mb-9">
          <div>
            <span class="block text-muted-color font-medium mb-4">Unique Domains</span>
            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ topLevelStats.uniqueDomainsCount }}</div>
          </div>
          <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-globe text-cyan-500 !text-xl"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
        <div class="flex justify-between mb-9">
          <div>
            <span class="block text-muted-color font-medium mb-4">Active Users</span>
            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ topLevelStats.activeUsers }}</div>
          </div>
          <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-users text-purple-500 !text-xl"></i>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    topLevelStats: {
      type: Object,
      default: () => ({
        totalAlerts: 0,
        newAlertsToday: 0,
        newAlertsThisWeek: 0,
        uniqueDomainsCount: 0,
        activeUsers: 0
      })
    }
  });
  </script>