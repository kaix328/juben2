# 🐳 Docker 部署指南

## 📋 快速开始

### 1. 准备环境变量

创建 `.env.production` 文件（或直接设置环境变量）：

```bash
# 复制环境变量模板
cat > .env.production << EOF
VITE_BASE_PATH=/
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_VOLCENGINE_API_KEY=your_volcengine_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_QIANWEN_API_KEY=your_qianwen_api_key_here
EOF
```

### 2. 构建并启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 访问应用

打开浏览器访问: http://localhost

---

## 🔧 详细配置

### 环境变量配置

#### 方式1: 使用 .env.production 文件（推荐）

```env
# .env.production
VITE_BASE_PATH=/
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
VITE_VOLCENGINE_API_KEY=your_key_here
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
VITE_QIANWEN_API_KEY=your_key_here
```

#### 方式2: 直接在命令行传入

```bash
VITE_DEEPSEEK_API_KEY=sk-xxx docker-compose up -d
```

#### 方式3: 修改 docker-compose.yml

```yaml
services:
  juben:
    environment:
      - VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 端口配置

默认使用80端口，如需修改：

```yaml
# docker-compose.yml
ports:
  - "8080:80"  # 将容器的80端口映射到主机的8080端口
```

访问地址变为: http://localhost:8080

### 资源限制

根据服务器配置调整：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # 最多使用2个CPU核心
      memory: 2G     # 最多使用2GB内存
    reservations:
      cpus: '1'      # 至少保留1个CPU核心
      memory: 1G     # 至少保留1GB内存
```

---

## 📊 常用命令

### 基础操作

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看实时日志（最后100行）
docker-compose logs -f --tail=100
```

### 构建相关

```bash
# 重新构建镜像
docker-compose build --no-cache

# 构建并启动
docker-compose up -d --build

# 仅构建不启动
docker-compose build
```

### 维护操作

```bash
# 进入容器
docker-compose exec juben sh

# 查看容器资源使用
docker stats

# 清理未使用的镜像
docker image prune -a

# 清理所有未使用的资源
docker system prune -a
```

---

## 🔍 健康检查

### 查看健康状态

```bash
# 查看容器健康状态
docker-compose ps

# 输出示例:
# NAME    STATUS                    PORTS
# juben   Up 2 minutes (healthy)    0.0.0.0:80->80/tcp
```

### 手动测试健康检查

```bash
# 进入容器
docker-compose exec juben sh

# 执行健康检查命令
wget --quiet --tries=1 --spider http://localhost/

# 检查退出码
echo $?  # 0表示成功
```

### 自定义健康检查

修改 `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s      # 每30秒检查一次
  timeout: 10s       # 超时时间10秒
  retries: 3         # 失败3次后标记为不健康
  start_period: 40s  # 启动后40秒才开始检查
```

---

## 📁 数据持久化

### 日志持久化

日志自动保存到 `./logs` 目录：

```bash
# 查看Nginx访问日志
tail -f logs/access.log

# 查看Nginx错误日志
tail -f logs/error.log
```

### 数据持久化（可选）

如需持久化应用数据，取消注释：

```yaml
volumes:
  - ./data:/app/data
```

---

## 🚀 生产环境部署

### 1. 使用反向代理（推荐）

#### Nginx反向代理

```nginx
# /etc/nginx/sites-available/juben
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy反向代理

```caddyfile
# Caddyfile
your-domain.com {
    reverse_proxy localhost:80
}
```

### 2. HTTPS配置

#### 使用Let's Encrypt

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

#### 修改docker-compose.yml

```yaml
services:
  juben:
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx-https.conf:/etc/nginx/conf.d/default.conf
```

### 3. 环境变量安全

#### 使用Docker Secrets

```yaml
# docker-compose.yml
version: '3.8'

services:
  juben:
    secrets:
      - deepseek_api_key
    environment:
      - VITE_DEEPSEEK_API_KEY_FILE=/run/secrets/deepseek_api_key

secrets:
  deepseek_api_key:
    file: ./secrets/deepseek_api_key.txt
```

创建密钥文件：

```bash
mkdir -p secrets
echo "sk-xxxxxxxxxxxxxxxx" > secrets/deepseek_api_key.txt
chmod 600 secrets/deepseek_api_key.txt
```

---

## 🔧 故障排查

### 问题1: 容器无法启动

```bash
# 查看详细日志
docker-compose logs juben

# 检查配置文件
docker-compose config

# 检查端口占用
netstat -tulpn | grep :80
```

### 问题2: 健康检查失败

```bash
# 进入容器检查
docker-compose exec juben sh

# 测试Nginx
wget http://localhost/

# 查看Nginx状态
ps aux | grep nginx
```

### 问题3: 环境变量未生效

```bash
# 检查构建参数
docker-compose config

# 重新构建（不使用缓存）
docker-compose build --no-cache

# 检查容器内的环境变量
docker-compose exec juben env | grep VITE
```

### 问题4: 内存不足

```bash
# 查看资源使用
docker stats

# 调整内存限制
# 编辑 docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G  # 增加到4GB
```

### 问题5: 构建失败

```bash
# 清理Docker缓存
docker builder prune -a

# 清理所有未使用的资源
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

---

## 📊 监控和日志

### 实时监控

```bash
# 查看资源使用
docker stats juben

# 查看实时日志
docker-compose logs -f --tail=100

# 查看特定时间的日志
docker-compose logs --since 30m
```

### 日志管理

```bash
# 限制日志大小
# docker-compose.yml
services:
  juben:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 集成监控工具

#### Prometheus + Grafana

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

---

## 🔄 更新和回滚

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose build

# 3. 停止旧容器
docker-compose down

# 4. 启动新容器
docker-compose up -d

# 5. 验证
docker-compose ps
docker-compose logs -f
```

### 零停机更新

```bash
# 使用 docker-compose 的滚动更新
docker-compose up -d --no-deps --build juben
```

### 回滚

```bash
# 1. 切换到旧版本
git checkout <old-commit>

# 2. 重新构建
docker-compose build

# 3. 重启
docker-compose up -d
```

---

## 📋 部署检查清单

### 部署前

- [ ] 配置所有必需的环境变量
- [ ] 检查 `.env.production` 文件
- [ ] 确认端口未被占用
- [ ] 检查磁盘空间（至少5GB）
- [ ] 检查内存（至少2GB可用）

### 部署中

- [ ] 构建镜像成功
- [ ] 容器启动成功
- [ ] 健康检查通过
- [ ] 日志无错误

### 部署后

- [ ] 访问应用正常
- [ ] API功能正常
- [ ] 创建项目测试
- [ ] AI生成测试
- [ ] 导出功能测试
- [ ] 性能测试

---

## 🆘 获取帮助

### 查看文档

- [环境变量配置](./ENV_CONFIG_GUIDE.md)
- [快速开始](./QUICK_START.md)
- [项目README](./README.md)

### 常见问题

1. **端口被占用**: 修改 `docker-compose.yml` 中的端口映射
2. **内存不足**: 调整资源限制或升级服务器
3. **构建失败**: 清理Docker缓存后重试
4. **API密钥无效**: 检查环境变量配置

### 联系支持

- GitHub Issues: [项目地址]
- 文档: [在线文档]

---

**最后更新**: 2026-01-19  
**Docker版本要求**: >= 20.10  
**Docker Compose版本**: >= 2.0
