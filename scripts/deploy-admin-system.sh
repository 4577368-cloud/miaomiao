#!/bin/bash

# 管理员系统部署脚本
# 一键部署Supabase管理员系统

set -e

echo "🚀 开始部署管理员系统..."

# 检查是否提供了Supabase项目URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ 请设置SUPABASE_URL环境变量"
    echo "例如: export SUPABASE_URL=https://your-project.supabase.co"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ 请设置SUPABASE_SERVICE_KEY环境变量"
    echo "在Supabase控制台 -> Settings -> API -> service_role key"
    exit 1
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：执行SQL文件
execute_sql() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}正在执行: $description${NC}"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ 文件不存在: $file${NC}"
        return 1
    fi
    
    # 使用curl执行SQL
    response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/sql" \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d @- < "$file")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $description 执行成功${NC}"
    else
        echo -e "${RED}❌ $description 执行失败${NC}"
        echo "错误信息: $response"
        return 1
    fi
}

# 函数：测试管理员登录
test_admin_login() {
    echo -e "${YELLOW}测试管理员登录...${NC}"
    
    response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/admin_login" \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"p_username": "admin", "p_password": "admin123"}')
    
    if [ $? -eq 0 ] && [ "$response" != "null" ]; then
        echo -e "${GREEN}✅ 管理员登录测试成功${NC}"
    else
        echo -e "${RED}❌ 管理员登录测试失败${NC}"
        echo "响应: $response"
        return 1
    fi
}

# 主部署流程
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  管理员系统部署脚本 v1.0${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    
    # 1. 检查依赖
    echo -e "${YELLOW}1. 检查依赖...${NC}"
    command -v curl >/dev/null 2>&1 || { echo -e "${RED}❌ curl未安装${NC}"; exit 1; }
    command -v jq >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  jq未安装，某些功能可能受限${NC}"; }
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
    echo
    
    # 2. 部署基础结构
    echo -e "${YELLOW}2. 部署基础数据库结构...${NC}"
    execute_sql "supabase/schema.sql" "基础表结构"
    echo
    
    # 3. 部署管理员权限设置
    echo -e "${YELLOW}3. 部署管理员权限设置...${NC}"
    execute_sql "supabase/migrations/20260208_admin_setup.sql" "管理员权限设置"
    execute_sql "supabase/migrations/20260208_admin_functions.sql" "管理员功能函数"
    execute_sql "supabase/migrations/20260208_fix_admin_rls.sql" "权限修复"
    echo
    
    # 4. 部署最终管理员系统
    echo -e "${YELLOW}4. 部署最终管理员系统...${NC}"
    execute_sql "supabase/final_admin_system.sql" "完整管理员系统"
    echo
    
    # 5. 测试部署
    echo -e "${YELLOW}5. 测试部署结果...${NC}"
    test_admin_login
    echo
    
    # 6. 显示结果
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ 管理员系统部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "${YELLOW}默认管理员账号:${NC}"
    echo -e "  用户名: admin"
    echo -e "  密码: admin123"
    echo -e "  邮箱: admin@miaomiao.com"
    echo
    echo -e "${YELLOW}前端访问地址:${NC}"
    echo -e "  https://miaomiao-blue.vercel.app/#/admin"
    echo
    echo -e "${YELLOW}下一步:${NC}"
    echo -e "  1. 访问管理员后台"
    echo -e "  2. 使用默认账号登录"
    echo -e "  3. 修改默认密码"
    echo -e "  4. 配置其他管理员账号"
    echo
    echo -e "${GREEN}部署成功！🎉${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中发生错误${NC}"; exit 1' ERR

# 运行主函数
main