<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="fetchUsers">拉取云端数据</el-button>
    </div>

    <el-table :data="users" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="用户ID" width="100" show-overflow-tooltip />
      <el-table-column label="用户" width="180">
        <template #default="scope">
          <div class="user-cell">
            <el-avatar :src="scope.row.avatar" :size="32" />
            <div class="user-info">
              <div class="nickname">{{ scope.row.nickname }}</div>
              <div class="gender">
                <span v-if="scope.row.gender === 'male'">♂</span>
                <span v-else-if="scope.row.gender === 'female'">♀</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="120">
        <template #default="scope">{{ scope.row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.email || '-' }}</template>
      </el-table-column>
      <el-table-column label="角色" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'sitter' ? 'warning' : 'primary'">{{ scope.row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="账户资产" width="180">
        <template #default="scope">
          <div class="asset-cell">
            <div>余额: ¥{{ Number(scope.row.balance || 0).toFixed(2) }}</div>
            <div>积分: {{ scope.row.points || 0 }}</div>
            <div v-if="scope.row.role === 'sitter'">劳务: ¥{{ Number(scope.row.labor_balance || 0).toFixed(2) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="订单数据" width="150">
        <template #default="scope">
          <div class="stats-cell">
            <div>发起: {{ scope.row.initiatedOrderCount || 0 }}</div>
            <div>完结: {{ scope.row.completedOrderCount || 0 }}</div>
            <div>消费: ¥{{ Number(scope.row.totalSpent || 0).toFixed(2) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="爱宠" min-width="150">
        <template #default="scope">
          <div class="pets-cell">
            <el-tag v-for="pet in scope.row.pets" :key="pet.id" size="small" class="pet-tag">
              {{ pet.name }} ({{ pet.type === 'cat' ? '猫' : '狗' }})
            </el-tag>
            <span v-if="!scope.row.pets?.length" class="no-data">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="160">
        <template #default="scope">
          {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString() : '' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="success" size="small" @click="handleRecharge(scope.row)">充值</el-button>
          <el-button link type="warning" size="small" @click="handleSendCoupon(scope.row)">发券</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Edit User Dialog -->
    <el-dialog v-model="editDialogVisible" title="编辑用户">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像">
          <el-input v-model="editForm.avatar" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="仅展示/修改记录" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="仅展示/修改记录" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role">
            <el-option label="owner" value="owner" />
            <el-option label="sitter" value="sitter" />
            <el-option label="admin" value="admin" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">资产信息 (不可修改)</el-divider>
        <el-row>
          <el-col :span="8">
            <el-form-item label="余额">
              <el-input :model-value="editForm.balance" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="积分">
              <el-input :model-value="editForm.points" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="劳务">
              <el-input :model-value="editForm.labor_balance" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Recharge Dialog -->
    <el-dialog v-model="rechargeDialogVisible" title="用户充值" width="400px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="当前余额">
          <span class="text-bold">¥{{ Number(currentUser?.balance || 0).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeForm.amount" :min="0.01" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.remark" placeholder="充值原因 (可选)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rechargeDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="rechargeLoading" @click="handleRechargeSubmit">确认充值</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Send Coupon Dialog -->
    <el-dialog v-model="couponDialogVisible" title="发放优惠券" width="500px">
      <el-form label-width="80px">
        <el-form-item label="选择优惠">
          <el-select v-model="selectedCouponId" placeholder="请选择优惠券模板" style="width: 100%">
            <el-option
              v-for="coupon in couponTemplates"
              :key="coupon.id"
              :label="`${coupon.name} (${coupon.type === 'FIXED' ? '¥'+coupon.value : coupon.value*10+'折'})`"
              :value="coupon.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="couponDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="couponLoading" @click="handleSendCouponSubmit">确认发放</el-button>
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

interface UserProfile {
  id: string
  nickname: string
  avatar: string
  role: string
  gender?: string
  phone?: string
  email?: string
  balance: number
  points?: number
  labor_balance: number
  created_at: string
  pets?: any[]
  initiatedOrderCount?: number
  completedOrderCount?: number
  totalSpent?: number
}

const users = ref<UserProfile[]>([])
const loading = ref(false)

// Edit State
const editDialogVisible = ref(false)
const editForm = ref<any>({})

// Recharge State
const rechargeDialogVisible = ref(false)
const rechargeLoading = ref(false)
const currentUser = ref<UserProfile | null>(null)
const rechargeForm = ref({ amount: 100, remark: '' })

// Coupon State
const couponDialogVisible = ref(false)
const couponLoading = ref(false)
const couponTemplates = ref<any[]>([])
const selectedCouponId = ref('')

const fetchUsers = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('get_admin_users')
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    users.value = (data || []).map((u: any) => ({
      ...u,
      initiatedOrderCount: 0,
      completedOrderCount: 0,
      totalSpent: 0,
      pets: []
    }))
  }
  loading.value = false
}

const handleEdit = (row: UserProfile) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: editForm.value.nickname,
      avatar: editForm.value.avatar,
      gender: editForm.value.gender,
      role: editForm.value.role,
      // phone/email updates in profile table if columns exist
      phone: editForm.value.phone, 
      email: editForm.value.email
    })
    .eq('id', editForm.value.id)

  if (error) {
    ElMessage.error('更新失败: ' + error.message)
  } else {
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchUsers()
  }
}

const handleDelete = (row: UserProfile) => {
  ElMessageBox.confirm('确定删除该用户吗？此操作不可恢复！', '警告', { type: 'error' }).then(async () => {
    const { error } = await supabase.from('profiles').delete().eq('id', row.id)
    if (error) ElMessage.error('删除失败: ' + error.message)
    else {
      ElMessage.success('删除成功')
      fetchUsers()
    }
  })
}

// Recharge Logic
const handleRecharge = (row: UserProfile) => {
  currentUser.value = row
  rechargeForm.value = { amount: 100, remark: '' }
  rechargeDialogVisible.value = true
}

const handleRechargeSubmit = async () => {
  if (!currentUser.value) return
  rechargeLoading.value = true
  try {
    // Call RPC function
    const { error } = await supabase.rpc('admin_recharge_balance', {
      target_user_id: currentUser.value.id,
      amount: rechargeForm.value.amount,
      remark: rechargeForm.value.remark
    })
    
    if (error) throw error
    
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
    fetchUsers()
  } catch (e: any) {
    ElMessage.error('充值失败: ' + (e.message || '未知错误'))
  } finally {
    rechargeLoading.value = false
  }
}

// Coupon Logic
const handleSendCoupon = async (row: UserProfile) => {
  currentUser.value = row
  selectedCouponId.value = ''
  couponDialogVisible.value = true
  // Fetch templates
  const { data } = await supabase.from('coupon_templates').select('*').eq('is_active', true)
  couponTemplates.value = data || []
}

const handleSendCouponSubmit = async () => {
  if (!currentUser.value || !selectedCouponId.value) {
    ElMessage.warning('请选择优惠券')
    return
  }
  couponLoading.value = true
  try {
    // Manual insert or RPC. Manual insert is easier if RLS allows.
    // We assume Admin has full access.
    const template = couponTemplates.value.find(t => t.id === selectedCouponId.value)
    if (!template) throw new Error('模板无效')

    const newCoupon = {
      user_id: currentUser.value.id,
      name: template.name,
      type: template.type,
      value: template.value,
      threshold: template.min_spend || 0,
      start_time: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days or from template
      status: 'UNUSED'
    }

    const { error } = await supabase.from('coupons').insert(newCoupon)
    if (error) throw error

    ElMessage.success('发放成功')
    couponDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error('发放失败: ' + e.message)
  } finally {
    couponLoading.value = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.gender {
  font-size: 12px;
  color: #999;
}
.asset-cell {
  font-size: 12px;
  color: #666;
}
.stats-cell {
  font-size: 12px;
  color: #666;
}
.pet-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}
.text-bold {
  font-weight: bold;
  font-size: 16px;
}
</style>
