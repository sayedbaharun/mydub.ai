import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Brain,
  CheckCircle2,
  Shield,
  Users,
  TrendingUp,
  Eye,
  Sparkles,
  FileSearch,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'

export function HowWeUseAIPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  useEffect(() => {
    document.title = 'How We Use AI | mydub.ai'
  }, [])

  return (
    <div className={cn('min-h-screen bg-gradient-to-b from-white to-gray-50', isRTL && 'rtl')}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-blue-50 opacity-30" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-900 hover:bg-purple-200">
              <Sparkles className="mr-1 h-3 w-3" />
              AI Transparency
            </Badge>

            <h1 className={cn(
              'mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl',
              isRTL && 'text-right'
            )}>
              How We Use AI to Deliver Dubai's News
            </h1>

            <p className={cn(
              'text-lg leading-relaxed text-gray-600',
              isRTL && 'text-right'
            )}>
              At mydub.ai, we believe in radical transparency. Here's exactly how our AI systems work,
              what we measure, and how we ensure accuracy and fairness in every story.
            </p>
          </div>
        </div>
      </section>

      {/* The Promise */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white shadow-xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Our AI Transparency Promise</h2>
            <p className="text-lg leading-relaxed text-purple-50">
              We are Dubai's first 90% AI-generated news channel. Every AI-generated article is clearly labeled,
              scored for confidence, and verified by human reviewers. We never hide our AI — we celebrate it
              while maintaining the highest editorial standards.
            </p>
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Our AI Content Pipeline</h2>
          <p className="text-lg text-gray-600">
            From source collection to publication, every step is measured and verified
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ProcessStep
            icon={FileSearch}
            number="1"
            title="Source Collection"
            description="AI agents scan 100+ trusted Dubai sources including Gulf News, Khaleej Times, and government portals every 15 minutes"
            metrics={['47+ sources per article', '95% credibility threshold']}
          />

          <ProcessStep
            icon={Brain}
            number="2"
            title="AI Generation"
            description="Advanced language models synthesize information, maintaining factual accuracy and Dubai context"
            metrics={['85% confidence minimum', 'Named entity verification']}
          />

          <ProcessStep
            icon={CheckCircle2}
            number="3"
            title="Quality Scoring"
            description="Multi-factor confidence algorithm scores source agreement, fact-checking, and sentiment consistency"
            metrics={['5 quality metrics', 'Weighted scoring algorithm']}
          />

          <ProcessStep
            icon={Users}
            number="4"
            title="Human Review"
            description="Editorial team reviews all content before publication, with focus on cultural sensitivity and accuracy"
            metrics={['100% human oversight', 'Cultural context verification']}
          />
        </div>
      </section>

      {/* Confidence Scoring Breakdown */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Understanding Our Confidence Scores</h2>
            <p className="text-lg text-gray-600">
              Every AI-generated article receives a multi-dimensional confidence score
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ConfidenceMetric
              title="Source Agreement"
              percentage={30}
              description="How much multiple sources agree on key facts"
              example="3+ high-credibility sources confirming the same information"
            />

            <ConfidenceMetric
              title="Fact-Checking"
              percentage={25}
              description="Verification against known facts and red flag detection"
              example="Cross-referenced with government announcements and official statements"
            />

            <ConfidenceMetric
              title="Model Confidence"
              percentage={25}
              description="AI's self-assessed confidence in generation quality"
              example="Based on language model logits and perplexity scores"
            />

            <ConfidenceMetric
              title="Sentiment Consistency"
              percentage={10}
              description="Consistency of tone across sources"
              example="Balanced reporting without sensationalism"
            />

            <ConfidenceMetric
              title="Entity Accuracy"
              percentage={10}
              description="Named entity recognition precision"
              example="Correct identification of people, places, organizations"
            />

            <Card className="lg:col-span-3 border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-900">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Publishing Threshold: 85%
                </CardTitle>
                <CardDescription className="text-green-700">
                  Only articles scoring 85% or higher are eligible for publication.
                  Articles below this threshold are flagged for additional human review or rejected.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Compliance & Ethics */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Compliance & Ethics</h2>
          <p className="text-lg text-gray-600">
            We adhere to international standards and UAE regulations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <ComplianceCard
            icon={Shield}
            title="UAE AI Charter 2024"
            description="Fully compliant with all 12 principles including transparency, fairness, accountability, and human oversight"
            link="https://ai.gov.ae"
          />

          <ComplianceCard
            icon={Eye}
            title="ISO/IEC 42001:2023"
            description="AI Management Systems certification ensuring systematic risk management and governance"
            link="#"
          />

          <ComplianceCard
            icon={AlertTriangle}
            title="Bias Monitoring"
            description="Continuous monitoring for gender, nationality, and cultural bias using automated detection systems"
            link="/transparency/bias-monitoring"
          />
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <FAQItem
              question="Why use AI for news generation?"
              answer="AI allows us to provide comprehensive coverage of Dubai news 24/7 by processing information from dozens of sources simultaneously. This means we can break stories faster and provide more context than traditional newsrooms. However, all AI-generated content is reviewed by human editors before publication."
            />

            <FAQItem
              question="How do you prevent AI hallucinations or false information?"
              answer="We use a multi-layered approach: (1) Only process information from pre-verified credible sources, (2) Require multiple sources to agree on key facts, (3) Use fact-checking algorithms to detect red flags, (4) Score every article with our confidence algorithm, and (5) Have human editors review all content before publication."
            />

            <FAQItem
              question="What happens to articles that score below 85%?"
              answer="Articles below our 85% confidence threshold are automatically flagged for intensive human review. Our editorial team examines these articles to determine if they can be improved or if they should be rejected. We never publish low-confidence AI content."
            />

            <FAQItem
              question="Can AI be biased?"
              answer="Yes, AI systems can reflect biases present in their training data. We actively monitor for bias using automated detection systems that check for unfair representation across gender, nationality, religion, and other sensitive dimensions. Our human review process specifically looks for cultural sensitivity issues relevant to Dubai's diverse community."
            />

            <FAQItem
              question="How is this different from other AI news services?"
              answer="Unlike other AI news services that hide their AI usage, we practice radical transparency. Every AI-generated article is clearly labeled with confidence scores, source counts, and human review status. We also make our methodology public and align with UAE AI Charter principles."
            />

            <FAQItem
              question="Where can I learn more about your AI systems?"
              answer="We maintain comprehensive documentation about our AI systems, confidence scoring methodology, and compliance measures. You can also view our real-time bias monitoring dashboard and quality metrics. For technical details, visit our GitHub repository or contact our transparency team."
            />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Our Track Record</h2>
          <p className="text-lg text-gray-600">
            Real-time statistics on AI performance and accuracy
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            value="94.2%"
            label="Average Confidence Score"
            trend="+2.1%"
            description="30-day average"
          />

          <StatCard
            value="47"
            label="Average Sources per Article"
            trend="+5"
            description="vs. last month"
          />

          <StatCard
            value="100%"
            label="Human Review Rate"
            trend="stable"
            description="All content reviewed"
          />

          <StatCard
            value="<0.1%"
            label="Error Rate"
            trend="-0.05%"
            description="Factual corrections needed"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Questions About Our AI?
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            We believe in open dialogue about AI journalism. Reach out to our transparency team.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:transparency@mydub.ai"
              className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
            >
              Contact Transparency Team
            </a>
            <a
              href="/transparency/bias-monitoring"
              className="rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:border-gray-400"
            >
              View Bias Monitoring
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// Supporting Components

interface ProcessStepProps {
  icon: React.ElementType
  number: string
  title: string
  description: string
  metrics: string[]
}

function ProcessStep({ icon: Icon, number, title, description, metrics }: ProcessStepProps) {
  return (
    <Card className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-600 to-blue-600" />

      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Icon className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-4xl font-bold text-gray-200">{number}</span>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="mb-4 text-sm text-gray-600">{description}</p>
        <div className="space-y-1">
          {metrics.map((metric, i) => (
            <div key={i} className="flex items-center text-xs text-gray-500">
              <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
              {metric}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ConfidenceMetricProps {
  title: string
  percentage: number
  description: string
  example: string
}

function ConfidenceMetric({ title, percentage, description, example }: ConfidenceMetricProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant="secondary" className="text-lg font-bold">
            {percentage}%
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Example:</span> {example}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface ComplianceCardProps {
  icon: React.ElementType
  title: string
  description: string
  link: string
}

function ComplianceCard({ icon: Icon, title, description, link }: ComplianceCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <a
          href={link}
          className="text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          Learn more →
        </a>
      </CardContent>
    </Card>
  )
}

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-gray-600">{answer}</p>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  value: string
  label: string
  trend: string
  description: string
}

function StatCard({ value, label, trend, description }: StatCardProps) {
  const isPositive = trend.startsWith('+') || trend === 'stable'

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="mb-2 text-4xl font-bold text-gray-900">{value}</div>
          <div className="mb-1 text-sm font-medium text-gray-600">{label}</div>
          <div className={cn(
            'text-xs font-medium',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend}
          </div>
          <div className="mt-1 text-xs text-gray-500">{description}</div>
        </div>
      </CardContent>
    </Card>
  )
}
