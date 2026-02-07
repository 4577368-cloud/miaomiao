import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PetSize, ServiceType } from '@/constants/pet';
import type { UserInfo } from '@/stores/user';

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
  time: string; // e.g. "2023-10-01 14:00"
  remark?: string;
  status: 'UNPAID' | 'PENDING' | 'ACCEPTED' | 'IN_SERVICE' | 'COMPLETED' | 'REVIEWED' | 'CANCELLED';
  isPaid: boolean;
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
        console.error('Failed to parse orders', e);
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
        if (order.status === 'PENDING') {
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
      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  const completeOrder = (orderId: string, evidence: NonNullable<Order['serviceEvidence']>) => {
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders.value[orderIndex] = {
        ...orders.value[orderIndex],
        status: 'COMPLETED',
        serviceEvidence: evidence
      };
      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
  };

  return {
    orders,
    loadOrders,
    addOrder,
    acceptOrder,
    updateOrderStatus,
    completeOrder
  };
});
