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
        <view class="address-input-wrapper">
          <textarea class="textarea" v-model="form.detail" placeholder="街道门牌、楼层房间号等信息" auto-height />
          <view class="location-btn" @click="chooseLocation">
            <text class="icon">📍</text>
            <text>定位</text>
          </view>
        </view>
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
        <switch class="default-switch" :checked="form.isDefault" color="#FF8E3C" @change="e => form.isDefault = (e as any).detail.value" />
      </view>
    </view>
    
    <view class="footer-btn">
      <button class="btn-save" @click="handleSave">保存</button>
      <button class="btn-delete" v-if="isEdit" @click="handleDelete">删除</button>
    </view>
  </view>
  <view style="height: 100px;"></view>
  <CustomTabBar current-path="pages/address/edit" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
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

const chooseLocation = () => {
  uni.chooseLocation({
    success: (res) => {
      // res.name is the place name (e.g. "Sanlitun SOHO")
      // res.address is the full address
      if (res.name) {
        form.detail = res.name;
      } else if (res.address) {
        form.detail = res.address;
      }
    },
    fail: (err) => {
      console.error('Choose location failed', err);
      // Fallback for H5/Testing without map key working properly
      uni.showToast({ title: '无法打开地图，请手动输入', icon: 'none' });
    }
  });
};

const handleSave = async () => {
  if (!form.contactName) return uni.showToast({ title: '请填写联系人', icon: 'none' });
  if (!form.contactPhone) return uni.showToast({ title: '请填写手机号', icon: 'none' });
  if (!form.detail) return uni.showToast({ title: '请填写详细地址', icon: 'none' });
  
  uni.showLoading({ title: '保存中...' });
  
  try {
    if (isEdit.value) {
      await userStore.updateAddress({ ...form });
    } else {
      // Remove id from form for new address, let backend generate it
      const { id, ...rest } = form; 
      await userStore.addAddress(rest);
    }
    
    uni.hideLoading();
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          await userStore.removeAddress(form.id);
          uni.hideLoading();
          uni.navigateBack();
        } catch (e) {
          uni.hideLoading();
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
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
    
    .address-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16rpx;

      .textarea {
        flex: 1;
        font-size: 28rpx;
        color: $color-text-main;
        min-height: 40rpx;
      }

      .location-btn {
        display: flex;
        align-items: center;
        gap: 4rpx;
        padding: 8rpx 16rpx;
        background-color: rgba($color-primary, 0.1);
        border-radius: 24rpx;
        
        .icon {
          font-size: 28rpx;
        }
        
        text {
          font-size: 24rpx;
          color: $color-primary;
          white-space: nowrap;
        }
      }
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
      
      .label {
        width: auto;
        white-space: nowrap;
      }
    }
    
    .default-switch {
      transform: scale(0.8);
      transform-origin: right center;
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
