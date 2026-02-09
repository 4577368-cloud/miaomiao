import { useUserStore } from '@/stores/user';

/**
 * 管理员权限验证中间件
 * 用于验证用户是否具有管理员权限
 */
export const adminAuthMiddleware = {
  /**
   * 检查管理员权限
   * 验证用户是否具有管理员权限
   * @returns {boolean} 是否具有管理员权限
   */
  checkAdminAuth(): boolean {
    return this.checkBasicAdminAuth();
  },

  /**
   * 验证管理员会话
   * 检查管理员会话是否有效
   */
  async validateAdminSession(): Promise<boolean> {
    const userStore = useUserStore();
    
    try {
      // 如果已经验证过是管理员，直接返回true
      if (userStore.isAdmin) {
        return true;
      }
      
      // 检查是否有管理员会话
      if (userStore.adminInfo) {
        // 验证会话有效性
        const result = await userStore.validateAdminSession();
        if (result.success) {
          return true;
        } else {
          // 会话无效，清除管理员信息
          userStore.clearAdminSession();
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('验证管理员会话失败:', error);
      return false;
    }
  },

  /**
   * 验证基础管理员权限（不验证会话）
   * @returns {boolean} 是否具有基础管理员权限
   */
  checkBasicAdminAuth(): boolean {
    const userStore = useUserStore();
    
    // 检查是否已登录
    if (!userStore.isLoggedIn) {
      uni.showModal({
        title: '未登录',
        content: '请先登录管理员账号',
        showCancel: false,
        success: () => {
          uni.redirectTo({
            url: '/pages/admin/login'
          });
        }
      });
      return false;
    }
    
    // 检查是否为管理员角色
    if (!userStore.isAdmin) {
      uni.showModal({
        title: '权限不足',
        content: '您没有管理员权限',
        showCancel: false,
        success: () => {
          uni.switchTab({
            url: '/pages/home/index'
          });
        }
      });
      return false;
    }
    
    return true;
  },

  /**
   * 执行管理员操作前的权限检查
   * @param operation 操作名称
   * @returns {Promise<boolean>} 是否允许执行操作
   */
  async checkAdminOperation(operation: string): Promise<boolean> {
    const userStore = useUserStore();
    
    // 首先检查基本权限
    if (!this.checkAdminAuth()) {
      return false;
    }
    
    // 验证会话有效性
    const sessionValid = await this.validateAdminSession();
    if (!sessionValid) {
      uni.showModal({
        title: '会话过期',
        content: '管理员会话已过期，请重新登录',
        showCancel: false,
        success: () => {
          uni.redirectTo({
            url: '/pages/admin/login'
          });
        }
      });
      return false;
    }
    
    // 记录管理员操作日志
    console.log(`管理员操作: ${operation}`, {
      adminId: userStore.adminInfo?.id,
      adminUsername: userStore.adminInfo?.username,
      operation,
      timestamp: new Date().toISOString()
    });
    
    return true;
  },

  /**
   * 获取管理员操作头信息
   * 用于API请求的身份验证
   */
  getAdminHeaders(): Record<string, string> {
    const userStore = useUserStore();
    
    if (!userStore.adminInfo) {
      return {};
    }
    
    return {
      'X-Admin-ID': userStore.adminInfo.id,
      'X-Admin-Username': userStore.adminInfo.username
    };
  }
};

export default adminAuthMiddleware;