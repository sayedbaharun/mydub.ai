import { supabase } from './supabase'

export const storage = {
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: { upsert?: boolean }
  ): Promise<string> {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  },

  async listFiles(bucket: string, path: string): Promise<any[]> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path)

    if (error) throw error
    return data || []
  },

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  }
}

// Helper functions for specific buckets
export const contentImages = {
  async upload(contentId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${contentId}/${Date.now()}.${fileExt}`
    return storage.uploadFile('content-images', fileName, file)
  },

  async uploadMultiple(contentId: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.upload(contentId, file))
    return Promise.all(uploadPromises)
  },

  async delete(path: string): Promise<void> {
    return storage.deleteFile('content-images', path)
  }
}

export const userAvatars = {
  async upload(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`
    return storage.uploadFile('user-avatars', fileName, file, { upsert: true })
  },

  async delete(userId: string): Promise<void> {
    const files = await storage.listFiles('user-avatars', userId)
    if (files.length > 0) {
      await Promise.all(
        files.map(file => storage.deleteFile('user-avatars', `${userId}/${file.name}`))
      )
    }
  }
}

export const contentDocuments = {
  async upload(contentId: string, file: File, documentType: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${contentId}/${documentType}-${Date.now()}.${fileExt}`
    return storage.uploadFile('content-documents', fileName, file)
  },

  async delete(path: string): Promise<void> {
    return storage.deleteFile('content-documents', path)
  },

  async getUrl(path: string): Promise<string> {
    return storage.getPublicUrl('content-documents', path)
  }
}