// 管理员系统测试脚本
// 用于验证管理员登录和基本功能

import { AdminAPI } from '@/utils/admin-api';

async function testAdminSystem() {
  console.log('🧪 开始测试管理员系统...');
  
  try {
    // 1. 测试管理员登录
    console.log('1. 测试管理员登录...');
    const loginResult = await AdminAPI.validateAdmin('admin', 'admin123');
    
    if (loginResult.success && loginResult.data) {
      console.log('✅ 管理员登录成功:', {
        username: loginResult.data.username,
        role: loginResult.data.role,
        permissions: loginResult.data.permissions
      });
    } else {
      console.log('❌ 管理员登录失败:', loginResult.error);
      return;
    }
    
    // 2. 测试获取用户列表
    console.log('2. 测试获取用户列表...');
    const usersResult = await AdminAPI.getUsers();
    
    if (usersResult.success) {
      console.log('✅ 获取用户列表成功，用户数:', usersResult.data?.length || 0);
      if (usersResult.data && usersResult.data.length > 0) {
        console.log('   第一个用户:', usersResult.data[0].nickname);
      }
    } else {
      console.log('❌ 获取用户列表失败:', usersResult.error);
    }
    
    // 3. 测试获取订单列表
    console.log('3. 测试获取订单列表...');
    const ordersResult = await AdminAPI.getOrders();
    
    if (ordersResult.success) {
      console.log('✅ 获取订单列表成功，订单数:', ordersResult.data?.length || 0);
    } else {
      console.log('❌ 获取订单列表失败:', ordersResult.error);
    }
    
    // 4. 测试获取公告列表
    console.log('4. 测试获取公告列表...');
    const announcementsResult = await AdminAPI.getAnnouncements();
    
    if (announcementsResult.success) {
      console.log('✅ 获取公告列表成功，公告数:', announcementsResult.data?.length || 0);
    } else {
      console.log('❌ 获取公告列表失败:', announcementsResult.error);
    }
    
    // 5. 测试获取统计数据
    console.log('5. 测试获取统计数据...');
    const statsResult = await AdminAPI.getStats();
    
    if (statsResult.success) {
      console.log('✅ 获取统计数据成功:', statsResult.data);
    } else {
      console.log('❌ 获取统计数据失败:', statsResult.error);
    }
    
    console.log('🎉 管理员系统测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 导出测试函数
export { testAdminSystem };

// 如果直接运行此脚本，则执行测试
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
  testAdminSystem();
}