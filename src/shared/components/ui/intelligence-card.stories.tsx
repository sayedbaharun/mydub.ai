import type { Meta, StoryObj } from '@storybook/react'
import { IntelligenceCard } from './intelligence-card'

const meta = {
  title: 'UI/IntelligenceCard',
  component: IntelligenceCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'featured', 'minimal', 'luxury'],
    },
    sentiment: {
      control: 'select',
      options: ['positive', 'neutral', 'negative'],
    },
  },
} satisfies Meta<typeof IntelligenceCard>

export default meta
type Story = StoryObj<typeof meta>

const sampleImage = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'

export const Default: Story = {
  args: {
    title: 'Dubai Announces New AI Strategy for 2026',
    description:
      'The emirate has unveiled a comprehensive artificial intelligence strategy aimed at transforming government services and enhancing the smart city experience.',
    image: sampleImage,
    category: 'Technology',
    date: '2 hours ago',
    author: 'Sarah Al Mazrouei',
    readTime: 5,
    aiGenerated: true,
    confidenceScore: 94,
    sourcesAnalyzed: 47,
    viewCount: 12453,
  },
}

export const Featured: Story = {
  args: {
    ...Default.args,
    variant: 'featured',
    trending: true,
    title: 'Breaking: Dubai Metro Expands to New Areas',
    description:
      'Major announcement reveals plans for 15 new metro stations across Dubai, connecting residential communities to business districts with cutting-edge transport technology.',
  },
}

export const Luxury: Story = {
  args: {
    ...Default.args,
    variant: 'luxury',
    category: 'Luxury Life',
    title: 'Exclusive: Inside Dubai\'s Most Luxurious New Resort',
    description:
      'A first look at the stunning beachfront property that redefines opulence in the heart of Dubai.',
    confidenceScore: 96,
  },
}

export const Minimal: Story = {
  args: {
    ...Default.args,
    variant: 'minimal',
    description: 'A quick update on Dubai\'s latest developments in urban planning.',
  },
}

export const WithoutImage: Story = {
  args: {
    variant: 'default',
    title: 'Dubai Real Estate Market Shows Strong Growth',
    description:
      'New data reveals sustained demand in premium properties across the emirate, with particular interest from international investors.',
    category: 'Real Estate',
    date: '5 hours ago',
    author: 'Ahmed Hassan',
    readTime: 3,
    aiGenerated: true,
    confidenceScore: 91,
    sourcesAnalyzed: 23,
    viewCount: 5678,
  },
}

export const HighConfidenceAI: Story = {
  args: {
    ...Default.args,
    title: 'Government Launches Digital Services Platform',
    aiGenerated: true,
    confidenceScore: 98,
    sourcesAnalyzed: 64,
    category: 'Government',
  },
}

export const LowConfidenceDraft: Story = {
  args: {
    ...Default.args,
    title: 'Preliminary Report: Weather Patterns Analysis',
    description: 'Initial findings from meteorological data suggest interesting trends.',
    aiGenerated: true,
    confidenceScore: 73,
    sourcesAnalyzed: 8,
    image: undefined,
  },
}

export const TrendingStory: Story = {
  args: {
    ...Default.args,
    trending: true,
    title: 'Dubai Hosts Major International Summit',
    category: 'Events',
    viewCount: 45230,
  },
}

export const MinimalNewsUpdate: Story = {
  args: {
    variant: 'minimal',
    title: 'Traffic Update: Sheikh Zayed Road',
    description: 'Light congestion reported near interchange 3',
    category: 'Traffic',
    date: '15 min ago',
    image: undefined,
  },
}

export const LuxuryDining: Story = {
  args: {
    variant: 'luxury',
    title: 'Michelin-Starred Chef Opens New Restaurant',
    description:
      'Dubai\'s culinary scene gets a new crown jewel with this exclusive dining experience.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    category: 'Dining',
    author: 'Layla Rahman',
    readTime: 7,
    aiGenerated: false,
  },
}

export const Interactive: Story = {
  args: {
    ...Default.args,
    onClick: () => alert('Card clicked!'),
  },
}

export const WithLink: Story = {
  args: {
    ...Default.args,
    href: '#',
  },
}

// Grid demonstration
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <IntelligenceCard {...Default.args} />
      <IntelligenceCard {...Minimal.args} />
      <IntelligenceCard {...WithoutImage.args} />
      <IntelligenceCard {...HighConfidenceAI.args} />
      <IntelligenceCard {...TrendingStory.args} />
      <IntelligenceCard {...MinimalNewsUpdate.args} />
    </div>
  ),
}

// Featured layout demonstration
export const FeaturedLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <IntelligenceCard {...Featured.args} />
      </div>
      <div className="space-y-4">
        <IntelligenceCard {...Minimal.args} />
        <IntelligenceCard {...MinimalNewsUpdate.args} />
      </div>
    </div>
  ),
}
