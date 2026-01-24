# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 声明构建参数（从docker-compose传入）
ARG VITE_BASE_PATH=/
ARG VITE_ENABLE_PERFORMANCE_MONITORING=true
ARG VITE_ENABLE_ERROR_REPORTING=false

# 将构建参数转换为环境变量（Vite构建时会使用）
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_ENABLE_PERFORMANCE_MONITORING=$VITE_ENABLE_PERFORMANCE_MONITORING
ENV VITE_ENABLE_ERROR_REPORTING=$VITE_ENABLE_ERROR_REPORTING

# 注意：API密钥应该在运行时通过环境变量注入，不要在构建时硬编码
# 如需使用API密钥，请在本地创建 .env.local 文件

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
