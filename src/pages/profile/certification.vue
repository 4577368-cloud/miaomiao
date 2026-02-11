<template>
  <view class="container">
    <view class="loading-state" v-if="isLoading">
      <view class="spinner"></view>
      <text>加载中...</text>
    </view>

    <template v-else>
      <view class="status-card" v-if="status !== 'none'">
        <view class="status-icon-box" :class="status">
          <text class="icon" v-if="status === 'verified'">✅</text>
          <text class="icon" v-else-if="status === 'pending'">⏳</text>
          <text class="icon" v-else>❌</text>
        </view>
        
        <text class="title">{{ statusText }}</text>
        <text class="desc">{{ statusDesc }}</text>
        <view class="status-meta" v-if="showStatusMeta">
          <text v-if="status === 'pending' && submittedAtText">提交时间：{{ submittedAtText }}</text>
          <text v-else-if="reviewedAtText">审核时间：{{ reviewedAtText }}</text>
        </view>
        
        <button class="btn-primary" v-if="status === 'rejected'" @click="resetStatus">重新提交</button>
        <button class="btn-outline" v-if="status === 'verified'" @click="handleBack">返回个人中心</button>
      </view>

      <view class="form-container" v-else>
        <view class="header-tip">
          <text class="tip-title">申请成为宠托师</text>
          <text class="tip-desc">请填写真实信息，通过认证后即可接单赚钱</text>
        </view>

        <view class="card form-card">
          <view class="section-title">身份信息</view>
          <view class="form-item">
            <text class="label">真实姓名</text>
            <input class="input" v-model="form.realName" placeholder="请输入身份证姓名" />
          </view>
          <view class="form-item">
            <text class="label">身份证号</text>
            <input class="input" v-model="form.idCard" type="idcard" maxlength="18" placeholder="请输入身份证号码" />
          </view>
          
          <view class="upload-section">
            <text class="label">证件照片</text>
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
        </view>

        <view class="card form-card">
          <view class="section-title">服务信息</view>
          <view class="form-item">
            <text class="label">养宠经验 (年)</text>
            <input class="input" v-model="form.experienceYears" type="number" placeholder="请输入经验年限" />
          </view>
          <view class="form-item">
            <text class="label">个人简介</text>
            <textarea 
              class="textarea" 
              v-model="form.bio" 
              placeholder="介绍一下您的养宠经验、服务特长，让宠主更信任您..." 
              maxlength="200"
            />
            <text class="word-count">{{ form.bio.length }}/200</text>
          </view>
        </view>

        <view class="action-bar">
          <view class="agreement">
            <checkbox-group @change="handleAgreementChange">
               <label class="checkbox-label">
                  <checkbox value="agreed" :checked="isAgreed" color="#FF8E3C" style="transform:scale(0.7)" />
                  <text>我已阅读并同意《宠托师入驻协议》</text>
               </label>
            </checkbox-group>
          </view>
          <button class="btn-submit" :class="{ disabled: !canSubmit }" @click="handleSubmit">提交认证</button>
        </view>
      </view>
    </template>
  </view>
  <view style="height: 100px;"></view>
  <CustomTabBar current-path="pages/profile/certification" />
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { supabase } from '@/utils/supabase';

const userStore = useUserStore();

const isLoading = ref(true);

const status = computed(() => {
  return userStore.userInfo?.sitterProfile?.certificationStatus || 'none';
});

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
    case 'verified': return '恭喜！您已获得宠托师身份标识，快去接单吧！';
    case 'pending': return '您的资料正在审核中，预计1个工作日内完成';
    case 'rejected': {
      const reason = userStore.userInfo?.sitterProfile?.certificationRejectReason;
      return reason ? `抱歉，您的资料未通过审核，原因：${reason}` : '抱歉，您的资料未通过审核，请修改后重新提交';
    }
    default: return '';
  }
});

const showStatusMeta = computed(() => status.value !== 'none');

const submittedAtText = computed(() => {
  const ts = userStore.userInfo?.sitterProfile?.certificationSubmittedAt;
  if (!ts) return '';
  return new Date(ts).toLocaleString();
});

const reviewedAtText = computed(() => {
  const ts = userStore.userInfo?.sitterProfile?.certificationReviewedAt;
  if (!ts) return '';
  return new Date(ts).toLocaleString();
});

const form = reactive({
  realName: '',
  idCard: '',
  idCardFront: '',
  idCardBack: '',
  experienceYears: '',
  bio: ''
});

const isAgreed = ref(false);

const canSubmit = computed(() => {
  return form.realName && 
         form.idCard && 
         form.idCardFront && 
         form.idCardBack && 
         form.experienceYears && 
         form.bio &&
         isAgreed.value;
});

const handleAgreementChange = (e: any) => {
  isAgreed.value = e.detail.value.includes('agreed');
};

const chooseImage = (side: 'front' | 'back') => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      if (side === 'front') form.idCardFront = res.tempFilePaths[0];
      else form.idCardBack = res.tempFilePaths[0];
    }
  });
};

const resetStatus = async () => {
  if (!userStore.userInfo?.id) return;
  await supabase
    .from('sitter_profiles')
    .update({
      certification_status: 'none',
      is_certified: false
    })
    .eq('user_id', userStore.userInfo.id);
  if (userStore.userInfo?.sitterProfile) {
    userStore.userInfo.sitterProfile.certificationStatus = 'none';
    userStore.userInfo.sitterProfile.isCertified = false;
  }
  initForm();
};

const handleBack = () => {
    uni.navigateBack();
};

const initForm = () => {
  const p = userStore.userInfo?.sitterProfile;
  if (p) {
    if (!form.realName && p.realName) form.realName = p.realName;
    if (!form.idCard && p.idCard) form.idCard = p.idCard;
    if (!form.experienceYears && p.experienceYears) form.experienceYears = String(p.experienceYears);
    if (!form.bio && p.bio) form.bio = p.bio;
  }
};

onShow(async () => {
  isLoading.value = true;
  try {
    if (userStore.userInfo?.id) {
       await userStore.fetchProfile(userStore.userInfo.id);
       initForm();
    }
  } finally {
    isLoading.value = false;
  }
});

const handleSubmit = async () => {
  if (!canSubmit.value) {
    if (!isAgreed.value) {
      uni.showToast({ title: '请先同意入驻协议', icon: 'none' });
      return;
    }
    uni.showToast({ title: '请完善所有信息', icon: 'none' });
    return;
  }
  if (!userStore.userInfo) return;
  uni.showLoading({ title: '提交中...' });
  try {
    const userId = userStore.userInfo.id;
    const readFile = (path: string) => {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const fs = uni.getFileSystemManager();
        fs.readFile({
          filePath: path,
          success: (res: any) => resolve(res.data as ArrayBuffer),
          fail: reject
        });
      });
    };
    const uploadLocal = async (path: string, side: 'front' | 'back') => {
      if (!path || path.startsWith('http')) return path;
      const ext = path.split('.').pop() || 'jpg';
      const fileKey = `${userId}/id_${side}_${Date.now()}.${ext}`;
      const buffer = await readFile(path);
      const contentType = ext ? `image/${ext}` : 'image/jpeg';
      const { error } = await supabase.storage.from('evidence').upload(fileKey, buffer, { upsert: true, contentType });
      if (error) throw error;
      const { data } = supabase.storage.from('evidence').getPublicUrl(fileKey);
      if (!data.publicUrl) throw new Error('上传失败');
      return data.publicUrl;
    };
    const frontUrl = await uploadLocal(form.idCardFront, 'front');
    const backUrl = await uploadLocal(form.idCardBack, 'back');
    await supabase.from('profiles').update({ role: 'sitter' }).eq('id', userId);
    const { error } = await supabase
      .from('sitter_profiles')
      .upsert({
        user_id: userId,
        real_name: form.realName,
        id_card: form.idCard,
        experience_years: parseInt(form.experienceYears) || 0,
        bio: form.bio,
        is_certified: false,
        certification_status: 'pending',
        certification_reject_reason: '',
        certification_reviewed_at: null,
        certification_submitted_at: new Date().toISOString(),
        id_card_front: frontUrl,
        id_card_back: backUrl
      }, { onConflict: 'user_id' });
    if (error) throw error;
    if (!userStore.userInfo.sitterProfile) {
      userStore.userInfo.sitterProfile = {
        level: 'BRONZE',
        completedOrders: 0,
        rating: 5,
        experienceYears: 0,
        tags: [],
        bio: '',
        isCertified: false,
        certificationStatus: 'pending'
      };
    }
    const profile = userStore.userInfo.sitterProfile;
    profile.realName = form.realName;
    profile.idCard = form.idCard;
    profile.idCardFront = frontUrl;
    profile.idCardBack = backUrl;
    profile.experienceYears = parseInt(form.experienceYears) || 0;
    profile.bio = form.bio;
    profile.certificationStatus = 'pending';
    profile.certificationRejectReason = '';
    profile.certificationSubmittedAt = Date.now();
    profile.certificationReviewedAt = undefined;
    userStore.updateUser(userStore.userInfo);
    uni.hideLoading();
    uni.showToast({ title: '已提交，审核中', icon: 'success' });
    uni.navigateBack();
  } catch (e: any) {
    uni.hideLoading();
    console.error('Certification submit failed:', e);
    uni.showToast({ title: e.message || '提交失败', icon: 'none' });
  }
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 30rpx;
  padding-bottom: 120rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  
  .spinner {
    width: 60rpx;
    height: 60rpx;
    border: 6rpx solid rgba($color-primary, 0.2);
    border-top-color: $color-primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20rpx;
  }
  
  text {
    font-size: 28rpx;
    color: $color-text-secondary;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100rpx;
  box-shadow: $shadow-sm;
  
  .status-icon-box {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    background: #f5f5f5;
    
    .icon { font-size: 60rpx; }
    
    &.verified { background: rgba($color-success, 0.1); }
    &.pending { background: rgba($color-warning, 0.1); }
    &.rejected { background: rgba($color-error, 0.1); }
  }
  
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: $color-text-main;
    margin-bottom: 16rpx;
  }
  
  .desc {
    font-size: 28rpx;
    color: $color-text-secondary;
    text-align: center;
    margin-bottom: 60rpx;
    line-height: 1.5;
  }
  
  .status-meta {
    font-size: 26rpx;
    color: $color-text-secondary;
    margin-bottom: 40rpx;
  }
  
  .btn-primary, .btn-outline {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
  }
  
  .btn-primary {
    background: $color-primary;
    color: #fff;
  }
  
  .btn-outline {
    background: #fff;
    color: $color-text-main;
    border: 2rpx solid #ddd;
  }
}

.header-tip {
  margin-bottom: 40rpx;
  .tip-title {
    font-size: 40rpx;
    font-weight: bold;
    color: $color-text-main;
    display: block;
    margin-bottom: 12rpx;
  }
  .tip-desc {
    font-size: 26rpx;
    color: $color-text-secondary;
  }
}

.card {
  background: #fff;
  border-radius: $radius-lg;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: $shadow-sm;
  
  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: $color-text-main;
    margin-bottom: 30rpx;
    padding-left: 16rpx;
    border-left: 8rpx solid $color-primary;
    line-height: 1;
  }
}

.form-item {
  margin-bottom: 30rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: $color-text-main;
    margin-bottom: 16rpx;
    font-weight: 500;
  }
  
  .input {
    background: #F9FAFB;
    padding: 0 24rpx;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: $color-text-main;
    width: 100%;
    box-sizing: border-box;
    border: 2rpx solid transparent;
    
    &:focus {
      border-color: $color-primary;
      background: #fff;
    }
  }
  
  .textarea {
    background: #F9FAFB;
    padding: 24rpx;
    width: 100%;
    height: 200rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: $color-text-main;
    box-sizing: border-box;
  }
  
  .word-count {
    display: block;
    text-align: right;
    font-size: 22rpx;
    color: $color-text-placeholder;
    margin-top: 8rpx;
  }
}

.upload-section {
  .label {
    display: block;
    font-size: 28rpx;
    color: $color-text-main;
    margin-bottom: 16rpx;
    font-weight: 500;
  }
  
  .upload-grid {
    display: flex;
    gap: 24rpx;
    
    .upload-item {
      flex: 1;
      height: 200rpx;
      background: #F9FAFB;
      border-radius: 12rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2rpx dashed #E5E7EB;
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
          font-size: 48rpx;
          margin-bottom: 12rpx;
          color: $color-text-placeholder;
        }
        
        .text {
          font-size: 24rpx;
          color: $color-text-secondary;
        }
      }
      
      &:active {
        background: #F3F4F6;
      }
    }
  }
}

.action-bar {
  margin-top: 60rpx;
  
  .agreement {
    margin-bottom: 30rpx;
    display: flex;
    justify-content: center;
    
    .checkbox-label {
      display: flex;
      align-items: center;
      font-size: 24rpx;
      color: $color-text-secondary;
    }
  }
  
  .btn-submit {
    background: $color-primary-gradient;
    color: #fff;
    border-radius: 44rpx;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 32rpx;
    font-weight: bold;
    box-shadow: $shadow-primary;
    
    &.disabled {
      background: #E5E7EB;
      color: #9CA3AF;
      box-shadow: none;
    }
    
    &:active:not(.disabled) {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }
}
</style>
