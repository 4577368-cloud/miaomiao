const AMAP_KEY = 'b785d85fbf0a8faf26934d832ace1c66'; // H5端 Key (来自 manifest.json)
// 注意：小程序端需要 "Web服务" 类型的 Key，请在开发者后台申请并替换此处
const AMAP_WEB_SERVICE_KEY = 'b785d85fbf0a8faf26934d832ace1c66'; // 临时使用相同的key，建议申请专用的Web服务Key 

export interface LocationResult {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

/**
 * 主动申请定位权限
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    // #ifdef H5
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          console.warn('H5定位权限申请失败:', error);
          if (error.code === error.PERMISSION_DENIED) {
            uni.showModal({
              title: '定位权限',
              content: '需要获取您的位置信息以提供更好的服务，请在浏览器设置中允许位置访问',
              showCancel: false,
              confirmText: '我知道了'
            });
          }
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      uni.showToast({ title: '浏览器不支持定位', icon: 'none' });
      resolve(false);
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    uni.authorize({
      scope: 'scope.userLocation',
      success: () => resolve(true),
      fail: () => {
        uni.showModal({
          title: '定位权限',
          content: '需要获取您的位置信息以提供更好的服务，请在设置中开启定位权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  resolve(!!settingRes.authSetting['scope.userLocation']);
                }
              });
            } else {
              resolve(false);
            }
          }
        });
      }
    });
    // #endif
    
    // #ifndef H5 || MP-WEIXIN
    resolve(true);
    // #endif
  });
};

/**
 * 获取当前位置（支持H5和微信小程序）
 * 统一使用高德地图服务
 */
export const getCurrentLocation = async (): Promise<LocationResult> => {
  // 先申请权限
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    return Promise.resolve({
      latitude: 39.9042,
      longitude: 116.4074,
      address: '北京市东城区长安街',
      name: '模拟位置(北京)'
    });
  }
  
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        const { latitude, longitude } = res;
        
        // #ifdef H5
        // H5端：如果有地址信息直接返回，否则使用 AMap.Geocoder
        if (res.address) {
            // @ts-ignore
            resolve({ latitude, longitude, address: res.address.city || res.address, name: res.address.poiName || '当前位置' });
        } else {
            reverseGeocoderH5(latitude, longitude)
                .then(addressInfo => resolve({ latitude, longitude, ...addressInfo }))
                .catch(err => {
                    console.warn('H5逆地址解析失败:', err);
                    resolve({ latitude, longitude, name: '当前位置' });
                });
        }
        // #endif

        // #ifdef MP-WEIXIN
        // 小程序端：使用高德 Web 服务 API
        if (AMAP_WEB_SERVICE_KEY) {
            reverseGeocoderMP(latitude, longitude)
                .then(addressInfo => resolve({ latitude, longitude, ...addressInfo }))
                .catch(() => resolve({ latitude, longitude, name: '当前位置' }));
        } else {
            // 没有配置 Web 服务 Key，直接返回坐标
            console.warn('未配置高德地图 Web服务Key，无法在小程序端进行逆地址解析');
            resolve({ latitude, longitude, name: '当前位置' });
        }
        // #endif

        // #ifndef MP-WEIXIN || H5
        resolve({ latitude, longitude, name: '当前位置' });
        // #endif
      },
      fail: (err) => {
        console.error('获取位置失败', err.errMsg || err);
        // 模拟定位兜底
        if (err.errMsg && (err.errMsg.includes('limit') || err.errMsg.includes('auth') || err.errMsg.includes('fail') || err.errMsg.includes('denied'))) {
            uni.showToast({
                title: '定位失败，已切换至模拟定位',
                icon: 'none'
            });
            resolve({
                latitude: 39.9042,
                longitude: 116.4074,
                address: '北京市东城区长安街',
                name: '模拟位置(北京)'
            });
        } else {
            reject(err);
        }
      }
    });
  });
};

/**
 * H5端逆地址解析 (使用 AMap JS API)
 */
const reverseGeocoderH5 = (lat: number, lng: number): Promise<{ address: string; name: string }> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof AMap === 'undefined') {
        reject('AMap JS API not loaded');
        return;
    }

    // @ts-ignore
    AMap.plugin('AMap.Geocoder', function() {
      // @ts-ignore
      const geocoder = new AMap.Geocoder({
        // city: "010", // 城市设为北京，默认："全国"
      });

      const lnglat = [lng, lat];
      geocoder.getAddress(lnglat, (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          const address = result.regeocode.formattedAddress;
          // 尝试获取最近的 POI
          const name = result.regeocode.pois && result.regeocode.pois.length > 0 
              ? result.regeocode.pois[0].name 
              : address;
              
          resolve({ address, name });
        } else {
          reject('逆地理编码失败');
        }
      });
    });
  });
};

/**
 * 小程序端逆地址解析 (使用高德 Web 服务 API)
 * https://restapi.amap.com/v3/geocode/regeo
 */
const reverseGeocoderMP = (lat: number, lng: number): Promise<{ address: string; name: string }> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://restapi.amap.com/v3/geocode/regeo',
      data: {
        location: `${lng},${lat}`, // 高德经纬度顺序是 经度,纬度
        key: AMAP_WEB_SERVICE_KEY,
        extensions: 'all'
      },
      success: (res: any) => {
        if (res.data && res.data.status === '1') {
            const regeocode = res.data.regeocode;
            const address = regeocode.formatted_address;
            const name = regeocode.pois && regeocode.pois.length > 0 
                ? regeocode.pois[0].name 
                : address;
            resolve({ address, name });
        } else {
            reject(res.data?.info || '解析失败');
        }
      },
      fail: reject
    });
  });
};
