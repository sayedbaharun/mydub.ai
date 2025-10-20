import type { Meta, StoryObj } from '@storybook/react'
import { AIDisclosureBadge } from './AIDisclosureBadge'

const meta = {
  title: 'AI/AIDisclosureBadge',
  component: AIDisclosureBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AIDisclosureBadge>

export default meta
type Story = StoryObj<typeof meta>

export const CompactVerified: Story = {
  args: {
    variant: 'compact',
    sourcesAnalyzed: 47,
    confidenceScore: 94,
    humanReviewed: true,
    generatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
}

export const CompactPending: Story = {
  args: {
    variant: 'compact',
    sourcesAnalyzed: 23,
    confidenceScore: 87,
    humanReviewed: false,
    generatedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
}

export const CompactLowConfidence: Story = {
  args: {
    variant: 'compact',
    sourcesAnalyzed: 12,
    confidenceScore: 72,
    humanReviewed: false,
    generatedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
}

export const ExpandedVerified: Story = {
  args: {
    variant: 'expanded',
    sourcesAnalyzed: 64,
    confidenceScore: 96,
    humanReviewed: true,
    generatedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
}

export const ExpandedPending: Story = {
  args: {
    variant: 'expanded',
    sourcesAnalyzed: 31,
    confidenceScore: 84,
    humanReviewed: false,
    generatedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
}

export const ExpandedLowConfidence: Story = {
  args: {
    variant: 'expanded',
    sourcesAnalyzed: 8,
    confidenceScore: 68,
    humanReviewed: false,
    generatedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
  },
}
