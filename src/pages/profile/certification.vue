<template>
  <view class="container">
    <view class="status-card" v-if="status !== 'none'">
      <text class="icon" v-if="status === 'verified'">✅</text>
      <text class="icon" v-else-if="status === 'pending'">⏳</text>
      <text class="icon" v-else>❌</text>
      
      <text class="title">{{ statusText }}</text>
      <text class="desc">{{ statusDesc }}</text>
    </view>

    <view class="form-card" v-if="status !== 'verified' && status !== 'pending'">
      <view class="form-item">
        <text class="label">真实姓名</text>
        <input class="input" v-model="form.realName" placeholder="请输入身份证姓名" />
      </view>
      <view class="form-item">
        <text class="label">身份证号</text>
        <input class="input" v-model="form.idCard" type="idcard" placeholder="请输入身份证号码" />
      </view>
      
      <view class="upload-section">
        <text class="section-title">证件照片</text>
        <view class="upload-grid">
          <view class="upload-item" @click="chooseImage('front')">
            <image v-if="form.idCardFront" :src="form.idCardFront" mode="aspectFill" class="preview" />
            <view v-else class="placeholder">
              <text class="icon">📷</text>
              <text class="text">人像面</text>
            </view>
          </view>
          <view class="upload-item" @click="chooseImage('back')">
            <image v-if="form.idCardBack" :src="form.idCardBack" mode="aspectFill" class="preview" />
            <view v-else class="placeholder">
              <text class="icon">📷</text>
              <text class="text">国徽面</text>
            </view>
          </view>
        </view>
      </view>

      <button class="btn-submit" @click="handleSubmit">提交认证</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const status = computed(() => userStore.userInfo?.sitterProfile?.certificationStatus || 'none');

const statusText = computed(() => {
  switch (status.value) {
    case 'verified': return '已通过认证';
    case 'pending': return '审核中';
    case 'rejected': return '认证未通过';
    default: return '未认证';
  }
});

const statusDesc = computed(() => {
  switch (status.value) {
    case 'verified': return '您已获得宠托师身份标识';
    case 'pending': return '预计1个工作日内完成审核';
    case 'rejected': return '请重新提交资料';
    default: return '完成认证后可发布接单意向';
  }
});

const form = reactive({
  realName: '',
  idCard: '',
  idCardFront: '',
  idCardBack: ''
});

const chooseImage = (side: 'front' | 'back') => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      if (side === 'front') form.idCardFront = res.tempFilePaths[0];
      else form.idCardBack = res.tempFilePaths[0];
    }
  });
};

const handleSubmit = () => {
  if (!form.realName || !form.idCard) return uni.showToast({ title: '请完善身份信息', icon: 'none' });
  if (!form.idCardFront || !form.idCardBack) return uni.showToast({ title: '请上传证件照片', icon: 'none' });
  
  uni.showLoading({ title: '提交中...' });
  
  setTimeout(() => {
    uni.hideLoading();
    
    // Mock submit
    if (userStore.userInfo) {
      if (!userStore.userInfo.sitterProfile) {
        userStore.userInfo.sitterProfile = {
          level: 'BRONZE',
          completedOrders: 0,
          rating: 5.0,
          experienceYears: 0,
          tags: [],
          bio: '',
          isCertified: false,
          certificationStatus: 'none'
        };
      }
      
      // Update store
      userStore.userInfo.sitterProfile.certificationStatus = 'verified'; // Mock auto-verify for demo
      userStore.userInfo.sitterProfile.isCertified = true;
      userStore.updateUser(userStore.userInfo);
      
      uni.showToast({ title: '认证成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  }, 1000);
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #FFFBF5;
  padding: 20px;
}

.status-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }
  
  .desc {
    font-size: 14px;
    color: #999;
  }
}

.form-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  z-index: 1;
  
  .form-item {
    margin-bottom: 20px;
    
    .label {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
      font-weight: bold;
    }
    
    .input {
      background: #f9f9f9;
      padding: 0 24rpx;
      height: 88rpx;
      line-height: 88rpx;
      border-radius: 8px;
      font-size: 14px;
      color: #333;
      width: 100%;
      box-sizing: border-box;
    }
  }
}

.upload-section {
  margin-top: 30px;
  margin-bottom: 30px;
  
  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-bottom: 16px;
    display: block;
  }
  
  .upload-grid {
    display: flex;
    gap: 16px;
    
    .upload-item {
      flex: 1;
      height: 100px;
      background: #f9f9f9;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ddd;
      overflow: hidden;
      
      .preview {
        width: 100%;
        height: 100%;
      }
      
      .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .text {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}

.btn-submit {
  background: #FF8E3C;
  color: #fff;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
  margin-top: 20px;
}
</style>