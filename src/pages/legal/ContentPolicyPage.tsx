import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, Users, FileText, Heart, MessageSquare } from 'lucide-react'
import { useEffect } from 'react'

export default function ContentPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Content Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: January 24, 2025
        </p>
      </div>

      <Alert className="mb-8">
        <Shield className="h-4 w-4" />
        <AlertTitle>Our Commitment</AlertTitle>
        <AlertDescription>
          MyDub.AI is committed to maintaining a safe, respectful, and informative platform for all users 
          while complying with UAE laws and cultural values.
        </AlertDescription>
      </Alert>

      <div className="prose prose-lg max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
          <p>
            This Content Policy outlines what content is acceptable on MyDub.AI and what is prohibited. 
            All users must comply with this policy when using our platform, including when interacting 
            with our AI chatbot, posting comments, or sharing information.
          </p>
          <p>
            We use a combination of automated AI moderation and human review to enforce these policies 
            consistently and fairly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Prohibited Content</h2>
          <p>
            The following types of content are strictly prohibited on MyDub.AI:
          </p>

          <Card className="my-4">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Critical Violations
              </h3>
              <ul className="space-y-2">
                <li>
                  <strong>Terrorism & Extremism:</strong> Content that promotes, supports, or glorifies 
                  terrorism or violent extremism
                </li>
                <li>
                  <strong>Hate Speech:</strong> Content that attacks or demeans individuals or groups based on 
                  race, ethnicity, national origin, religion, gender, sexual orientation, or disability
                </li>
                <li>
                  <strong>Violence & Threats:</strong> Content depicting graphic violence, threats of violence, 
                  or content that incites harm to others
                </li>
                <li>
                  <strong>Child Safety:</strong> Any content that sexualizes, exploits, or harms minors
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="my-4">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">High Severity Violations</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Adult Content:</strong> Sexually explicit content, pornography, or nudity
                </li>
                <li>
                  <strong>Drugs & Illegal Activities:</strong> Content promoting illegal drugs, criminal activities, 
                  or providing instructions for illegal actions
                </li>
                <li>
                  <strong>Gambling:</strong> Content promoting gambling services or unauthorized lottery schemes
                </li>
                <li>
                  <strong>Self-Harm:</strong> Content that promotes or encourages self-harm or suicide
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="my-4">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Medium Severity Violations</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Misinformation:</strong> Deliberately false or misleading information that could cause harm
                </li>
                <li>
                  <strong>Defamation:</strong> False statements that damage someone's reputation
                </li>
                <li>
                  <strong>Privacy Violations:</strong> Sharing private information without consent
                </li>
                <li>
                  <strong>Spam:</strong> Repetitive, unwanted content or commercial solicitation
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Cultural Sensitivity Guidelines</h2>
          <p>
            In accordance with UAE cultural values and laws, we require all content to be respectful of:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Religious Content:</strong> All discussions of religion must be respectful. 
              Blasphemy, religious offense, or disrespectful content about any faith is prohibited.
            </li>
            <li>
              <strong>Political Content:</strong> Political discussions must be balanced and constructive. 
              Content that undermines state security or spreads political extremism is prohibited.
            </li>
            <li>
              <strong>Cultural Traditions:</strong> Content must respect local customs, traditions, and 
              cultural sensitivities of the UAE and its diverse population.
            </li>
            <li>
              <strong>Gender Relations:</strong> Content must respect local norms regarding gender 
              interactions and relationships.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Content Moderation Process</h2>
          <p>
            We use a multi-layered approach to content moderation:
          </p>

          <div className="grid gap-4 my-6">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">1. Automated AI Moderation</h4>
                <p className="text-sm">
                  All content is automatically scanned by our AI systems, which check for policy violations 
                  using OpenAI's moderation API and our custom UAE-specific guidelines.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">2. Human Review</h4>
                <p className="text-sm">
                  Content flagged by AI or reported by users is reviewed by our moderation team to ensure 
                  accurate and culturally appropriate decisions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">3. User Reporting</h4>
                <p className="text-sm">
                  Users can report content they believe violates our policies. All reports are taken 
                  seriously and reviewed promptly.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Enforcement Actions</h2>
          <p>
            When content violates our policies, we may take the following actions:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Badge variant="secondary" className="mr-2">Warning</Badge>
              First-time or minor violations may result in a warning
            </li>
            <li>
              <Badge variant="default" className="mr-2">Content Removal</Badge>
              Violating content will be removed from the platform
            </li>
            <li>
              <Badge variant="destructive" className="mr-2">Account Suspension</Badge>
              Repeated or severe violations may result in temporary account suspension
            </li>
            <li>
              <Badge className="mr-2">Account Termination</Badge>
              Critical violations or persistent policy breaches may result in permanent account termination
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Appeals Process</h2>
          <p>
            If you believe your content was incorrectly removed or your account was unfairly actioned, 
            you have the right to appeal:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Submit an appeal through your account dashboard within 30 days of the action</li>
            <li>Provide a clear explanation of why you believe the decision was incorrect</li>
            <li>Our appeals team will review your case within 7 business days</li>
            <li>You will receive a final decision via email</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Positive Community Guidelines</h2>
          <p>
            We encourage content that:
          </p>
          <div className="grid gap-3 my-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Builds Community:</strong> Share helpful information about life in Dubai, 
                cultural events, and community activities
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Provides Value:</strong> Share accurate information, helpful tips, and 
                constructive feedback
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Shows Respect:</strong> Engage respectfully with others, celebrating the 
                diversity of Dubai's community
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-1" />
              <div>
                <strong>Encourages Discussion:</strong> Foster constructive dialogue and cultural 
                exchange while respecting different viewpoints
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Reporting Violations</h2>
          <p>
            If you encounter content that violates this policy:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the report button available on all content</li>
            <li>Select the appropriate violation category</li>
            <li>Provide additional context if needed</li>
            <li>Our moderation team will review reports within 24 hours</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. AI-Generated Content</h2>
          <p>
            When using our AI chatbot or other AI features:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Do not attempt to generate prohibited content</li>
            <li>Do not use AI to create misleading or harmful information</li>
            <li>Remember that you are responsible for how you use AI-generated content</li>
            <li>AI responses are monitored for policy compliance</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Updates to This Policy</h2>
          <p>
            We may update this Content Policy from time to time to reflect changes in laws, regulations, 
            or community standards. We will notify users of significant changes through the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p>
            If you have questions about this Content Policy or need to report a serious violation:
          </p>
          <ul className="list-none space-y-2">
            <li>Email: content-policy@mydub.ai</li>
            <li>Response time: Within 24-48 hours</li>
            <li>Emergency reports: abuse@mydub.ai</li>
          </ul>
        </section>

        <Alert className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Legal Compliance</AlertTitle>
          <AlertDescription>
            This policy is designed to comply with UAE Federal Law No. 34 of 2021 on Combating Rumours 
            and Cybercrimes, and all other applicable UAE laws and regulations.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}