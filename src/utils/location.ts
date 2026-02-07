import { ref } from 'vue';

const QQ_MAP_KEY = '3CEBZ-D3OCW-DUOR3-YGJUF-2FBKK-RIBFD';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

/**
 * 获取当前位置（支持H5和微信小程序）
 * H5端使用uni.getLocation (可能需要https)
 * 小程序端使用uni.getLocation + 腾讯地图API逆地址解析
 */
export const getCurrentLocation = (): Promise<LocationResult> => {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        const { latitude, longitude } = res;
        
        // #ifdef MP-WEIXIN
        // 小程序端需要逆地址解析
        reverseGeocoder(latitude, longitude)
          .then(addressInfo => {
            resolve({
              latitude,
              longitude,
              ...addressInfo
            });
          })
          .catch(() => {
            // 解析失败降级返回坐标
            resolve({ latitude, longitude, name: '当前位置' });
          });
        // #endif

        // #ifdef H5
        // H5端如果有地址信息直接返回，否则尝试JSONP解析
        if (res.address) {
            // @ts-ignore
            resolve({ latitude, longitude, address: res.address.city || res.address, name: res.address.poiName || '当前位置' });
        } else {
            // 尝试使用JSONP进行逆地址解析
            reverseGeocoderH5(latitude, longitude)
                .then(addressInfo => {
                    resolve({
                        latitude,
                        longitude,
                        ...addressInfo
                    });
                })
                .catch(() => {
                    // 解析失败降级返回坐标
                    console.warn('逆地址解析失败，降级使用默认位置');
                    resolve({ latitude, longitude, name: '当前位置' });
                });
        }
        // #endif

        // #ifndef MP-WEIXIN || H5
        resolve({ latitude, longitude, name: '当前位置' });
        // #endif
      },
      fail: (err) => {
        console.error('获取位置失败', err.errMsg || err);
        // 如果是Key额度不足，降级使用模拟位置（方便开发调试）
        if (err.errMsg && (err.errMsg.includes('limit') || err.errMsg.includes('上限'))) {
            uni.showToast({
                title: '地图Key额度已满，已切换至模拟定位',
                icon: 'none',
                duration: 3000
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
 * 微信小程序端逆地址解析
 */
const reverseGeocoder = (lat: number, lng: number): Promise<{ address: string; name: string }> => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${lat},${lng}`,
        key: QQ_MAP_KEY,
        get_poi: 1
      },
      success: (res: any) => {
        if (res.data && res.data.status === 0) {
          const result = res.data.result;
          // 优先使用推荐的POI，如果没有则使用大致位置
          const name = result.formatted_addresses?.recommend || result.address;
          resolve({
            address: result.address,
            name: name
          });
        } else {
          reject(res.data?.message || '解析失败');
        }
      },
      fail: reject
    });
  });
};

/**
 * H5端逆地址解析 (使用JSONP)
 */
const reverseGeocoderH5 = (lat: number, lng: number): Promise<{ address: string; name: string }> => {
  return new Promise((resolve, reject) => {
    // 构建JSONP请求
    const callbackName = 'qq_map_callback_' + Date.now();
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${QQ_MAP_KEY}&output=jsonp&callback=${callbackName}&get_poi=1`;

    // @ts-ignore
    window[callbackName] = (res: any) => {
      if (res && res.status === 0) {
        const result = res.result;
        const name = result.formatted_addresses?.recommend || result.address;
        resolve({
          address: result.address,
          name: name
        });
      } else {
        reject(res?.message || '解析失败');
      }
      // 清理
      // @ts-ignore
      delete window[callbackName];
      document.body.removeChild(script);
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = () => {
        reject('JSONP加载失败');
        // @ts-ignore
        delete window[callbackName];
        document.body.removeChild(script);
    };
    document.body.appendChild(script);
  });
};
