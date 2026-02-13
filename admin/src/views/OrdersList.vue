<template>
  <div class="page-container">
    <div class="toolbar">
      <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 160px">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="margin: 0 12px"
      />
      <el-button type="primary" :loading="loading" @click="fetchOrders">拉取历史订单</el-button>
      <el-checkbox v-model="useMock" style="margin-left: 12px">使用示例数据</el-checkbox>
    </div>
    <el-alert v-if="lastError" :title="lastError" type="error" show-icon style="margin-bottom: 12px" />
    <el-table :data="filtered" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="订单ID" min-width="180" />
      <el-table-column prop="service_type" label="服务类型" width="120">
        <template #default="scope">{{ getServiceTypeName(scope.row.service_type) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag>{{ getOrderStatusName(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_price" label="金额" width="120">
        <template #default="scope">¥{{ Number(scope.row.total_price || 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="creator_name" label="下单用户" width="140" />
      <el-table-column prop="sitter_name" label="宠托师" width="140" />
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const orders = ref<any[]>([])
const statusFilter = ref<string>('ALL')
const dateRange = ref<[Date, Date] | null>(null)
const useMock = ref<boolean>(false)
const lastError = ref<string>('')

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '待接单', value: 'PENDING' },
  { label: '已接单/服务中', value: 'IN_SERVICE' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' }
]

const fetchOrders = async () => {
  loading.value = true
  lastError.value = ''
  if (useMock.value) {
    orders.value = [
      { id: 'MOCK-1', service_type: 'FEEDING', status: 'PENDING', total_price: 88, creator_name: '张三', sitter_name: '李四', created_at: new Date().toISOString() },
      { id: 'MOCK-2', service_type: 'WALKING', status: 'COMPLETED', total_price: 66, creator_name: '王五', sitter_name: '赵六', created_at: new Date(Date.now() - 86400000).toISOString() }
    ]
  } else {
    const { data: orderList, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      lastError.value = `拉取失败: ${error.message}`
      ElMessage.error('加载失败')
      orders.value = []
    } else {
      // Fetch user profiles to display names
      const userIds = new Set<string>()
      orderList.forEach((o: any) => {
        if (o.creator_id) userIds.add(o.creator_id)
        if (o.sitter_id) userIds.add(o.sitter_id)
      })

      let profileMap = new Map<string, string>()
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname')
          .in('id', Array.from(userIds))
        
        profiles?.forEach((p: any) => profileMap.set(p.id, p.nickname))
      }

      orders.value = orderList.map((o: any) => ({
        ...o,
        creator_name: profileMap.get(o.creator_id) || '未知用户',
        sitter_name: profileMap.get(o.sitter_id) || (o.sitter_snapshot?.nickname || (o.sitter_id ? '未知宠托师' : '待接单'))
      }))
    }
  }
  loading.value = false
}

const formatDate = (str: string) => {
  if (!str) return ''
  return new Date(str).toLocaleString()
}

const getServiceTypeName = (type: string) => {
  const map: Record<string, string> = {
    FEEDING: '上门喂养',
    WALKING: '上门遛宠',
    FOSTER: '家庭寄养'
  }
  return map[type] || type
}

const getOrderStatusName = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '待接单',
    ACCEPTED: '已接单',
    IN_SERVICE: '服务中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REVIEWED: '已评价'
  }
  return map[status] || status
}

const filtered = computed(() => {
  let list = orders.value
  if (statusFilter.value !== 'ALL') {
    if (statusFilter.value === 'IN_SERVICE') {
      list = list.filter(o => ['ACCEPTED', 'IN_SERVICE'].includes(o.status))
    } else {
      list = list.filter(o => o.status === statusFilter.value)
    }
  }
  if (dateRange.value) {
    const [start, end] = dateRange.value
    const s = start.getTime()
    const e = end.getTime()
    list = list.filter(o => {
      const t = o.created_at ? new Date(o.created_at).getTime() : 0
      return t >= s && t <= e
    })
  }
  return list
})

onMounted(fetchOrders)
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
