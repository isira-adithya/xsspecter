<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);
const timeBasedAnalytics = ref({
  alertTrend: [
    {
      date: "1970-01-01",
      count: 99
    }
  ]
});

const props = defineProps({
  timeBasedAnalytics: {
    type: Object,
    default: () => ({
      alertTrend: [
        {
          date: "1970-01-01",
          count: 99
        }
      ]
    })
  }
});

function setChartData() {
  const documentStyle = getComputedStyle(document.documentElement);

  return {
    labels: timeBasedAnalytics.value.alertTrend.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        type: 'bar',
        label: 'Alerts',
        backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
        data: timeBasedAnalytics.value.alertTrend.map(item => item.count),
        barThickness: 32,
        borderRadius: {
          topLeft: 8,
          topRight: 8
        }
      }
    ]
  };
}

function setChartOptions() {
  const documentStyle = getComputedStyle(document.documentElement);
  const borderColor = documentStyle.getPropertyValue('--surface-border');
  const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

  return {
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: {
        display: true,
        text: 'Alert Trend',
        color: textMutedColor
      }
    },
    scales: {
      x: {
        ticks: {
          color: textMutedColor
        },
        grid: {
          color: 'transparent',
          borderColor: 'transparent'
        }
      },
      y: {
        ticks: {
          color: textMutedColor
        },
        grid: {
          color: borderColor,
          borderColor: 'transparent',
          drawTicks: false
        }
      }
    }
  };
}

watch([getPrimary, getSurface, isDarkTheme], () => {
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
});

onMounted(() => {
  timeBasedAnalytics.value = props.timeBasedAnalytics;
  chartData.value = setChartData();
  chartOptions.value = setChartOptions();
});
</script>

<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">Alert Trend</div>
    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
  </div>
</template>