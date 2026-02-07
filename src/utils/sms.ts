// src/utils/sms.ts

// 模拟验证码存储 (在真实后端应存储在 Redis 或数据库中)
const mockCodeStore: Record<string, { code: string; expires: number }> = {};

/**
 * 发送短信验证码
 * @param phone 手机号
 * @returns Promise<boolean>
 */
export const sendSmsCode = async (phone: string): Promise<boolean> => {
  // 1. 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确');
  }

  // 2. 生成验证码 (6位数字)
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. 模拟发送 (真实环境请调用阿里云 SDK)
  console.log(`[Mock SMS] To: ${phone}, Code: ${code}`);
  
  // 存储验证码 (有效期 5 分钟)
  mockCodeStore[phone] = {
    code,
    expires: Date.now() + 5 * 60 * 1000
  };

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // --- 真实阿里云短信发送代码示例 (请在后端/Edge Function 中使用) ---
  /*
  import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
  import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';

  const config = new $OpenApi.Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    endpoint: 'dysmsapi.aliyuncs.com',
  });
  const client = new Dysmsapi20170525(config);
  
  await client.sendSms(new $Dysmsapi20170525.SendSmsRequest({
    phoneNumbers: phone,
    signName: '您的签名',
    templateCode: '您的模板ID',
    templateParam: JSON.stringify({ code }),
  }));
  */

  // 仅在开发模式下通过 Toast 提示验证码，方便测试
  uni.showToast({
    title: `验证码: ${code}`,
    icon: 'none',
    duration: 3000
  });

  return true;
};

/**
 * 验证短信验证码
 * @param phone 手机号
 * @param code 验证码
 * @returns boolean
 */
export const verifySmsCode = (phone: string, code: string): boolean => {
  const record = mockCodeStore[phone];
  
  if (!record) {
    return false;
  }

  if (Date.now() > record.expires) {
    delete mockCodeStore[phone];
    return false;
  }

  if (record.code === code) {
    delete mockCodeStore[phone]; // 验证成功后删除
    return true;
  }

  return false;
};
