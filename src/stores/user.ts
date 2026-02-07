import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PetSize } from '@/constants/pet';

export type UserRole = 'owner' | 'sitter';
export type SitterLevel = 'GOLD' | 'SILVER' | 'BRONZE';

export interface SitterAvailability {
  time: string; // e.g., "Weekends", "All day"
  locations: string[]; // e.g., ["Chaoyang", "Haidian"]
  services: ('feeding' | 'walking')[];
}

export interface SitterProfile {
  realName?: string;
  idCard?: string;
  level: SitterLevel;
  completedOrders: number;
  rating: number;
  experienceYears: number;
  tags: string[];
  bio: string;
  isCertified: boolean; // 是否实名/资质认证
  certificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  availability?: SitterAvailability;
}

export interface PetInfo {
  id: string;
  name: string;
  avatar: string;
  type: 'cat' | 'dog';
  breed?: string;
  gender: 'male' | 'female';
  size: PetSize;
  weight: number;
  age: number;
  sterilized: boolean;
  vaccine: boolean;
  description?: string;
}

export interface Address {
  id: string;
  name: string; // e.g. "家", "公司"
  detail: string; // 详细地址
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
}

export interface Coupon {
  id: string;
  type: 'FIXED' | 'DISCOUNT'; // 固定金额 | 满减
  value: number; // 面值
  threshold: number; // 门槛 (0表示无门槛)
  name: string; // e.g. "新用户专享"
  expiresAt: number; // timestamp
  status: 'UNUSED' | 'USED' | 'EXPIRED';
}

export interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  phone?: string; // 用户手机号
  role: UserRole;
  joinDate: number; // timestamp
  sitterProfile?: SitterProfile; // 只有当用户也是宠托师时才有
  pets?: PetInfo[];
  addresses?: Address[];
  balance?: number;
  coupons?: Coupon[];
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const isLoggedIn = ref(false);

  const initUser = () => {
    const saved = uni.getStorageSync('miaomiao_user');
    if (saved) {
      try {
        userInfo.value = JSON.parse(saved);
        ensureData(); // Ensure structure for existing data
        isLoggedIn.value = true;
      } catch (e) {
        console.error('Failed to parse user info', (e as Error).message || e);
        logout();
      }
    } else {
      // Initialize with empty arrays/defaults if no saved data but we want structure
      // Actually only do this on login or explicit init
    }
  };

  // Helper to ensure data structure exists (for existing users)
  const ensureData = () => {
    if (userInfo.value) {
      if (!userInfo.value.addresses) userInfo.value.addresses = [];
      if (!userInfo.value.pets) {
        userInfo.value.pets = [
          {
            id: 'p1',
            name: '奥利奥',
            avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
            type: 'cat',
            gender: 'male',
            size: PetSize.SMALL,
            weight: 4,
            age: 2,
            breed: '英短蓝猫',
            sterilized: true,
            vaccine: true
          },
          {
            id: 'p2',
            name: '旺财',
            avatar: '/static/avatars/dog-shiba.jpg',
            type: 'dog',
            gender: 'female',
            size: PetSize.MEDIUM,
            weight: 12,
            age: 3,
            breed: '柴犬',
            sterilized: true,
            vaccine: true
          }
        ];
      }
      if (!userInfo.value.coupons) {
        // Mock Coupons for new feature
        userInfo.value.coupons = [
          {
            id: 'c1',
            type: 'FIXED',
            value: 5,
            threshold: 0,
            name: '新人体验券',
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
            status: 'UNUSED'
          },
          {
            id: 'c2',
            type: 'DISCOUNT',
            value: 5,
            threshold: 20,
            name: '满20减5',
            expiresAt: Date.now() + 15 * 24 * 60 * 60 * 1000,
            status: 'UNUSED'
          },
          {
            id: 'c3',
            type: 'FIXED',
            value: 3,
            threshold: 0,
            name: '老友回归',
            expiresAt: Date.now() - 1000, // Expired
            status: 'EXPIRED'
          }
        ];
      }
      if (userInfo.value.balance === undefined) userInfo.value.balance = 0;
    }
  };

  const login = (info: UserInfo) => {
    userInfo.value = info;
    ensureData(); // Add mocks
    isLoggedIn.value = true;
    uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
  };

  const logout = () => {
    userInfo.value = null;
    isLoggedIn.value = false;
    uni.removeStorageSync('miaomiao_user');
    uni.reLaunch({ url: '/pages/login/index' });
  };

  const switchRole = (newRole: UserRole) => {
    if (userInfo.value) {
      // Check if switching to sitter but no profile
      if (newRole === 'sitter' && !userInfo.value.sitterProfile) {
        uni.navigateTo({ url: '/pages/sitter-register/index' });
        return;
      }
      
      userInfo.value.role = newRole;
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      
      // Navigate to Home or refresh
      uni.reLaunch({ url: '/pages/home/index' });
    }
  };

  const updateUser = (updates: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...updates };
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
    }
  };

  const useCoupon = (couponId: string) => {
    if (userInfo.value && userInfo.value.coupons) {
      const coupon = userInfo.value.coupons.find(c => c.id === couponId);
      if (coupon) {
        coupon.status = 'USED';
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
    }
  };

  const addBalance = (amount: number) => {
    if (userInfo.value) {
      userInfo.value.balance = (userInfo.value.balance || 0) + amount;
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
    }
  };

  const recharge = (amount: number) => {
    addBalance(amount);
  };

  const deductBalance = (amount: number): boolean => {
    if (userInfo.value && (userInfo.value.balance || 0) >= amount) {
      userInfo.value.balance = (userInfo.value.balance || 0) - amount;
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      return true;
    }
    return false;
  };

  const calculateSitterLevel = (years: number): SitterLevel => {
    if (years >= 5) return 'GOLD';
    if (years >= 2) return 'SILVER';
    return 'BRONZE';
  };

  const registerAsSitter = (data: {
    realName: string;
    idCard: string;
    experienceYears: number;
    tags: string[];
    bio: string;
    availability: SitterAvailability;
  }) => {
    if (!userInfo.value) return;
    
    const level = calculateSitterLevel(data.experienceYears);
    
    userInfo.value.sitterProfile = {
      realName: data.realName,
      idCard: data.idCard,
      level: level,
      completedOrders: 0,
      rating: 5.0, // Initial rating
      experienceYears: data.experienceYears,
      tags: data.tags,
      bio: data.bio,
      isCertified: true, // Auto-verify for demo
      certificationStatus: 'verified',
      availability: data.availability
    };
    
    // Auto-switch to sitter role upon registration?
    // User asked: "Cannot directly switch... fill info first"
    // So after this, we can switch role.
    userInfo.value.role = 'sitter';
    uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
  };

  return {
    userInfo,
    isLoggedIn,
    initUser,
    login,
    logout,
    switchRole,
    updateUser,
    useCoupon,
    addBalance,
    recharge,
    deductBalance,
    registerAsSitter
  };
});
