<template>
  <view class="container">
    <view class="form-card">
      <!-- Service Types -->
      <view class="section">
        <text class="section-title">提供服务</text>
        <view class="tags-group">
          <view 
            class="tag-item" 
            :class="{ active: form.services.includes('feeding') }"
            @click="toggleService('feeding')"
          >
            🐱 上门喂养
          </view>
          <view 
            class="tag-item" 
            :class="{ active: form.services.includes('walking') }"
            @click="toggleService('walking')"
          >
            🐶 上门遛宠
          </view>
        </view>
      </view>
      
      <view class="divider"></view>

      <!-- Availability -->
      <view class="section">
        <text class="section-title">空闲时间</text>
        <input class="input" v-model="form.time" placeholder="例如：周末全天、工作日晚上" />
      </view>

      <view class="divider"></view>

      <!-- Location -->
      <view class="section">
        <text class="section-title">服务区域</text>
        <input class="input" v-model="form.locationStr" placeholder="例如：朝阳区三里屯附近" />
      </view>

      <view class="divider"></view>

      <!-- Expertise -->
      <view class="section">
        <text class="section-title">擅长领域</text>
        <view class="tags-group">
          <view 
            class="tag-item small" 
            v-for="tag in availableTags" 
            :key="tag"
            :class="{ active: form.tags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </view>
        </view>
      </view>

      <view class="divider"></view>

      <!-- Experience -->
      <view class="section">
        <text class="section-title">经验描述</text>
        <textarea 
          class="textarea" 
          v-model="form.experience" 
          placeholder="请描述您的养宠经验、照顾特长等，这能增加被选中的机会..."
          maxlength="200"
        />
        <text class="word-count">{{ form.experience.length }}/200</text>
      </view>
    </view>

    <view class="footer">
      <button class="btn-submit" @click="handleSubmit">发布意向</button>
    </view>
  </view>
  <view style="height: 100px;"></view>
  <CustomTabBar current-path="pages/publish/sitter" />
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useSitterStore } from '@/stores/sitter';

const userStore = useUserStore();
const sitterStore = useSitterStore();

const availableTags = ['猫咪专家', '大型犬', '幼宠照顾', '老年宠护理', '口服药喂食', '注射服务', '行为训练', '多宠家庭'];

const form = reactive({
  services: [] as ('feeding' | 'walking')[],
  time: '',
  locationStr: '',
  tags: [] as string[],
  experience: ''
});

onMounted(() => {
  // Load existing profile if any
  const profile = userStore.userInfo?.sitterProfile;
  if (profile) {
    if (profile.availability) {
      form.services = [...profile.availability.services];
      form.time = profile.availability.time;
      form.locationStr = profile.availability.locations.join('、');
    }
    form.tags = [...profile.tags];
    form.experience = profile.bio;
  }
});

const toggleService = (type: 'feeding' | 'walking') => {
  const idx = form.services.indexOf(type);
  if (idx > -1) form.services.splice(idx, 1);
  else form.services.push(type);
};

const toggleTag = (tag: string) => {
  const idx = form.tags.indexOf(tag);
  if (idx > -1) form.tags.splice(idx, 1);
  else form.tags.push(tag);
};

const handleSubmit = () => {
  if (form.services.length === 0) return uni.showToast({ title: '请选择至少一项服务', icon: 'none' });
  if (!form.time) return uni.showToast({ title: '请填写空闲时间', icon: 'none' });
  if (!form.locationStr) return uni.showToast({ title: '请填写服务区域', icon: 'none' });
  if (!form.experience) return uni.showToast({ title: '请填写经验描述', icon: 'none' });

  uni.showLoading({ title: '发布中...' });

  setTimeout(() => {
    uni.hideLoading();
    
    if (userStore.userInfo && userStore.userInfo.sitterProfile) {
      // Update Store
      userStore.userInfo.sitterProfile.availability = {
        services: form.services,
        time: form.time,
        locations: form.locationStr.split(/[,，、\s]+/).filter(Boolean)
      };
      userStore.userInfo.sitterProfile.tags = form.tags;
      userStore.userInfo.sitterProfile.bio = form.experience;
      
      userStore.updateUser(userStore.userInfo);
      
      // Add to available sitters for user visibility
      sitterStore.addSitter(userStore.userInfo);
      
      uni.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  }, 800);
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #FFFBF5;
  padding: 20px;
  padding-bottom: 100px;
}

.form-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.section {
  padding: 16px 0;
  
  .section-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 12px;
    display: block;
  }
}

.divider {
  height: 1px;
  background: #f5f5f5;
}

.input {
  font-size: 14px;
  color: #333;
  width: 100%;
}

.textarea {
  width: 100%;
  height: 120px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.word-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  display: block;
  margin-top: 8px;
}

.tags-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  .tag-item {
    padding: 8px 16px;
    background: #f5f5f5;
    border-radius: 20px;
    font-size: 14px;
    color: #666;
    border: 1px solid transparent;
    transition: all 0.2s;
    
    &.small {
      font-size: 12px;
      padding: 6px 12px;
    }
    
    &.active {
      background: #FFF0E5;
      color: #FF8E3C;
      border-color: #FF8E3C;
    }
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  
  .btn-submit {
    background: #FF8E3C;
    color: #fff;
    border-radius: 24px;
    font-size: 16px;
    font-weight: bold;
    height: 48px;
    line-height: 48px;
  }
}
</style>