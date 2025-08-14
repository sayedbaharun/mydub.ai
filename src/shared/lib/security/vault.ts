import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
}

export class SecretVault {
  private algorithm = 'aes-256-gcm';
  private iterations = 100000;
  private keyLength = 32;
  
  /**
   * Derives a key from the master password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha256');
  }

  /**
   * Encrypts sensitive data using AES-256-GCM
   */
  encrypt(text: string, masterPassword: string): EncryptedData {
    const salt = randomBytes(16);
    const key = this.deriveKey(masterPassword, salt);
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypts data encrypted with encrypt()
   */
  decrypt(encryptedData: EncryptedData, masterPassword: string): string {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = this.deriveKey(masterPassword, salt);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Validates encrypted data structure
   */
  isValidEncryptedData(data: any): data is EncryptedData {
    return (
      data &&
      typeof data.encrypted === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.salt === 'string' &&
      typeof data.tag === 'string'
    );
  }
}

/**
 * Secure storage for API keys and secrets
 */
export class SecureApiKeyStorage {
  private vault: SecretVault;
  private storageKey = 'mydub_encrypted_keys';
  
  constructor() {
    this.vault = new SecretVault();
  }

  /**
   * Store an API key securely
   */
  async storeApiKey(keyName: string, apiKey: string, masterPassword: string): Promise<void> {
    const encryptedData = this.vault.encrypt(apiKey, masterPassword);
    
    // In production, store in secure backend/database
    // For now, using localStorage with encryption
    const storage = this.getStorage();
    storage[keyName] = encryptedData;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    }
  }

  /**
   * Retrieve a decrypted API key
   */
  async getApiKey(keyName: string, masterPassword: string): Promise<string | null> {
    const storage = this.getStorage();
    const encryptedData = storage[keyName];
    
    if (!encryptedData || !this.vault.isValidEncryptedData(encryptedData)) {
      return null;
    }
    
    try {
      return this.vault.decrypt(encryptedData, masterPassword);
    } catch (error) {
      // Decryption failed
      return null;
    }
  }

  /**
   * Remove an API key
   */
  async removeApiKey(keyName: string): Promise<void> {
    const storage = this.getStorage();
    delete storage[keyName];
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    }
  }

  /**
   * List all stored key names (not the actual keys)
   */
  listKeyNames(): string[] {
    const storage = this.getStorage();
    return Object.keys(storage);
  }

  /**
   * Clear all stored keys
   */
  clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  private getStorage(): Record<string, EncryptedData> {
    if (typeof window === 'undefined') {
      return {};
    }
    
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }
}

/**
 * Environment-specific key management
 */
export class EnvironmentKeyManager {
  private static instance: EnvironmentKeyManager;
  private keyStorage: SecureApiKeyStorage;
  private cachedKeys: Map<string, string> = new Map();
  
  private constructor() {
    this.keyStorage = new SecureApiKeyStorage();
  }

  static getInstance(): EnvironmentKeyManager {
    if (!EnvironmentKeyManager.instance) {
      EnvironmentKeyManager.instance = new EnvironmentKeyManager();
    }
    return EnvironmentKeyManager.instance;
  }

  /**
   * Initialize with master password (should be from secure source)
   */
  async initialize(masterPassword: string): Promise<void> {
    // In production, master password should come from:
    // - Environment variable on server
    // - User input on client
    // - Hardware security module (HSM)
    // - Key management service (KMS)
    
    // Pre-load frequently used keys into memory
    const keyNames = this.keyStorage.listKeyNames();
    for (const keyName of keyNames) {
      const key = await this.keyStorage.getApiKey(keyName, masterPassword);
      if (key) {
        this.cachedKeys.set(keyName, key);
      }
    }
  }

  /**
   * Get an API key with fallback to environment variable
   */
  async getKey(keyName: string, masterPassword?: string): Promise<string | undefined> {
    // Check cache first
    if (this.cachedKeys.has(keyName)) {
      return this.cachedKeys.get(keyName);
    }

    // Try to get from secure storage
    if (masterPassword) {
      const key = await this.keyStorage.getApiKey(keyName, masterPassword);
      if (key) {
        this.cachedKeys.set(keyName, key);
        return key;
      }
    }

    // Fallback to environment variable (for backward compatibility)
    const envKey = `VITE_${keyName.toUpperCase().replace(/-/g, '_')}`;
    return import.meta.env[envKey];
  }

  /**
   * Rotate an API key
   */
  async rotateKey(keyName: string, newKey: string, masterPassword: string): Promise<void> {
    await this.keyStorage.storeApiKey(keyName, newKey, masterPassword);
    this.cachedKeys.set(keyName, newKey);
  }

  /**
   * Clear cached keys from memory
   */
  clearCache(): void {
    this.cachedKeys.clear();
  }
}

// Export singleton instance
export const keyManager = EnvironmentKeyManager.getInstance();