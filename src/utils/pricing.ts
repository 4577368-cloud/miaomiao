import { 
  PET_SIZE_COEFFICIENTS, 
  PetSize, 
  ADD_ON_PRICES,
  HOLIDAY_MULTIPLIER,
  RUSH_FEE_MULTIPLIER,
  RUSH_THRESHOLD_HOURS,
  MULTI_PET_DISCOUNT
} from '../constants/pet';

// Simple mock for holiday check
const isHoliday = (dateStr: string): boolean => {
  // In a real app, this would check against a calendar API or config
  // For now, let's mock some dates or just say weekends are "peak" enough to be holidays for demo
  // Or specific dates like Oct 1st, May 1st, Spring Festival
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Example: National Day (Oct 1-7), New Year (Jan 1), Labour Day (May 1)
  if (month === 10 && day <= 7) return true;
  if (month === 1 && day === 1) return true;
  if (month === 5 && day <= 5) return true;
  
  return false;
};

// Check for rush order
const isRushOrder = (serviceDateStr: string, serviceTimeStr: string): boolean => {
  // Combine date and time
  // serviceDateStr: YYYY-MM-DD
  // serviceTimeStr: HH:mm or HH:mm-HH:mm
  const timePart = serviceTimeStr.split('-')[0]; // Take start time
  const fullDateStr = `${serviceDateStr} ${timePart}`;
  const serviceTime = new Date(fullDateStr.replace(/-/g, '/')).getTime(); // Replace - with / for Safari/iOS compatibility
  const now = Date.now();
  
  const diffHours = (serviceTime - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours < RUSH_THRESHOLD_HOURS;
};

export interface PricingParams {
  basePrice: number;          // 基础服务费 (e.g. 50 for 30min walking)
  petSizes: PetSize[];        // 宠物类型列表 (Updated from single petSize)
  durationMarkup: number;     // 时长加价比例 (e.g. 0.3 for +30%)
  serviceDate: string;        // YYYY-MM-DD
  serviceTime: string;        // HH:mm
  addOns: {
    play?: boolean;
    deepClean?: boolean;
    medicine?: boolean;
  };
}

export interface PriceBreakdown {
  base: number;
  pets: number;
  duration: number;
  holiday: number;
  rush: number;
  addOns: number;
  total: number;
}

/**
 * 计算服务总价
 * 公式: 总价 = (基础服务费 * 宠物系数 * (1 + 时长加价)) * (节日系数) * (急单系数) + 附加费
 * 多宠逻辑: 第一只全价，后续半价
 */
export function calculateTotalPrice(params: PricingParams): PriceBreakdown {
  const { basePrice, petSizes, durationMarkup, addOns, serviceDate, serviceTime } = params;

  // 1. 宠物基础费计算 (多宠优惠)
  // Sort sizes by coefficient desc to apply full price to most expensive pet
  const sortedSizes = [...petSizes].sort((a, b) => PET_SIZE_COEFFICIENTS[b] - PET_SIZE_COEFFICIENTS[a]);
  
  let petBaseTotal = 0;
  if (sortedSizes.length > 0) {
    // First pet: 100%
    petBaseTotal += basePrice * PET_SIZE_COEFFICIENTS[sortedSizes[0]];
    
    // Subsequent pets: 50%
    for (let i = 1; i < sortedSizes.length; i++) {
      petBaseTotal += basePrice * PET_SIZE_COEFFICIENTS[sortedSizes[i]] * MULTI_PET_DISCOUNT;
    }
  }

  // 2. 时长加价
  const durationFee = petBaseTotal * durationMarkup;
  const priceWithDuration = petBaseTotal + durationFee;

  // 3. 节日 & 急单溢价 (Apply to service fee, usually not add-ons)
  let holidayFee = 0;
  let rushFee = 0;

  if (isHoliday(serviceDate)) {
    holidayFee = priceWithDuration * (HOLIDAY_MULTIPLIER - 1);
  }

  if (isRushOrder(serviceDate, serviceTime)) {
    rushFee = priceWithDuration * (RUSH_FEE_MULTIPLIER - 1);
  }
  
  const serviceSubtotal = priceWithDuration + holidayFee + rushFee;

  // 4. 附加服务 (Per order for now, could be per pet)
  let addOnTotal = 0;
  if (addOns.play) addOnTotal += ADD_ON_PRICES.PLAY_15_MIN;
  if (addOns.deepClean) addOnTotal += ADD_ON_PRICES.DEEP_CLEAN;
  if (addOns.medicine) addOnTotal += ADD_ON_PRICES.MEDICINE;

  // 5. 总价
  const totalRaw = serviceSubtotal + addOnTotal;
  const total = Math.round(totalRaw * 100) / 100;

  return {
    base: Math.round(petBaseTotal * 100) / 100,
    pets: Math.round(petBaseTotal * 100) / 100, // Same as base in this breakdown context
    duration: Math.round(durationFee * 100) / 100,
    holiday: Math.round(holidayFee * 100) / 100,
    rush: Math.round(rushFee * 100) / 100,
    addOns: Math.round(addOnTotal * 100) / 100,
    total
  };
}
