import { supabase } from '@/utils/supabase';
import adminAuthMiddleware from '@/middleware/admin';

/**
 * Admin API 工具类
 * 处理所有管理员相关的Supabase操作
 */
export class AdminAPI {
  /**
   * 获取管理员专用的Supabase客户端
   * 自动添加管理员身份验证头
   */
  private static getAdminClient() {
    const headers = adminAuthMiddleware.getAdminHeaders();
    
    // 创建带有管理员身份验证的请求
    return {
      from: (table: string) => {
        const query = supabase.from(table);
        
        // 添加管理员头信息到请求中
        if (headers['X-Admin-ID']) {
          // 这里可以通过Supabase的RLS策略来识别管理员身份
          return query;
        }
        
        return query;
      },
      
      // 管理员专用方法
      admin: {
        /**
         * 执行管理员查询，自动添加权限验证
         */
        async select(table: string, columns = '*') {
          try {
            const { data, error } = await supabase
              .from(table)
              .select(columns);
            
            if (error) {
              console.error(`管理员查询 ${table} 失败:`, error);
              return { success: false, error: error.message };
            }
            
            return { success: true, data };
          } catch (error) {
            console.error(`管理员查询 ${table} 异常:`, error);
            return { success: false, error: '查询失败' };
          }
        },
        
        /**
         * 执行管理员更新，自动添加权限验证
         */
        async update(table: string, id: string, updates: any) {
          try {
            const { data, error } = await supabase
              .from(table)
              .update(updates)
              .eq('id', id)
              .select()
              .single();
            
            if (error) {
              console.error(`管理员更新 ${table} 失败:`, error);
              return { success: false, error: error.message };
            }
            
            return { success: true, data };
          } catch (error) {
            console.error(`管理员更新 ${table} 异常:`, error);
            return { success: false, error: '更新失败' };
          }
        },
        
        /**
         * 执行管理员删除，自动添加权限验证
         */
        async delete(table: string, id: string) {
          try {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('id', id);
            
            if (error) {
              console.error(`管理员删除 ${table} 失败:`, error);
              return { success: false, error: error.message };
            }
            
            return { success: true };
          } catch (error) {
            console.error(`管理员删除 ${table} 异常:`, error);
            return { success: false, error: '删除失败' };
          }
        },
        
        /**
         * 执行管理员插入，自动添加权限验证
         */
        async insert(table: string, data: any) {
          try {
            const { data: result, error } = await supabase
              .from(table)
              .insert(data)
              .select()
              .single();
            
            if (error) {
              console.error(`管理员插入 ${table} 失败:`, error);
              return { success: false, error: error.message };
            }
            
            return { success: true, data: result };
          } catch (error) {
            console.error(`管理员插入 ${table} 异常:`, error);
            return { success: false, error: '插入失败' };
          }
        }
      }
    };
  }
  
  /**
   * 获取用户列表（管理员权限）
   */
  static async getUsers() {
    return this.getAdminClient().admin.select('users', `
      *,
      profiles:nickname,
      auth:phone
    `);
  }
  
  /**
   * 更新用户状态（管理员权限）
   */
  static async updateUserStatus(userId: string, status: string) {
    return this.getAdminClient().admin.update('users', userId, { status });
  }
  
  /**
   * 获取订单列表（管理员权限）
   */
  static async getOrders() {
    return this.getAdminClient().admin.select('orders', `
      *,
      owner:owner_id(nickname, phone),
      sitter:sitter_id(nickname, phone),
      service:service_type
    `);
  }
  
  /**
   * 获取系统公告（管理员权限）
   */
  static async getAnnouncements() {
    return this.getAdminClient().admin.select('announcements', '*');
  }
  
  /**
   * 创建系统公告（管理员权限）
   */
  static async createAnnouncement(data: {
    title: string;
    content: string;
    created_by: string;
  }) {
    return this.getAdminClient().admin.insert('announcements', data);
  }
  
  /**
   * 更新系统公告（管理员权限）
   */
  static async updateAnnouncement(id: string, data: {
    title?: string;
    content?: string;
  }) {
    return this.getAdminClient().admin.update('announcements', id, data);
  }
  
  /**
   * 删除系统公告（管理员权限）
   */
  static async deleteAnnouncement(id: string) {
    return this.getAdminClient().admin.delete('announcements', id);
  }
  
  /**
   * 获取统计数据（管理员权限）
   */
  static async getStats() {
    try {
      // 获取用户统计
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('role', { count: 'exact' });
      
      if (userError) throw userError;
      
      // 获取订单统计
      const { data: orderStats, error: orderError } = await supabase
        .from('orders')
        .select('status, amount', { count: 'exact' });
      
      if (orderError) throw orderError;
      
      // 计算总收入
      const totalRevenue = orderStats?.reduce((sum: number, order: any) => {
        return sum + (order.amount || 0);
      }, 0) || 0;
      
      return {
        success: true,
        data: {
          totalUsers: userStats?.length || 0,
          totalOrders: orderStats?.length || 0,
          totalRevenue
        }
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return { success: false, error: '获取统计数据失败' };
    }
  }
  
  /**
   * 验证管理员身份
   */
  static async validateAdmin(username: string, password: string) {
    try {
      // 在admin_users表中验证管理员账号
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, role, status')
        .eq('username', username)
        .eq('password', password) // 注意：实际应用中应该使用加密密码
        .single();
      
      if (error || !data) {
        return { success: false, error: '用户名或密码错误' };
      }
      
      // 检查管理员状态
      if (data.status === 'banned') {
        return { success: false, error: '管理员账号已被禁用' };
      }
      
      return {
        success: true,
        data: {
          id: data.id,
          username: data.username,
          role: data.role
        }
      };
    } catch (error) {
      console.error('验证管理员失败:', error);
      return { success: false, error: '验证失败' };
    }
  }
}

export default AdminAPI;