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
  petSnapshot?: any; // Complete PetInfo snapshot
  
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

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders.value[orderIndex].status = status;
      // If starting service, record start time
      if (status === 'IN_SERVICE' && !orders.value[orderIndex].actualStartTime) {
        orders.value[orderIndex].actualStartTime = Date.now();
      }
      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  const completeOrder = (orderId: string, evidence: NonNullable<Order['serviceEvidence']>) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      const order = orders.value[orderIndex];
      orders.value[orderIndex] = {
        ...order,
        status: 'COMPLETED',
        serviceEvidence: evidence
      };
      
      // Add balance to sitter
      if (order.sitterId && order.totalPrice > 0) {
        const userStore = useUserStore();
        // Check if current user is the sitter (should be, as they complete the order)
        // Or if we need to update remote, this is mock.
        // We just update current user if they are the sitter.
        if (userStore.userInfo?.id === order.sitterId) {
            userStore.addBalance(order.totalPrice);
        }
      }

      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  const createOrder = (order: Order) => {
    addOrder(order);
  };

  return {
    orders,
    loadOrders,
    addOrder,
    createOrder,
    acceptOrder,
    updateOrderStatus,
    completeOrder
  };
});
