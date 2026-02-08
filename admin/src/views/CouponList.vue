<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新建活动</el-button>
    </div>
    
    <el-table :data="coupons" border style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="活动名称" width="180" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="scope">
          <el-tag>{{ scope.row.type === 'FIXED' ? '满减' : '折扣' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="面值/折扣" width="120">
        <template #default="scope">
          <span v-if="scope.row.type === 'FIXED'">¥{{ scope.row.value }}</span>
          <span v-else>{{ scope.row.value * 10 }}折</span>
        </template>
      </el-table-column>
      <el-table-column label="发放进度" width="150">
        <template #default="scope">
          {{ scope.row.issued_quantity }} / {{ scope.row.total_quantity || '不限' }}
        </template>
      </el-table-column>
      <el-table-column prop="start_time" label="开始时间" width="180">
        <template #default="scope">
          {{ new Date(scope.row.start_time).toLocaleDateString() }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" title="新建营销活动">
      <el-form :model="form" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="form.name" placeholder="如: 春节大促" />
        </el-form-item>
        <el-form-item label="优惠类型">
          <el-radio-group v-model="form.type">
            <el-radio label="FIXED">满减券</el-radio>
            <el-radio label="DISCOUNT">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type === 'FIXED' ? '减免金额' : '折扣比例'">
          <el-input-number v-model="form.value" :precision="2" :step="0.1" :max="form.type === 'DISCOUNT' ? 1 : 9999" />
          <span class="hint" v-if="form.type === 'DISCOUNT'"> (0.8代表8折)</span>
        </el-form-item>
        <el-form-item label="最低消费">
          <el-input-number v-model="form.min_spend" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="发放总量">
          <el-input-number v-model="form.total_quantity" :min="-1" placeholder="-1为不限" />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { supabase } from '@/utils/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

interface CouponTemplate {
  id?: string
  name: string
  type: 'FIXED' | 'DISCOUNT'
  value: number
  min_spend: number
  total_quantity: number | null
  issued_quantity: number
  start_time: string
  end_time: string
  is_active: boolean
}

const coupons = ref<CouponTemplate[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dateRange = ref([])
const form = ref<CouponTemplate>({
  name: '',
  type: 'FIXED',
  value: 0,
  min_spend: 0,
  total_quantity: 100,
  issued_quantity: 0,
  start_time: '',
  end_time: '',
  is_active: true
})

const fetchCoupons = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('coupon_templates')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    coupons.value = data || []
  }
  loading.value = false
}

const handleAdd = () => {
  form.value = {
    name: '',
    type: 'FIXED',
    value: 10,
    min_spend: 0,
    total_quantity: 100,
    issued_quantity: 0,
    start_time: '',
    end_time: '',
    is_active: true
  }
  dateRange.value = []
  dialogVisible.value = true
}

const handleDelete = (row: CouponTemplate) => {
  ElMessageBox.confirm('确定删除该活动吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    const { error } = await supabase.from('coupon_templates').delete().eq('id', row.id)
    if (error) ElMessage.error('删除失败')
    else {
      ElMessage.success('删除成功')
      fetchCoupons()
    }
  })
}

const handleSubmit = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    form.value.start_time = dateRange.value[0]
    form.value.end_time = dateRange.value[1]
  } else {
    // Default to now + 30 days if not set, or error
    form.value.start_time = new Date().toISOString()
    form.value.end_time = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { error } = await supabase
    .from('coupon_templates')
    .insert(form.value)
  
  if (error) ElMessage.error('创建失败: ' + error.message)
  else {
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchCoupons()
  }
}

onMounted(fetchCoupons)
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
.toolbar {
  margin-bottom: 20px;
}
.hint {
  color: #999;
  font-size: 12px;
  margin-left: 10px;
}
</style>
