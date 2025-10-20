/**
 * Share Button Component
 * Phase 3.3.1: One-click sharing to multiple platforms
 */

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'
import { Share2, MessageCircle, Twitter, Facebook, Linkedin, Mail, Link2, Check } from 'lucide-react'
import { SharingService } from '../services/sharing.service'
import { toast } from '@/shared/services/toast.service'

interface ShareButtonProps {
  articleId: string
  title: string
  summary?: string
  url?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showLabel?: boolean
}

export function ShareButton({
  articleId,
  title,
  summary,
  url,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || `${window.location.origin}/news/${articleId}`

  const handleWhatsApp = async () => {
    await SharingService.shareToWhatsApp(articleId, title, shareUrl)
  }

  const handleTwitter = async () => {
    await SharingService.shareToTwitter(articleId, title, shareUrl)
  }

  const handleFacebook = async () => {
    await SharingService.shareToFacebook(articleId, shareUrl)
  }

  const handleLinkedIn = async () => {
    await SharingService.shareToLinkedIn(articleId, title, shareUrl, summary)
  }

  const handleEmail = async () => {
    await SharingService.shareViaEmail(articleId, title, shareUrl, summary)
  }

  const handleCopyLink = async () => {
    const success = await SharingService.copyLink(articleId, shareUrl)
    if (success) {
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy link')
    }
  }

  const handleNativeShare = async () => {
    try {
      await SharingService.nativeShare(articleId, title, shareUrl, summary)
    } catch (error) {
      // Fallback to share menu if native share fails
      console.error('Native share failed:', error)
    }
  }

  // Check if native share is supported
  const isNativeShareSupported = SharingService.isNativeShareSupported()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className={`${showLabel ? 'mr-2' : ''} h-4 w-4`} />
          {showLabel && 'Share'}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* WhatsApp - Priority for Dubai market */}
        <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer">
          <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          <span>WhatsApp</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Twitter/X */}
        <DropdownMenuItem onClick={handleTwitter} className="cursor-pointer">
          <Twitter className="mr-2 h-4 w-4 text-blue-400" />
          <span>Twitter</span>
        </DropdownMenuItem>

        {/* Facebook */}
        <DropdownMenuItem onClick={handleFacebook} className="cursor-pointer">
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          <span>Facebook</span>
        </DropdownMenuItem>

        {/* LinkedIn */}
        <DropdownMenuItem onClick={handleLinkedIn} className="cursor-pointer">
          <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
          <span>LinkedIn</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Email */}
        <DropdownMenuItem onClick={handleEmail} className="cursor-pointer">
          <Mail className="mr-2 h-4 w-4 text-gray-600" />
          <span>Email</span>
        </DropdownMenuItem>

        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4 text-gray-600" />
              <span>Copy Link</span>
            </>
          )}
        </DropdownMenuItem>

        {/* Native Share (mobile) */}
        {isNativeShareSupported && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
              <Share2 className="mr-2 h-4 w-4 text-gray-600" />
              <span>More...</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
