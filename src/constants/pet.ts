export enum PetSize {
  SMALL = 'SMALL',   // 1-10kg
  MEDIUM = 'MEDIUM', // 10-25kg
  LARGE = 'LARGE',   // 25-40kg
  GIANT = 'GIANT',   // 40-100kg
  CAT = 'CAT'        // 1-15kg
}

export const PET_SIZE_COEFFICIENTS: Record<PetSize, number> = {
  [PetSize.SMALL]: 1.0,
  [PetSize.MEDIUM]: 1.2,
  [PetSize.LARGE]: 1.4,
  [PetSize.GIANT]: 1.6,
  [PetSize.CAT]: 1.0, // 基础价
};

export enum ServiceType {
  FEEDING = 'FEEDING', // 上门喂养
  WALKING = 'WALKING', // 上门遛宠
}

export const ADD_ON_PRICES = {
  PLAY_15_MIN: 15,
  DEEP_CLEAN: 20,
  MEDICINE: 10,
};

// Pricing Constants
export const HOLIDAY_MULTIPLIER = 1.5; // 节假日溢价 1.5倍
export const RUSH_FEE_MULTIPLIER = 1.2; // 急单溢价 1.2倍
export const RUSH_THRESHOLD_HOURS = 2; // 急单阈值 (小时)
export const MULTI_PET_DISCOUNT = 0.5; // 第二只宠物半价 (50%)
