import { PET_SIZE_COEFFICIENTS, PetSize, ADD_ON_PRICES } from '../constants/pet';

export interface PricingParams {
  basePrice: number;          // 基础服务费 (e.g. 50 for 30min walking)
  petSize: PetSize;           // 宠物类型
  durationMarkup: number;     // 时长加价比例 (e.g. 0.3 for +30%)
  addOns: {
    play?: boolean;
    deepClean?: boolean;
    medicine?: boolean;
  };
}

/**
 * 计算服务总价
 * 公式: 总价 = (基础服务费 * 宠物类型系数 * (1 + 时长加价比例)) + 附加服务费
 */
export function calculateTotalPrice(params: PricingParams): number {
  const { basePrice, petSize, durationMarkup, addOns } = params;

  // 1. 宠物类型系数
  const petCoefficient = PET_SIZE_COEFFICIENTS[petSize];

  // 2. 基础计算 (含宠物系数)
  const baseWithPet = basePrice * petCoefficient;

  // 3. 时长加价
  // 注意：需求示例中 60元 + 30% = 78元，说明是在 (基础*宠物系数) 的基础上乘 (1 + 30%)
  const priceWithDuration = baseWithPet * (1 + durationMarkup);

  // 4. 附加服务
  let addOnTotal = 0;
  if (addOns.play) addOnTotal += ADD_ON_PRICES.PLAY_15_MIN;
  if (addOns.deepClean) addOnTotal += ADD_ON_PRICES.DEEP_CLEAN;
  if (addOns.medicine) addOnTotal += ADD_ON_PRICES.MEDICINE;

  // 5. 总价 (保留两位小数? 通常价格取整或两位)
  return Math.round((priceWithDuration + addOnTotal) * 100) / 100;
}
