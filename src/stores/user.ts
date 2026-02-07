import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import { PetSize } from '@/constants/pet';
import { useOrderStore } from '@/stores/order';

export type UserRole = 'owner' | 'sitter';
export type SitterLevel = 'GOLD' | 'SILVER' | 'BRONZE';

// ... (Existing interfaces remain same)
export interface SitterAvailability {
  time: string;
  locations: string[];
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
  isCertified: boolean;
  certificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  availability?: SitterAvailability;
}

export interface PetCareProfile {
  medications?: string[];
  allergies?: string[];
  habits?: string[];
  notes?: string;
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
  careProfile?: PetCareProfile;
}

export interface Address {
  id: string;
  name: string;
  detail: string;
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Coupon {
  id: string;
  type: 'FIXED' | 'DISCOUNT';
  value: number;
  threshold: number;
  name: string;
  expiresAt: number;
  status: 'UNUSED' | 'USED' | 'EXPIRED';
}

export interface UserInfo {
  id: string;
  email?: string; // Add email field
  nickname: string;
  avatar: string;
  phone?: string;
  role: UserRole;
  joinDate: number;
  sitterProfile?: SitterProfile;
  pets?: PetInfo[];
  addresses?: Address[];
  balance?: number;
  coupons?: Coupon[];
  laborBalance?: number;
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const isLoggedIn = ref(false);

  // Sync Supabase Session to Store
  const syncSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id, session.user.email);
      isLoggedIn.value = true;
    } else {
      // Clear if no session
      userInfo.value = null;
      isLoggedIn.value = false;
    }
  };

  const initUser = async () => {
    // Check local storage first for speed (optional, or just rely on supabase)
    const saved = uni.getStorageSync('miaomiao_user');
    if (saved) {
      try {
        userInfo.value = JSON.parse(saved);
        isLoggedIn.value = true;
      } catch (e) { console.error(e); }
    }
    
    // Then verify with Supabase
    await syncSession();
  };

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Fetch related data (Sitter Profile, Pets, etc.) - For MVP simplified
        // Merge into UserInfo structure
        const currentInfo: UserInfo = {
          id: data.id,
          email: email,
          nickname: data.nickname || '用户',
          avatar: data.avatar || 'https://img.yzcdn.cn/vant/cat.jpeg',
          role: data.role as UserRole,
          balance: data.balance,
          laborBalance: data.labor_balance,
          joinDate: new Date(data.created_at).getTime(),
          // Default empty arrays, will load on demand or separate actions
          pets: [], 
          addresses: [],
          coupons: [] 
        };
        
        // If sitter, fetch sitter profile
        if (currentInfo.role === 'sitter') {
           const { data: sitterData } = await supabase
             .from('sitter_profiles')
             .select('*')
             .eq('user_id', userId)
             .single();
             
           if (sitterData) {
             currentInfo.sitterProfile = {
               level: (sitterData.level as SitterLevel) || 'BRONZE',
               completedOrders: 0, // Need to count orders
               rating: sitterData.rating || 5.0,
               experienceYears: sitterData.experience_years || 0,
               tags: sitterData.tags || [],
               bio: sitterData.bio || '',
               isCertified: sitterData.is_certified || false,
               availability: sitterData.availability
             };
           }
        }

        userInfo.value = currentInfo;
        ensureData(); // Add mocks/defaults for arrays if empty
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
    }
  };

  // Helper to ensure data structure exists (Hybrid: Real + Mock)
  const ensureData = () => {
    if (userInfo.value) {
      if (!userInfo.value.addresses) userInfo.value.addresses = [];
      // Keep Mock Pets for demo if real DB is empty
      if (!userInfo.value.pets || userInfo.value.pets.length === 0) {
        // In real app, we would fetch from 'pets' table here.
        // For now, let's keep the mock data for smooth transition or fetch real
      }
      // ... keep other ensure logic ...
      if (userInfo.value.balance === undefined) userInfo.value.balance = 0;
    }
  };

  const login = async (info: UserInfo) => {
    // Deprecated: pure mock login. 
    // Kept for compatibility if needed, but we should use auth actions
    userInfo.value = info;
    isLoggedIn.value = true;
    uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    userInfo.value = null;
    isLoggedIn.value = false;
    uni.removeStorageSync('miaomiao_user');
    uni.reLaunch({ url: '/pages/login/index' });
  };
  
  // New: Auth Actions
  const updateProfile = async (updates: Partial<UserInfo>) => {
    if (!userInfo.value) return;
    
    // Update local state
    userInfo.value = { ...userInfo.value, ...updates };
    uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
    
    // Update Supabase
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: updates.nickname,
          avatar: updates.avatar,
          role: updates.role
        })
        .eq('id', userInfo.value.id);
        
      if (error) throw error;
    } catch (e) {
      console.error('Update profile failed', e);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    if (userInfo.value) {
      const orderStore = useOrderStore();
      
      // ... (Keep existing validation logic) ...
      // 1. Check Certification for Sitter
      if (newRole === 'sitter') {
        if (!userInfo.value.sitterProfile) {
          uni.navigateTo({ url: '/pages/sitter-register/index' });
          return;
        }
        // ...
      }

      // 2. Check Active Orders
      if (userInfo.value.role === 'sitter' && newRole === 'owner') {
         const hasActiveJob = orderStore.orders.some(o => 
           o.sitterId === userInfo.value?.id && 
           ['ACCEPTED', 'IN_SERVICE'].includes(o.status)
         );
         if (hasActiveJob) {
           uni.showToast({ title: '有进行中的订单，请先完成', icon: 'none' });
           return;
         }
      }

      // Update Role
      await updateProfile({ role: newRole });
      
      // Force TabBar update
      uni.switchTab({ url: '/pages/home/index' });
    }
  };

  // ... (Keep other methods: useCoupon, addBalance, etc.) ...
  const useCoupon = (couponId: string) => {
    if (userInfo.value && userInfo.value.coupons) {
      const coupon = userInfo.value.coupons.find(c => c.id === couponId);
      if (coupon) {
        coupon.status = 'USED';
        // TODO: Update DB to mark coupon as used
      }
    }
  };

  const updateUser = (updates: Partial<UserInfo>) => {
     updateProfile(updates);
  };
  
  // ... Keep existing simple state modifiers for UI responsiveness ...
  const addBalance = (amount: number) => {
    if (userInfo.value) {
      userInfo.value.balance = (userInfo.value.balance || 0) + amount;
      // TODO: Update DB
    }
  };

  const addLaborIncome = (amount: number) => {
    if (userInfo.value) {
      userInfo.value.laborBalance = (userInfo.value.laborBalance || 0) + amount;
       // TODO: Update DB
    }
  };
  
  const withdrawLaborIncome = (amount: number): boolean => {
    if (userInfo.value && (userInfo.value.laborBalance || 0) >= amount) {
      userInfo.value.laborBalance = (userInfo.value.laborBalance || 0) - amount;
      // TODO: Update DB
      return true;
    }
    return false;
  };
  
  const recharge = (amount: number) => {
      addBalance(amount);
  };
  
  const deductBalance = (amount: number): boolean => {
    if (userInfo.value && (userInfo.value.balance || 0) >= amount) {
      userInfo.value.balance = (userInfo.value.balance || 0) - amount;
      // TODO: Update DB
      return true;
    }
    return false;
  };
  
  const calculateSitterLevel = (years: number): SitterLevel => {
    if (years >= 5) return 'GOLD';
    if (years >= 2) return 'SILVER';
    return 'BRONZE';
  };

  const registerAsSitter = async (data: {
    realName: string;
    idCard: string;
    experienceYears: number;
    tags: string[];
    bio: string;
    availability: SitterAvailability;
  }) => {
    if (!userInfo.value) return;
    
    const level = calculateSitterLevel(data.experienceYears);
    const newProfile: SitterProfile = {
      realName: data.realName,
      idCard: data.idCard,
      level: level,
      completedOrders: 0,
      rating: 5.0,
      experienceYears: data.experienceYears,
      tags: data.tags,
      bio: data.bio,
      isCertified: true,
      certificationStatus: 'verified',
      availability: data.availability
    };
    
    // Update Local
    userInfo.value.sitterProfile = newProfile;
    userInfo.value.role = 'sitter';
    
    // Update DB
    try {
       await supabase.from('sitter_profiles').upsert({
         user_id: userInfo.value.id,
         real_name: data.realName,
         id_card: data.idCard,
         level,
         experience_years: data.experienceYears,
         tags: data.tags,
         bio: data.bio,
         is_certified: true,
         availability: data.availability
       });
       
       await updateProfile({ role: 'sitter' });
    } catch (e) {
       console.error('Register sitter failed', e);
    }
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
    addLaborIncome,
    withdrawLaborIncome,
    recharge,
    deductBalance,
    registerAsSitter,
    fetchProfile // Export for login page usage
  };
});
