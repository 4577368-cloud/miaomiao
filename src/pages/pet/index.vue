<template>
  <view class="container">
    <view class="pet-list" v-if="!showModal">
      <view class="pet-card" v-for="pet in pets" :key="pet.id" @click="editPet(pet)">
        <image :src="pet.avatar || '/static/default-pet.png'" class="avatar" mode="aspectFill" />
        <view class="info">
          <view class="name-row">
             <text class="name">{{ pet.name }}</text>
             <text class="gender-icon">{{ pet.gender === 'male' ? '♂' : '♀' }}</text>
             <text class="tag">{{ pet.type === 'cat' ? '🐱' : '🐶' }}</text>
          </view>
          <text class="detail">{{ getPetSizeLabel(pet.size) }} | {{ pet.weight }}kg | {{ pet.age }}岁</text>
          <view class="badges">
            <text class="badge" v-if="pet.sterilized">已绝育</text>
            <text class="badge" v-if="pet.vaccine">已免疫</text>
          </view>
        </view>
      </view>
      
      <view class="add-btn" @click="addNewPet">
        <text class="icon">+</text>
        <text>添加宠物</text>
      </view>
    </view>

    <!-- Edit/Add Form (Full Page Mode or Modal) -->
    <!-- Using a full covering view for better form experience -->
    <view class="edit-page" v-if="showModal">
      <view class="nav-header">
        <text class="cancel" @click="closeModal">取消</text>
        <text class="title">{{ isEditing ? '编辑宠物' : '添加宠物' }}</text>
        <text class="save" @click="savePet">保存</text>
      </view>
      
      <scroll-view scroll-y class="form-scroll">
        <view class="form-content">
          <!-- Avatar -->
          <view class="form-item center">
             <view class="avatar-upload" @click="chooseAvatar">
                <image :src="form.avatar || '/static/default-pet.png'" mode="aspectFill" />
                <view class="camera-icon">📷</view>
             </view>
             <text class="hint">上传爱宠头像</text>
          </view>

          <!-- Basic Info -->
          <view class="card">
            <view class="form-row">
              <text class="label">昵称</text>
              <input class="input" v-model="form.name" placeholder="请输入宠物昵称" />
            </view>
            <view class="divider"></view>
            <view class="form-row">
              <text class="label">种类</text>
              <view class="radio-group">
                 <view class="radio-item" :class="{active: form.type === 'cat'}" @click="handleTypeChange('cat')">🐱 猫咪</view>
                 <view class="radio-item" :class="{active: form.type === 'dog'}" @click="handleTypeChange('dog')">🐶 狗狗</view>
              </view>
            </view>
            <view class="divider"></view>
            <view class="form-row">
              <text class="label">品种</text>
              <picker mode="selector" :range="availableBreeds" @change="handleBreedChange">
                <view class="picker-value">
                  {{ form.breed || '请选择品种' }} <text class="arrow">></text>
                </view>
              </picker>
            </view>
             <view class="divider"></view>
            <view class="form-row">
              <text class="label">性别</text>
              <view class="radio-group">
                 <view class="radio-item" :class="{active: form.gender === 'male'}" @click="form.gender = 'male'">♂ DD</view>
                 <view class="radio-item" :class="{active: form.gender === 'female'}" @click="form.gender = 'female'">♀ MM</view>
              </view>
            </view>
          </view>

          <!-- Physical Info -->
          <view class="card">
            <view class="form-row">
              <text class="label">年龄 (岁)</text>
              <input class="input" type="number" v-model.number="form.age" placeholder="0" />
            </view>
            <view class="divider"></view>
            <view class="form-row">
              <text class="label">体重 (kg)</text>
              <input class="input" type="digit" v-model.number="form.weight" placeholder="0.0" @input="autoSelectSize" />
            </view>
            <view class="divider"></view>
            <view class="form-column">
              <text class="label mb-2">体型选择</text>
              <view class="size-grid">
                <view 
                  v-for="size in availableSizes" 
                  :key="size.value"
                  class="size-item"
                  :class="{active: form.size === size.value}"
                  @click="form.size = size.value"
                >
                  <text class="size-name">{{ size.label }}</text>
                  <text class="size-desc">{{ size.desc }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- Health Info -->
          <view class="card">
            <view class="form-row">
              <text class="label">是否绝育</text>
              <switch :checked="form.sterilized" @change="e => form.sterilized = e.detail.value" color="#FF8E3C" style="transform:scale(0.8)"/>
            </view>
            <view class="divider"></view>
            <view class="form-row">
              <text class="label">是否免疫</text>
              <switch :checked="form.vaccine" @change="e => form.vaccine = e.detail.value" color="#FF8E3C" style="transform:scale(0.8)"/>
            </view>
          </view>

          <!-- Care Profile -->
          <view class="card">
            <text class="section-title">健康档案 (选填)</text>
            
            <text class="label mb-2">近期用药 (每行一个)</text>
            <textarea 
              class="textarea mb-3" 
              v-model="careForm.medications" 
              placeholder="例如：每日早晚各一次消炎药..." 
              auto-height
            />
            
            <text class="label mb-2">过敏史 (每行一个)</text>
            <textarea 
              class="textarea mb-3" 
              v-model="careForm.allergies" 
              placeholder="例如：对鸡肉过敏，不能吃海鲜..." 
              auto-height
            />
            
            <text class="label mb-2">特殊习惯/禁忌 (每行一个)</text>
            <textarea 
              class="textarea" 
              v-model="careForm.habits" 
              placeholder="例如：不喜欢被摸尾巴，出门容易爆冲..." 
              auto-height
            />
          </view>

          <!-- Description -->
          <view class="card">
            <text class="label mb-2">备注信息</text>
            <textarea 
              class="textarea" 
              v-model="form.description" 
              placeholder="记录它的性格、喜好或特殊习惯..." 
              auto-height
            />
          </view>
          
          <view class="delete-btn" v-if="isEditing" @click="deletePet">删除宠物</view>
          <view class="spacer"></view>
        </view>
      </scroll-view>
    </view>

    <!-- Avatar Selection Modal -->
    <view class="modal-mask" v-if="showAvatarModal" @click="showAvatarModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="title">选择默认头像</text>
          <text class="close" @click="showAvatarModal = false">×</text>
        </view>
        <scroll-view scroll-y class="avatar-scroll">
          <view class="avatar-grid">
            <view class="grid-item" v-for="(file, breed) in BREED_AVATAR_MAP" :key="breed" @click="selectDefaultAvatar(file)">
              <image :src="'/static/avatars/' + file" mode="aspectFill" />
              <text class="name">{{ breed }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useUserStore, type PetInfo } from '@/stores/user';
import { PetSize, PET_SIZE_COEFFICIENTS } from '@/constants/pet';
import { DOG_BREEDS, CAT_BREEDS, BREED_AVATAR_MAP } from '@/constants/breeds';

const userStore = useUserStore();
const pets = computed(() => userStore.userInfo?.pets || []);
const showModal = ref(false);
const showAvatarModal = ref(false);
const isEditing = ref(false);

const defaultForm: Partial<PetInfo> = {
  type: 'cat',
  gender: 'male',
  size: PetSize.CAT,
  age: 1,
  weight: 4,
  sterilized: false,
  vaccine: false,
  avatar: '',
  name: '',
  breed: '',
  description: ''
};

const form = ref<Partial<PetInfo>>({ ...defaultForm });

const careForm = reactive({
  medications: '',
  allergies: '',
  habits: '',
  notes: ''
});

const petSizesList = [
  { label: '猫咪', value: PetSize.CAT, desc: '1-15kg', type: 'cat' },
  { label: '小型犬', value: PetSize.SMALL, desc: '1-10kg', type: 'dog' },
  { label: '中型犬', value: PetSize.MEDIUM, desc: '10-25kg', type: 'dog' },
  { label: '大型犬', value: PetSize.LARGE, desc: '25-40kg', type: 'dog' },
  { label: '巨型犬', value: PetSize.GIANT, desc: '40kg+', type: 'dog' },
];

const availableSizes = computed(() => {
  return petSizesList.filter(s => {
    if (form.value.type === 'cat') return s.value === PetSize.CAT;
    return s.value !== PetSize.CAT;
  });
});

const getPetSizeLabel = (size: PetSize) => {
  return petSizesList.find(s => s.value === size)?.label || size;
};

const handleTypeChange = (type: 'cat' | 'dog') => {
  form.value.type = type;
  // Reset size based on type
  if (type === 'cat') {
    form.value.size = PetSize.CAT;
  } else {
    form.value.size = PetSize.SMALL;
  }
};

const autoSelectSize = () => {
  const w = form.value.weight || 0;
  const t = form.value.type;
  
  if (t === 'cat') {
    form.value.size = PetSize.CAT;
    return;
  }
  
  // Dog logic
  if (w <= 10) form.value.size = PetSize.SMALL;
  else if (w <= 25) form.value.size = PetSize.MEDIUM;
  else if (w <= 40) form.value.size = PetSize.LARGE;
  else form.value.size = PetSize.GIANT;
};

const availableBreeds = computed(() => {
  return form.value.type === 'cat' ? CAT_BREEDS : DOG_BREEDS;
});

const handleBreedChange = (e: any) => {
  const index = e.detail.value;
  const breed = availableBreeds.value[index];
  form.value.breed = breed;
  
  // Auto-select avatar if empty or using default-pet
  if ((!form.value.avatar || form.value.avatar.includes('default-pet')) && BREED_AVATAR_MAP[breed]) {
    form.value.avatar = `/static/avatars/${BREED_AVATAR_MAP[breed]}`;
  }
};

const chooseAvatar = () => {
  uni.showActionSheet({
    itemList: ['从相册/相机选择', '选择默认头像'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.chooseImage({
          count: 1,
          success: (res) => {
            form.value.avatar = res.tempFilePaths[0];
          }
        });
      } else {
        showAvatarModal.value = true;
      }
    }
  });
};

const selectDefaultAvatar = (filename: string) => {
  form.value.avatar = `/static/avatars/${filename}`;
  showAvatarModal.value = false;
};

const addNewPet = () => {
  isEditing.value = false;
  form.value = JSON.parse(JSON.stringify(defaultForm));
  // Reset care form
  careForm.medications = '';
  careForm.allergies = '';
  careForm.habits = '';
  careForm.notes = '';
  showModal.value = true;
};

const editPet = (pet: PetInfo) => {
  isEditing.value = true;
  form.value = JSON.parse(JSON.stringify(pet));
  
  // Populate care form
  const profile = pet.careProfile || {};
  careForm.medications = profile.medications?.join('\n') || '';
  careForm.allergies = profile.allergies?.join('\n') || '';
  careForm.habits = profile.habits?.join('\n') || '';
  careForm.notes = profile.notes || '';
  
  showModal.value = true;
};

const closeModal = () => showModal.value = false;



const savePet = async () => {
  if (!form.value.name) return uni.showToast({ title: '请输入昵称', icon: 'none' });
  
  // Construct Care Profile
  const careProfile = {
    medications: careForm.medications.split('\n').map(s => s.trim()).filter(s => s),
    allergies: careForm.allergies.split('\n').map(s => s.trim()).filter(s => s),
    habits: careForm.habits.split('\n').map(s => s.trim()).filter(s => s),
    notes: careForm.notes
  };

  uni.showLoading({ title: '保存中...' });
  try {
    if (isEditing.value && form.value.id) {
       await userStore.updatePet({
         ...form.value,
         careProfile
       } as PetInfo);
    } else {
       // Remove id for new pet
       const { id, ...rest } = form.value;
       await userStore.addPet({
         ...rest,
         careProfile
       } as any);
    }
    
    uni.hideLoading();
    showModal.value = false;
    uni.showToast({ title: '保存成功' });
    
    // 优化动线：保存后自动返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};

const deletePet = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个宠物吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
           if (form.value.id) {
             await userStore.removePet(form.value.id);
           }
           uni.hideLoading();
           showModal.value = false;
        } catch (e) {
           uni.hideLoading();
           uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};
</script>

<style lang="scss">
.container {
  padding: 20px;
  background-color: #FFFBF5;
  min-height: 100vh;
}

.pet-list {
  padding-bottom: 80px;
}

.pet-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 30px;
    margin-right: 16px;
    background: #f0f0f0;
  }
  
  .info {
    flex: 1;
    
    .name-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      
      .name {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-right: 8px;
      }
      
      .gender-icon {
        font-size: 14px;
        margin-right: 8px;
        color: #999;
      }
      
      .tag {
        font-size: 12px;
        background: #FFF0E5;
        color: #FF8E3C;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    
    .detail {
      font-size: 14px;
      color: #666;
      margin-bottom: 6px;
      display: block;
    }
    
    .badges {
      display: flex;
      gap: 6px;
      
      .badge {
        font-size: 10px;
        background: #E8F5E9;
        color: #4CAF50;
        padding: 2px 4px;
        border-radius: 4px;
      }
    }
  }
}

.add-btn {
  background: #fff;
  border: 2px dashed #FF8E3C;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF8E3C;
  font-size: 16px;
  font-weight: bold;
  
  .icon {
    font-size: 24px;
    margin-right: 8px;
    line-height: 1;
  }
}

/* Edit Page Overlay */
.edit-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #FFFBF5;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.nav-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  
  .title {
    font-size: 16px;
    font-weight: bold;
  }
  
  .cancel {
    font-size: 14px;
    color: #999;
  }
  
  .save {
    font-size: 14px;
    color: #FF8E3C;
    font-weight: bold;
  }
}

.form-scroll {
  flex: 1;
  height: 0;
}

.form-content {
  padding: 20px;
}

.form-item.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  
  .avatar-upload {
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background: #f0f0f0;
    position: relative;
    overflow: hidden;
    margin-bottom: 8px;
    
    image {
      width: 100%;
      height: 100%;
    }
    
    .camera-icon {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 24px;
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .hint {
    font-size: 12px;
    color: #999;
  }
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 0 16px;
  margin-bottom: 16px;
  
  & > .label {
    display: block;
    padding-top: 16px;
    font-size: 14px;
    color: #666;
  }
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  
  .label {
    font-size: 14px;
    color: #333;
    width: 80px;
  }
  
  .input {
    flex: 1;
    text-align: right;
    font-size: 14px;
  }
  
  .picker-value {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 14px;
    color: #333;
    
    .arrow {
      margin-left: 4px;
      color: #999;
      font-size: 12px;
    }
  }
}

.form-column {
  padding: 16px 0;
  
  .label {
    font-size: 14px;
    color: #333;
    display: block;
    margin-bottom: 12px;
  }
}

.divider {
  height: 1px;
  background: #f5f5f5;
}

.radio-group {
  display: flex;
  gap: 12px;
  
  .radio-item {
    padding: 6px 12px;
    background: #f5f5f5;
    border-radius: 16px;
    font-size: 13px;
    color: #666;
    border: 1px solid transparent;
    
    &.active {
      background: #FFF0E5;
      color: #FF8E3C;
      border-color: #FF8E3C;
    }
  }
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  
  .size-item {
    background: #f9f9f9;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    
    &.active {
      background: #FFF0E5;
      border-color: #FF8E3C;
    }
    
    .size-name {
      display: block;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }
    
    .size-desc {
      display: block;
      font-size: 12px;
      color: #999;
    }
  }
}

.textarea {
  width: 100%;
  min-height: 80px;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.delete-btn {
  margin-top: 20px;
  text-align: center;
  color: #ff4d4f;
  font-size: 14px;
  padding: 12px;
}

.spacer {
  height: 40px;
}

/* Avatar Modal */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 80%;
  max-height: 70vh;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .modal-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f5f5f5;
    
    .title {
      font-size: 16px;
      font-weight: bold;
    }
    
    .close {
      font-size: 24px;
      color: #999;
      line-height: 1;
      padding: 0 8px;
    }
  }
  
  .avatar-scroll {
    flex: 1;
    min-height: 400px;
  }
  
  .avatar-grid {
    display: flex;
    flex-wrap: wrap;
    padding: 16px;
    justify-content: space-between;
    
    .grid-item {
      width: 48%;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      
      image {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin-bottom: 8px;
        border: 2px solid #f5f5f5;
        object-fit: cover;
      }
      
      .name {
        font-size: 12px;
        color: #666;
        text-align: center;
      }
    }
  }
}

.section-title {
  display: block;
  font-size: 15px;
  font-weight: bold;
  color: #333;
  padding: 16px 0 12px 0;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 16px;
}
</style>