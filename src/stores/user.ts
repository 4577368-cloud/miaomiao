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
  email?: string;
  nickname: string;
  avatar: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  userNo?: number;
  phone?: string;
  role: UserRole;
  joinDate: number;
  sitterProfile?: SitterProfile;
  pets?: PetInfo[];
  addresses?: Address[];
  balance?: number;
  points?: number;
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
        .maybeSingle(); 
        
      if (error) throw error;
      
      if (data) {
        processProfileData(data, email);
        isLoggedIn.value = true;
      } else {
        // 自我修复：创建默认配置
        console.log('用户信息缺失，正在自动创建...');
        const defaultProfile = {
          id: userId,
          nickname: `用户${userId.slice(0, 6)}`,
          avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
          role: 'owner'
          // email: email // Remove email as it may not exist in profiles table
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile);
          
        if (insertError) {
           console.error('自动创建用户档案失败:', insertError);
           // 即使失败，为了不阻塞流程，不抛出异常，而是让用户停留在登录态但数据不完整
           // 但这里我们选择记录错误并尝试让用户进入
        } else {
           processProfileData(defaultProfile, email);
           isLoggedIn.value = true;
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      // 确保错误状态下登出
      isLoggedIn.value = false;
      userInfo.value = null;
    }
  };

  const processProfileData = async (data: any, email?: string) => {
      // Merge into UserInfo structure
      const currentInfo: UserInfo = {
        id: data.id,
        email: email,
        nickname: data.nickname || '用户',
        avatar: data.avatar || 'https://img.yzcdn.cn/vant/cat.jpeg',
        bio: data.bio || '',
        gender: data.gender,
        userNo: data.user_no ? Number(data.user_no) : undefined,
        role: (data.role as UserRole) || 'owner',
        balance: data.balance || 0,
        points: data.points || 0,
        laborBalance: data.labor_balance || 0,
        joinDate: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        pets: [], 
        addresses: [],
        coupons: [] 
      };
      
      userInfo.value = currentInfo;

      // 并行获取关联数据
      const promises = [
        fetchSitterProfile(data.id),
        fetchUserPets(data.id),
        fetchUserAddresses(data.id),
        fetchUserCoupons(data.id)
      ];

      const [sitterProfile, pets, addresses, coupons] = await Promise.all(promises);
      
      if (userInfo.value) {
        if (sitterProfile) userInfo.value.sitterProfile = sitterProfile;
        if (pets) userInfo.value.pets = pets;
        if (addresses) userInfo.value.addresses = addresses;
        if (coupons) userInfo.value.coupons = coupons;
        
        ensureData(); 
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
  };

  const fetchUserPets = async (userId: string) => {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', userId);
    
    if (error) {
      console.error('Fetch pets failed:', error);
      return [];
    }
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      type: p.type,
      breed: p.breed,
      gender: p.gender,
      size: p.size,
      weight: p.weight,
      age: p.age,
      sterilized: p.sterilized,
      vaccine: p.vaccine,
      description: p.description,
      careProfile: p.care_profile
    })) as PetInfo[];
  };

  const fetchUserAddresses = async (userId: string) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Fetch addresses failed:', error);
      return [];
    }
    
    return data.map(a => ({
      id: a.id,
      name: a.name,
      detail: a.detail,
      contactName: a.contact_name,
      contactPhone: a.contact_phone,
      isDefault: a.is_default,
      latitude: a.latitude,
      longitude: a.longitude
    })) as Address[];
  };

  const fetchUserCoupons = async (userId: string) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Fetch coupons failed:', error);
      return [];
    }
    
    return data.map(c => ({
      id: c.id,
      type: c.type,
      value: Number(c.value),
      threshold: Number(c.threshold),
      name: c.name,
      expiresAt: new Date(c.expires_at).getTime(),
      status: c.status
    })) as Coupon[];
  };

  const fetchSitterProfile = async (userId: string) => {
       const { data: sitterData } = await supabase
         .from('sitter_profiles')
         .select('*')
         .eq('user_id', userId)
         .single();
         
       if (sitterData) {
         return {
           level: (sitterData.level as SitterLevel) || 'BRONZE',
           completedOrders: 0,
           rating: sitterData.rating || 5.0,
           experienceYears: sitterData.experience_years || 0,
           tags: sitterData.tags || [],
           bio: sitterData.bio || '',
           isCertified: sitterData.is_certified || false,
           availability: sitterData.availability
         };
       }
       return undefined;
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
          bio: updates.bio,
          gender: updates.gender,
          role: updates.role
        })
        .eq('id', userInfo.value.id);
        
      if (error) throw error;
    } catch (e) {
      console.error('Update profile failed', e);
      throw e; // Re-throw to let caller handle UI feedback
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
  
  const deductBalance = async (amount: number): Promise<boolean> => {
    if (!userInfo.value) return false;
    
    // Optimistic UI update
    const oldBalance = userInfo.value.balance || 0;
    if (oldBalance < amount) return false;
    
    userInfo.value.balance = oldBalance - amount;
    
    try {
      // Call RPC for atomic update
      const { data, error } = await supabase.rpc('deduct_balance', {
        user_id: userInfo.value.id,
        amount: amount
      });
      
      if (error) throw error;
      if (!data) {
        // Rollback if failed (returned false)
        userInfo.value.balance = oldBalance;
        return false;
      }
      
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      return true;
    } catch (e) {
      console.error('Deduct balance failed:', e);
      userInfo.value.balance = oldBalance; // Rollback
      return false;
    }
  };

  const markCouponUsed = async (couponId: string) => {
    if (!userInfo.value?.coupons) return;
    
    const coupon = userInfo.value.coupons.find(c => c.id === couponId);
    if (coupon) {
       // Optimistic
       const oldStatus = coupon.status;
       coupon.status = 'USED';
       
       const { error } = await supabase
         .from('coupons')
         .update({ status: 'USED' })
         .eq('id', couponId);
         
       if (error) {
         console.error('Update coupon failed:', error);
         coupon.status = oldStatus; // Rollback
       } else {
         uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
       }
    }
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

  // Pet CRUD
  const addPet = async (pet: Omit<PetInfo, 'id'>) => {
    if (!userInfo.value) return;
    
    try {
      const { data, error } = await supabase
        .from('pets')
        .insert({
          owner_id: userInfo.value.id,
          name: pet.name,
          avatar: pet.avatar,
          type: pet.type,
          breed: pet.breed,
          gender: pet.gender,
          size: pet.size,
          weight: pet.weight,
          age: pet.age,
          sterilized: pet.sterilized,
          vaccine: pet.vaccine,
          description: pet.description,
          care_profile: pet.careProfile
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newPet: PetInfo = {
        ...pet,
        id: data.id, // Use real UUID from DB
        careProfile: data.care_profile
      };
      
      if (!userInfo.value.pets) userInfo.value.pets = [];
      userInfo.value.pets.push(newPet);
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      return newPet;
    } catch (e) {
      console.error('Add pet failed', e);
      throw e;
    }
  };

  const updatePet = async (pet: PetInfo) => {
    if (!userInfo.value) return;
    
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          name: pet.name,
          avatar: pet.avatar,
          type: pet.type,
          breed: pet.breed,
          gender: pet.gender,
          size: pet.size,
          weight: pet.weight,
          age: pet.age,
          sterilized: pet.sterilized,
          vaccine: pet.vaccine,
          description: pet.description,
          care_profile: pet.careProfile
        })
        .eq('id', pet.id)
        .eq('owner_id', userInfo.value.id); // Security check
        
      if (error) throw error;
      
      if (userInfo.value.pets) {
        const idx = userInfo.value.pets.findIndex(p => p.id === pet.id);
        if (idx > -1) {
          userInfo.value.pets[idx] = pet;
          uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
        }
      }
    } catch (e) {
      console.error('Update pet failed', e);
      throw e;
    }
  };

  const removePet = async (petId: string) => {
    if (!userInfo.value) return;
    
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId)
        .eq('owner_id', userInfo.value.id);
        
      if (error) throw error;
      
      if (userInfo.value.pets) {
        userInfo.value.pets = userInfo.value.pets.filter(p => p.id !== petId);
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
    } catch (e) {
      console.error('Delete pet failed', e);
      throw e;
    }
  };

  // Address CRUD
  const addAddress = async (addr: Omit<Address, 'id'>) => {
    if (!userInfo.value) return;
    
    try {
      // If default, unset others
      if (addr.isDefault) {
         await resetDefaultAddress();
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userInfo.value.id,
          name: addr.name,
          detail: addr.detail,
          contact_name: addr.contactName,
          contact_phone: addr.contactPhone,
          is_default: addr.isDefault,
          latitude: addr.latitude,
          longitude: addr.longitude
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newAddr: Address = {
        ...addr,
        id: data.id,
        contactName: data.contact_name,
        contactPhone: data.contact_phone,
        isDefault: data.is_default
      };
      
      if (!userInfo.value.addresses) userInfo.value.addresses = [];
      if (newAddr.isDefault) {
        userInfo.value.addresses.forEach(a => a.isDefault = false);
        userInfo.value.addresses.unshift(newAddr);
      } else {
        userInfo.value.addresses.push(newAddr);
      }
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      return newAddr;
    } catch (e) {
      console.error('Add address failed', e);
      throw e;
    }
  };

  const updateAddress = async (addr: Address) => {
    if (!userInfo.value) return;
    
    try {
      if (addr.isDefault) {
         await resetDefaultAddress(addr.id);
      }

      const { error } = await supabase
        .from('addresses')
        .update({
          name: addr.name,
          detail: addr.detail,
          contact_name: addr.contactName,
          contact_phone: addr.contactPhone,
          is_default: addr.isDefault,
          latitude: addr.latitude,
          longitude: addr.longitude
        })
        .eq('id', addr.id)
        .eq('user_id', userInfo.value.id);
        
      if (error) throw error;
      
      if (userInfo.value.addresses) {
        // Local update
        if (addr.isDefault) {
           userInfo.value.addresses.forEach(a => a.isDefault = false);
        }
        
        const idx = userInfo.value.addresses.findIndex(a => a.id === addr.id);
        if (idx > -1) {
          userInfo.value.addresses[idx] = addr;
          // Re-sort if needed or just keep
        }
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
    } catch (e) {
      console.error('Update address failed', e);
      throw e;
    }
  };

  const removeAddress = async (addrId: string) => {
    if (!userInfo.value) return;
    
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addrId)
        .eq('user_id', userInfo.value.id);
        
      if (error) throw error;
      
      if (userInfo.value.addresses) {
        userInfo.value.addresses = userInfo.value.addresses.filter(a => a.id !== addrId);
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
    } catch (e) {
      console.error('Delete address failed', e);
      throw e;
    }
  };

  const resetDefaultAddress = async (excludeId?: string) => {
    if (!userInfo.value) return;
    // Batch update DB to set is_default = false
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userInfo.value.id)
      .neq('id', excludeId || '00000000-0000-0000-0000-000000000000'); // safe check
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
    markCouponUsed,
    registerAsSitter,
    fetchProfile,
    // New CRUD exports
    addPet,
    updatePet,
    removePet,
    addAddress,
    updateAddress,
    removeAddress
  };
});
