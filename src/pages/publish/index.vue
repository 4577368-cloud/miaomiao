<template>
  <view class="container">
    <!-- 顶部导航栏占位 -->
    <view class="nav-placeholder"></view>

    <!-- SITTER MODE: Update Availability -->
    <block v-if="userStore.userInfo?.role === 'sitter'">
      <view class="page-header">
        <text class="title">服务管理</text>
        <text class="subtitle">管理您的接单时间与服务内容</text>
      </view>

      <view class="card-section">
        <view class="section-header">
          <text class="section-title">可服务时间</text>
        </view>
        <view class="time-options">
          <view 
            class="time-opt" 
            :class="{ active: sitterForm.availability.time === 'Weekends' }"
            @click="sitterForm.availability.time = 'Weekends'"
          >仅周末</view>
          <view 
            class="time-opt" 
            :class="{ active: sitterForm.availability.time === 'Weekdays' }"
            @click="sitterForm.availability.time = 'Weekdays'"
          >仅工作日</view>
          <view 
            class="time-opt" 
            :class="{ active: sitterForm.availability.time === 'All' }"
            @click="sitterForm.availability.time = 'All'"
          >全周</view>
        </view>
      </view>

      <view class="card-section">
        <view class="section-header">
          <text class="section-title">服务项目</text>
        </view>
        <view class="checkbox-group">
          <label class="checkbox-item" @click="toggleSitterService('feeding')">
            <view class="checkbox" :class="{ checked: sitterForm.availability.services.includes('feeding') }">✓</view>
            <text>上门喂养</text>
          </label>
          <label class="checkbox-item" @click="toggleSitterService('walking')">
            <view class="checkbox" :class="{ checked: sitterForm.availability.services.includes('walking') }">✓</view>
            <text>上门遛宠</text>
          </label>
        </view>
      </view>

      <button class="btn-submit" @click="handleSitterUpdate">保存设置</button>
    </block>

    <!-- OWNER MODE: Publish Task -->
    <block v-else>
      <!-- 1. 发布模式选择 (Task Hall vs Specific Sitter) -->
      <view class="section card-section mode-selection">
        <view class="section-header">
          <text class="section-title">发布方式</text>
        </view>
        <view class="mode-grid">
          <view 
            class="mode-card mode-hall"
            :class="{ active: !form.targetSitterId }"
            @click="selectPublishMode('HALL')"
          >
            <view class="mode-info">
              <text class="mode-title">任务大厅</text>
              <text class="mode-desc">系统派单 / 多人抢单</text>
            </view>
            <view class="check-mark" v-if="!form.targetSitterId">✓</view>
          </view>
          
          <view 
            class="mode-card mode-sitter"
            :class="{ active: form.targetSitterId, disabled: availableSitters.length === 0 }"
            @click="availableSitters.length > 0 && selectPublishMode('SITTER')"
          >
            <view class="mode-info">
              <text class="mode-title">指定宠托师</text>
              <text class="mode-desc" v-if="availableSitters.length > 0">{{ availableSitters.length }}位宠托师在线</text>
              <text class="mode-desc" v-else>暂无在线宠托师</text>
            </view>
            <view class="check-mark" v-if="form.targetSitterId">✓</view>
          </view>
        </view>
      </view>

      <!-- 2. 服务类型 -->
      <view class="section card-section">
        <view class="section-header">
          <text class="section-title">服务类型</text>
        </view>
        <view class="service-type-switch">
          <view 
            class="switch-item feeding"
            :class="{ active: form.serviceType === ServiceType.FEEDING, disabled: isServiceDisabled(ServiceType.FEEDING) }"
            @click="selectServiceType(ServiceType.FEEDING)"
          >
            <view class="info">
              <text class="label">上门喂养</text>
              <text class="desc">喂食 · 换水 · 铲屎</text>
              <text class="price">标准价 ¥{{ getServiceBasePrice(ServiceType.FEEDING) }}/次</text>
            </view>
            <view class="check-mark" v-if="form.serviceType === ServiceType.FEEDING">✓</view>
          </view>
          
          <view 
            class="switch-item walking"
            :class="{ active: form.serviceType === ServiceType.WALKING, disabled: isServiceDisabled(ServiceType.WALKING) }"
            @click="selectServiceType(ServiceType.WALKING)"
          >
            <view class="info">
              <text class="label">上门遛宠</text>
              <text class="desc">遛狗 · 陪玩 · 清洁</text>
              <text class="price">标准价 ¥{{ getServiceBasePrice(ServiceType.WALKING) }}/次</text>
            </view>
            <view class="check-mark" v-if="form.serviceType === ServiceType.WALKING">✓</view>
          </view>
        </view>
        
        <!-- 服务内容标准说明 -->
        <view class="service-standards">
           <view class="std-header" @click="showServiceDesc = !showServiceDesc">
              <text class="std-title">查看服务内容详情</text>
              <text class="std-arrow" :class="{ rotated: showServiceDesc }">></text>
           </view>
           <view class="std-content" v-if="showServiceDesc">
              <view class="std-item">
                <text class="dot">🥣</text>
                <text class="text">喂食：猫粮/罐头/自制猫饭/生骨肉/商业湿粮/零食</text>
              </view>
              <view class="std-item">
                <text class="dot">💧</text>
                <text class="text">换水：清洗饮水机/静态水碗，更换新鲜水源</text>
              </view>
              <view class="std-item">
                <text class="dot">🧹</text>
                <text class="text">清理：铲屎/清理尿团 (单层/双层猫砂盆)</text>
              </view>
              <view class="std-item">
                <text class="dot">👀</text>
                <text class="text">观察：检查身体情况、精神状态、陪玩陪疯撸猫</text>
              </view>
              <view class="std-item">
                <text class="dot">📸</text>
                <text class="text">反馈：拍照/拍视频实时发送 (建议安装监控)</text>
              </view>
              <view class="std-item highlight">
                 <text class="dot">💊</text>
                 <text class="text">喂药/浇花等更多个性化服务，请联系客服或备注</text>
              </view>
           </view>
        </view>
      </view>

      <!-- 3. 选择宠托师 (Only if Specific Sitter mode is active) -->
      <view class="section card-section sitter-select-card" v-if="form.targetSitterId || showSitterSelector">
        <view class="section-header">
          <text class="section-title">选择宠托师</text>
        </view>
        
        <scroll-view scroll-x class="sitter-scroll">
          <view class="sitter-list">
            <view 
              v-for="sitter in availableSitters" 
              :key="sitter.id"
              class="sitter-card"
              :class="{ active: form.targetSitterId === sitter.id }"
              @click="selectSitter(sitter)"
            >
              <image :src="sitter.avatar" class="avatar" mode="aspectFill" />
              <view class="name-row">
                <text class="name">{{ sitter.nickname }}</text>
                <view :class="['level-badge', sitter.sitterProfile?.level.toLowerCase()]">
                  {{ getLevelLabel(sitter.sitterProfile?.level) }}
                </view>
              </view>
              <text class="desc">{{ sitter.sitterProfile?.experienceYears }}年经验 | {{ sitter.sitterProfile?.tags[0] }}</text>
              <view class="check-mark" v-if="form.targetSitterId === sitter.id">✓</view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 4. 地址与时间 -->
      <view class="section card-section address-time-card">
        <view class="form-row" @click="handleAddressSelect">
          <view class="icon-box location">📍</view>
          <view class="row-content">
            <text class="row-label">服务地址</text>
            <text class="row-value" :class="{ placeholder: !form.address }">
              {{ form.address || '点击选择服务地址' }}
            </text>
          </view>
          <text class="arrow">></text>
        </view>
        
        <view class="divider"></view>
        
        <!-- Date Range & Time Selection -->
        <view class="time-selection-area">
           <view class="time-header">
              <text class="row-label">服务时间</text>
              <view class="mode-switch">
                 <text 
                    :class="{active: !isMultiDay}" 
                    @click="isMultiDay = false"
                 >单次</text>
                 <text class="sep">|</text>
                 <text 
                    :class="{active: isMultiDay}" 
                    @click="isMultiDay = true"
                 >连续多天</text>
              </view>
           </view>
           
           <picker 
              v-if="!isMultiDay" 
              mode="date" 
              :start="startDate" 
              :end="endDate" 
              @change="handleDateChange"
           >
              <view class="date-display">
                 <text class="date-val">{{ form.date || '选择日期' }}</text>
                 <text class="icon">📅</text>
              </view>
           </picker>
           
           <view v-else class="multi-date-row">
              <picker mode="date" :start="startDate" :end="endDate" @change="(e: any) => handleRangeChange('start', e)">
                 <view class="date-box">
                    <text class="lbl">开始</text>
                    <text class="val">{{ dateRange.start || '请选择' }}</text>
                 </view>
              </picker>
              <text class="arrow">→</text>
              <picker mode="date" :start="dateRange.start || startDate" :end="endDate" @change="(e: any) => handleRangeChange('end', e)">
                 <view class="date-box">
                    <text class="lbl">结束</text>
                    <text class="val">{{ dateRange.end || '请选择' }}</text>
                 </view>
              </picker>
           </view>
           
           <view class="slots-container">
              <scroll-view scroll-x class="slots-scroll">
                 <view class="slots-row">
                    <view 
                       v-for="t in timeSlots" 
                       :key="t" 
                       class="time-slot"
                       :class="{active: form.time === t}"
                       @click="form.time = t"
                    >
                       {{ t }}
                    </view>
                 </view>
              </scroll-view>
           </view>
        </view>
      </view>

      <!-- 4. 宠物类型 -->
      <view class="section card-section">
        <view class="section-header">
          <text class="section-title">宠物类型</text>
          <text class="section-sub">选择体型以匹配合适的服务人员</text>
        </view>
        
        <view class="my-pets">
           <view class="section-header-row">
              <text class="sub-label">从我的爱宠中选择：</text>
              <view class="add-pet-link" @click="goToPetPage">
                 <text class="plus">+</text>
                 <text>管理/添加</text>
              </view>
           </view>
           
           <scroll-view scroll-x class="pets-scroll">
              <view class="pets-row">
                 <view 
                    class="my-pet-item" 
                    v-for="pet in userStore.userInfo?.pets" 
                    :key="pet.id"
                    :class="{ active: selectedPetIds.includes(pet.id) }"
                    @click="selectMyPet(pet)"
                 >
                    <image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="pet-avatar" />
                    <text class="pet-name">{{ pet.name }}</text>
                 </view>
                 
                 <view class="my-pet-item add-item" @click="goToPetPage">
                    <view class="add-icon">+</view>
                    <text class="pet-name">添加爱宠</text>
                 </view>
              </view>
           </scroll-view>
        </view>

        <view class="pet-grid" :class="{ disabled: selectedPetIds.length > 0 }">
          <!-- Overlay to block clicks but keep visual clear -->
          <view class="grid-overlay" v-if="selectedPetIds.length > 0"></view>
          
          <view 
            v-for="size in petSizeOptions" 
            :key="size.value"
            :class="['pet-card', { active: form.petSize === size.value }]"
            @click="selectedPetIds.length === 0 && (form.petSize = size.value)"
          >
            <image :src="size.image" mode="aspectFill" class="pet-icon-img" />
            <text class="pet-name">{{ size.label }}</text>
            <text class="pet-desc">{{ size.desc }}</text>
            <view class="pet-badge" v-if="size.coeff > 1">+{{ Math.round((size.coeff - 1) * 100) }}%</view>
          </view>
        </view>
      </view>

      <!-- 5. 服务时长 -->
      <view class="section card-section">
        <view class="section-header">
          <text class="section-title">服务时长</text>
          <text class="section-sub">时长越长，陪伴越久</text>
        </view>
        <view class="duration-selector">
          <view 
            v-for="d in durations" 
            :key="d.value"
            class="duration-item"
            :class="{ active: form.duration === d.value }"
            @click="form.duration = d.value"
          >
            <view class="d-val">
              <text class="num">{{ d.value }}</text>
              <text class="unit">分钟</text>
            </view>
            <view class="d-price-tag" :class="{ 'has-markup': d.markup > 0 }">
              {{ d.markup > 0 ? `+${Math.round(d.markup * 100)}%` : '标准价' }}
            </view>
            <view class="check-icon" v-if="form.duration === d.value">✓</view>
          </view>
        </view>
      </view>

      <!-- 6. 附加服务 -->
      <view class="section card-section">
        <view class="section-header">
          <text class="section-title">附加服务</text>
        </view>
        <view class="addon-list">
          <view 
            class="addon-item" 
            :class="{ active: form.addOns.play }"
            @click="form.addOns.play = !form.addOns.play"
          >
            <view class="addon-info">
              <text class="addon-name">陪玩15分钟</text>
              <text class="addon-price">+¥{{ addOnPrices.PLAY_15_MIN }}</text>
            </view>
            <view class="checkbox" :class="{ checked: form.addOns.play }"></view>
          </view>
          <view 
            class="addon-item" 
            :class="{ active: form.addOns.deepClean }"
            @click="form.addOns.deepClean = !form.addOns.deepClean"
          >
            <view class="addon-info">
              <text class="addon-name">深度清洁</text>
              <text class="addon-price">+¥{{ addOnPrices.DEEP_CLEAN }}</text>
            </view>
            <view class="checkbox" :class="{ checked: form.addOns.deepClean }"></view>
          </view>
          <view 
            class="addon-item" 
            :class="{ active: form.addOns.medicine }"
            @click="form.addOns.medicine = !form.addOns.medicine"
          >
            <view class="addon-info">
              <text class="addon-name">喂药服务</text>
              <text class="addon-price">+¥{{ addOnPrices.MEDICINE }}</text>
            </view>
            <view class="checkbox" :class="{ checked: form.addOns.medicine }"></view>
          </view>
        </view>
      </view>
      
      <!-- 7. 优惠券 -->
      <view class="section card-section" @click="openCouponSelector">
        <view class="form-row">
          <view class="icon-box coupon-icon">🎟️</view>
          <view class="row-content">
            <text class="row-label">优惠券</text>
            <text class="row-value highlight" v-if="selectedCoupon">
              -¥{{ selectedCoupon.value }}
            </text>
            <text class="row-value placeholder" v-else>
              {{ availableCouponsCount > 0 ? `${availableCouponsCount}张可用` : '无可用优惠券' }}
            </text>
          </view>
          <text class="arrow">></text>
        </view>
      </view>

      <!-- 8. 备注 -->
      <view class="section card-section">
        <view class="section-header">
          <text class="section-title">订单备注</text>
        </view>
        <view class="remark-box">
          <textarea 
            v-model="form.remark" 
            placeholder="请填写宠物的特殊习惯、性格或注意事项..." 
            class="remark-input" 
            placeholder-style="color: #BFBFBF"
            auto-height
          />
        </view>
      </view>

      <!-- 底部保障 -->
      <view class="service-guarantee">
        <view class="guarantee-header">
           <text class="line"></text>
           <text class="title">平台服务保障</text>
           <text class="line"></text>
        </view>
        <view class="guarantee-grid">
           <view class="g-item">
              <view class="icon-box">🛡️</view>
              <text class="g-title">实名认证</text>
              <text class="g-desc">专业培训上岗</text>
           </view>
           <view class="g-item">
              <view class="icon-box">🏥</view>
              <text class="g-title">意外保险</text>
              <text class="g-desc">全程赠送保险</text>
           </view>
           <view class="g-item">
              <view class="icon-box">⏰</view>
              <text class="g-title">免费取消</text>
              <text class="g-desc">服务前2小时</text>
           </view>
        </view>
      </view>

      <!-- 底部价格栏 -->
      <view class="footer-bar-placeholder"></view>
      <view class="footer-bar">
        <view class="price-container" @click="openPriceDetail">
          <view class="price-label-row">
             <text class="price-label">预估总价</text>
             <text class="price-detail-link">明细 ></text>
          </view>
          <view class="price-col">
            <view class="price-main">
              <view class="price-val">
                <text class="symbol">¥</text>
                <text class="amount">{{ finalPrice }}</text>
              </view>
              <text class="original-price" v-if="finalPrice < rawTotalPrice">¥{{ rawTotalPrice }}</text>
            </view>
            <view class="price-tags" v-if="priceBreakdown.holiday > 0 || priceBreakdown.rush > 0">
               <text class="tag holiday" v-if="priceBreakdown.holiday > 0">节日+{{ priceBreakdown.holiday }}</text>
               <text class="tag rush" v-if="priceBreakdown.rush > 0">急单+{{ priceBreakdown.rush }}</text>
            </view>
          </view>
        </view>
        <button class="btn-submit" @click="handleSubmit">
          {{ form.targetSitterId ? '立即预约' : '发布需求' }}
        </button>
      </view>

      <!-- 价格明细弹窗 -->
      <view class="price-detail-mask" v-if="showPriceDetail" @click="closePriceDetail">
         <view class="price-detail-content" @click.stop>
            <view class="pd-header">
               <text class="pd-title">费用明细</text>
               <text class="pd-close" @click="closePriceDetail">×</text>
            </view>
            <view class="pd-list">
               <view class="pd-item">
                  <text class="pd-label">标准服务价</text>
                  <text class="pd-val">¥{{ basePrice }}</text>
               </view>
               <view class="pd-item">
                  <text class="pd-label">基础服务费</text>
                  <text class="pd-val">¥{{ priceBreakdown.base }}</text>
               </view>
               <view class="pd-item" v-if="priceBreakdown.pets > priceBreakdown.base">
                  <text class="pd-label">多宠附加费</text>
                  <text class="pd-val">+¥{{ (priceBreakdown.pets - priceBreakdown.base).toFixed(2) }}</text>
               </view>
               <view class="pd-item" v-if="priceBreakdown.duration > 0">
                  <text class="pd-label">时长加价</text>
                  <text class="pd-val">+¥{{ priceBreakdown.duration }}</text>
               </view>
               <view class="pd-item" v-if="priceBreakdown.holiday > 0">
                  <text class="pd-label">节假日溢价</text>
                  <text class="pd-val">+¥{{ priceBreakdown.holiday }}</text>
               </view>
               <view class="pd-item" v-if="priceBreakdown.rush > 0">
                  <text class="pd-label">急单溢价</text>
                  <text class="pd-val">+¥{{ priceBreakdown.rush }}</text>
               </view>
               <view class="pd-item" v-if="priceBreakdown.addOns > 0">
                  <text class="pd-label">附加服务费</text>
                  <text class="pd-val">+¥{{ priceBreakdown.addOns }}</text>
               </view>
               <view class="pd-divider"></view>
               <view class="pd-item total">
                  <text class="pd-label">总计</text>
                  <text class="pd-val">¥{{ priceBreakdown.total }}</text>
               </view>
               <view class="pd-item discount" v-if="selectedCoupon">
                  <text class="pd-label">优惠券</text>
                  <text class="pd-val">-¥{{ selectedCoupon.value }}</text>
               </view>
               <view class="pd-item final" v-if="selectedCoupon">
                  <text class="pd-label">实付</text>
                  <text class="pd-val">¥{{ finalPrice }}</text>
               </view>
            </view>
         </view>
      </view>

      <!-- 优惠券选择弹窗 -->
    <view class="coupon-popup-mask" v-if="showCouponPopup" @click="closeCouponPopup">
        <view class="coupon-popup-content" @click.stop>
          <view class="popup-header">
            <text class="popup-title">选择优惠券</text>
            <text class="popup-close" @click="closeCouponPopup">×</text>
          </view>
          
          <scroll-view scroll-y class="coupon-scroll">
            <view class="coupon-list">
               <!-- 不使用优惠券选项 -->
              <view 
                class="no-coupon-item" 
                :class="{ active: !form.couponId }"
                @click="selectCoupon('')"
              >
                <text>不使用优惠券</text>
                <view class="radio-circle" :class="{ checked: !form.couponId }"></view>
              </view>

              <!-- 优惠券列表 -->
              <view 
                class="coupon-card-item" 
                v-for="coupon in availableCoupons" 
                :key="coupon.id"
                @click="selectCoupon(coupon.id)"
              >
                <view class="card-left">
                  <view class="amount-box">
                    <text class="symbol">¥</text>
                    <text class="num">{{ coupon.value }}</text>
                  </view>
                  <text class="condition">{{ coupon.threshold > 0 ? `满${coupon.threshold}可用` : '无门槛' }}</text>
                </view>
                <view class="card-right">
                  <view class="info">
                    <text class="name">{{ coupon.name }}</text>
                    <text class="date">有效期至 {{ new Date(coupon.expiresAt).toLocaleDateString() }}</text>
                  </view>
                  <view class="radio-circle" :class="{ checked: form.couponId === coupon.id }"></view>
                </view>
                <!-- 锯齿装饰 -->
                <view class="sawtooth-left"></view>
                <view class="sawtooth-right"></view>
              </view>
              
              <view v-if="availableCoupons.length === 0" class="empty-coupons">
                <text>暂无可用优惠券</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </block>
  </view>
  <view style="height: 50px;"></view>
  <CustomTabBar current-path="pages/publish/index" />
</template>

<script setup lang="ts">
import CustomTabBar from '@/components/custom-tab-bar/index.vue';
import { reactive, computed, ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { PetSize, ServiceType } from '@/constants/pet';
import { calculateTotalPrice, type PriceBreakdown } from '@/utils/pricing';
import { useOrderStore } from '@/stores/order';
import { useUserStore, type PetInfo, type Address } from '@/stores/user';
import { useSitterStore } from '@/stores/sitter';
import { useConfigStore } from '@/stores/config';

const orderStore = useOrderStore();
const userStore = useUserStore();
const sitterStore = useSitterStore();
const configStore = useConfigStore();
const fallbackBasePrice = 50; 

// OWNER LOGIC
const selectedPetIds = ref<string[]>([]);
const showCouponPopup = ref(false);
const showServiceDesc = ref(false);
const lastPetCount = ref(0);
const showSitterSelector = ref(false);

const availableSitters = computed(() => sitterStore.availableSitters);
const addOnPrices = computed(() => configStore.getAddOnPrices());
const basePrice = computed(() => {
  const price = configStore.getServicePrice(form.serviceType);
  return price > 0 ? price : fallbackBasePrice;
});
const getServiceBasePrice = (type: ServiceType) => {
  const price = configStore.getServicePrice(type);
  return price > 0 ? price : fallbackBasePrice;
};
const petSizeOptions = computed(() => [
  { value: PetSize.CAT, label: '猫咪', desc: '不限体重', coeff: configStore.getPetSizeCoefficient(PetSize.CAT), image: '/static/avatars/cat-british.jpg' },
  { value: PetSize.SMALL, label: '小型犬', desc: '<10kg', coeff: configStore.getPetSizeCoefficient(PetSize.SMALL), image: '/static/avatars/dog-small.jpg' },
  { value: PetSize.MEDIUM, label: '中型犬', desc: '10-25kg', coeff: configStore.getPetSizeCoefficient(PetSize.MEDIUM), image: '/static/avatars/dog-corgi.jpg' },
  { value: PetSize.LARGE, label: '大型犬', desc: '>25kg', coeff: configStore.getPetSizeCoefficient(PetSize.LARGE), image: '/static/avatars/dog-golden.jpg' }
]);
const pricingOverrides = computed(() => ({
  petSizeCoefficients: configStore.getPetSizeCoefficients(),
  addOnPrices: addOnPrices.value,
  holidayMultiplier: configStore.getHolidayMultiplier(),
  rushMultiplier: configStore.getRushMultiplier(),
  rushThresholdHours: configStore.getRushThresholdHours(),
  multiPetDiscount: configStore.getMultiPetDiscount()
}));

const form = reactive({
  targetSitterId: undefined as string | undefined,
  address: '',
  contactName: '',
  contactPhone: '',
  date: '',
  time: '',
  serviceType: ServiceType.FEEDING,
  petSize: PetSize.CAT,
  duration: 30,
  durationMarkup: 0,
  remark: '',
  couponId: '',
  addOns: {
    play: false,
    deepClean: false,
    medicine: false,
  }
});

// SITTER LOGIC
const sitterForm = reactive({
  availability: {
    time: 'Weekends',
    locations: [],
    services: [] as ('feeding' | 'walking')[]
  }
});

// Initialize Sitter Form
const initSitterForm = () => {
  if (userStore.userInfo?.sitterProfile?.availability) {
    sitterForm.availability = JSON.parse(JSON.stringify(userStore.userInfo.sitterProfile.availability));
  }
};

const toggleSitterService = (svc: 'feeding' | 'walking') => {
  const list = sitterForm.availability.services;
  const idx = list.indexOf(svc);
  if (idx > -1) list.splice(idx, 1);
  else list.push(svc);
};

const handleSitterUpdate = () => {
  userStore.updateUser({
    sitterProfile: {
      ...userStore.userInfo!.sitterProfile!,
      availability: sitterForm.availability
    }
  });
  uni.showToast({ title: '设置已更新', icon: 'success' });
};

const getLevelLabel = (level?: string) => {
  switch (level) {
    case 'GOLD': return '金牌';
    case 'SILVER': return '银牌';
    case 'BRONZE': return '铜牌';
    default: return '普通';
  }
};

const selectPublishMode = (mode: 'HALL' | 'SITTER') => {
  if (mode === 'HALL') {
    form.targetSitterId = undefined;
    showSitterSelector.value = false;
  } else {
    showSitterSelector.value = true;
    // Auto-select first sitter if none selected
    if (!form.targetSitterId && availableSitters.value.length > 0) {
      form.targetSitterId = availableSitters.value[0].id;
    }
  }
};

// OWNER ACTIONS
const selectSitter = (sitter: any) => {
  if (!sitter) {
    // Should not happen in new UI logic for sitter card click
    return;
  }
  form.targetSitterId = sitter.id;
};

const isServiceDisabled = (type: ServiceType) => {
  if (!form.targetSitterId) return false;
  const sitter = availableSitters.value.find(s => s.id === form.targetSitterId);
  if (sitter && sitter.sitterProfile?.availability?.services) {
    const lowerType = type === ServiceType.FEEDING ? 'feeding' : 'walking';
    return !sitter.sitterProfile.availability.services.includes(lowerType);
  }
  return false;
};

const selectServiceType = (type: ServiceType) => {
  if (isServiceDisabled(type)) {
     uni.showToast({ title: '当前宠托师不支持该服务', icon: 'none' });
     return;
  }
  form.serviceType = type;
};

// Date/Time Logic
const today = new Date();
const startDate = ref(today.toISOString().split('T')[0]);
const endDate = ref(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
const isMultiDay = ref(false);
const dateRange = reactive({ start: '', end: '' });

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '19:00', '20:00'];

const handleDateChange = (e: any) => {
  form.date = e.detail.value;
};

const handleRangeChange = (type: 'start' | 'end', e: any) => {
   if (type === 'start') dateRange.start = e.detail.value;
   else dateRange.end = e.detail.value;
   
   if (dateRange.start && dateRange.end) {
      form.date = `${dateRange.start} 至 ${dateRange.end}`;
   }
};

// Address
const handleAddressSelect = () => {
  uni.chooseLocation({
    success: (res) => {
      form.address = res.address + (res.name ? ` (${res.name})` : '');
    },
    fail: () => {
       // Mock for dev
       form.address = '北京市朝阳区三里屯SOHO';
    }
  });
};

// Pet
const goToPetPage = () => {
   uni.navigateTo({ url: '/pages/pet/index' });
};

const selectMyPet = (pet: PetInfo) => {
   const index = selectedPetIds.value.indexOf(pet.id);
   if (index > -1) {
     selectedPetIds.value.splice(index, 1);
   } else {
     selectedPetIds.value.push(pet.id);
   }
   
   // Update remark with all selected pets
   const selectedPets = userStore.userInfo?.pets?.filter(p => selectedPetIds.value.includes(p.id)) || [];
   if (selectedPets.length > 0) {
     form.remark = selectedPets.map(p => `${p.name}(${p.breed})`).join(', ');
     
     // Determine the largest size among selected pets
     const sizePriority = {
       [PetSize.CAT]: 1,
       [PetSize.SMALL]: 2,
       [PetSize.MEDIUM]: 3,
       [PetSize.LARGE]: 4,
       [PetSize.GIANT]: 5
     };
     
     let maxSize = selectedPets[0].size;
     let maxPriority = sizePriority[maxSize] || 0;
     
     for (let i = 1; i < selectedPets.length; i++) {
       const p = selectedPets[i];
       const priority = sizePriority[p.size] || 0;
       if (priority > maxPriority) {
         maxPriority = priority;
         maxSize = p.size;
       }
     }
     form.petSize = maxSize;
   } else {
     form.remark = '';
     // Reset to default or keep current? Let's reset to CAT as default
     form.petSize = PetSize.CAT;
   }
};

// Duration
const durations = [
  { value: 30, markup: 0 },
  { value: 45, markup: 0.2 },
  { value: 60, markup: 0.4 },
  { value: 90, markup: 0.7 }
];

// Coupons
const openCouponSelector = () => {
   showCouponPopup.value = true;
};
const closeCouponPopup = () => {
   showCouponPopup.value = false;
};
const selectCoupon = (id: string) => {
   form.couponId = id;
};

const availableCoupons = computed(() => {
   if (!userStore.userInfo?.coupons) return [];
   // Simple logic: filter active
   return userStore.userInfo.coupons.filter(c => c.status === 'UNUSED');
});

const availableCouponsCount = computed(() => availableCoupons.value.length);
const selectedCoupon = computed(() => {
   if (!form.couponId) return null;
   return availableCoupons.value.find(c => c.id === form.couponId);
});


const showPriceDetail = ref(false);
const openPriceDetail = () => {
   showPriceDetail.value = true;
};
const closePriceDetail = () => {
   showPriceDetail.value = false;
};

// Price Calculation
const priceBreakdown = computed(() => {
  // Determine effective pet sizes
  let petSizes: PetSize[] = [];
  if (selectedPetIds.value.length > 0) {
    const selectedPets = userStore.userInfo?.pets?.filter(p => selectedPetIds.value.includes(p.id)) || [];
    petSizes = selectedPets.map(p => p.size);
  } else {
    petSizes = [form.petSize];
  }

  // Parse date for holiday check (use start date if range)
  // form.date format example: "2023-10-01" or "2023-10-01 至 2023-10-03"
  const serviceDate = form.date.split(' ')[0] || new Date().toISOString().split('T')[0];

  return calculateTotalPrice({
    basePrice: basePrice.value,
    petSizes: petSizes,
    durationMarkup: durations.find(d => d.value === form.duration)?.markup || 0,
    serviceDate: serviceDate,
    serviceTime: form.time || '12:00',
    addOns: form.addOns,
    overrides: pricingOverrides.value
  });
});

const rawTotalPrice = computed(() => priceBreakdown.value.total);

const finalPrice = computed(() => {
  let price = rawTotalPrice.value;
  if (selectedCoupon.value) {
     if (selectedCoupon.value.threshold > 0 && price < selectedCoupon.value.threshold) {
        // threshold not met
     } else {
        price -= selectedCoupon.value.value;
     }
  }
  return Math.max(0.01, price); // Minimum price
});


const handleSubmit = async () => {
  if (!form.address) return uni.showToast({ title: '请选择地址', icon: 'none' });
  if (!form.date) return uni.showToast({ title: '请选择时间', icon: 'none' });
  if (!form.time) return uni.showToast({ title: '请选择时间段', icon: 'none' });
  
  // Get selected pets
  const selectedPets = userStore.userInfo?.pets?.filter(p => selectedPetIds.value.includes(p.id)) || [];

  // Create Order
  const newOrder = {
    // ID will be generated by DB or Store
    creatorId: userStore.userInfo?.id || 'temp',
    sitterId: form.targetSitterId, // Null = Task Hall
    serviceType: form.serviceType,
    status: 'PENDING' as const,
    totalPrice: finalPrice.value,
    originalPrice: rawTotalPrice.value,
    discountAmount: selectedCoupon.value ? selectedCoupon.value.value : 0,
    couponId: form.couponId,
    address: form.address,
    time: `${form.date} ${form.time}`,
    petSize: selectedPets.length > 0 ? selectedPets[0].size : form.petSize,
    petIds: selectedPetIds.value,
    petSnapshots: selectedPets,
    duration: form.duration,
    remark: form.remark,
    addOns: form.addOns,
    // Contact Info (Defaults to user info if not specified)
    contactName: userStore.userInfo?.nickname || '联系人',
    contactPhone: userStore.userInfo?.phone || '',
  };
  
  try {
    uni.showLoading({ title: '发布中...' });
    await orderStore.createOrder(newOrder);
    uni.hideLoading();
    uni.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      uni.switchTab({ url: '/pages/orders/index' });
    }, 1500);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: '发布失败，请重试', icon: 'none' });
    console.error(e);
  }
};

// Lifecycle
onLoad((options: any) => {
  if (options && options.serviceType) {
    if (Object.values(ServiceType).includes(options.serviceType)) {
      form.serviceType = options.serviceType as ServiceType;
    }
  }
});

onShow(async () => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }
  await configStore.initConfig(true);
  
  // Sitter Mode Check
  if (userStore.userInfo?.role === 'sitter') {
    initSitterForm();
  }
  
  // Refresh Pets
  if (userStore.userInfo?.pets?.length) {
     const currentCount = userStore.userInfo.pets.length;
     if (currentCount > lastPetCount.value) {
        // New pet added, select it
        const newPet = userStore.userInfo.pets[userStore.userInfo.pets.length - 1];
        selectMyPet(newPet);
     }
     lastPetCount.value = currentCount;
  }
});
</script>

<style lang="scss" scoped>
@import '@/styles/vars.scss';

.container {
  padding-bottom: 180rpx;
}

.nav-placeholder {
  height: var(--status-bar-height);
  background: transparent;
}

.page-header {
  padding: 40rpx 30rpx;
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

.card-section {
  background: #fff;
  border-radius: 24rpx;
  margin: 0 30rpx 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);
}

.section-header {
  margin-bottom: 24rpx;
  display: flex;
  align-items: baseline;
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $color-text-main;
    margin-right: 16rpx;
  }
  .section-sub {
    font-size: 24rpx;
    color: $color-text-secondary;
  }
}

.mode-grid {
  display: flex;
  gap: 24rpx;
  
  .mode-card {
    flex: 1;
    border-radius: 16rpx;
    padding: 24rpx 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    border: 2rpx solid transparent;
    transition: all 0.3s;
    
    &.mode-hall {
      background: #E3F2FD;
      &.active {
        background: #BBDEFB;
        border-color: #2196F3;
      }
      .check-mark { color: #2196F3; }
    }
    
    &.mode-sitter {
      background: #FFF3E0;
      &.active {
        background: #FFE0B2;
        border-color: #FF9800;
      }
      .check-mark { color: #FF9800; }
    }
    
    &.disabled {
      opacity: 0.5;
      filter: grayscale(1);
    }
    
    .mode-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .mode-title {
      font-size: 28rpx;
      font-weight: 600;
      color: $color-text-main;
      margin-bottom: 4rpx;
    }
    
    .mode-desc {
      font-size: 22rpx;
      color: $color-text-secondary;
    }
    
    .check-mark {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      font-weight: bold;
      font-size: 24rpx;
    }
  }
}

/* Service Switch - Top Position */
.service-type-switch {
  display: flex;
  gap: 24rpx;
  
  .switch-item {
    flex: 1;
    border-radius: 24rpx;
    padding: 24rpx 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    border: 2rpx solid transparent;
    transition: all 0.3s;
    
    &.feeding {
      background: #E8F5E9;
      &.active {
        background: #C8E6C9;
        border-color: #4CAF50;
      }
      .check-mark { color: #4CAF50; }
    }
    
    &.walking {
      background: #F3E5F5;
      &.active {
        background: #E1BEE7;
        border-color: #9C27B0;
      }
      .check-mark { color: #9C27B0; }
    }
    
    .info {
      display: flex;
      flex-direction: column;
      .label {
        font-size: 30rpx;
        font-weight: 600;
        color: $color-text-main;
      }
      .desc {
        font-size: 22rpx;
        color: $color-text-secondary;
        margin-top: 4rpx;
      }
      .price {
        font-size: 22rpx;
        color: $color-primary;
        margin-top: 6rpx;
        font-weight: 600;
      }
    }
    
    &.disabled {
      opacity: 0.5;
      background: #f5f5f5;
    }
    
    .check-mark {
      position: absolute;
      right: 12rpx;
      top: 12rpx;
      font-weight: bold;
    }
  }
}

.service-standards {
    margin-top: 24rpx;
    background: #F9FAFB;
    border-radius: $radius-md;
    overflow: hidden;
    
    .std-header {
      padding: 20rpx 24rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .std-title {
        font-size: 26rpx;
        color: $color-text-secondary;
      }
      
      .std-arrow {
        font-size: 24rpx;
        color: #999;
        transition: transform 0.3s;
        
        &.rotated {
          transform: rotate(90deg);
        }
      }
    }
    
    .std-content {
      padding: 0 24rpx 24rpx;
      border-top: 1px solid rgba(0,0,0,0.03);
      
      .std-item {
        display: flex;
        align-items: flex-start;
        margin-top: 16rpx;
        
        .dot {
          font-size: 24rpx;
          margin-right: 12rpx;
          line-height: 1.4;
        }
        
        .text {
          flex: 1;
          font-size: 24rpx;
          color: $color-text-secondary;
          line-height: 1.4;
        }
        
        &.highlight {
          .text {
            color: $color-primary;
            font-weight: bold;
          }
        }
      }
    }
}

/* Sitter Scroll */
.sitter-select-card {
  padding: 30rpx 0 30rpx 30rpx; // Right padding 0 for scroll
  
  .sitter-scroll {
    white-space: nowrap;
    width: 100%;
    
    .sitter-list {
      display: flex;
      padding-right: 30rpx;
    }
    
    .sitter-card {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      width: 200rpx;
      margin-right: 20rpx;
      padding: 24rpx;
      background: #f8f8f8;
      border-radius: 16rpx;
      border: 2rpx solid transparent;
      box-sizing: border-box;
      
      &.active {
        background: rgba(255, 142, 60, 0.08);
        border-color: $color-primary;
      }
      
      &.no-sitter {
         justify-content: center;
         .icon-placeholder {
            font-size: 60rpx;
            margin-bottom: 10rpx;
         }
      }
      
      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-bottom: 12rpx;
        background: #eee;
      }
      
      .name-row {
         display: flex;
         align-items: center;
         margin-bottom: 6rpx;
         
         .name {
           font-size: 26rpx;
           font-weight: 600;
           margin-right: 6rpx;
           max-width: 80rpx;
           overflow: hidden;
           text-overflow: ellipsis;
         }
         
         .level-badge {
            font-size: 16rpx;
            padding: 2rpx 6rpx;
            border-radius: 6rpx;
            color: #fff;
            &.gold { background: #FFD700; color: #8B4500; }
            &.silver { background: #C0C0C0; color: #555; }
            &.bronze { background: #CD7F32; }
         }
      }
      
      .desc {
        font-size: 20rpx;
        color: $color-text-secondary;
        white-space: normal;
        text-align: center;
        line-height: 1.2;
      }
      
      .check-mark {
         position: absolute;
         top: 10rpx;
         right: 10rpx;
         color: $color-primary;
         font-size: 24rpx;
      }
    }
  }
}

/* Common Form Rows */
.form-row {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
  
  .icon-box {
    width: 40rpx;
    font-size: 32rpx;
    margin-right: 20rpx;
    text-align: center;
  }
  
  .row-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .row-label {
      font-size: 28rpx;
      color: $color-text-main;
      margin-bottom: 4rpx;
    }
    .row-value {
      font-size: 30rpx;
      color: $color-text-main;
      font-weight: 500;
      
      &.placeholder {
        color: $color-text-secondary;
        font-weight: normal;
      }
      &.highlight {
         color: $color-error;
      }
    }
  }
  
  .arrow {
    color: $color-text-secondary;
    font-size: 28rpx;
  }
}

.divider {
  height: 1px;
  background: #f0f0f0;
  margin: 24rpx 0;
}

/* Time Selection */
.time-selection-area {
   .time-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .row-label { font-size: 28rpx; font-weight: 600; }
      
      .mode-switch {
         font-size: 24rpx;
         color: $color-text-secondary;
         .active { color: $color-primary; font-weight: bold; }
         .sep { margin: 0 10rpx; }
      }
   }
   
   .date-display {
      background: #f9f9f9;
      padding: 20rpx;
      border-radius: 12rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .date-val { font-size: 30rpx; font-weight: 500; }
   }
   
   .multi-date-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20rpx;
      
      .date-box {
         background: #f9f9f9;
         padding: 16rpx 24rpx;
         border-radius: 12rpx;
         width: 260rpx;
         
         .lbl { display: block; font-size: 22rpx; color: $color-text-secondary; margin-bottom: 4rpx; }
         .val { font-size: 28rpx; font-weight: 500; }
      }
      .arrow { color: $color-text-secondary; }
   }
   
   .slots-container {
      width: 100%;
      overflow: hidden;
      
      .slots-scroll {
         white-space: nowrap;
         width: 100%;
         
         .slots-row {
            display: flex;
            padding-bottom: 10rpx; // scroll bar space
         }
         
         .time-slot {
            display: inline-block;
            padding: 12rpx 24rpx;
            background: #f5f5f5;
            border-radius: 30rpx;
            font-size: 26rpx;
            color: $color-text-main;
            margin-right: 16rpx;
            border: 2rpx solid transparent;
            
            &.active {
               background: rgba(255, 142, 60, 0.1);
               color: $color-primary;
               border-color: $color-primary;
            }
         }
      }
   }
}

/* Pets */
.my-pets {
   margin-bottom: 30rpx;
   
   .section-header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16rpx;
      .sub-label { font-size: 26rpx; color: $color-text-secondary; }
      .add-pet-link {
         font-size: 24rpx;
         color: $color-primary;
         display: flex;
         align-items: center;
         .plus { margin-right: 4rpx; font-size: 30rpx; }
      }
   }
   
   .pets-scroll {
      white-space: nowrap;
      .pets-row {
         display: flex;
      }
   }
   
   .my-pet-item {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      margin-right: 24rpx;
      opacity: 0.6;
      transition: all 0.2s;
      
      &.active {
         opacity: 1;
         transform: scale(1.05);
         .pet-avatar { border: 4rpx solid $color-primary; }
         .pet-name { color: $color-primary; font-weight: bold; }
      }
      
      .pet-avatar {
         width: 90rpx;
         height: 90rpx;
         border-radius: 50%;
         margin-bottom: 8rpx;
         border: 4rpx solid transparent;
      }
      .pet-name {
         font-size: 24rpx;
         color: $color-text-main;
      }
      
      &.add-item {
         opacity: 1;
         .add-icon {
            width: 90rpx;
            height: 90rpx;
            border-radius: 50%;
            background: #f5f5f5;
            color: #ccc;
            font-size: 50rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8rpx;
         }
      }
   }
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  
  .pet-card {
    background: #f9f9f9;
    padding: 20rpx 10rpx;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    &.active {
      background: rgba(255, 142, 60, 0.08);
      border-color: $color-primary;
    }
    
    .pet-icon-img { 
      width: 80rpx; 
      height: 80rpx; 
      display: block; 
      margin-bottom: 12rpx; 
      border-radius: 50%;
      object-fit: cover;
    }
    .pet-name { font-size: 24rpx; font-weight: 600; display: block; white-space: nowrap; }
    .pet-desc { font-size: 20rpx; color: $color-text-secondary; white-space: nowrap; transform: scale(0.9); }
    
    .pet-badge {
      position: absolute;
      top: -10rpx;
      right: -10rpx;
      font-size: 18rpx;
      color: #fff;
      background: $color-error;
      padding: 2rpx 6rpx;
      border-radius: 8rpx;
      z-index: 1;
    }
  }
}

/* Duration */
.duration-selector {
  display: flex;
  justify-content: space-between;
  
  .duration-item {
    flex: 1;
    margin: 0 10rpx;
    background: #f9f9f9;
    padding: 20rpx 0;
    text-align: center;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    position: relative;
    
    &:first-child { margin-left: 0; }
    &:last-child { margin-right: 0; }
    
    &.active {
      background: rgba(255, 142, 60, 0.08);
      border-color: $color-primary;
      .d-val { color: $color-primary; }
    }
    
    .d-val {
      color: $color-text-main;
      margin-bottom: 6rpx;
      .num { font-size: 36rpx; font-weight: bold; }
      .unit { font-size: 22rpx; margin-left: 4rpx; }
    }
    
    .d-price-tag {
      font-size: 20rpx;
      color: $color-text-secondary;
      &.has-markup { color: $color-error; }
    }
    
    .check-icon {
      position: absolute;
      top: 6rpx;
      right: 6rpx;
      font-size: 20rpx;
      color: $color-primary;
    }
  }
}

/* Addons */
.addon-list {
  .addon-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child { border-bottom: none; padding-bottom: 0; }
    &:first-child { padding-top: 0; }
    
    .addon-info {
      display: flex;
      flex-direction: column;
      .addon-name { font-size: 28rpx; color: $color-text-main; }
      .addon-price { font-size: 24rpx; color: $color-error; margin-top: 4rpx; }
    }
    
    .checkbox {
      width: 40rpx;
      height: 40rpx;
      border: 2rpx solid #ddd;
      border-radius: 50%;
      &.checked {
        background: $color-primary;
        border-color: $color-primary;
        position: relative;
        &::after {
          content: '✓';
          color: #fff;
          font-size: 24rpx;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }
  }
}

/* Footer Bar */
.footer-bar-placeholder { height: calc(140rpx + env(safe-area-inset-bottom)); }
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: calc(120rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  z-index: 10000;
  
  .price-container {
    flex: 1;
    
    .price-label { font-size: 24rpx; color: $color-text-secondary; }
    
    .price-col {
       display: flex;
       flex-direction: column;
       
       .price-main {
         display: flex;
         align-items: baseline;
       }
       
       .price-tags {
         display: flex;
         margin-top: 4rpx;
         
         .tag {
           font-size: 20rpx;
           padding: 2rpx 8rpx;
           border-radius: 6rpx;
           margin-right: 8rpx;
           
           &.holiday { background: #FFEBEE; color: #D32F2F; }
           &.rush { background: #E3F2FD; color: #1976D2; }
         }
       }
       
       .price-val {
         color: $color-error;
         margin-right: 16rpx;
         .symbol { font-size: 28rpx; }
         .amount { font-size: 48rpx; font-weight: bold; }
       }
       .original-price {
         text-decoration: line-through;
         color: $color-text-secondary;
         font-size: 24rpx;
       }
    }
  }
  
  .btn-submit {
    width: 240rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #FFB07C 0%, #FF8E3C 100%);
    color: #fff;
    border-radius: 40rpx;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 80rpx;
    margin: 0;
    
    &:active { opacity: 0.9; }
  }
}

/* Coupon Popup */
.coupon-popup-mask {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background: rgba(0,0,0,0.5);
   z-index: 10002;
   display: flex;
   align-items: flex-end;
}

.coupon-popup-content {
   width: 100%;
   height: 70vh;
   background: #fff;
   border-radius: 30rpx 30rpx 0 0;
   display: flex;
   flex-direction: column;
   
   .popup-header {
      padding: 30rpx;
      text-align: center;
      position: relative;
      border-bottom: 1rpx solid #eee;
      .popup-title { font-size: 32rpx; font-weight: bold; }
      .popup-close {
         position: absolute;
         right: 30rpx;
         top: 30rpx;
         font-size: 40rpx;
         color: #999;
         line-height: 1;
      }
   }
   
   .coupon-scroll {
      flex: 1;
      padding: 30rpx;
      box-sizing: border-box;
      background: #f5f5f5;
   }
   
   .no-coupon-item {
      background: #fff;
      padding: 30rpx;
      border-radius: 16rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx;
      
      &.active { color: $color-primary; }
      .radio-circle {
         width: 36rpx;
         height: 36rpx;
         border: 2rpx solid #ccc;
         border-radius: 50%;
         &.checked {
            border-color: $color-primary;
            background: $color-primary;
         }
      }
   }
   
   .coupon-card-item {
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 24rpx;
      display: flex;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
      
      .card-left {
         width: 200rpx;
         background: linear-gradient(135deg, #FFB07C 0%, #FF8E3C 100%);
         color: #fff;
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         padding: 20rpx;
         
         .amount-box {
            .symbol { font-size: 24rpx; }
            .num { font-size: 56rpx; font-weight: bold; }
         }
         .condition { font-size: 20rpx; opacity: 0.9; }
      }
      
      .card-right {
         flex: 1;
         padding: 30rpx;
         display: flex;
         justify-content: space-between;
         align-items: center;
         
         .info {
            display: flex;
            flex-direction: column;
            .name { font-size: 30rpx; font-weight: 600; margin-bottom: 8rpx; }
            .date { font-size: 22rpx; color: #999; }
         }
         
         .radio-circle {
            width: 36rpx;
            height: 36rpx;
            border: 2rpx solid #ccc;
            border-radius: 50%;
            &.checked {
               border-color: $color-primary;
               background: $color-primary;
            }
         }
      }
      
      /* Sawtooth effect */
      .sawtooth-left, .sawtooth-right {
         position: absolute;
         width: 20rpx;
         height: 20rpx;
         background: #f5f5f5;
         border-radius: 50%;
         top: 50%;
         transform: translateY(-50%);
         z-index: 10;
      }
      .sawtooth-left { left: -10rpx; }
      .sawtooth-right { right: -10rpx; display: none; }
   }
   
   .empty-coupons {
      text-align: center;
      padding: 60rpx 0;
      color: #999;
      font-size: 26rpx;
   }
}

/* Service Guarantee */
.service-guarantee {
  margin: 40rpx 30rpx 60rpx;
  
  .guarantee-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    
    .title {
      font-size: 24rpx;
      color: #999;
      margin: 0 20rpx;
    }
    
    .line {
      width: 40rpx;
      height: 2rpx;
      background: #eee;
    }
  }
  
  .guarantee-grid {
    display: flex;
    justify-content: space-between;
    
    .g-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      
      .icon-box {
        width: 80rpx;
        height: 80rpx;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36rpx;
        margin-bottom: 16rpx;
        box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
      }
      
      .g-title {
        font-size: 24rpx;
        color: $color-text-main;
        font-weight: 600;
        margin-bottom: 6rpx;
      }
      
      .g-desc {
        font-size: 20rpx;
        color: #999;
      }
    }
  }
}

.price-label-row {
   display: flex;
   align-items: center;
   margin-bottom: 4rpx;
   
   .price-label { font-size: 24rpx; color: $color-text-secondary; margin-right: 10rpx; }
   .price-detail-link { font-size: 22rpx; color: $color-primary; }
}

.price-detail-mask {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background: rgba(0,0,0,0.5);
   z-index: 10001;
   display: flex;
   align-items: flex-end;
}

.price-detail-content {
   width: 100%;
   background: #fff;
   border-radius: 30rpx 30rpx 0 0;
   padding-bottom: env(safe-area-inset-bottom);
   
   .pd-header {
      padding: 30rpx;
      text-align: center;
      position: relative;
      border-bottom: 1rpx solid #eee;
      .pd-title { font-size: 32rpx; font-weight: bold; }
      .pd-close {
         position: absolute;
         right: 30rpx;
         top: 30rpx;
         font-size: 40rpx;
         color: #999;
         line-height: 1;
      }
   }
   
   .pd-list {
      padding: 30rpx;
      
      .pd-item {
         display: flex;
         justify-content: space-between;
         margin-bottom: 20rpx;
         font-size: 28rpx;
         color: $color-text-main;
         
         &.total {
            font-weight: bold;
            font-size: 32rpx;
            margin-top: 20rpx;
         }
         
         &.discount {
            color: $color-error;
         }
         
         &.final {
            font-weight: bold;
            font-size: 36rpx;
            color: $color-error;
            margin-top: 10rpx;
         }
      }
      
      .pd-divider {
         height: 1rpx;
         background: #eee;
         margin: 20rpx 0;
      }
   }
}

.pet-grid {
   position: relative;
   
   .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      background: transparent; // Make transparent
   }
}
</style>
