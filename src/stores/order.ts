import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PetSize, ServiceType } from '@/constants/pet';
import type { UserInfo } from '@/stores/user';
import { useUserStore } from '@/stores/user';

export interface Order {
  id: string;
  creatorId: string; // 发布者ID
  sitterId?: string; // 接单者ID
  sitterSnapshot?: UserInfo; // 接单者快照信息
  
  // Pet Details Snapshot
  petName?: string;
  petBreed?: string;
  petGender?: 'male' | 'female';
  petAge?: number;
  petWeight?: number;
  petSnapshot?: any; // Complete PetInfo snapshot (Legacy single pet)
  petSnapshots?: any[]; // List of PetInfo snapshots (Multi-pet support)
  petIds?: string[]; // IDs of involved pets
  
  // Contact Info
  contactName: string;
  contactPhone: string;
  
  serviceType: ServiceType;
  petSize: PetSize;
  duration: number;
  totalPrice: number;
  address: string;
  distance?: number; // 距离 (米)
  time: string; // e.g. "2023-10-01 14:00"
  remark?: string;
  status: 'UNPAID' | 'PENDING' | 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'IN_SERVICE' | 'COMPLETED' | 'REVIEWED' | 'CANCELLED';
  isPaid: boolean;
  isDirect?: boolean; // 是否为1v1直接指派
  actualStartTime?: number; // 实际开始服务时间
  createdAt: number;
  addOns: {
    play: boolean;
    deepClean: boolean;
    medicine: boolean;
  };
  serviceEvidence?: {
    photos: string[];
    items: string[];
    confirmedAt: number;
  };
  review?: {
    rating: number;
    content: string;
    createdAt: number;
  };
  sitterReview?: {
    rating: number; // 1-5
    tags: string[]; // e.g. "乖巧", "护食", "粘人"
    content: string;
    createdAt: number;
  };
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);

  // 模拟从本地存储加载
  const loadOrders = () => {
    const saved = uni.getStorageSync('miaomiao_orders');
    if (saved) {
      try {
        orders.value = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse orders', (e as Error).message || e);
      }
    }
  };

  const addOrder = (order: Order) => {
    orders.value.unshift(order);
    uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
  };

  const acceptOrder = (orderId: string, sitterInfo: UserInfo) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        const order = orders.value[orderIndex];
        // Allow accepting if PENDING (public) or PENDING_ACCEPTANCE (direct match)
        if (order.status === 'PENDING' || order.status === 'PENDING_ACCEPTANCE') {
            orders.value[orderIndex] = {
                ...order,
                sitterId: sitterInfo.id,
                sitterSnapshot: sitterInfo,
                status: 'ACCEPTED'
            };
            uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
            return true;
        }
    }
    return false;
  };

  // State Machine Actions
  
  const startService = (orderId: string) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        const order = orders.value[orderIndex];
        if (order.status === 'ACCEPTED') {
            orders.value[orderIndex] = {
                ...order,
                status: 'IN_SERVICE',
                actualStartTime: Date.now()
            };
            uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
            return true;
        }
    }
    return false;
  };

  const completeService = (orderId: string) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        const order = orders.value[orderIndex];
        if (order.status === 'IN_SERVICE') {
            orders.value[orderIndex] = {
                ...order,
                status: 'COMPLETED'
            };
            
            // Auto-settle funds
            const userStore = useUserStore();
            const sitterId = order.sitterId;
            if (sitterId && userStore.userInfo?.id === sitterId) {
                userStore.addLaborIncome(order.totalPrice);
            }
            
            uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
            return true;
        }
    }
    return false;
  };

  const submitOwnerReview = (orderId: string, rating: number, content: string) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders.value[orderIndex].review = {
            rating,
            content,
            createdAt: Date.now()
        };
        // If Sitter hasn't reviewed yet, status stays COMPLETED (or maybe change to REVIEWED to hide from "Pending Review" list)
        // For simplicity: Status -> REVIEWED implies Owner has reviewed.
        orders.value[orderIndex].status = 'REVIEWED';
        uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  const submitSitterReview = (orderId: string, rating: number, content: string, tags: string[] = []) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders.value[orderIndex].sitterReview = {
            rating,
            content,
            tags,
            createdAt: Date.now()
        };
        // Sitter review doesn't change main status from COMPLETED usually, 
        // but if both reviewed, maybe archive? 
        // For now, just save it.
        uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  const cancelOrder = (orderId: string, role: 'owner' | 'sitter') => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        const order = orders.value[orderIndex];
        // Allow cancellation only in early stages
        if (['UNPAID', 'PENDING', 'PENDING_ACCEPTANCE', 'ACCEPTED'].includes(order.status)) {
            // If cancelling an accepted order, might need more logic (notifications, penalties)
            // For MVP, just allow it
            orders.value[orderIndex].status = 'CANCELLED';
            uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
            return true;
        }
    }
    return false;
  };

  const payOrder = (orderId: string) => {
      const orderIndex = orders.value.findIndex(o => o.id === orderId);
      if (orderIndex > -1) {
          const order = orders.value[orderIndex];
          if (order.status === 'UNPAID') {
              orders.value[orderIndex] = {
                  ...order,
                  status: 'PENDING',
                  isPaid: true
              };
              uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
              return true;
          }
      }
      return false;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    // Deprecated: Strict state machine actions should be used instead.
    // Kept only for legacy or debug.
    console.warn('updateOrderStatus is deprecated. Use specific actions like startService, completeService, cancelOrder, payOrder.');
    
    if (status === 'IN_SERVICE') return startService(orderId);
    if (status === 'COMPLETED') return completeService(orderId);
    
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders.value[orderIndex].status = status;
      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  const updateOrderEvidence = (orderId: string, evidence: NonNullable<Order['serviceEvidence']>) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders.value[orderIndex].serviceEvidence = {
        ...orders.value[orderIndex].serviceEvidence,
        ...evidence
      };
      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  return {
    orders,
    loadOrders,
    addOrder,
    acceptOrder,
    startService,
    completeService,
    submitOwnerReview,
    submitSitterReview,
    cancelOrder,
    payOrder,
    updateOrderStatus,
    updateOrderEvidence
  };
});
