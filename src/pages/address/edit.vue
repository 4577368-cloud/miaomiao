<template>
  <view class="container">
    <view class="form-card">
      <view class="form-item">
        <text class="label">联系人</text>
        <input class="input" v-model="form.contactName" placeholder="请填写收货人姓名" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input class="input" v-model="form.contactPhone" type="number" placeholder="请填写收货人手机号" />
      </view>
      <view class="form-item">
        <text class="label">详细地址</text>
        <textarea class="textarea" v-model="form.detail" placeholder="街道门牌、楼层房间号等信息" auto-height />
      </view>
      <view class="form-item">
        <text class="label">标签</text>
        <view class="tags">
          <text 
            v-for="tag in ['家', '公司', '学校']" 
            :key="tag"
            class="tag"
            :class="{ active: form.name === tag }"
            @click="form.name = tag"
          >
            {{ tag }}
          </text>
          <input 
            class="tag-input" 
            v-model="customTag" 
            placeholder="自定义" 
            @focus="form.name = customTag"
            @input="form.name = customTag"
          />
        </view>
      </view>
      <view class="form-item switch-item">
        <text class="label">设为默认地址</text>
        <switch :checked="form.isDefault" color="#FF8E3C" @change="e => form.isDefault = e.detail.value" />
      </view>
    </view>
    
    <view class="footer-btn">
      <button class="btn-save" @click="handleSave">保存</button>
      <button class="btn-delete" v-if="isEdit" @click="handleDelete">删除</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore, type Address } from '@/stores/user';

const userStore = useUserStore();
const isEdit = ref(false);
const customTag = ref('');

const form = reactive<Address>({
  id: '',
  name: '家',
  detail: '',
  contactName: '',
  contactPhone: '',
  isDefault: false
});

onLoad((options: any) => {
  if (options.id) {
    isEdit.value = true;
    const addr = userStore.userInfo?.addresses?.find(a => a.id === options.id);
    if (addr) {
      Object.assign(form, addr);
      if (!['家', '公司', '学校'].includes(form.name)) {
        customTag.value = form.name;
      }
    }
  }
});

const handleSave = () => {
  if (!form.contactName) return uni.showToast({ title: '请填写联系人', icon: 'none' });
  if (!form.contactPhone) return uni.showToast({ title: '请填写手机号', icon: 'none' });
  if (!form.detail) return uni.showToast({ title: '请填写详细地址', icon: 'none' });
  
  const newAddr = {
    ...form,
    id: form.id || Date.now().toString()
  };
  
  // Update Store
  const addresses = userStore.userInfo?.addresses ? [...userStore.userInfo.addresses] : [];
  
  if (newAddr.isDefault) {
    addresses.forEach(a => a.isDefault = false);
  }
  
  if (isEdit.value) {
    const idx = addresses.findIndex(a => a.id === newAddr.id);
    if (idx > -1) addresses[idx] = newAddr;
  } else {
    addresses.unshift(newAddr);
  }
  
  userStore.updateUser({ addresses });
  uni.navigateBack();
};

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该地址吗？',
    success: (res) => {
      if (res.confirm) {
        const addresses = userStore.userInfo?.addresses?.filter(a => a.id !== form.id) || [];
        userStore.updateUser({ addresses });
        uni.navigateBack();
      }
    }
  });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 20rpx;
}

.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 0 30rpx;
  
  .form-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child { border-bottom: none; }
    
    .label {
      width: 160rpx;
      font-size: 28rpx;
      color: $color-text-main;
      font-weight: 600;
    }
    
    .input {
      flex: 1;
      font-size: 28rpx;
      color: $color-text-main;
    }
    
    .textarea {
      flex: 1;
      font-size: 28rpx;
      color: $color-text-main;
      min-height: 40rpx;
    }
    
    .tags {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 20rpx;
      
      .tag {
        font-size: 24rpx;
        padding: 8rpx 24rpx;
        background: #f5f5f5;
        border-radius: 30rpx;
        color: $color-text-secondary;
        
        &.active {
          background: #FFF0E5;
          color: #FF8E3C;
          border: 1px solid #FF8E3C;
        }
      }
      
      .tag-input {
        width: 120rpx;
        font-size: 24rpx;
        padding: 8rpx 0;
        text-align: center;
        border-bottom: 1px solid #eee;
      }
    }
    
    &.switch-item {
      justify-content: space-between;
    }
  }
}

.footer-btn {
  margin-top: 60rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  button {
    width: 100%;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    height: 88rpx;
    line-height: 88rpx;
  }
  
  .btn-save {
    background: $color-primary;
    color: #fff;
  }
  
  .btn-delete {
    background: #fff;
    color: #FF4D4F;
    border: 1px solid #FF4D4F;
  }
}
</style>
