import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/utils/supabase';
import type { PetSize, ServiceType } from '@/constants/pet';
import type { UserInfo } from '@/stores/user';
import { useUserStore } from '@/stores/user';

export interface Order {
  id: string;
  orderNo?: string; // 订单编号
  creatorId: string; // 发布者ID
  sitterId?: string; // 接单者ID
  sitterSnapshot?: UserInfo; // 接单者快照信息
  
  // Pet Details Snapshot
  petName?: string;
  petBreed?: string;
  petGender?: 'male' | 'female';
  petAge?: number;
  petWeight?: number;
  petSnapshot?: any; // Legacy
  petSnapshots?: any[]; // List of PetInfo snapshots
  petIds?: string[]; // IDs of involved pets
  
  // Contact Info
  contactName: string;
  contactPhone: string;
  
  serviceType: ServiceType;
  petSize: PetSize;
  duration: number;
  totalPrice: number;
  
  // Discount Info
  couponId?: string;
  discountAmount?: number;
  originalPrice?: number;

  address: string;
  latitude?: number;
  longitude?: number;
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
  let realtimeChannel: any = null;

  // Helper: Generate Order No
  const generateOrderNo = (): string => {
    const random = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `CI${random}`;
  };

  // Helper: Calculate Distance (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ1) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // in metres
  };

  // Helper: Map DB row to Order object
  const mapDbOrderToLocal = (row: any): Order => {
    return {
      id: row.id,
      orderNo: row.order_no,
      creatorId: row.creator_id,
      sitterId: row.sitter_id || undefined,
      sitterSnapshot: row.sitter_snapshot,
      
      petIds: row.pet_ids || [],
      petSnapshots: row.pet_snapshots || [],
      // For legacy compatibility, use first pet if available
      petSnapshot: row.pet_snapshots?.[0],
      
      contactName: row.contact_name || '',
      contactPhone: row.contact_phone || '',
      
      serviceType: row.service_type as ServiceType,
      petSize: row.pet_size as PetSize,
      duration: row.duration,
      totalPrice: Number(row.total_price),
      
      couponId: row.coupon_id,
      discountAmount: Number(row.discount_amount || 0),
      originalPrice: Number(row.original_price || row.total_price),

      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      distance: (() => {
         // Priority: DB distance > Calculated distance
         if (row.distance) return Number(row.distance);
         
         const userStore = useUserStore();
         if (row.latitude && row.longitude && userStore.userInfo?.addresses?.length) {
             const myAddress = userStore.userInfo.addresses.find(a => a.isDefault) || userStore.userInfo.addresses[0];
             if (myAddress?.latitude && myAddress?.longitude) {
                 return calculateDistance(myAddress.latitude, myAddress.longitude, row.latitude, row.longitude);
             }
         }
         return 0;
      })(),
      time: row.scheduled_time ? new Date(row.scheduled_time).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') : '', // Simplified formatting
      remark: row.remark,
      status: row.status,
      isPaid: row.is_paid,
      
      createdAt: new Date(row.created_at).getTime(),
      addOns: row.add_ons || { play: false, deepClean: false, medicine: false },
      serviceEvidence: row.service_evidence,
      
      // Reviews need to be fetched separately usually, but if we join them:
      // For MVP, we might need to fetch reviews or store them in order row (not normalized)
      // Since schema.sql has separate reviews table, we'll skip review mapping here unless joined.
      // But for local cache compatibility, we keep structure.
    };
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    const userStore = useUserStore();
    const userId = userStore.userInfo?.id;

    if (!userId || !newRecord) return;

    if (eventType === 'UPDATE') {
       const index = orders.value.findIndex(o => o.id === newRecord.id);
       
       if (index > -1) {
         const updatedOrder = mapDbOrderToLocal(newRecord);
         
         // Sitter Logic: If order is taken by someone else, remove it from my list
        if (userStore.userInfo?.role === 'sitter' && 
             newRecord.sitter_id && 
             newRecord.sitter_id !== userId) {
            orders.value.splice(index, 1);
         } else {
            orders.value[index] = updatedOrder;
         }
       } else {
         // Not in list, check if it should be
         if (newRecord.creator_id === userId || newRecord.sitter_id === userId) {
            orders.value.unshift(mapDbOrderToLocal(newRecord));
         }
       }
    } else if (eventType === 'INSERT') {
       // New order created
       if (newRecord.creator_id === userId) {
          if (!orders.value.some(o => o.id === newRecord.id)) {
             orders.value.unshift(mapDbOrderToLocal(newRecord));
          }
       } else if (userStore.userInfo?.role === 'sitter' && newRecord.status === 'PENDING' && !newRecord.sitter_id) {
          orders.value.unshift(mapDbOrderToLocal(newRecord));
       }
    }
    
    // Sort by createdAt desc
    orders.value.sort((a, b) => b.createdAt - a.createdAt);
    uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
  };

  const subscribeToOrders = () => {
    if (realtimeChannel) return;
    
    realtimeChannel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => handleRealtimeUpdate(payload)
      )
      .subscribe();
  };

  const unsubscribeFromOrders = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };

  const loadOrders = async () => {
    const userStore = useUserStore();
    if (!userStore.userInfo) return;
    
    // Start Realtime Subscription
    subscribeToOrders();

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        // Allow seeing own orders (creator/sitter) OR public pending orders (Task Hall)
        .or(`creator_id.eq.${userStore.userInfo.id},sitter_id.eq.${userStore.userInfo.id},and(status.eq.PENDING,sitter_id.is.null)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        orders.value = data.map(mapDbOrderToLocal);
        uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
      }
    } catch (e) {
      console.error('Load orders failed:', e);
      // Fallback to local
      const saved = uni.getStorageSync('miaomiao_orders');
      if (saved) orders.value = JSON.parse(saved);
    }
  };

  const createOrder = async (order: Partial<Order>) => {
    const userStore = useUserStore();
    
    // Prepare Data for DB
    // Parse time string to ISO
    let scheduledTime = new Date().toISOString();
    if (order.time) {
        // Handle "YYYY-MM-DD HH:mm" or similar
        // Simple fallback
        scheduledTime = new Date(order.time.replace(/-/g, '/')).toISOString();
    }

    const orderNo = generateOrderNo();

    const dbOrder = {
       creator_id: order.creatorId,
       order_no: orderNo,
       sitter_id: order.sitterId || null,
       service_type: order.serviceType,
       pet_size: order.petSize,
       duration: order.duration,
       total_price: order.totalPrice,
       address: order.address,
       latitude: order.latitude || null,
       longitude: order.longitude || null,
       contact_name: order.contactName || userStore.userInfo?.nickname || '联系人',
       contact_phone: order.contactPhone || userStore.userInfo?.phone || '',
       scheduled_time: scheduledTime,
       status: order.status || 'UNPAID',
       is_paid: order.isPaid || false,
       remark: order.remark,
       add_ons: order.addOns,
       pet_ids: order.petIds,
       pet_snapshots: order.petSnapshots,
       coupon_id: order.couponId || null,
       discount_amount: order.discountAmount || 0,
       original_price: order.originalPrice || order.totalPrice
    };

    const { data, error } = await supabase.from('orders').insert(dbOrder).select().single();
    if (error) {
        console.error('Create order failed:', error);
        throw error;
    }
    
    // Update local store
    if (data) {
       const newOrder = mapDbOrderToLocal(data);
       orders.value.unshift(newOrder);
       uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
       
       // If coupon used, mark it
       if (order.couponId) {
           userStore.markCouponUsed(order.couponId);
       }
       
       return newOrder;
    }
  };

  const payOrder = async (orderId: string) => {
      const orderIndex = orders.value.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return false;
      const order = orders.value[orderIndex];
      
      if (order.status !== 'UNPAID') return false;
      
      const userStore = useUserStore();
      
      // Deduct Balance
      const success = await userStore.deductBalance(order.totalPrice);
      if (!success) {
          uni.showToast({ title: '余额不足', icon: 'none' });
          return false;
      }
      
      // Update Order Status
      const { error } = await supabase
        .from('orders')
        .update({ 
            status: 'PENDING',
            is_paid: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      if (error) {
          console.error('Pay order failed:', error);
          // TODO: Rollback balance?
          return false;
      }

      orders.value[orderIndex].status = 'PENDING';
      orders.value[orderIndex].isPaid = true;
      uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
      return true;
  };

  const acceptOrder = async (orderId: string, sitterInfo: UserInfo) => {
    if (!sitterInfo.sitterProfile?.isCertified) return false;
    const { error } = await supabase
        .from('orders')
        .update({
            sitter_id: sitterInfo.id,
            sitter_snapshot: sitterInfo, // Assuming we added this column
            status: 'ACCEPTED',
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (error) {
        console.error('Accept order failed:', error);
        return false;
    }

    // Local Update
    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders.value[orderIndex].sitterId = sitterInfo.id;
        orders.value[orderIndex].sitterSnapshot = sitterInfo;
        orders.value[orderIndex].status = 'ACCEPTED';
        uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
    return true;
  };

  const startService = async (orderId: string) => {
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'IN_SERVICE',
            actual_start_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (error) return false;

    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders.value[orderIndex].status = 'IN_SERVICE';
        orders.value[orderIndex].actualStartTime = Date.now();
        uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
    return true;
  };

  const completeService = async (orderId: string) => {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return false;

    const { error } = await supabase
        .from('orders')
        .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (error) return false;
    
    // Add Income
    const userStore = useUserStore();
    // Assuming backend triggers (Supabase Edge Function) handle money better, but for MVP:
    // We rely on RPC or manual update. userStore.addLaborIncome calls local update + TODO DB.
    // We should implement addLaborIncome with RPC in user store too, but for now:
    if (order.sitterId) {
         // Call RPC
         await supabase.rpc('add_labor_income', { 
             user_id: order.sitterId, 
             amount: order.totalPrice 
         });
    }

    const orderIndex = orders.value.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders.value[orderIndex].status = 'COMPLETED';
        uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
    }
    return true;
  };
  
  const cancelOrder = async (orderId: string, role: 'owner' | 'sitter') => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId);
        
      if (error) return false;
      
      const orderIndex = orders.value.findIndex(o => o.id === orderId);
      if (orderIndex > -1) {
          orders.value[orderIndex].status = 'CANCELLED';
          uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
      }
      return true;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) return false;

      const orderIndex = orders.value.findIndex(o => o.id === orderId);
      if (orderIndex > -1) {
          orders.value[orderIndex].status = status;
          uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
      }
      return true;
  };

  // Reviews - Simplified (Keep local for now or implement full DB)
  // Since we have 'reviews' table, we should insert there.
  const submitOwnerReview = async (orderId: string, rating: number, content: string) => {
     const { error } = await supabase
        .from('orders')
        .update({ status: 'REVIEWED' })
        .eq('id', orderId);
        
     if (error) throw error;
     
     const idx = orders.value.findIndex(o => o.id === orderId);
     if (idx > -1) {
         orders.value[idx].status = 'REVIEWED';
         orders.value[idx].review = { rating, content, createdAt: Date.now() };
         uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
     }
     return true;
  };

  const submitSitterReview = async (orderId: string, rating: number, content: string, tags: string[] = []) => {
      // TODO: Insert into reviews table
      // Local update
      const idx = orders.value.findIndex(o => o.id === orderId);
      if (idx > -1) {
          orders.value[idx].sitterReview = { rating, content, tags, createdAt: Date.now() };
          uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
      }
  };

  const completeOrder = async (orderId: string, evidence: { photos: string[], items?: string[], confirmedAt: number }) => {
      const updated = await updateOrderEvidence(orderId, evidence);
      if (!updated) return false;
      return await completeService(orderId);
  };

  const updateOrderEvidence = async (orderId: string, evidence: { photos: string[], items?: string[], confirmedAt: number }) => {
     const { error } = await supabase
       .from('orders')
       .update({ 
           service_evidence: evidence,
           updated_at: new Date().toISOString()
       })
       .eq('id', orderId);
       
     if (error) {
         console.error('Update evidence failed:', error);
         return false;
     }

     const idx = orders.value.findIndex(o => o.id === orderId);
     if (idx > -1) {
         orders.value[idx].serviceEvidence = { photos: evidence.photos, items: evidence.items || [], confirmedAt: evidence.confirmedAt };
         uni.setStorageSync('miaomiao_orders', JSON.stringify(orders.value));
     }
     return true;
  };

  // Helper alias (since previous code used addOrder)
  const addOrder = createOrder;

  return {
    orders,
    loadOrders,
    createOrder,
    addOrder,
    acceptOrder,
    startService,
    completeService,
    updateOrderEvidence,
    submitOwnerReview,
    submitSitterReview,
    cancelOrder,
    updateOrderStatus,
    completeOrder,
    payOrder,
    subscribeToOrders,
    unsubscribeFromOrders
  };
});
