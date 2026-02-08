import { defineStore } from 'pinia';
import { supabase } from '@/utils/supabase';
import { 
  PetSize, 
  ADD_ON_PRICES, 
  HOLIDAY_MULTIPLIER, 
  RUSH_FEE_MULTIPLIER, 
  RUSH_THRESHOLD_HOURS, 
  MULTI_PET_DISCOUNT, 
  PET_SIZE_COEFFICIENTS 
} from '@/constants/pet';

export interface ServiceType {
  id: string;
  code: string;
  name: string;
  description: string;
  base_price: number;
  discount_percent?: number;
  duration_minutes: number;
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    services: [] as ServiceType[],
    pricingRules: {} as Record<string, any>,
    activeCampaigns: [] as any[],
    loaded: false
  }),
  actions: {
    async initConfig(force = false) {
      if (this.loaded && !force) return;
      
      try {
        // 1. Fetch Services
        const { data: services } = await supabase
          .from('service_types')
          .select('*')
          .eq('is_active', true)
          .order('base_price');
        
        if (services) this.services = services;

        // 2. Fetch Pricing Rules
        const { data: rules } = await supabase.from('pricing_configs').select('*');
        if (rules) {
          this.pricingRules = rules.reduce((acc, curr) => {
            if (!acc[curr.category]) acc[curr.category] = {};
            acc[curr.category][curr.key] = curr.value;
            return acc;
          }, {} as Record<string, any>);
        }

        // 3. Fetch Active Campaigns (Coupon Templates)
        const { data: campaigns } = await supabase
          .from('coupon_templates')
          .select('*')
          .eq('is_active', true)
          .gt('end_time', new Date().toISOString());
          
        if (campaigns) this.activeCampaigns = campaigns;

        this.loaded = true;
        console.log('System Config Loaded:', { services: this.services.length, rules: Object.keys(this.pricingRules).length });
      } catch (e) {
        console.error('Failed to load system config:', e);
      }
    },
    
    getServiceStandardPrice(code: string): number {
      const service = this.services.find(s => s.code === code);
      return service ? Number(service.base_price) : 0;
    },
    getServiceDiscountPercent(code: string): number {
      const service = this.services.find(s => s.code === code);
      const value = service?.discount_percent;
      if (value === undefined || value === null) return 100;
      return Number(value);
    },
    getServicePrice(code: string): number {
      const standard = this.getServiceStandardPrice(code);
      const discount = this.getServiceDiscountPercent(code);
      return Math.round(standard * (discount / 100) * 100) / 100;
    },
    getPetSizeCoefficient(size: PetSize): number {
      const value = this.pricingRules?.PET_SIZE?.[size];
      return value !== undefined ? Number(value) : PET_SIZE_COEFFICIENTS[size];
    },
    getPetSizeCoefficients(): Record<PetSize, number> {
      return {
        [PetSize.CAT]: this.getPetSizeCoefficient(PetSize.CAT),
        [PetSize.SMALL]: this.getPetSizeCoefficient(PetSize.SMALL),
        [PetSize.MEDIUM]: this.getPetSizeCoefficient(PetSize.MEDIUM),
        [PetSize.LARGE]: this.getPetSizeCoefficient(PetSize.LARGE),
        [PetSize.GIANT]: this.getPetSizeCoefficient(PetSize.GIANT)
      };
    },
    getHolidayMultiplier(): number {
      const value = this.pricingRules?.HOLIDAY?.DEFAULT;
      return value !== undefined ? Number(value) : HOLIDAY_MULTIPLIER;
    },
    getRushMultiplier(): number {
      const value = this.pricingRules?.RUSH?.DEFAULT;
      return value !== undefined ? Number(value) : RUSH_FEE_MULTIPLIER;
    },
    getRushThresholdHours(): number {
      const value = this.pricingRules?.RUSH?.THRESHOLD_HOURS;
      return value !== undefined ? Number(value) : RUSH_THRESHOLD_HOURS;
    },
    getMultiPetDiscount(): number {
      const value = this.pricingRules?.MULTI_PET?.DEFAULT;
      return value !== undefined ? Number(value) : MULTI_PET_DISCOUNT;
    },
    getAddOnPrice(key: keyof typeof ADD_ON_PRICES): number {
      const value = this.pricingRules?.ADD_ON?.[key];
      return value !== undefined ? Number(value) : ADD_ON_PRICES[key];
    },
    getAddOnPrices(): typeof ADD_ON_PRICES {
      return {
        PLAY_15_MIN: this.getAddOnPrice('PLAY_15_MIN'),
        DEEP_CLEAN: this.getAddOnPrice('DEEP_CLEAN'),
        MEDICINE: this.getAddOnPrice('MEDICINE')
      };
    }
  }
});
