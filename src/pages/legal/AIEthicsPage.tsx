import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Brain, Shield, Eye, Heart, Users, Zap, Lock, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

export default function AIEthicsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Ethics Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: January 24, 2025
        </p>
      </div>

      <Alert className="mb-8">
        <Brain className="h-4 w-4" />
        <AlertTitle>Our AI Commitment</AlertTitle>
        <AlertDescription>
          MyDub.AI is committed to the responsible and ethical use of artificial intelligence 
          to enhance your experience while respecting your rights, privacy, and cultural values.
        </AlertDescription>
      </Alert>

      <div className="prose prose-lg max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            This AI Ethics Policy outlines our principles and practices for the responsible development 
            and deployment of artificial intelligence within MyDub.AI. We believe AI should augment 
            human capabilities while respecting human values, rights, and dignity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Core AI Principles</h2>
          
          <div className="grid gap-4 my-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Human-Centered Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  AI systems are designed to enhance human capabilities, not replace human judgment. 
                  We ensure humans remain in control of important decisions and can override AI recommendations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Transparency & Explainability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  We clearly indicate when AI is being used and provide explanations for AI decisions. 
                  Users can access information about which AI models are used and how they work.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Safety & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  AI systems undergo rigorous testing for safety, security, and reliability. 
                  We implement safeguards to prevent misuse and protect against adversarial attacks.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Fairness & Non-Discrimination
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  We actively work to identify and mitigate biases in our AI systems to ensure 
                  fair treatment for all users regardless of their background or characteristics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Privacy & Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  AI systems are designed with privacy by default. We minimize data collection, 
                  protect user data, and never use personal data for AI training without explicit consent.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. AI Models We Use</h2>
          <p>
            MyDub.AI uses state-of-the-art AI models from trusted providers:
          </p>

          <div className="grid gap-4 my-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">OpenAI GPT-4</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Advanced language understanding and generation for chatbot interactions
                    </p>
                  </div>
                  <Badge variant="secondary">Primary</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">Anthropic Claude 3</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Safety-focused AI for sensitive content and nuanced responses
                    </p>
                  </div>
                  <Badge variant="secondary">Safety</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">Google Gemini Pro</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Multimodal AI for understanding images and complex queries
                    </p>
                  </div>
                  <Badge variant="secondary">Multimodal</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. How We Use AI</h2>
          
          <Card className="my-4">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">AI-Powered Features</h3>
              <ul className="space-y-3">
                <li>
                  <strong>Chatbot Assistant:</strong> Provides information about Dubai services, 
                  answers questions, and offers personalized assistance
                </li>
                <li>
                  <strong>Content Recommendations:</strong> Suggests relevant news, services, and 
                  information based on your interests and needs
                </li>
                <li>
                  <strong>Search Enhancement:</strong> Improves search results by understanding 
                  context and intent
                </li>
                <li>
                  <strong>Content Moderation:</strong> Helps maintain a safe platform by identifying 
                  potentially harmful content
                </li>
                <li>
                  <strong>Language Translation:</strong> Facilitates communication across Arabic, 
                  English, Hindi, and Urdu
                </li>
                <li>
                  <strong>Sentiment Analysis:</strong> Understands user feedback to improve services
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights & Controls</h2>
          <p>
            You have complete control over how AI is used in your MyDub.AI experience:
          </p>

          <div className="space-y-4 my-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Opt-Out Rights:</strong> You can disable AI features entirely or selectively 
                choose which AI features to use
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Transparency Access:</strong> View detailed logs of AI decisions that affect 
                you and understand why certain recommendations were made
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Data Control:</strong> Export your AI interaction data, request deletion, 
                or modify your AI preferences at any time
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Human Review:</strong> Request human review of any AI decision you disagree with
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. AI Safety Measures</h2>
          <p>
            We implement multiple layers of safety to ensure responsible AI use:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Content Filtering:</strong> AI responses are filtered to prevent harmful, 
              biased, or inappropriate content
            </li>
            <li>
              <strong>Rate Limiting:</strong> Prevents abuse and ensures fair access to AI services
            </li>
            <li>
              <strong>Continuous Monitoring:</strong> AI outputs are monitored for quality and safety
            </li>
            <li>
              <strong>Regular Audits:</strong> Third-party audits ensure our AI systems meet 
              ethical standards
            </li>
            <li>
              <strong>Feedback Loops:</strong> User feedback helps us identify and fix issues quickly
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data & Training</h2>
          <Card className="my-4">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Our Data Practices</h3>
              <ul className="space-y-2">
                <li>✓ We do NOT use your personal data to train AI models without explicit consent</li>
                <li>✓ AI models are pre-trained by their providers on public datasets</li>
                <li>✓ Your interactions are logged only for transparency and service improvement</li>
                <li>✓ You can opt out of data collection for improvement purposes</li>
                <li>✓ All data is encrypted and stored securely in UAE data centers</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Limitations & Disclaimers</h2>
          <Alert variant="default" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important AI Limitations</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• AI may occasionally generate incorrect or outdated information</li>
                <li>• AI cannot replace professional advice (legal, medical, financial)</li>
                <li>• AI decisions should be verified for critical matters</li>
                <li>• AI has knowledge cutoff dates and may not have real-time information</li>
              </ul>
            </AlertDescription>
          </Alert>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Cultural & Religious Sensitivity</h2>
          <p>
            Our AI systems are specifically configured to respect UAE cultural values and Islamic principles:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI responses respect religious beliefs and cultural sensitivities</li>
            <li>Content generation avoids topics that conflict with local values</li>
            <li>AI is trained to understand and respect cultural context</li>
            <li>Special care is taken during religious occasions and cultural events</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Accountability & Governance</h2>
          <p>
            We maintain strong governance over our AI systems:
          </p>
          <div className="grid gap-3 my-4">
            <div>
              <strong>AI Ethics Committee:</strong> Reviews AI implementations and policies quarterly
            </div>
            <div>
              <strong>External Audits:</strong> Annual third-party audits of AI systems
            </div>
            <div>
              <strong>Incident Response:</strong> Dedicated team for AI-related issues
            </div>
            <div>
              <strong>Continuous Improvement:</strong> Regular updates based on user feedback and 
              technological advances
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Reporting AI Issues</h2>
          <p>
            If you encounter any issues with our AI systems:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the feedback button in any AI interaction</li>
            <li>Email our AI Ethics team: ai-ethics@mydub.ai</li>
            <li>Report urgent issues: ai-safety@mydub.ai</li>
            <li>Response time: Within 48 hours for standard issues, 24 hours for safety concerns</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Future Commitments</h2>
          <p>
            As AI technology evolves, we commit to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Staying current with AI safety research and best practices</li>
            <li>Engaging with the community on AI development</li>
            <li>Transparently communicating changes to our AI systems</li>
            <li>Collaborating with regulators and industry partners</li>
            <li>Prioritizing user safety and benefit in all AI decisions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="font-semibold mb-3">AI Ethics Team</p>
              <ul className="space-y-2 text-sm">
                <li>General inquiries: ai-ethics@mydub.ai</li>
                <li>Safety concerns: ai-safety@mydub.ai</li>
                <li>Data requests: privacy@mydub.ai</li>
                <li>Partnership inquiries: ai-partnerships@mydub.ai</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Alert className="mt-8">
          <Shield className="h-4 w-4" />
          <AlertTitle>Regulatory Compliance</AlertTitle>
          <AlertDescription>
            This AI Ethics Policy complies with UAE National AI Strategy 2031, UAE Council for 
            Artificial Intelligence guidelines, and international AI ethics standards including 
            the EU AI Act principles where applicable.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}