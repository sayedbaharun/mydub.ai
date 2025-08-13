#!/usr/bin/env npx tsx

/**
 * Database Backup Script for MyDub.AI
 * 
 * This script creates comprehensive backups of the Supabase database,
 * including schema and data, with retention management and encryption.
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

interface BackupConfig {
  supabaseUrl: string
  serviceRoleKey: string
  backupDir: string
  retentionDays: number
  encryptionEnabled: boolean
  compressionEnabled: boolean
  notificationWebhook?: string
}

interface BackupMetadata {
  timestamp: string
  version: string
  size: number
  checksum: string
  tables: string[]
  encrypted: boolean
  compressed: boolean
}

class DatabaseBackupManager {
  private config: BackupConfig
  private supabase: ReturnType<typeof createClient>
  private backupTimestamp: string

  constructor(config: BackupConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey)
    this.backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
  }

  async createBackup(): Promise<void> {
    console.log('🚀 Starting database backup process...')
    
    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory()
      
      // Get database schema and data
      const backupData = await this.exportDatabaseData()
      
      // Create backup file
      const backupPath = await this.createBackupFile(backupData)
      
      // Encrypt if enabled
      const finalPath = this.config.encryptionEnabled 
        ? await this.encryptBackup(backupPath)
        : backupPath
      
      // Compress if enabled
      const compressedPath = this.config.compressionEnabled
        ? await this.compressBackup(finalPath)
        : finalPath
      
      // Generate metadata
      const metadata = await this.generateMetadata(compressedPath, backupData.tables)
      await this.saveMetadata(metadata)
      
      // Cleanup old backups
      await this.cleanupOldBackups()
      
      // Send notification
      await this.sendNotification('success', {
        backupPath: compressedPath,
        size: metadata.size,
        tables: metadata.tables.length
      })
      
      console.log(`✅ Backup completed successfully: ${compressedPath}`)
      
    } catch (error) {
      console.error('❌ Backup failed:', error)
      await this.sendNotification('error', { error: error.message })
      throw error
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.config.backupDir)
    } catch {
      await fs.mkdir(this.config.backupDir, { recursive: true })
      console.log(`📁 Created backup directory: ${this.config.backupDir}`)
    }
  }

  private async exportDatabaseData(): Promise<{ schema: any, tables: string[], data: Record<string, any[]> }> {
    console.log('📊 Exporting database schema and data...')
    
    // Get all tables
    const { data: tables, error: tablesError } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'spatial_ref_sys') // Exclude PostGIS system table
    
    if (tablesError) {
      throw new Error(`Failed to get tables: ${tablesError.message}`)
    }
    
    const tableNames = tables.map(t => t.table_name)
    console.log(`📋 Found ${tableNames.length} tables: ${tableNames.join(', ')}`)
    
    // Export data from each table
    const data: Record<string, any[]> = {}
    
    for (const tableName of tableNames) {
      try {
        console.log(`📥 Exporting data from ${tableName}...`)
        
        const { data: tableData, error } = await this.supabase
          .from(tableName)
          .select('*')
        
        if (error) {
          console.warn(`⚠️  Failed to export ${tableName}: ${error.message}`)
          continue
        }
        
        data[tableName] = tableData || []
        console.log(`✅ Exported ${data[tableName].length} rows from ${tableName}`)
        
      } catch (error) {
        console.warn(`⚠️  Error exporting ${tableName}:`, error)
      }
    }
    
    // Get schema information
    const { data: schema, error: schemaError } = await this.supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
    
    if (schemaError) {
      console.warn('⚠️  Failed to export schema:', schemaError.message)
    }
    
    return {
      schema: schema || [],
      tables: tableNames,
      data
    }
  }

  private async createBackupFile(backupData: any): Promise<string> {
    const fileName = `mydub-backup-${this.backupTimestamp}.json`
    const filePath = path.join(this.config.backupDir, fileName)
    
    const backupContent = {
      metadata: {
        timestamp: this.backupTimestamp,
        version: process.env.VITE_APP_VERSION || '1.0.0',
        created_by: 'MyDub.AI Backup System',
        tables_count: backupData.tables.length,
        total_records: Object.values(backupData.data).reduce((sum: number, table: any) => sum + table.length, 0)
      },
      schema: backupData.schema,
      data: backupData.data
    }
    
    await fs.writeFile(filePath, JSON.stringify(backupContent, null, 2))
    console.log(`💾 Backup file created: ${filePath}`)
    
    return filePath
  }

  private async encryptBackup(filePath: string): Promise<string> {
    console.log('🔐 Encrypting backup file...')
    
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey)
    const input = await fs.readFile(filePath)
    
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()])
    
    const encryptedPath = filePath.replace('.json', '.encrypted')
    await fs.writeFile(encryptedPath, encrypted)
    
    // Save encryption info
    const keyInfo = {
      iv: iv.toString('hex'),
      algorithm: 'aes-256-cbc',
      timestamp: this.backupTimestamp
    }
    
    await fs.writeFile(encryptedPath + '.key', JSON.stringify(keyInfo))
    
    // Remove original file
    await fs.unlink(filePath)
    
    console.log(`🔐 Backup encrypted: ${encryptedPath}`)
    return encryptedPath
  }

  private async compressBackup(filePath: string): Promise<string> {
    console.log('🗜️  Compressing backup file...')
    
    const compressedPath = filePath + '.gz'
    
    try {
      execSync(`gzip -9 "${filePath}"`, { stdio: 'inherit' })
      console.log(`🗜️  Backup compressed: ${compressedPath}`)
      return compressedPath
    } catch (error) {
      console.warn('⚠️  Compression failed, using uncompressed file')
      return filePath
    }
  }

  private async generateMetadata(backupPath: string, tables: string[]): Promise<BackupMetadata> {
    const stats = await fs.stat(backupPath)
    const content = await fs.readFile(backupPath)
    const checksum = crypto.createHash('sha256').update(content).digest('hex')
    
    return {
      timestamp: this.backupTimestamp,
      version: process.env.VITE_APP_VERSION || '1.0.0',
      size: stats.size,
      checksum,
      tables,
      encrypted: this.config.encryptionEnabled,
      compressed: this.config.compressionEnabled
    }
  }

  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(
      this.config.backupDir,
      `metadata-${this.backupTimestamp}.json`
    )
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    console.log(`📋 Metadata saved: ${metadataPath}`)
  }

  private async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...')
    
    const files = await fs.readdir(this.config.backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)
    
    let deletedCount = 0
    
    for (const file of files) {
      if (!file.startsWith('mydub-backup-')) continue
      
      const filePath = path.join(this.config.backupDir, file)
      const stats = await fs.stat(filePath)
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath)
        console.log(`🗑️  Deleted old backup: ${file}`)
        deletedCount++
        
        // Also delete associated metadata and key files
        const baseName = file.replace(/\.(json|encrypted|gz)$/, '')
        const associatedFiles = files.filter(f => f.startsWith(`metadata-${baseName}`) || f.endsWith('.key'))
        
        for (const assocFile of associatedFiles) {
          try {
            await fs.unlink(path.join(this.config.backupDir, assocFile))
            console.log(`🗑️  Deleted associated file: ${assocFile}`)
          } catch (error) {
            console.warn(`⚠️  Failed to delete ${assocFile}:`, error)
          }
        }
      }
    }
    
    console.log(`🧹 Cleanup completed. Deleted ${deletedCount} old backups.`)
  }

  private async sendNotification(status: 'success' | 'error', details: any): Promise<void> {
    if (!this.config.notificationWebhook) return
    
    const payload = {
      timestamp: new Date().toISOString(),
      service: 'MyDub.AI Database Backup',
      status,
      details,
      environment: process.env.NODE_ENV || 'production'
    }
    
    try {
      const response = await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        console.warn('⚠️  Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.warn('⚠️  Failed to send notification:', error)
    }
  }
}

// Restore functionality
class DatabaseRestoreManager {
  private config: BackupConfig
  private supabase: ReturnType<typeof createClient>

  constructor(config: BackupConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey)
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    console.log(`🔄 Starting database restore from: ${backupPath}`)
    
    try {
      // Decrypt if needed
      let processedPath = backupPath
      if (backupPath.includes('.encrypted')) {
        processedPath = await this.decryptBackup(backupPath)
      }
      
      // Decompress if needed
      if (processedPath.endsWith('.gz')) {
        processedPath = await this.decompressBackup(processedPath)
      }
      
      // Load backup data
      const backupContent = JSON.parse(await fs.readFile(processedPath, 'utf-8'))
      
      // Restore data
      await this.restoreData(backupContent.data)
      
      console.log('✅ Database restore completed successfully')
      
    } catch (error) {
      console.error('❌ Restore failed:', error)
      throw error
    }
  }

  private async decryptBackup(encryptedPath: string): Promise<string> {
    console.log('🔓 Decrypting backup file...')
    
    const keyPath = encryptedPath + '.key'
    const keyInfo = JSON.parse(await fs.readFile(keyPath, 'utf-8'))
    
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('BACKUP_ENCRYPTION_KEY not found in environment')
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey)
    const encrypted = await fs.readFile(encryptedPath)
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    
    const decryptedPath = encryptedPath.replace('.encrypted', '.json')
    await fs.writeFile(decryptedPath, decrypted)
    
    console.log(`🔓 Backup decrypted: ${decryptedPath}`)
    return decryptedPath
  }

  private async decompressBackup(compressedPath: string): Promise<string> {
    console.log('📦 Decompressing backup file...')
    
    const decompressedPath = compressedPath.replace('.gz', '')
    
    try {
      execSync(`gunzip -c "${compressedPath}" > "${decompressedPath}"`, { stdio: 'inherit' })
      console.log(`📦 Backup decompressed: ${decompressedPath}`)
      return decompressedPath
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`)
    }
  }

  private async restoreData(data: Record<string, any[]>): Promise<void> {
    console.log('📥 Restoring database data...')
    
    for (const [tableName, tableData] of Object.entries(data)) {
      try {
        console.log(`📥 Restoring ${tableData.length} rows to ${tableName}...`)
        
        // Clear existing data (optional - be careful!)
        // await this.supabase.from(tableName).delete().neq('id', 0)
        
        // Insert data in batches
        const batchSize = 100
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          
          const { error } = await this.supabase
            .from(tableName)
            .upsert(batch)
          
          if (error) {
            console.warn(`⚠️  Failed to restore batch for ${tableName}:`, error.message)
          }
        }
        
        console.log(`✅ Restored ${tableName}`)
        
      } catch (error) {
        console.warn(`⚠️  Error restoring ${tableName}:`, error)
      }
    }
  }
}

// Main execution
async function main() {
  const config: BackupConfig = {
    supabaseUrl: process.env.VITE_SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    encryptionEnabled: process.env.BACKUP_ENCRYPTION_ENABLED === 'true',
    compressionEnabled: process.env.BACKUP_COMPRESSION_ENABLED !== 'false',
    notificationWebhook: process.env.BACKUP_NOTIFICATION_WEBHOOK
  }
  
  // Validate required environment variables
  if (!config.supabaseUrl || !config.serviceRoleKey) {
    console.error('❌ Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  const command = process.argv[2]
  
  try {
    if (command === 'restore') {
      const backupPath = process.argv[3]
      if (!backupPath) {
        console.error('❌ Please provide backup path for restore')
        process.exit(1)
      }
      
      const restoreManager = new DatabaseRestoreManager(config)
      await restoreManager.restoreFromBackup(backupPath)
      
    } else {
      // Default: create backup
      const backupManager = new DatabaseBackupManager(config)
      await backupManager.createBackup()
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { DatabaseBackupManager, DatabaseRestoreManager }