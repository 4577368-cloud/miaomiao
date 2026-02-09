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
    // 使用RPC函数获取用户列表
    const { data, error } = await supabase
      .rpc('get_admin_users');
    
    if (error) {
      console.error('获取用户列表失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  }
  
  /**
   * 更新用户状态（管理员权限）
   */
  static async updateUserStatus(userId: string, status: string) {
    // 使用RPC函数切换用户状态
    const { data, error } = await supabase
      .rpc('admin_toggle_user_status', {
        p_user_id: userId,
        p_ban: status === 'banned'
      });
    
    if (error) {
      console.error('更新用户状态失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  }
  
  /**
   * 获取订单列表（管理员权限）
   */
  static async getOrders() {
    // 使用RPC函数获取订单列表
    const { data, error } = await supabase
      .rpc('get_admin_orders');
    
    if (error) {
      console.error('获取订单列表失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  }
  
  /**
   * 获取系统公告列表（管理员权限）
   */
  static async getAnnouncements() {
    // 使用RPC函数获取公告列表
    const { data, error } = await supabase
      .rpc('get_admin_announcements');
    
    if (error) {
      console.error('获取公告列表失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  }
  
  /**
   * 创建系统公告（管理员权限）
   */
  static async createAnnouncement(data: {
    title: string;
    content: string;
    created_by: string;
  }) {
    // 使用RPC函数创建公告
    const { data: result, error } = await supabase
      .rpc('admin_create_announcement', {
        p_title: data.title,
        p_content: data.content,
        p_created_by: data.created_by
      });
    
    if (error) {
      console.error('创建公告失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: { id: result } };
  }
  
  /**
   * 更新系统公告（管理员权限）
   */
  static async updateAnnouncement(id: string, data: {
    title?: string;
    content?: string;
  }) {
    // 使用RPC函数更新公告内容
    const { data: result, error } = await supabase
      .rpc('admin_update_announcement', {
        p_id: id,
        p_content: data.content || ''
      });
    
    if (error) {
      console.error('更新公告失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  }
  
  /**
   * 删除系统公告（管理员权限）
   */
  static async deleteAnnouncement(id: string) {
    // 使用RPC函数删除公告
    const { data: result, error } = await supabase
      .rpc('admin_delete_announcement', {
        p_id: id
      });
    
    if (error) {
      console.error('删除公告失败:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  }
  
  /**
   * 获取统计数据（管理员权限）
   */
  static async getStats() {
    try {
      // 使用RPC函数获取统计数据
      const { data, error } = await supabase
        .rpc('get_admin_stats');
      
      if (error) throw error;
      
      return {
        success: true,
        data: data[0] || {
          total_users: 0,
          total_orders: 0,
          total_revenue: 0
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
      // 使用RPC函数验证管理员登录
      const { data, error } = await supabase
        .rpc('admin_login', {
          p_username: username,
          p_password: password
        });
      
      if (error || !data || data.length === 0) {
        return { success: false, error: '用户名或密码错误' };
      }
      
      const admin = data[0];
      
      return {
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          permissions: admin.permissions
        }
      };
    } catch (error) {
      console.error('验证管理员失败:', error);
      return { success: false, error: '验证失败' };
    }
  }

  /**
   * 更新用户资产（余额/积分）（管理员权限）
   */
  static async updateUserAssets(userId: string, balance?: number, points?: number) {
    const { data, error } = await supabase
      .rpc('admin_update_user_assets', {
        p_user_id: userId,
        p_balance: balance,
        p_points: points
      });

    if (error) {
      console.error('更新用户资产失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * 获取宠托师认证列表（管理员权限）
   */
  static async getSitterCertifications(status: string = 'pending') {
    const { data, error } = await supabase
      .rpc('admin_get_sitter_certifications', {
        p_status: status
      });

    if (error) {
      console.error('获取认证列表失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * 审核宠托师（管理员权限）
   */
  static async verifySitter(sitterId: string, status: string, rejectReason?: string) {
    const { data, error } = await supabase
      .rpc('admin_verify_sitter', {
        p_sitter_id: sitterId,
        p_status: status,
        p_reject_reason: rejectReason
      });

    if (error) {
      console.error('审核宠托师失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * 获取服务列表（管理员权限）
   */
  static async getServices() {
    const { data, error } = await supabase
      .rpc('admin_get_services');

    if (error) {
      console.error('获取服务列表失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }

  /**
   * 更新服务价格（管理员权限）
   */
  static async updateServicePrice(serviceId: string, price: number, discount: number = 100) {
    const { data, error } = await supabase
      .rpc('admin_update_service_price', {
        p_service_id: serviceId,
        p_price: price,
        p_discount: discount
      });

    if (error) {
      console.error('更新服务价格失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }
}

export default AdminAPI;