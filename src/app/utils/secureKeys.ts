/**
 * API 密钥安全管理
 * 提供加密存储和安全访问 API 密钥的功能
 */

// ============ 类型定义 ============

export interface SecureAPIKey {
  id: string;
  provider: string;
  name: string;
  encryptedKey: string;
  createdAt: string;
  lastUsedAt?: string;
  maskedKey: string; // 用于显示的掩码版本
}

export interface APIKeyConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// ============ 加密工具 ============

/**
 * 简单的混淆加密（前端安全性有限，主要防止明文存储）
 * 注意：真正的安全需要后端处理
 */
class SimpleEncryption {
  private readonly salt: string;

  constructor() {
    // 使用设备指纹作为盐值
    this.salt = this.generateDeviceFingerprint();
  }

  private generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ];
    return this.hashString(components.join('|'));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 加密字符串
   */
  encrypt(plainText: string): string {
    if (!plainText) return '';
    
    const saltedText = this.salt + plainText;
    const encoded = btoa(encodeURIComponent(saltedText));
    
    // 简单的字符替换混淆
    return encoded
      .split('')
      .map((char, i) => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + (i % 5) + 1);
      })
      .join('');
  }

  /**
   * 解密字符串
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      // 反向字符替换
      const decoded = encryptedText
        .split('')
        .map((char, i) => {
          const code = char.charCodeAt(0);
          return String.fromCharCode(code - (i % 5) - 1);
        })
        .join('');
      
      const saltedText = decodeURIComponent(atob(decoded));
      
      // 移除盐值
      if (saltedText.startsWith(this.salt)) {
        return saltedText.slice(this.salt.length);
      }
      
      return '';
    } catch {
      return '';
    }
  }
}

const encryption = new SimpleEncryption();

// ============ 密钥管理器 ============

class SecureKeyManager {
  private readonly storageKey = 'secure-api-keys';
  private keys: Map<string, SecureAPIKey> = new Map();

  constructor() {
    this.loadKeys();
  }

  /**
   * 从存储加载密钥
   */
  private loadKeys(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, key]) => {
          this.keys.set(id, key as SecureAPIKey);
        });
      }
    } catch (e) {
      console.warn('Failed to load API keys:', e);
    }
  }

  /**
   * 保存密钥到存储
   */
  private saveKeys(): void {
    try {
      const data = Object.fromEntries(this.keys);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save API keys:', e);
    }
  }

  /**
   * 生成掩码密钥（用于显示）
   */
  private maskKey(key: string): string {
    if (key.length <= 8) {
      return '*'.repeat(key.length);
    }
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    const middle = '*'.repeat(Math.min(key.length - 8, 20));
    return `${prefix}${middle}${suffix}`;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 存储 API 密钥
   */
  storeKey(provider: string, apiKey: string, name?: string): string {
    const id = this.generateId();
    const secureKey: SecureAPIKey = {
      id,
      provider,
      name: name || provider,
      encryptedKey: encryption.encrypt(apiKey),
      createdAt: new Date().toISOString(),
      maskedKey: this.maskKey(apiKey),
    };

    this.keys.set(id, secureKey);
    this.saveKeys();

    return id;
  }

  /**
   * 获取解密后的 API 密钥
   */
  getKey(id: string): string | null {
    const secureKey = this.keys.get(id);
    if (!secureKey) return null;

    // 更新最后使用时间
    secureKey.lastUsedAt = new Date().toISOString();
    this.saveKeys();

    return encryption.decrypt(secureKey.encryptedKey);
  }

  /**
   * 通过提供商获取密钥
   */
  getKeyByProvider(provider: string): string | null {
    for (const [id, key] of this.keys) {
      if (key.provider === provider) {
        return this.getKey(id);
      }
    }
    return null;
  }

  /**
   * 获取所有密钥信息（不包含实际密钥）
   */
  getAllKeys(): SecureAPIKey[] {
    return Array.from(this.keys.values()).map(key => ({
      ...key,
      encryptedKey: '[ENCRYPTED]', // 不暴露加密后的密钥
    }));
  }

  /**
   * 检查是否有指定提供商的密钥
   */
  hasKey(provider: string): boolean {
    for (const key of this.keys.values()) {
      if (key.provider === provider) {
        return true;
      }
    }
    return false;
  }

  /**
   * 更新密钥
   */
  updateKey(id: string, newApiKey: string): boolean {
    const secureKey = this.keys.get(id);
    if (!secureKey) return false;

    secureKey.encryptedKey = encryption.encrypt(newApiKey);
    secureKey.maskedKey = this.maskKey(newApiKey);
    this.saveKeys();

    return true;
  }

  /**
   * 删除密钥
   */
  deleteKey(id: string): boolean {
    const result = this.keys.delete(id);
    if (result) {
      this.saveKeys();
    }
    return result;
  }

  /**
   * 删除指定提供商的所有密钥
   */
  deleteKeysByProvider(provider: string): number {
    let count = 0;
    for (const [id, key] of this.keys) {
      if (key.provider === provider) {
        this.keys.delete(id);
        count++;
      }
    }
    if (count > 0) {
      this.saveKeys();
    }
    return count;
  }

  /**
   * 清除所有密钥
   */
  clearAllKeys(): void {
    this.keys.clear();
    localStorage.removeItem(this.storageKey);
  }

  /**
   * 验证密钥格式
   */
  validateKeyFormat(provider: string, apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: 'API 密钥不能为空' };
    }

    // 根据提供商验证格式
    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API 密钥应以 sk- 开头' };
        }
        if (apiKey.length < 40) {
          return { valid: false, error: 'OpenAI API 密钥长度不正确' };
        }
        break;

      case 'deepseek':
        if (apiKey.length < 20) {
          return { valid: false, error: 'DeepSeek API 密钥长度不正确' };
        }
        break;

      case 'doubao':
        if (apiKey.length < 10) {
          return { valid: false, error: '豆包 API 密钥长度不正确' };
        }
        break;

      default:
        if (apiKey.length < 10) {
          return { valid: false, error: 'API 密钥长度过短' };
        }
    }

    return { valid: true };
  }
}

// 导出单例实例
export const secureKeyManager = new SecureKeyManager();

// ============ 安全配置管理 ============

interface SecureConfig {
  provider: string;
  keyId: string;
  baseUrl?: string;
  model?: string;
}

class SecureConfigManager {
  private readonly storageKey = 'secure-api-configs';
  private configs: Map<string, SecureConfig> = new Map();

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([provider, config]) => {
          this.configs.set(provider, config as SecureConfig);
        });
      }
    } catch (e) {
      console.warn('Failed to load API configs:', e);
    }
  }

  private saveConfigs(): void {
    try {
      const data = Object.fromEntries(this.configs);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save API configs:', e);
    }
  }

  /**
   * 设置 API 配置
   */
  setConfig(config: APIKeyConfig): string {
    // 存储密钥并获取 ID
    const keyId = secureKeyManager.storeKey(config.provider, config.apiKey);

    const secureConfig: SecureConfig = {
      provider: config.provider,
      keyId,
      baseUrl: config.baseUrl,
      model: config.model,
    };

    this.configs.set(config.provider, secureConfig);
    this.saveConfigs();

    return keyId;
  }

  /**
   * 获取完整配置（包含解密的密钥）
   */
  getConfig(provider: string): APIKeyConfig | null {
    const config = this.configs.get(provider);
    if (!config) return null;

    const apiKey = secureKeyManager.getKey(config.keyId);
    if (!apiKey) return null;

    return {
      provider: config.provider,
      apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    };
  }

  /**
   * 获取配置信息（不包含密钥）
   */
  getConfigInfo(provider: string): Omit<SecureConfig, 'keyId'> | null {
    const config = this.configs.get(provider);
    if (!config) return null;

    return {
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
    };
  }

  /**
   * 检查是否有配置
   */
  hasConfig(provider: string): boolean {
    return this.configs.has(provider);
  }

  /**
   * 删除配置
   */
  deleteConfig(provider: string): boolean {
    const config = this.configs.get(provider);
    if (config) {
      secureKeyManager.deleteKey(config.keyId);
      this.configs.delete(provider);
      this.saveConfigs();
      return true;
    }
    return false;
  }

  /**
   * 获取所有已配置的提供商
   */
  getConfiguredProviders(): string[] {
    return Array.from(this.configs.keys());
  }
}

export const secureConfigManager = new SecureConfigManager();

// ============ 导出 ============

export default {
  keyManager: secureKeyManager,
  configManager: secureConfigManager,
};
