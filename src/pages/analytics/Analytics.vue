<template>
  <div class="analytics-page q-pa-md">
    <!-- Page Header with Year Selector -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-white">Analytics Dashboard</div>
      <q-select
          v-model="currentYear"
          :options="yearOptions"
          dense
          outlined
          dark
          class="year-selector"
          @update:model-value="onYearChange"
          :disable="loading"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="50px" color="primary"/>
      <div class="q-mt-md text-white">Loading analytics data...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative"/>
      <div class="q-mt-md">
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

    <!-- Main Analytics Content -->
    <div v-else-if="analyticsData.length > 0" class="analytics-content">
      <!-- Summary Cards Row -->
      <div class="row q-gutter-md q-mb-lg">
        <div class="col">
          <q-card dark class="summary-card bg-gradient-primary">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-subtitle2 text-grey-3">Total Hours</div>
                  <div class="text-h4 text-white">{{ totalHours }}</div>
                </div>
                <div class="col-auto">
                  <q-icon name="schedule" size="40px" class="text-white opacity-60"/>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col">
          <q-card dark class="summary-card bg-gradient-secondary">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-subtitle2 text-grey-3">Average/Month</div>
                  <div class="text-h4 text-white">{{ avgHoursPerMonth }}</div>
                </div>
                <div class="col-auto">
                  <q-icon name="trending_up" size="40px" class="text-white opacity-60"/>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col">
          <q-card dark class="summary-card bg-gradient-accent">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-subtitle2 text-grey-3">Peak Month</div>
                  <div class="text-h4 text-white">{{ peakMonth }}</div>
                  <div class="text-caption text-grey-4">{{ peakHours }}h</div>
                </div>
                <div class="col-auto">
                  <q-icon name="star" size="40px" class="text-white opacity-60"/>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col">
          <q-card dark class="summary-card bg-gradient-positive">
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-subtitle2 text-grey-3">This Month</div>
                  <div class="text-h4 text-white">{{ currentMonthHours }}</div>
                  <div class="text-caption" :class="trendClass">
                    <q-icon :name="trendIcon" size="16px"/>
                    {{ trendText }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-icon name="today" size="40px" class="text-white opacity-60"/>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Chart Card -->
      <q-card dark class="chart-card">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-white">Monthly Hours Breakdown</div>
            <div class="chart-controls">
              <q-btn-toggle
                  v-model="chartType"
                  toggle-color="primary"
                  :options="chartTypeOptions"
                  dense
                  class="text-white"
                  @update:model-value="updateChart"
              />
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas ref="chartCanvas" id="analytics-chart"></canvas>
          </div>
        </q-card-section>
      </q-card>

      <!-- Insights Card -->
      <q-card dark class="insights-card q-mt-lg">
        <q-card-section>
          <div class="text-h6 text-white q-mb-md">
            <q-icon name="lightbulb" class="q-mr-sm"/>
            Insights
          </div>
          <div class="insights-grid">
            <div v-for="insight in insights" :key="insight.id" class="insight-item">
              <q-icon :name="insight.icon" :color="insight.color" class="q-mr-sm"/>
              <span class="text-grey-3">{{ insight.text }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="analytics" size="50px" color="grey-5"/>
      <div class="q-mt-md text-grey-4">
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
import {ref, watch, computed} from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration
} from 'chart.js'

Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineController,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
)

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

interface Insight {
  id: string
  icon: string
  color: string
  text: string
}

// @ts-ignore - Electron IPC API
const ipcRenderer: ElectronApi = window.ipcRenderer

// Reactive state
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const analyticsData = ref<MonthlyAnalyticsData[]>([])
const currentYear = ref<number>(new Date().getFullYear())
const chartType = ref<string>('bar')

let chartInstance: Chart | null = null

// Year selector options
const yearOptions = computed(() => {
  const years = []
  const currentYearNum = new Date().getFullYear()
  for (let i = currentYearNum; i >= currentYearNum - 5; i--) {
    years.push(i)
  }
  return years
})

const chartTypeOptions = [
  {label: 'Bar', value: 'bar'},
  {label: 'Line', value: 'line'}
]

const totalHours = computed(() => {
  if (!analyticsData.value.length) return '0h'
  const total = analyticsData.value.reduce((sum, item) => sum + item.hours, 0)
  return `${Math.round(total)}h`
})

const avgHoursPerMonth = computed(() => {
  if (!analyticsData.value.length) return '0h'
  const total = analyticsData.value.reduce((sum, item) => sum + item.hours, 0)
  const avg = total / 12 // Always 12 months
  return `${Math.round(avg)}h`
})

const peakMonth = computed(() => {
  if (!analyticsData.value.length) return '-'
  const peak = analyticsData.value.reduce((max, item) =>
      item.hours > max.hours ? item : max
  )
  return peak.month
})

const peakHours = computed(() => {
  if (!analyticsData.value.length) return '0'
  const peak = analyticsData.value.reduce((max, item) =>
      item.hours > max.hours ? item : max
  )
  return Math.round(peak.hours)
})

const currentMonthHours = computed(() => {
  if (!analyticsData.value.length) return '0h'
  const currentMonth = new Date().getMonth()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonthName = monthNames[currentMonth]
  const currentData = analyticsData.value.find(item => item.month === currentMonthName)
  return `${Math.round(currentData?.hours || 0)}h`
})

const trend = computed(() => {
  if (!analyticsData.value.length) return {direction: 'neutral', percentage: 0}

  const currentMonth = new Date().getMonth()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const currentMonthName = monthNames[currentMonth]
  const previousMonthName = monthNames[currentMonth - 1] || monthNames[11]

  const currentHours = analyticsData.value.find(item => item.month === currentMonthName)?.hours || 0
  const previousHours = analyticsData.value.find(item => item.month === previousMonthName)?.hours || 0

  if (previousHours === 0) return {direction: 'neutral', percentage: 0}

  const change = ((currentHours - previousHours) / previousHours) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'

  return {direction, percentage: Math.abs(Math.round(change))}
})

const trendClass = computed(() => ({
  'text-positive': trend.value.direction === 'up',
  'text-negative': trend.value.direction === 'down',
  'text-grey-4': trend.value.direction === 'neutral'
}))

const trendIcon = computed(() => {
  switch (trend.value.direction) {
    case 'up':
      return 'trending_up'
    case 'down':
      return 'trending_down'
    default:
      return 'trending_flat'
  }
})

const trendText = computed(() => {
  if (trend.value.direction === 'neutral') return 'No change'
  const direction = trend.value.direction === 'up' ? 'up' : 'down'
  return `${trend.value.percentage}% ${direction}`
})

const insights = computed((): Insight[] => {
  if (!analyticsData.value.length) return []

  const insights: Insight[] = []
  const total = analyticsData.value.reduce((sum, item) => sum + item.hours, 0)
  const avg = total / 12

  // Peak month insight
  const peak = analyticsData.value.reduce((max, item) =>
      item.hours > max.hours ? item : max
  )
  insights.push({
    id: 'peak',
    icon: 'star',
    color: 'yellow',
    text: `${peak.month} was your most productive month with ${Math.round(peak.hours)} hours`
  })

  // Low activity insight
  const low = analyticsData.value.reduce((min, item) =>
      item.hours < min.hours ? item : min
  )
  if (low.hours < avg * 0.5) {
    insights.push({
      id: 'low',
      icon: 'info',
      color: 'blue',
      text: `${low.month} had minimal activity with only ${Math.round(low.hours)} hours`
    })
  }

  // Consistency insight
  const variance = analyticsData.value.reduce((sum, item) =>
      sum + Math.pow(item.hours - avg, 2), 0
  ) / 12
  const stdDev = Math.sqrt(variance)

  if (stdDev < avg * 0.3) {
    insights.push({
      id: 'consistent',
      icon: 'check_circle',
      color: 'positive',
      text: 'Your work hours are consistently distributed throughout the year'
    })
  } else {
    insights.push({
      id: 'variable',
      icon: 'warning',
      color: 'orange',
      text: 'Your work hours vary significantly between months'
    })
  }

  return insights
})

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

    const isLine = chartType.value === 'line'
    const config: ChartConfiguration = {
      type: chartType.value as 'bar' | 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Hours',
          data: hoursData,
          backgroundColor: isLine ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.8)',
          borderColor: '#1976d2',
          borderWidth: 2,
          ...(isLine && {
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#1976d2',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          })
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#1976d2',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `${context.parsed.y}h worked`
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff',
              callback: function (value) {
                return value + 'h'
              }
            },
            title: {
              display: true,
              text: 'Hours',
              color: '#ffffff'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ffffff'
            },
            title: {
              display: true,
              text: 'Month',
              color: '#ffffff'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
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

const onYearChange = (newYear: number): void => {
  currentYear.value = newYear
  loadAnalyticsData()
}

const updateChart = (): void => {
  if (analyticsData.value.length > 0 && chartCanvas.value) {
    renderChart()
  }
}

watch([analyticsData, chartCanvas], ([data, canvas]) => {
  if (data && data.length > 0 && canvas && !loading.value && !error.value) {
    renderChart();
  }
}, {immediate: false})

loadAnalyticsData()
</script>

<style scoped>
.analytics-page {
  max-width: 1200px;
  background: transparent;
}

.year-selector {
  min-width: 120px;
}

.summary-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.bg-gradient-secondary {
  background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%);
}

.bg-gradient-accent {
  background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
}

.bg-gradient-positive {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
}

.chart-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
}

.chart-wrapper {
  position: relative;
  height: 400px;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

#analytics-chart {
  max-width: 100%;
  max-height: 100%;
}

.insights-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
}

.insights-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.insight-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
}

.insight-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

@media (max-width: 768px) {
  .analytics-page {
    padding: 8px;
  }

  .chart-wrapper {
    height: 300px;
    padding: 8px;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

}

.text-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.opacity-60 {
  opacity: 0.6;
}
</style>