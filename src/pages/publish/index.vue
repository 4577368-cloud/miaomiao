<template>
  <view class="container">
    <!-- 顶部导航栏占位 -->
    <view class="nav-placeholder"></view>

    <!-- SITTER MODE: Update Availability -->
    <template v-if="userStore.userInfo?.role === 'sitter'">
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
    </template>

    <!-- OWNER MODE: Publish Task -->
    <template v-else>
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
              <view class="price-line">
                <text class="price" :class="{ strike: getServiceDiscountPercent(ServiceType.FEEDING) < 100 }">¥{{ getServiceStandardPrice(ServiceType.FEEDING) }}/次</text>
                <text class="price discount" v-if="getServiceDiscountPercent(ServiceType.FEEDING) < 100">¥{{ getServiceDiscountedPrice(ServiceType.FEEDING) }}/次</text>
              </view>
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
              <view class="price-line">
                <text class="price" :class="{ strike: getServiceDiscountPercent(ServiceType.WALKING) < 100 }">¥{{ getServiceStandardPrice(ServiceType.WALKING) }}/次</text>
                <text class="price discount" v-if="getServiceDiscountPercent(ServiceType.WALKING) < 100">¥{{ getServiceDiscountedPrice(ServiceType.WALKING) }}/次</text>
              </view>
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
           </view>
           
           <view class="date-display" @click="openCalendar">
              <text class="date-val">{{ form.date || '选择日期' }}</text>
              <text class="icon">📅</text>
           </view>
           
           <view class="slots-container">
              <scroll-view scroll-x class="slots-scroll">
                 <view class="slots-row">
                    <view 
                       v-for="t in timeSlots" 
                       :key="t" 
                       class="time-slot"
                       :class="{active: form.times.includes(t)}"
                       @click="form.times = form.times.includes(t) ? form.times.filter(x => x !== t) : [...form.times, t]"
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
              ¥{{ getDurationDisplayPrice(d.value) }}
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
          ></textarea>
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
    </template>

    <!-- 公共底部栏 (Sitter 和 Owner 通用) -->
    <view class="footer-bar-placeholder"></view>
    <view class="footer-bar">
      <!-- Sitter Mode Footer -->
      <view v-if="userStore.userInfo?.role === 'sitter'" class="footer-content sitter-mode" style="width: 100%">
         <button class="btn-submit" @click="handleSitterUpdate" style="width: 100%">保存设置</button>
      </view>
      
      <!-- Owner/Default Mode Footer -->
      <view v-else class="footer-content owner-mode" style="display: flex; width: 100%; align-items: center;">
        <view class="price-container" @click="openPriceDetail">
          <view class="price-label-row">
             <text class="price-label">预估总价</text>
             <text class="price-detail-link">明细 ></text>
          </view>
          <view class="price-col">
            <view class="price-main">
              <view class="price-val">
                <text class="symbol">¥</text>
                <text class="amount">{{ safeFinalPrice }}</text>
              </view>
              <text class="original-price" v-if="safeStandardPrice > safeRawPrice">¥{{ safeStandardPrice }}</text>
            </view>
            <view class="price-tags" v-if="priceBreakdown && (priceBreakdown.holiday > 0 || priceBreakdown.rush > 0)">
               <text class="tag holiday" v-if="priceBreakdown.holiday > 0">节日+{{ priceBreakdown.holiday }}</text>
               <text class="tag rush" v-if="priceBreakdown.rush > 0">急单+{{ priceBreakdown.rush }}</text>
            </view>
          </view>
        </view>
        <button class="btn-submit" @click="handleSubmit">
          {{ form.targetSitterId ? '立即预约' : '发布需求' }}
        </button>
      </view>
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
                  <view class="pd-val-col">
                     <text class="pd-origin" v-if="discountPercent < 100">¥{{ standardBasePrice }}</text>
                     <text class="pd-discount">¥{{ discountedBasePrice }}</text>
                  </view>
               </view>
               <view class="pd-item">
                  <text class="pd-label">宠物服务价</text>
                  <text class="pd-val">¥{{ priceBreakdown.pets }}</text>
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
               <view class="pd-item" v-if="form.addOns.play">
                  <text class="pd-label">附加：陪玩15分钟</text>
                  <text class="pd-val">+¥{{ addOnPrices.PLAY_15_MIN }}</text>
               </view>
               <view class="pd-item" v-if="form.addOns.deepClean">
                  <text class="pd-label">附加：深度清洁</text>
                  <text class="pd-val">+¥{{ addOnPrices.DEEP_CLEAN }}</text>
               </view>
               <view class="pd-item" v-if="form.addOns.medicine">
                  <text class="pd-label">附加：喂药服务</text>
                  <text class="pd-val">+¥{{ addOnPrices.MEDICINE }}</text>
               </view>
               <view class="pd-divider"></view>
               <view class="pd-item total" v-if="standardTotalPrice > rawTotalPrice">
                  <text class="pd-label">原价总计</text>
                  <text class="pd-val strike">¥{{ standardTotalPrice }}</text>
               </view>
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

      <!-- 地址选择弹窗 -->
    <view class="address-popup-mask" v-if="showAddressPopup" @click="closeAddressPopup">
        <view class="address-popup-content" @click.stop>
          <view class="popup-header">
            <text class="popup-title">选择服务地址</text>
            <text class="popup-close" @click="closeAddressPopup">×</text>
          </view>
          <scroll-view scroll-y class="address-scroll">
            <view class="address-section" v-if="addressOptions.length > 0">
              <text class="section-title">我的地址</text>
              <view 
                class="address-item"
                v-for="addr in addressOptions"
                :key="addr.id"
                :class="{ active: form.address === formatAddressText(addr) }"
                @click="selectSavedAddress(addr)"
              >
                <view class="address-main">
                  <text class="address-name">{{ addr.name || '地址' }}</text>
                  <text class="address-tag" v-if="addr.isDefault">默认</text>
                </view>
                <text class="address-detail">{{ addr.detail }}</text>
              </view>
            </view>
            <view class="address-section" v-if="historyAddressOptions.length > 0">
              <text class="section-title">历史地址</text>
              <view 
                class="address-item"
                v-for="addr in historyAddressOptions"
                :key="addr.address"
                :class="{ active: form.address === addr.address }"
                @click="selectHistoryAddress(addr)"
              >
                <text class="address-detail">{{ addr.address }}</text>
              </view>
            </view>
            <view class="address-empty" v-if="addressOptions.length === 0 && historyAddressOptions.length === 0">
              暂无可用地址
            </view>
          </scroll-view>
          <view class="address-actions">
            <button class="btn-select-address" @click="chooseNewAddress">选择新地址</button>
          </view>
        </view>
      </view>
    
    <view class="calendar-popup-mask" v-if="showCalendar" @click="closeCalendar">
      <view class="calendar-popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择服务日期</text>
          <text class="popup-close" @click="closeCalendar">×</text>
          <text class="popup-action popup-clear" @click="clearCalendarRange">清除</text>
          <text class="popup-action popup-confirm" @click="applyCalendarRange">确定</text>
        </view>
        <view class="calendar-header">
          <text class="calendar-nav" @click="changeCalendarMonth(-1)">‹</text>
          <text class="calendar-title">{{ calendarTitle }}</text>
          <text class="calendar-nav" @click="changeCalendarMonth(1)">›</text>
        </view>
        <view class="calendar-week">
          <text v-for="d in calendarWeekDays" :key="d" class="week-item">{{ d }}</text>
        </view>
        <view class="calendar-grid">
          <view 
            v-for="day in calendarDays" 
            :key="day.key"
            class="calendar-day"
            :class="{
              out: !day.inMonth,
              disabled: day.disabled,
              selected: day.key === calendarRange.start || day.key === calendarRange.end,
              inrange: day.inRange
            }"
            @click="selectCalendarDay(day)"
            @touchstart="handleDayTouchStart(day)"
            @touchmove="handleDayTouchMove(day)"
            @touchend="handleDayTouchEnd"
            @touchcancel="handleDayTouchEnd"
            @mousedown="handleDayMouseDown(day)"
            @mousemove="handleDayMouseMove(day)"
            @mouseup="handleDayMouseUp"
          >
            <text class="day-num">{{ day.date.getDate() }}</text>
          </view>
        </view>
        <view class="calendar-actions">
          <button class="btn-ghost" @click="clearCalendarRange">清除</button>
          <button class="btn-primary" @click="applyCalendarRange">确定</button>
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
  </view>
</template>

<script setup lang="ts">
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
const showAddressPopup = ref(false);

const availableSitters = computed(() => sitterStore.availableSitters);
const addOnPrices = computed(() => configStore.getAddOnPrices());
const addressOptions = computed(() => userStore.userInfo?.addresses || []);
const historyAddressOptions = computed(() => {
  const userId = userStore.userInfo?.id;
  const set = new Set<string>();
  const list: { address: string }[] = [];
  orderStore.orders.forEach(o => {
    if (userId && o.creatorId !== userId) return;
    const address = (o.address || '').trim();
    if (!address || set.has(address)) return;
    set.add(address);
    list.push({ address });
  });
  return list;
});
const standardBasePrice = computed(() => {
  const price = configStore.getServiceStandardPrice(form.serviceType);
  return price > 0 ? price : fallbackBasePrice;
});
const discountPercent = computed(() => {
  const value = configStore.getServiceDiscountPercent(form.serviceType);
  return value > 0 ? value : 100;
});
const discountedBasePrice = computed(() => {
  return Math.round(standardBasePrice.value * (discountPercent.value / 100) * 100) / 100;
});
const getServiceStandardPrice = (type: ServiceType) => {
  const price = configStore.getServiceStandardPrice(type);
  return price > 0 ? price : fallbackBasePrice;
};
const getServiceDiscountPercent = (type: ServiceType) => {
  const value = configStore.getServiceDiscountPercent(type);
  return value > 0 ? value : 100;
};
const getServiceDiscountedPrice = (type: ServiceType) => {
  const standard = getServiceStandardPrice(type);
  const discount = getServiceDiscountPercent(type);
  return Math.round(standard * (discount / 100) * 100) / 100;
};
const petSizeOptions = computed(() => [
  { value: PetSize.CAT, label: '猫咪', desc: '不限体重', coeff: configStore.getPetSizeCoefficient(PetSize.CAT), image: '/static/avatars/cat-british.jpg' },
  { value: PetSize.SMALL, label: '小型犬', desc: '<10kg', coeff: configStore.getPetSizeCoefficient(PetSize.SMALL), image: '/static/avatars/dog-small.jpg' },
  { value: PetSize.MEDIUM, label: '中型犬', desc: '10-25kg', coeff: configStore.getPetSizeCoefficient(PetSize.MEDIUM), image: '/static/avatars/dog-corgi.jpg' },
  { value: PetSize.LARGE, label: '大型犬', desc: '>25kg', coeff: configStore.getPetSizeCoefficient(PetSize.LARGE), image: '/static/avatars/dog-golden.jpg' }
]);
const petCoefficient = computed(() => {
  return Math.round(configStore.getPetSizeCoefficient(form.petSize) * 100) / 100;
});
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
  times: [] as string[],
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

const showCalendar = ref(false);
const calendarMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1));
const calendarRange = reactive({ start: '', end: '' });
const dragStartKey = ref('');
const dragEndKey = ref('');
let isDragSelecting = false;
let suppressCalendarClick = false;

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseDateKey = (key: string) => new Date(key.replace(/-/g, '/'));

const calendarWeekDays = ['日', '一', '二', '三', '四', '五', '六'];

const calendarTitle = computed(() => {
  const y = calendarMonth.value.getFullYear();
  const m = (calendarMonth.value.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
});

const calendarDays = computed(() => {
  const startOfMonth = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth(), 1);
  const startWeekday = startOfMonth.getDay();
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - startWeekday);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = formatDateKey(date);
    const inMonth = date.getMonth() === calendarMonth.value.getMonth();
    const disabled = key < startDate.value;
    const rangeStart = calendarRange.start;
    const rangeEnd = calendarRange.end;
    const inRange = !!rangeStart && !!rangeEnd && key >= rangeStart && key <= rangeEnd;
    days.push({
      key,
      date,
      inMonth,
      disabled,
      inRange
    });
  }
  return days;
});

const parseFormDateRange = (value: string) => {
  const text = value || '';
  if (!text) return { start: '', end: '' };
  if (text.includes('至')) {
    const parts = text.split('至').map(p => p.trim());
    return { start: parts[0] || '', end: parts[1] || '' };
  }
  return { start: text, end: '' };
};

const openCalendar = () => {
  showCalendar.value = true;
  const parsed = parseFormDateRange(form.date);
  calendarRange.start = parsed.start || dateRange.start || '';
  calendarRange.end = parsed.end || dateRange.end || '';
  if (calendarRange.start) {
    const date = parseDateKey(calendarRange.start);
    calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
  }
};

const closeCalendar = () => {
  showCalendar.value = false;
};

const changeCalendarMonth = (offset: number) => {
  const date = new Date(calendarMonth.value);
  date.setMonth(date.getMonth() + offset);
  calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
};

const selectCalendarDay = (day: { key: string; inMonth: boolean; disabled: boolean }) => {
  if (suppressCalendarClick) return;
  if (day.disabled) return;
  if (!day.inMonth) {
    const date = parseDateKey(day.key);
    calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
  }
  // Toggle selection without closing; allow multi-day by setting end on second click
  if (!calendarRange.start || (calendarRange.start && calendarRange.end)) {
    calendarRange.start = day.key;
    calendarRange.end = '';
  } else {
    updateCalendarRangeFromDrag(calendarRange.start, day.key);
  }
};

const updateCalendarRangeFromDrag = (startKey: string, endKey: string) => {
  if (!startKey || !endKey) return;
  if (startKey <= endKey) {
    calendarRange.start = startKey;
    calendarRange.end = endKey;
  } else {
    calendarRange.start = endKey;
    calendarRange.end = startKey;
  }
};

const handleDayTouchStart = (day: { key: string; disabled: boolean }) => {
  if (day.disabled) return;
  isDragSelecting = true;
  suppressCalendarClick = true;
  dragStartKey.value = day.key;
  dragEndKey.value = day.key;
  updateCalendarRangeFromDrag(dragStartKey.value, dragEndKey.value);
};

const handleDayTouchMove = (day: { key: string; disabled: boolean }) => {
  if (!isDragSelecting || day.disabled) return;
  if (day.key === dragEndKey.value) return;
  dragEndKey.value = day.key;
  updateCalendarRangeFromDrag(dragStartKey.value, dragEndKey.value);
};

const handleDayTouchEnd = () => {
  if (!isDragSelecting) return;
  isDragSelecting = false;
  // Keep range selection; do not close. Confirm with button.
  setTimeout(() => {
    suppressCalendarClick = false;
  }, 50);
};
const handleDayMouseDown = (day: { key: string; disabled: boolean }) => {
  if (day.disabled) return;
  isDragSelecting = true;
  dragStartKey.value = day.key;
  dragEndKey.value = day.key;
  updateCalendarRangeFromDrag(dragStartKey.value, dragEndKey.value);
};
const handleDayMouseMove = (day: { key: string; disabled: boolean }) => {
  if (!isDragSelecting || day.disabled) return;
  if (day.key === dragEndKey.value) return;
  dragEndKey.value = day.key;
  updateCalendarRangeFromDrag(dragStartKey.value, dragEndKey.value);
};
const handleDayMouseUp = () => {
  if (!isDragSelecting) return;
  isDragSelecting = false;
  // Keep range; do not auto-apply or close.
};

const clearCalendarRange = () => {
  calendarRange.start = '';
  calendarRange.end = '';
  dateRange.start = '';
  dateRange.end = '';
  form.date = '';
};

const applyCalendarRange = () => {
  if (!calendarRange.start) return;
  if (!calendarRange.end) {
    form.date = calendarRange.start;
    dateRange.start = calendarRange.start;
    dateRange.end = '';
    showCalendar.value = false;
    return;
  }
  dateRange.start = calendarRange.start;
  dateRange.end = calendarRange.end;
  form.date = `${dateRange.start} 至 ${dateRange.end}`;
  showCalendar.value = false;
};

// Address
const formatAddressText = (addr: Address) => {
  // Only use detail address to avoid exposing tags like "Home" or "Company"
  return addr.detail || '';
};
const chooseNewAddress = () => {
  showAddressPopup.value = false;
  uni.chooseLocation({
    success: (res) => {
      form.address = res.address;
      (form as any).latitude = res.latitude;
      (form as any).longitude = res.longitude;
    },
    fail: () => {
       if (typeof navigator !== 'undefined' && navigator.geolocation) {
         navigator.geolocation.getCurrentPosition((pos) => {
           const { latitude, longitude } = pos.coords;
           form.address = '当前位置';
           (form as any).latitude = latitude;
           (form as any).longitude = longitude;
         }, () => {
           form.address = '北京市朝阳区三里屯SOHO';
         }, { enableHighAccuracy: true, timeout: 8000 });
       } else {
         form.address = '北京市朝阳区三里屯SOHO';
       }
    }
  });
};
const closeAddressPopup = () => {
  showAddressPopup.value = false;
};
const selectSavedAddress = (addr: Address) => {
  form.address = formatAddressText(addr);
  showAddressPopup.value = false;
};
const selectHistoryAddress = (addr: { address: string }) => {
  form.address = addr.address;
  showAddressPopup.value = false;
};
const openAddressPopup = () => {
  if (addressOptions.value.length > 0 || historyAddressOptions.value.length > 0) {
    showAddressPopup.value = true;
    return;
  }
  chooseNewAddress();
};
const handleAddressSelect = () => {
  openAddressPopup();
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

const resolvePricingPetSizes = () => {
  if (selectedPetIds.value.length > 0) {
    const selectedPets = userStore.userInfo?.pets?.filter(p => selectedPetIds.value.includes(p.id)) || [];
    return selectedPets.map(p => p.size);
  }
  return [form.petSize];
};

const getServiceDateForPricing = () => {
  const parsed = parseFormDateRange(form.date);
  return parsed.start || new Date().toISOString().split('T')[0];
};
const getSelectedDates = () => {
  const { start, end } = parseFormDateRange(form.date);
  if (!start) return [];
  const startDate = parseDateKey(start);
  const endDate = end ? parseDateKey(end) : startDate;
  const list: string[] = [];
  const cur = new Date(startDate);
  while (cur.getTime() <= endDate.getTime()) {
    list.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return list;
};

const getDurationDisplayPrice = (durationValue: number) => {
  const timeList = form.times.length ? form.times : ['12:00'];
  const dateList = getSelectedDates().length ? getSelectedDates() : [getServiceDateForPricing()];
  let total = 0;
  for (const d of dateList) {
    for (const t of timeList) {
      const result = calculateTotalPrice({
        basePrice: discountedBasePrice.value,
        petSizes: resolvePricingPetSizes(),
        durationMarkup: durations.find(di => di.value === durationValue)?.markup || 0,
        serviceDate: d,
        serviceTime: t,
        addOns: { play: false, deepClean: false, medicine: false },
        overrides: pricingOverrides.value
      });
      total += result.total;
    }
  }
  return total.toFixed(2);
};

// Price Calculation
const standardPriceBreakdown = computed(() => {
  const timeList = form.times.length ? form.times : ['12:00'];
  const dateList = getSelectedDates().length ? getSelectedDates() : [getServiceDateForPricing()];
  const acc = { base: 0, pets: 0, duration: 0, holiday: 0, rush: 0, addOns: 0, total: 0 };
  for (const d of dateList) {
    for (const t of timeList) {
      const r = calculateTotalPrice({
        basePrice: standardBasePrice.value,
        petSizes: resolvePricingPetSizes(),
        durationMarkup: durations.find(di => di.value === form.duration)?.markup || 0,
        serviceDate: d,
        serviceTime: t,
        addOns: form.addOns,
        overrides: pricingOverrides.value
      });
      acc.base += r.base; acc.pets += r.pets; acc.duration += r.duration; acc.holiday += r.holiday; acc.rush += r.rush; acc.addOns += r.addOns; acc.total += r.total;
    }
  }
  return acc;
});

const priceBreakdown = computed(() => {
  const timeList = form.times.length ? form.times : ['12:00'];
  const dateList = getSelectedDates().length ? getSelectedDates() : [getServiceDateForPricing()];
  const acc = { base: 0, pets: 0, duration: 0, holiday: 0, rush: 0, addOns: 0, total: 0 };
  for (const d of dateList) {
    for (const t of timeList) {
      const r = calculateTotalPrice({
        basePrice: discountedBasePrice.value,
        petSizes: resolvePricingPetSizes(),
        durationMarkup: durations.find(di => di.value === form.duration)?.markup || 0,
        serviceDate: d,
        serviceTime: t,
        addOns: form.addOns,
        overrides: pricingOverrides.value
      });
      acc.base += r.base; acc.pets += r.pets; acc.duration += r.duration; acc.holiday += r.holiday; acc.rush += r.rush; acc.addOns += r.addOns; acc.total += r.total;
    }
  }
  return acc;
});

const rawTotalPrice = computed(() => priceBreakdown.value.total);
const standardTotalPrice = computed(() => standardPriceBreakdown.value.total);

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

// Safe Computed for Price Display to prevent render errors
const safeFinalPrice = computed(() => {
  try {
    if (!priceBreakdown.value) return '0.00';
    // Use finalPrice logic here or just rely on priceBreakdown if finalPrice is not needed for display?
    // The template uses safeFinalPrice.
    // finalPrice logic includes coupon deduction which is NOT in priceBreakdown.total (usually).
    // Let's check calculateTotalPrice.
    // Usually total in breakdown is pre-coupon.
    // But finalPrice computed above does the coupon deduction.
    // So safeFinalPrice should probably wrap finalPrice.
    return finalPrice.value || '0.00';
  } catch (e) {
    console.error('Price display error:', e);
    return '0.00';
  }
});

const safeStandardPrice = computed(() => {
  try {
    return standardTotalPrice.value || 0;
  } catch {
    return 0;
  }
});

const safeRawPrice = computed(() => {
  try {
    return rawTotalPrice.value || 0;
  } catch {
    return 0;
  }
});


const handleSubmit = async () => {
  // 表单验证
  if (!form.address) return uni.showToast({ title: '请选择地址', icon: 'none' });
  if (!form.date) return uni.showToast({ title: '请选择时间', icon: 'none' });
  if (!form.times.length) return uni.showToast({ title: '请选择时间段', icon: 'none' });
  
  // 验证用户信息
  if (!userStore.userInfo?.id) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  
  // 验证服务类型
  if (!form.serviceType) {
    uni.showToast({ title: '请选择服务类型', icon: 'none' });
    return;
  }
  
  // 验证价格
  if (!finalPrice.value || finalPrice.value <= 0) {
    uni.showToast({ title: '订单金额异常', icon: 'none' });
    return;
  }
  
  // Get selected pets
  let selectedPets = userStore.userInfo?.pets?.filter(p => selectedPetIds.value.includes(p.id)) || [];
  if (selectedPets.length === 0 && userStore.userInfo?.pets?.length) {
    selectedPets = [userStore.userInfo.pets[0]];
  }
  
  // 如果没有选择宠物但有宠物列表，使用第一个宠物
  if (selectedPets.length === 0 && userStore.userInfo?.pets && userStore.userInfo.pets.length > 0) {
    selectedPets = [userStore.userInfo.pets[0]];
  }

  // Create Order
  const newOrder = {
    // ID will be generated by DB or Store
    creatorId: userStore.userInfo.id,
    sitterId: form.targetSitterId, // Null = Task Hall
    serviceType: form.serviceType,
    status: 'UNPAID' as const, // 初始状态为未支付
    totalPrice: finalPrice.value,
    originalPrice: standardTotalPrice.value,
    discountAmount: selectedCoupon.value ? selectedCoupon.value.value : 0,
    couponId: form.couponId,
    address: form.address,
    time: (() => {
      const timeList = form.times.length ? form.times : ['12:00'];
      const dateList = getSelectedDates().length ? getSelectedDates() : [getServiceDateForPricing()];
      const combos = [] as string[];
      for (const d of dateList) {
        for (const t of timeList) combos.push(`${d} ${t}`);
      }
      return combos.join(',');
    })(),
    petSize: selectedPets.length > 0 ? selectedPets[0].size : form.petSize,
    petIds: selectedPets.map(p => p.id),
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
    const createdOrder = await orderStore.createOrder(newOrder);
    uni.hideLoading();
    
    if (createdOrder) {
      uni.showToast({ title: '发布成功', icon: 'success' });
      
      // 跳转到订单详情页或订单列表页
      setTimeout(() => {
        if (createdOrder.id) {
          // 如果有订单ID，跳转到订单详情页
          uni.navigateTo({
            url: `/pages/orders/detail?id=${createdOrder.id}`
          });
        } else {
          // 否则跳转到订单列表页
          uni.switchTab({ url: '/pages/orders/index' });
        }
      }, 1500);
    } else {
      uni.showToast({ title: '发布失败：未获取到订单信息', icon: 'none' });
    }
  } catch (e: any) {
    uni.hideLoading();
    const message = e?.message ? `发布失败：${e.message}` : '发布失败，请重试';
    uni.showToast({ title: message, icon: 'none' });
    console.error('发布需求失败:', e);
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
  if (!form.address) {
    const defaultAddress = addressOptions.value.find(a => a.isDefault) || addressOptions.value[0];
    if (defaultAddress) {
      form.address = formatAddressText(defaultAddress);
    } else if (historyAddressOptions.value.length > 0) {
      form.address = historyAddressOptions.value[0].address;
    }
  }
  
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
      .price-line {
        display: flex;
        align-items: baseline;
        gap: 12rpx;
        margin-top: 6rpx;
      }
      .price {
        font-size: 22rpx;
        color: $color-text-secondary;
        font-weight: 600;
        &.discount {
          color: $color-primary;
          font-size: 24rpx;
        }
        &.strike {
          text-decoration: line-through;
          color: #999;
          font-weight: 500;
        }
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
  width: 100vw; /* 确保占满屏幕宽度 */
  height: calc(120rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  z-index: 99999; /* 极大值，防止被遮挡 */
  
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
.address-popup-mask {
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

.address-popup-content {
  width: 100%;
  height: 60vh;
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
    .popup-action {
      position: absolute;
      top: 32rpx;
      font-size: 28rpx;
      color: $color-primary;
    }
    .popup-clear { left: 30rpx; }
    .popup-confirm { right: 100rpx; }
  }
  
  .address-scroll {
    flex: 1;
    padding: 30rpx;
    box-sizing: border-box;
    background: #f7f7f7;
  }
  
  .address-section {
    margin-bottom: 24rpx;
    .section-title {
      font-size: 26rpx;
      color: $color-text-secondary;
      margin-bottom: 16rpx;
      display: block;
    }
  }
  
  .address-item {
    background: #fff;
    padding: 24rpx;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
    border: 1rpx solid transparent;
    &.active {
      border-color: $color-primary;
    }
  }
  
  .address-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
  }
  
  .address-name {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text-main;
  }
  
  .address-tag {
    font-size: 22rpx;
    color: $color-primary;
    background: rgba(255, 142, 60, 0.12);
    padding: 2rpx 10rpx;
    border-radius: 10rpx;
  }
  
  .address-detail {
    font-size: 26rpx;
    color: $color-text-secondary;
  }
  
  .address-empty {
    text-align: center;
    color: $color-text-secondary;
    font-size: 26rpx;
    padding: 40rpx 0;
  }
  
  .address-actions {
    padding: 20rpx 30rpx 30rpx;
  }
  
  .btn-select-address {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #FFB07C 0%, #FF8E3C 100%);
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 88rpx;
  }
}

.calendar-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 10003;
  display: flex;
  align-items: flex-end;
}

.calendar-popup-content {
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
  
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx 10rpx;
  }
  
  .calendar-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $color-text-main;
  }
  
  .calendar-nav {
    font-size: 40rpx;
    color: $color-text-secondary;
    padding: 0 20rpx;
  }
  
  .calendar-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding: 10rpx 20rpx;
  }
  
  .week-item {
    text-align: center;
    font-size: 24rpx;
    color: $color-text-secondary;
  }
  
  .calendar-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: 96rpx;
    padding: 0 20rpx 10rpx;
    gap: 8rpx;
    overflow: auto;
  }
  
  .calendar-day {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    background: #fff;
    border: 1px solid #f0f0f0;
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.04);
    &.out {
      background: transparent;
      border-color: transparent;
      box-shadow: none;
      color: #c0c0c0;
    }
    &.disabled {
      color: #c0c0c0;
      background: #f6f6f6;
      border-color: #f0f0f0;
      box-shadow: none;
    }
    &.selected {
      background: linear-gradient(135deg, #FFB07C 0%, #FF8E3C 100%);
      color: #fff;
      font-weight: 600;
      border-color: transparent;
      box-shadow: 0 10rpx 20rpx rgba(255, 142, 60, 0.25);
    }
    &.inrange {
      background: rgba(255, 142, 60, 0.12);
      border-color: rgba(255, 142, 60, 0.2);
      color: $color-text-main;
    }
  }
  
  .day-num {
    font-size: 26rpx;
  }
  
  .calendar-actions {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 20rpx;
    padding: 20rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -6rpx 16rpx rgba(0,0,0,0.06);
    z-index: 2;
  }
  
  .btn-ghost {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    background: #f5f5f5;
    color: $color-text-secondary;
    font-size: 28rpx;
    line-height: 80rpx;
  }
  
  .btn-primary {
    flex: 1;
    height: 80rpx;
    border-radius: 40rpx;
    background: linear-gradient(135deg, #FFB07C 0%, #FF8E3C 100%);
    color: #fff;
    font-size: 28rpx;
    line-height: 80rpx;
  }
}

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

         .pd-val-col {
            display: flex;
            align-items: baseline;
            gap: 12rpx;
         }
         .pd-origin {
            color: #999;
            text-decoration: line-through;
            font-size: 24rpx;
         }
         .pd-discount {
            color: $color-primary;
            font-weight: 600;
         }
         .pd-val.strike {
            color: #999;
            text-decoration: line-through;
         }
         
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
