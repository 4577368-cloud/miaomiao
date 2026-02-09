<template>
  <div class="page-container">
    <div class="page-header">
      <div class="title">数据看板</div>
      <el-button type="primary" :loading="loading" @click="fetchDashboard">刷新数据</el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card>
          <el-statistic title="订单总量" :value="stats.totalOrders" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="已完成订单" :value="stats.completedOrders" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="收入总额" :value="stats.totalRevenue" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <el-statistic title="平均评分" :value="stats.avgRating" :precision="2" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-title">近7日订单趋势</div>
          </template>
          <div class="bar-chart">
            <div v-for="item in orderTrend" :key="item.label" class="bar-row">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.percent + '%' }"></div>
              </div>
              <div class="bar-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-title">服务类型分布</div>
          </template>
          <div class="bar-chart">
            <div v-for="item in serviceDistribution" :key="item.label" class="bar-row">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-track">
                <div class="bar-fill is-secondary" :style="{ width: item.percent + '%' }"></div>
              </div>
              <div class="bar-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>
        <div class="card-title">最近订单</div>
      </template>
      <el-table :data="recentOrders" border style="width: 100%">
        <el-table-column prop="id" label="订单ID" min-width="180" />
        <el-table-column prop="serviceType" label="服务类型" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="totalPrice" label="金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.totalPrice }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { ElMessage } from 'element-plus'

interface OrderItem {
  id: string
  status: string
  total_price: number
  service_type: string
  created_at: string
}

interface ReviewItem {
  rating: number
  created_at: string
}

interface ChartItem {
  label: string
  value: number
  percent: number
}

const loading = ref(false)
const stats = ref({
  totalOrders: 0,
  completedOrders: 0,
  totalRevenue: 0,
  avgRating: 0
})
const orderTrend = ref<ChartItem[]>([])
const serviceDistribution = ref<ChartItem[]>([])
const recentOrders = ref<{ id: string; serviceType: string; status: string; totalPrice: string; createdAt: string }[]>([])

const formatDateLabel = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

const calculateChart = (items: { label: string; value: number }[]): ChartItem[] => {
  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 0) || 1
  return items.map(item => ({
    label: item.label,
    value: item.value,
    percent: Math.round((item.value / maxValue) * 100)
  }))
}

const fetchDashboard = async () => {
  loading.value = true
  const { data: ordersData, error: orderError } = await supabase.rpc('get_admin_orders')
  const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats')
  if (orderError || statsError) {
    ElMessage.error('数据加载失败')
    loading.value = false
    return
  }
  const orders = (ordersData || []) as any[]
  const completedStatuses = ['COMPLETED', 'REVIEWED']
  stats.value.totalOrders = orders.length
  stats.value.completedOrders = orders.filter(order => completedStatuses.includes(order.status)).length
  stats.value.totalRevenue = orders
    .filter(order => completedStatuses.includes(order.status))
    .reduce((sum, order) => sum + Number(order.total_price || 0), 0)
  stats.value.avgRating = 0
  const today = new Date()
  const trendItems: { label: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const label = formatDateLabel(date)
    const dateKey = date.toISOString().split('T')[0]
    const count = orders.filter(order => (order.created_at || '').startsWith(dateKey)).length
    trendItems.push({ label, value: count })
  }
  orderTrend.value = calculateChart(trendItems)
  const serviceMap = orders.reduce((acc, order) => {
    const key = order.service_type || 'UNKNOWN'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const serviceItems = Object.keys(serviceMap).map(key => ({
    label: key,
    value: serviceMap[key]
  }))
  serviceDistribution.value = calculateChart(serviceItems)
  recentOrders.value = orders.slice(0, 10).map(order => ({
    id: order.id,
    serviceType: order.service_type,
    status: order.status,
    totalPrice: Number(order.total_price || 0).toFixed(2),
    createdAt: order.created_at ? new Date(order.created_at).toLocaleString() : ''
  }))
  if (!orders.length && !(statsData || []).length) {
    ElMessage.warning('暂无数据')
  }
  loading.value = false
}

onMounted(fetchDashboard)
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f6f8;
  min-height: 100%;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.stats-row {
  margin-bottom: 16px;
}
.charts-row {
  margin-bottom: 16px;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bar-row {
  display: grid;
  grid-template-columns: 60px 1fr 40px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.bar-label {
  color: #666;
}
.bar-track {
  height: 8px;
  border-radius: 4px;
  background: #f0f2f5;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #409eff;
  border-radius: 4px;
}
.bar-fill.is-secondary {
  background: #67c23a;
}
.bar-value {
  text-align: right;
  color: #333;
}
.table-card {
  margin-top: 8px;
}
</style>
