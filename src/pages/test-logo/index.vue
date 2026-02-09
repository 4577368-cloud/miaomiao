<template>
  <view class="test-container">
    <view class="test-header">
      <text class="test-title">Logo显示测试</text>
      <text class="test-subtitle">如果图片无法显示，请检查浏览器控制台</text>
    </view>
    
    <view class="test-section">
      <text class="section-title">测试1: 本地Logo</text>
      <image 
        src="/static/logo.png" 
        class="test-logo"
        mode="aspectFit"
        @load="onLocalLogoLoad"
        @error="onLocalLogoError"
      />
      <text class="status-text" :class="localLogoStatus">{{ localLogoMessage }}</text>
    </view>
    
    <view class="test-section">
      <text class="section-title">测试2: 网络Logo</text>
      <image 
        src="https://imgus.tangbuy.com/static/images/2026-02-07/fb3eeeb726ef43ea9a0020b18da5290e-177045207976112019662246898497843.jpeg" 
        class="test-logo"
        mode="aspectFit"
        @load="onNetworkLogoLoad"
        @error="onNetworkLogoError"
      />
      <text class="status-text" :class="networkLogoStatus">{{ networkLogoMessage }}</text>
    </view>
    
    <view class="test-section">
      <text class="section-title">测试3: 备用Logo</text>
      <image 
        src="https://via.placeholder.com/200x200/FF8E3C/FFFFFF?text=宠乐到家" 
        class="test-logo"
        mode="aspectFit"
        @load="onFallbackLogoLoad"
        @error="onFallbackLogoError"
      />
      <text class="status-text" :class="fallbackLogoStatus">{{ fallbackLogoMessage }}</text>
    </view>
    
    <view class="debug-info">
      <text class="debug-title">调试信息</text>
      <text class="debug-text">协议: {{ protocol }}</text>
      <text class="debug-text">域名: {{ hostname }}</text>
      <text class="debug-text">端口: {{ port }}</text>
      <text class="debug-text">用户代理: {{ userAgent }}</text>
    </view>
    
    <CustomTabBar current-path="pages/test-logo/index" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CustomTabBar from '@/components/custom-tab-bar/index.vue';

const localLogoStatus = ref('');
const localLogoMessage = ref('等待加载...');
const networkLogoStatus = ref('');
const networkLogoMessage = ref('等待加载...');
const fallbackLogoStatus = ref('');
const fallbackLogoMessage = ref('等待加载...');

const protocol = ref('');
const hostname = ref('');
const port = ref('');
const userAgent = ref('');

onMounted(() => {
  // 获取浏览器信息
  protocol.value = window.location.protocol;
  hostname.value = window.location.hostname;
  port.value = window.location.port;
  userAgent.value = navigator.userAgent;
  
  console.log('Logo测试页面加载完成');
  console.log('当前URL:', window.location.href);
  console.log('协议:', protocol.value);
  console.log('域名:', hostname.value);
  console.log('端口:', port.value);
});

const onLocalLogoLoad = () => {
  localLogoStatus.value = 'success';
  localLogoMessage.value = '✅ 本地Logo加载成功';
  console.log('本地Logo加载成功');
};

const onLocalLogoError = (event: any) => {
  localLogoStatus.value = 'error';
  localLogoMessage.value = '❌ 本地Logo加载失败';
  console.error('本地Logo加载失败:', event);
  console.error('错误详情:', JSON.stringify(event));
};

const onNetworkLogoLoad = () => {
  networkLogoStatus.value = 'success';
  networkLogoMessage.value = '✅ 网络Logo加载成功';
  console.log('网络Logo加载成功');
};

const onNetworkLogoError = (event: any) => {
  networkLogoStatus.value = 'error';
  networkLogoMessage.value = '❌ 网络Logo加载失败';
  console.error('网络Logo加载失败:', event);
};

const onFallbackLogoLoad = () => {
  fallbackLogoStatus.value = 'success';
  fallbackLogoMessage.value = '✅ 备用Logo加载成功';
  console.log('备用Logo加载成功');
};

const onFallbackLogoError = (event: any) => {
  fallbackLogoStatus.value = 'error';
  fallbackLogoMessage.value = '❌ 备用Logo加载失败';
  console.error('备用Logo加载失败:', event);
};
</script>

<style lang="scss" scoped>
.test-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFFBF5 0%, #FFF8F0 100%);
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.test-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.test-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.test-subtitle {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.test-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.test-logo {
  width: 200rpx;
  height: 200rpx;
  display: block;
  margin: 0 auto 20rpx;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
}

.status-text {
  font-size: 28rpx;
  text-align: center;
  display: block;
  
  &.success {
    color: #4CAF50;
  }
  
  &.error {
    color: #f44336;
  }
  
  &:not(.success):not(.error) {
    color: #999;
  }
}

.debug-info {
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.debug-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

.debug-text {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 5rpx;
  word-break: break-all;
}
</style>