<template>
  <view class="container">
    <view class="header">
      <text class="title">成为宠托师</text>
      <text class="subtitle">分享您的爱心与经验，赚取收益</text>
    </view>

    <view class="form-section">
      <!-- 1. 个人信息 -->
      <view class="card">
        <view class="card-header">个人信息 (实名认证)</view>
        <view class="input-group">
          <text class="label">真实姓名</text>
          <input class="input" type="text" v-model="form.realName" placeholder="请输入真实姓名" />
        </view>
        <view class="input-group">
          <text class="label">身份证号</text>
          <input class="input" type="idcard" v-model="form.idCard" placeholder="请输入身份证号" />
        </view>
      </view>

      <!-- 2. 经验与技能 -->
      <view class="card">
        <view class="card-header">经验与技能</view>
        <view class="input-group">
          <text class="label">养宠经验 (年)</text>
          <slider 
            :value="form.experienceYears" 
            @change="e => form.experienceYears = e.detail.value" 
            min="0" max="20" show-value 
            activeColor="#FF8E3C"
          />
          <text class="hint">系统将根据经验自动评定等级</text>
        </view>
        
        <view class="input-group">
          <text class="label">擅长技能 (多选)</text>
          <view class="tags-container">
            <view 
              v-for="tag in availableTags" 
              :key="tag"
              class="tag"
              :class="{ active: form.tags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </view>
          </view>
        </view>

        <view class="input-group">
          <text class="label">个人简介</text>
          <textarea 
            class="textarea" 
            v-model="form.bio" 
            placeholder="请简单介绍自己，增加雇主信任感..."
          />
        </view>
      </view>

      <!-- 3. 服务设置 -->
      <view class="card">
        <view class="card-header">服务设置</view>
        <view class="input-group">
          <text class="label">可服务时间</text>
          <view class="time-options">
            <view 
              class="time-opt" 
              :class="{ active: form.availability.time === 'Weekends' }"
              @click="form.availability.time = 'Weekends'"
            >仅周末</view>
            <view 
              class="time-opt" 
              :class="{ active: form.availability.time === 'Weekdays' }"
              @click="form.availability.time = 'Weekdays'"
            >仅工作日</view>
            <view 
              class="time-opt" 
              :class="{ active: form.availability.time === 'All' }"
              @click="form.availability.time = 'All'"
            >全周</view>
          </view>
        </view>
        
        <view class="input-group">
          <text class="label">服务项目</text>
          <view class="checkbox-group">
            <label class="checkbox-item" @click="toggleService('feeding')">
              <view class="checkbox" :class="{ checked: form.availability.services.includes('feeding') }">✓</view>
              <text>上门喂养</text>
            </label>
            <label class="checkbox-item" @click="toggleService('walking')">
              <view class="checkbox" :class="{ checked: form.availability.services.includes('walking') }">✓</view>
              <text>上门遛宠</text>
            </label>
          </view>
        </view>
      </view>
    </view>

    <button class="btn-submit" @click="handleSubmit">提交申请并认证</button>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useUserStore, type SitterAvailability } from '@/stores/user';

const userStore = useUserStore();

const availableTags = [
  '猫咪专家', '狗狗训练', '医疗护理', '特殊照顾', '洗护经验', '摄影达人', '耐心细致'
];

const form = reactive({
  realName: '',
  idCard: '',
  experienceYears: 1,
  tags: [] as string[],
  bio: '',
  availability: {
    time: 'Weekends',
    locations: ['朝阳区'], // Default mock
    services: ['feeding', 'walking']
  } as SitterAvailability
});

const toggleTag = (tag: string) => {
  const index = form.tags.indexOf(tag);
  if (index > -1) {
    form.tags.splice(index, 1);
  } else {
    form.tags.push(tag);
  }
};

const toggleService = (svc: 'feeding' | 'walking') => {
  const index = form.availability.services.indexOf(svc);
  if (index > -1) {
    form.availability.services.splice(index, 1);
  } else {
    form.availability.services.push(svc);
  }
};

const handleSubmit = () => {
  if (!form.realName || !form.idCard) {
    uni.showToast({ title: '请完善实名信息', icon: 'none' });
    return;
  }
  
  if (form.tags.length === 0) {
    uni.showToast({ title: '请至少选择一个技能标签', icon: 'none' });
    return;
  }

  // Register
  userStore.registerAsSitter({
    realName: form.realName,
    idCard: form.idCard,
    experienceYears: form.experienceYears,
    tags: form.tags,
    bio: form.bio,
    availability: form.availability
  });

  uni.showToast({ title: '认证通过，身份已切换', icon: 'success' });
  
  setTimeout(() => {
    uni.switchTab({ url: '/pages/home/index' });
  }, 1500);
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: $color-bg-page;
  padding: 40rpx 30rpx;
  padding-bottom: 120rpx;
}

.header {
  margin-bottom: 40rpx;
  .title {
    font-size: 40rpx;
    font-weight: bold;
    color: $color-text-main;
    display: block;
    margin-bottom: 10rpx;
  }
  .subtitle {
    font-size: 26rpx;
    color: $color-text-secondary;
  }
}

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .card-header {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text-main;
    margin-bottom: 30rpx;
    padding-left: 16rpx;
    border-left: 8rpx solid $color-primary;
  }
}

.input-group {
  margin-bottom: 30rpx;
  &:last-child { margin-bottom: 0; }
  
  .label {
    display: block;
    font-size: 26rpx;
    color: $color-text-secondary;
    margin-bottom: 16rpx;
  }
  
  .input {
    height: 80rpx;
    background: $color-bg;
    border-radius: 12rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    position: relative;
    z-index: 10;
  }
  
  .textarea {
    width: 100%;
    height: 200rpx;
    background: $color-bg;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    position: relative;
    z-index: 10;
  }
  
  .hint {
    font-size: 22rpx;
    color: $color-warning;
    margin-top: 10rpx;
    display: block;
  }
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .tag {
    padding: 10rpx 24rpx;
    background: $color-bg;
    color: $color-text-secondary;
    font-size: 24rpx;
    border-radius: 30rpx;
    border: 2rpx solid transparent;
    
    &.active {
      background: rgba($color-primary, 0.1);
      color: $color-primary;
      border-color: $color-primary;
    }
  }
}

.time-options {
  display: flex;
  gap: 20rpx;
  
  .time-opt {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    background: $color-bg;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: $color-text-secondary;
    
    &.active {
      background: $color-primary;
      color: #fff;
    }
  }
}

.checkbox-group {
  display: flex;
  gap: 40rpx;
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 28rpx;
    color: $color-text-main;
    
    .checkbox {
      width: 36rpx;
      height: 36rpx;
      border: 2rpx solid #ddd;
      border-radius: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      font-size: 24rpx;
      
      &.checked {
        background: $color-primary;
        border-color: $color-primary;
        color: #fff;
      }
    }
  }
}

.btn-submit {
  background: linear-gradient(90deg, #FF8E3C, #FF6B6B);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 600;
  margin-top: 60rpx;
}
</style>