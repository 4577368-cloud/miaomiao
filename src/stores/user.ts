import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import { PetSize } from '@/constants/pet';
import { useOrderStore } from '@/stores/order';
import AdminAPI from '@/utils/admin-api';

export type UserRole = 'owner' | 'sitter';
export type SitterLevel = 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE' | 'TRAINEE';

// ... (Existing interfaces remain same)
export interface SitterAvailability {
  time: string;
  locations: string[];
  services: ('feeding' | 'walking')[];
}

export interface SitterProfile {
  realName?: string;
  idCard?: string;
  idCardFront?: string;
  idCardBack?: string;
  level: SitterLevel;
  completedOrders: number;
  rating: number;
  experienceYears: number;
  tags: string[];
  bio: string;
  isCertified: boolean;
  certificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  certificationRejectReason?: string;
  certificationSubmittedAt?: number;
  certificationReviewedAt?: number;
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

export interface NotificationItem {
  id: string;
  type: 'order' | 'system' | 'coupon' | 'other' | 'announcement';
  title: string;
  content: string;
  time: string;
  read: boolean;
  link?: string;
  orderId?: string;
}

export interface AdminInfo {
  id: string;
  username: string;
  email?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  lastLogin?: number;
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
  status?: 'active' | 'banned'; // 添加用户状态字段
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const isLoggedIn = ref(false);
  const adminInfo = ref<AdminInfo | null>(null);
  const isAdmin = ref(false);
  
  // 计算管理员状态
  const updateAdminStatus = () => {
    isAdmin.value = !!adminInfo.value;
  };

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
      const [sitterProfile, pets, addresses, coupons] = await Promise.all([
        fetchSitterProfile(data.id),
        fetchUserPets(data.id),
        fetchUserAddresses(data.id),
        fetchUserCoupons(data.id)
      ] as const);
      
      if (userInfo.value) {
        if (sitterProfile) userInfo.value.sitterProfile = sitterProfile;
        if (pets) userInfo.value.pets = pets;
        if (addresses) userInfo.value.addresses = addresses;
        if (coupons) userInfo.value.coupons = coupons;
        const statusKey = `miaomiao_cert_status_${data.id}`;
        const prevStatus = uni.getStorageSync(statusKey);
        const currentStatus = sitterProfile?.certificationStatus;
        if (currentStatus && currentStatus !== prevStatus) {
          if (currentStatus === 'verified' || currentStatus === 'rejected') {
            const title = currentStatus === 'verified' ? '宠托师认证通过' : '宠托师认证未通过';
            const content = currentStatus === 'verified'
              ? '您的实名认证已通过审核，可以开始接单了'
              : `很遗憾，您的认证未通过${sitterProfile?.certificationRejectReason ? '，原因：' + sitterProfile.certificationRejectReason : ''}`;
            addNotification({
              id: `cert_${currentStatus}_${data.id}_${Date.now()}`,
              type: 'system',
              title,
              content,
              time: new Date().toLocaleString()
            });
          }
          uni.setStorageSync(statusKey, currentStatus);
        }
        
        ensureData(); 
        uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      }
  };

  const fetchUserPets = async (userId: string): Promise<PetInfo[]> => {
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

  const fetchUserAddresses = async (userId: string): Promise<Address[]> => {
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

  const fetchUserCoupons = async (userId: string): Promise<Coupon[]> => {
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

  const fetchSitterProfile = async (userId: string): Promise<SitterProfile | undefined> => {
       const { data: sitterData } = await supabase
         .from('sitter_profiles')
         .select('*')
         .eq('user_id', userId)
         .single();
         
       if (sitterData) {
         return {
           level: (sitterData.level as SitterLevel) || 'BRONZE',
           completedOrders: sitterData.completed_orders || 0,
           rating: sitterData.rating || 5.0,
           experienceYears: sitterData.experience_years || 0,
           tags: sitterData.tags || [],
           bio: sitterData.bio || '',
           isCertified: sitterData.is_certified || false,
           certificationStatus: sitterData.certification_status || 'none',
           certificationRejectReason: sitterData.certification_reject_reason || '',
           certificationSubmittedAt: sitterData.certification_submitted_at ? new Date(sitterData.certification_submitted_at).getTime() : undefined,
           certificationReviewedAt: sitterData.certification_reviewed_at ? new Date(sitterData.certification_reviewed_at).getTime() : undefined,
           idCardFront: sitterData.id_card_front,
           idCardBack: sitterData.id_card_back,
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
    adminInfo.value = null; // 清除管理员信息
    uni.removeStorageSync('miaomiao_user');
    uni.removeStorageSync('miaomiao_admin');
    uni.reLaunch({ url: '/pages/login/index' });
  };
  
  // 管理员登录
  const adminLogin = async (username: string, password: string) => {
    try {
      // 使用AdminAPI验证管理员身份
      const result = await AdminAPI.validateAdmin(username, password);
      
      if (!result.success) {
        return { success: false, message: result.error || '登录失败' };
      }
      
      // 设置管理员信息
      adminInfo.value = {
        id: result.data!.id,
        username: result.data!.username,
        email: '', // 可以从数据库获取，这里简化处理
        role: result.data!.role,
        permissions: ['admin'], // 管理员权限
        lastLogin: Date.now()
      };
      
      // 更新管理员状态
      updateAdminStatus();
      
      // 保存到本地存储
      uni.setStorageSync('miaomiao_admin', JSON.stringify(adminInfo.value));
      
      return { success: true, data: adminInfo.value };
    } catch (error: any) {
      console.error('管理员登录失败:', error);
      return { success: false, message: error.message || '登录失败' };
    }
  };
  
  // 管理员登出
  const adminLogout = () => {
    adminInfo.value = null;
    updateAdminStatus();
    uni.removeStorageSync('miaomiao_admin');
  };

  // 验证管理员会话
  const validateAdminSession = async () => {
    if (!adminInfo.value) {
      return { success: false, error: '管理员未登录' };
    }
    
    try {
      // 这里可以添加会话验证逻辑
      // 例如检查会话是否过期，或者向服务器验证会话有效性
      
      // 简单的本地验证：检查最后登录时间是否超过24小时
      const now = Date.now();
      const lastLogin = adminInfo.value.lastLogin || 0;
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24小时
      
      if (now - lastLogin > sessionTimeout) {
        // 会话过期，清除管理员信息
        adminLogout();
        return { success: false, error: '管理员会话已过期' };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('验证管理员会话失败:', error);
      return { success: false, error: '会话验证失败' };
    }
  };

  // 清除管理员会话
  const clearAdminSession = () => {
    adminLogout();
  };
  
  // 获取管理员用户列表
  const getAdminUsers = async () => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.getUsers();
      return result;
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      return { success: false, message: error.message || '获取用户列表失败' };
    }
  };
  
  // 切换用户状态
  const toggleUserStatus = async (userId: string, ban: boolean) => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.updateUserStatus(userId, ban ? 'banned' : 'active');
      return result;
    } catch (error: any) {
      console.error('切换用户状态失败:', error);
      return { success: false, message: error.message || '操作失败' };
    }
  };
  
  // 获取管理员订单列表
  const getAdminOrders = async () => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.getOrders();
      return result;
    } catch (error: any) {
      console.error('获取订单列表失败:', error);
      return { success: false, message: error.message || '获取订单列表失败' };
    }
  };
  
  // 获取管理员公告列表
  const getAdminAnnouncements = async () => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.getAnnouncements();
      return result;
    } catch (error: any) {
      console.error('获取公告列表失败:', error);
      return { success: false, message: error.message || '获取公告列表失败' };
    }
  };
  
  // 创建公告
  const createAnnouncement = async (announcement: { title: string; content: string }) => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.createAnnouncement({
        title: announcement.title,
        content: announcement.content,
        created_by: adminInfo.value?.username || '管理员'
      });
      return result;
    } catch (error: any) {
      console.error('创建公告失败:', error);
      return { success: false, message: error.message || '创建公告失败' };
    }
  };
  
  // 更新公告
  const updateAnnouncement = async (id: string, announcement: { content: string }) => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.updateAnnouncement(id, {
        content: announcement.content
      });
      return result;
    } catch (error: any) {
      console.error('更新公告失败:', error);
      return { success: false, message: error.message || '更新公告失败' };
    }
  };
  
  // 删除公告
  const deleteAnnouncement = async (id: string) => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.deleteAnnouncement(id);
      return result;
    } catch (error: any) {
      console.error('删除公告失败:', error);
      return { success: false, message: error.message || '删除公告失败' };
    }
  };
  
  // 获取管理员统计数据
  const getAdminStats = async () => {
    if (!isAdmin.value) {
      throw new Error('没有管理员权限');
    }
    
    try {
      const result = await AdminAPI.getStats();
      return result;
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
      return { success: false, message: error.message || '获取统计数据失败' };
    }
  };
  
  // New: Auth Actions
  const updateProfile = async (updates: Partial<UserInfo>) => {
    if (!userInfo.value) return;
    
    // Update local state
    userInfo.value = { ...userInfo.value, ...updates };
    uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
    
    // Update Supabase
    const payload = {
      nickname: updates.nickname,
      avatar: updates.avatar,
      bio: updates.bio,
      gender: updates.gender,
      role: updates.role
    };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userInfo.value.id);
        
      if (error) throw error;
    } catch (e: any) {
      if (e?.message && String(e.message).includes('bio') && String(e.message).includes('schema cache')) {
        const fallbackPayload = {
          nickname: updates.nickname,
          avatar: updates.avatar,
          gender: updates.gender,
          role: updates.role
        };
        const { error: fallbackError } = await supabase
          .from('profiles')
          .update(fallbackPayload)
          .eq('id', userInfo.value.id);
        if (fallbackError) {
          console.error('Update profile failed', fallbackError);
          throw fallbackError;
        }
        return;
      }
      console.error('Update profile failed', e);
      throw e;
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
        
        if (!userInfo.value.sitterProfile.isCertified) {
          const status = userInfo.value.sitterProfile.certificationStatus || 'none';
          if (status === 'pending') {
            uni.showToast({ title: '认证审核中', icon: 'none' });
            return;
          }
          if (status === 'rejected') {
            uni.showModal({
              title: '认证未通过',
              content: '请修改资料后重新提交',
              confirmText: '去认证',
              success: (res) => {
                if (res.confirm) {
                  uni.navigateTo({ url: '/pages/profile/certification' });
                }
              }
            });
            return;
          }
          uni.showModal({
            title: '未认证',
            content: '切换为宠托师身份需要先通过实名认证',
            confirmText: '去认证',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({ url: '/pages/profile/certification' });
              }
            }
          });
          return;
        }
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

  const claimNewcomerCoupon = async (): Promise<boolean> => {
    if (!userInfo.value) return false;
    
    // Check if already claimed
    const hasCoupon = userInfo.value.coupons?.some(c => c.name === '新人专享红包');
    if (hasCoupon) return true; // Already claimed, treat as success

    const newCoupon: Coupon = {
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }),
      type: 'FIXED',
      value: 30,
      threshold: 0,
      name: '新人专享红包',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      status: 'UNUSED'
    };

    // Optimistic update
    if (!userInfo.value.coupons) userInfo.value.coupons = [];
    userInfo.value.coupons.push(newCoupon);
    
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          id: newCoupon.id,
          user_id: userInfo.value.id,
          type: newCoupon.type,
          value: newCoupon.value,
          threshold: newCoupon.threshold,
          name: newCoupon.name,
          expires_at: new Date(newCoupon.expiresAt).toISOString(),
          status: newCoupon.status
        });

      if (error) throw error;
      
      uni.setStorageSync('miaomiao_user', JSON.stringify(userInfo.value));
      addNotification({
        id: `coupon_${newCoupon.id}`,
        type: 'coupon',
        title: '优惠券到账',
        content: `您已领取优惠券「${newCoupon.name}」，快去下单使用吧`,
        time: new Date().toLocaleString(),
        link: '/pages/wallet/index'
      });
      return true;
    } catch (e) {
      console.error('Claim coupon failed:', e);
      // Rollback
      userInfo.value.coupons = userInfo.value.coupons.filter(c => c.id !== newCoupon.id);
      return false;
    }
  };

  
  const calculateSitterLevel = (points: number): SitterLevel => {
    if (points > 5000) return 'DIAMOND';
    if (points >= 1500) return 'GOLD';
    if (points >= 500) return 'SILVER';
    return 'TRAINEE';
  };

  const addPoints = async (amount: number) => {
    if (!userInfo.value) return;
    
    // Optimistic update
    const newPoints = (userInfo.value.points || 0) + amount;
    userInfo.value.points = newPoints;
    
    // Check for level upgrade
    if (userInfo.value.role === 'sitter' && userInfo.value.sitterProfile) {
        const newLevel = calculateSitterLevel(newPoints);
        if (newLevel !== userInfo.value.sitterProfile.level) {
            userInfo.value.sitterProfile.level = newLevel;
            // Update sitter profile level in DB
            await supabase.from('sitter_profiles').update({ level: newLevel }).eq('user_id', userInfo.value.id);
        }
    }
    
    // Update points in DB (profiles table)
    await supabase.from('profiles').update({ points: newPoints }).eq('id', userInfo.value.id);
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
    
    const level = calculateSitterLevel(userInfo.value.points || 0);
    const newProfile: SitterProfile = {
      realName: data.realName,
      idCard: data.idCard,
      level: level,
      completedOrders: 0,
      rating: 5.0,
      experienceYears: data.experienceYears,
      tags: data.tags,
      bio: data.bio,
      isCertified: false,
      certificationStatus: 'none',
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
         is_certified: false,
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

  const getNotificationKey = (userId: string) => `miaomiao_notifications_${userId}`;

  const getNotifications = (userId?: string): NotificationItem[] => {
    const uid = userId || userInfo.value?.id;
    if (!uid) return [];
    const list = uni.getStorageSync(getNotificationKey(uid)) || [];
    return Array.isArray(list) ? (list as NotificationItem[]) : [];
  };

  const setNotifications = (userId: string, list: NotificationItem[]) => {
    uni.setStorageSync(getNotificationKey(userId), list);
  };

  const addNotification = (item: Omit<NotificationItem, 'read'> & { read?: boolean }) => {
    const uid = userInfo.value?.id;
    if (!uid) return;
    const list = getNotifications(uid);
    if (list.some(n => n.id === item.id)) return;
    const nextItem: NotificationItem = {
      read: false,
      ...item
    };
    list.unshift(nextItem);
    setNotifications(uid, list);
    void supabase.from('notifications').insert({
      id: nextItem.id,
      user_id: uid,
      type: nextItem.type,
      title: nextItem.title,
      content: nextItem.content,
      link: nextItem.link || null,
      order_id: nextItem.orderId || null,
      is_read: nextItem.read,
      created_at: new Date().toISOString()
    });
    return nextItem;
  };

  const markNotificationRead = (id: string) => {
    const uid = userInfo.value?.id;
    if (!uid) return;
    const list = getNotifications(uid);
    const idx = list.findIndex(n => n.id === id);
    if (idx > -1) {
      list[idx].read = true;
      setNotifications(uid, list);
    }
    void supabase.from('notifications').update({ is_read: true }).eq('user_id', uid).eq('id', id);
  };

  const markNotificationsRead = (ids: string[]) => {
    const uid = userInfo.value?.id;
    if (!uid) return;
    const list = getNotifications(uid);
    let changed = false;
    list.forEach(n => {
      if (ids.includes(n.id) && !n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) setNotifications(uid, list);
    if (ids.length > 0) {
      void supabase.from('notifications').update({ is_read: true }).eq('user_id', uid).in('id', ids);
    }
  };

  const upsertNotificationFromDb = (row: any) => {
    const uid = userInfo.value?.id;
    if (!uid || !row?.id) return;
    const list = getNotifications(uid);
    const idx = list.findIndex(n => n.id === row.id);
    const item: NotificationItem = {
      id: row.id,
      type: row.type || 'system',
      title: row.title || '',
      content: row.content || '',
      time: row.created_at ? new Date(row.created_at).toLocaleString() : new Date().toLocaleString(),
      read: !!row.is_read,
      link: row.link || undefined,
      orderId: row.order_id || undefined
    };
    if (idx > -1) {
      list[idx] = item;
      setNotifications(uid, list);
    } else {
      setNotifications(uid, [item, ...list]);
    }
  };

  const removeNotificationById = (id: string) => {
    const uid = userInfo.value?.id;
    if (!uid) return;
    const list = getNotifications(uid).filter(n => n.id !== id);
    setNotifications(uid, list);
  };

  const getUnreadNotifications = (userId?: string) => {
    const uid = userId || userInfo.value?.id;
    if (!uid) return [];
    
    // 清理过期的公告通知（超过1天）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const allNotifications = getNotifications(uid);
    const validNotifications = allNotifications.filter(n => {
      // 如果是公告类型，检查是否过期
      if (n.type === 'announcement') {
        const notificationTime = new Date(n.time).getTime();
        return notificationTime > oneDayAgo;
      }
      return true; // 其他类型不过期
    });
    
    // 如果有过期通知被清理，更新存储
    if (validNotifications.length < allNotifications.length) {
      setNotifications(uid, validNotifications);
    }
    
    return validNotifications.filter(n => !n.read);
  };

  const clearNotifications = (userId?: string) => {
    const uid = userId || userInfo.value?.id;
    if (!uid) return;
    setNotifications(uid, []);
    void supabase.from('notifications').delete().eq('user_id', uid);
  };

  const syncNotifications = async () => {
    const uid = userInfo.value?.id;
    if (!uid) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Load notifications failed:', error);
      return;
    }
    const list: NotificationItem[] = (data || []).map((row: any) => ({
      id: row.id,
      type: row.type || 'system',
      title: row.title || '',
      content: row.content || '',
      time: row.created_at ? new Date(row.created_at).toLocaleString() : '',
      read: !!row.is_read,
      link: row.link || undefined,
      orderId: row.order_id || undefined
    }));
    setNotifications(uid, list);
  };

  const syncAnnouncements = async () => {
    const uid = userInfo.value?.id;
    if (!uid) return;
    
    // 获取当前时间，计算1天前的边界时间
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .gte('created_at', oneDayAgo.toISOString()) // 只获取1天内的公告
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Load announcements failed:', error);
      return;
    }
    
    const existing = getNotifications(uid);
    const existsIds = new Set(existing.map(n => n.id));
    const added: NotificationItem[] = [];
    
    (data || []).forEach((row: any) => {
      const nid = `announcement_${row.id}_${uid}`;
      if (!existsIds.has(nid)) {
        const item: NotificationItem = {
          id: nid,
          type: 'announcement',
          title: row.title || '系统公告',
          content: row.content || '',
          time: new Date(row.created_at).toLocaleString(),
          read: false,
          link: row.link || undefined
        };
        added.push(item);
      }
    });
    
    if (added.length > 0) {
      setNotifications(uid, [...added, ...existing]);
      void supabase.from('notifications').insert(added.map(item => ({
        id: item.id,
        user_id: uid,
        type: item.type,
        title: item.title,
        content: item.content,
        link: item.link || null,
        is_read: item.read,
        created_at: item.time ? new Date(item.time).toISOString() : new Date().toISOString()
      })));
    }
  };

  return {
    userInfo,
    isLoggedIn,
    adminInfo,
    isAdmin,
    initUser,
    login,
    logout,
    adminLogin,
    adminLogout,
    validateAdminSession,
    clearAdminSession,
    switchRole,
    updateProfile,
    updateUser,
    useCoupon,
    addBalance,
    addLaborIncome,
    withdrawLaborIncome,
    recharge,
    deductBalance,
    markCouponUsed,
    claimNewcomerCoupon,
    registerAsSitter,
    fetchProfile,
    addPoints, // Export this
    // Admin functions
    getAdminUsers,
    toggleUserStatus,
    getAdminOrders,
    getAdminAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAdminStats,
    // New CRUD exports
    addPet,
    updatePet,
    removePet,
    addAddress,
    updateAddress,
    removeAddress,
    getNotifications,
    getUnreadNotifications,
    addNotification,
    markNotificationRead,
    markNotificationsRead,
    clearNotifications,
    syncAnnouncements,
    syncNotifications,
    upsertNotificationFromDb,
    removeNotificationById
  };
});
