<template>
  <div class="analytics-page q-pa-md">
    <div class="text-h4 q-mb-md">Analytics</div>
    
    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
      <div class="q-mt-md">Loading analytics data...</div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-mt-md text-negative">
        <div class="text-h6">Error Loading Analytics</div>
        <div class="q-mt-sm">{{ error }}</div>
        <q-btn 
          color="primary" 
          label="Retry" 
          @click="loadAnalyticsData" 
          class="q-mt-md"
        />
      </div>
    </div>
    
    <!-- Chart Container -->
    <div v-else-if="analyticsData.length > 0" class="chart-container">
      <div class="text-h6 q-mb-md text-center">
        Monthly Active Hours - {{ currentYear }}
      </div>
      <div class="chart-wrapper">
        <canvas ref="chartCanvas" id="analytics-chart"></canvas>
      </div>
    </div>
    
    <!-- No Data State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="analytics" size="50px" color="grey-5" />
      <div class="q-mt-md text-grey-6">
        <div class="text-h6">No Analytics Data</div>
        <div class="q-mt-sm">No work logs found for {{ currentYear }}</div>
        <q-btn 
          color="primary" 
          label="Refresh" 
          @click="loadAnalyticsData" 
          class="q-mt-md"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration
} from 'chart.js'

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend)

// Types
interface MonthlyAnalyticsData {
  month: string
  hours: number
}

interface AnalyticsError {
  message: string
  code?: string
  timestamp: number
}

// @ts-ignore - Electron IPC API
const ipcRenderer: ElectronApi = window.ipcRenderer

// Reactive state
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const analyticsData = ref<MonthlyAnalyticsData[]>([])
const currentYear = ref<number>(new Date().getFullYear())

let chartInstance: Chart | null = null

const handleError = (errorMessage: string, originalError?: any): void => {
  const analyticsError: AnalyticsError = {
    message: errorMessage,
    code: originalError?.code || 'UNKNOWN_ERROR',
    timestamp: Date.now()
  }
  
  error.value = analyticsError.message
  loading.value = false
}

const validateAnalyticsData = (data: any): data is MonthlyAnalyticsData[] => {
  if (!Array.isArray(data)) {
    return false
  }
  
  for (const item of data) {
    if (!item.month || typeof item.month !== 'string') {
      return false
    }
    if (typeof item.hours !== 'number' || item.hours < 0) {
      return false
    }
  }
  
  return true
}

const loadAnalyticsData = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null

    // Make IPC call to backend
    const response = await ipcRenderer.invoke('getMonthlyAnalytics', currentYear.value)
    
    if (!response) {
      throw new Error('No data received from backend')
    }
    
    if (!validateAnalyticsData(response)) {
      throw new Error('Invalid data format received from backend')
    }
    
    analyticsData.value = response
    // Update happens in the watcher because the canvas might not be ready yet.

  } catch (err: any) {
    handleError(
      `Failed to load analytics data: ${err.message || 'Unknown error'}`,
      err
    )
  } finally {
    loading.value = false
  }
}

const renderChart = (): void => {
  try {
    if (!chartCanvas.value) {
      throw new Error('Chart canvas not available')
    }
    
    // Destroy existing chart instance if it exists
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }

    const monthLabels = analyticsData.value.map(item => item.month)
    const hoursData = analyticsData.value.map(item => Math.round(item.hours * 100) / 100)
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Hours',
          data: hoursData,
          backgroundColor: '#1976d2',
          borderColor: '#1565c0',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false // Title is handled in template
          },
          legend: {
            display: false // Simple chart doesn't need legend
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          }
        }
      }
    }
    chartInstance = new Chart(chartCanvas.value, config)
  } catch (error: any) {
    handleError(
      `Failed to render chart: ${error.message || 'Unknown error'}`,
        error
    )
  }
}

watch([analyticsData, chartCanvas], ([data, canvas]) => {
  if (data && data.length > 0 && canvas && !loading.value && !error.value) {
    renderChart();
  }
}, { immediate: false })

loadAnalyticsData()
</script>

<style scoped>
.analytics-page {
  max-width: 1200px;
  margin: 0 auto;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-wrapper {
  position: relative;
  height: 400px;
  width: 100%;
}

#analytics-chart {
  max-width: 100%;
  max-height: 100%;
}
</style>