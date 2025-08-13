import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, User, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface ConsentData {
  id: string;
  child_birth_date: string;
  parent_email: string;
  status: string;
  created_at: string;
}

export function ParentalConsentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchConsentData();
    } else {
      setError('Invalid consent link. Please check your email for the correct link.');
      setLoading(false);
    }
  }, [token]);

  const fetchConsentData = async () => {
    try {
      const { data, error } = await supabase
        .from('parental_consents')
        .select('*')
        .eq('consent_token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Consent request not found.');
      } else if (data.status !== 'pending') {
        setError(`This consent request has already been ${data.status}.`);
      } else {
        setConsentData(data);
      }
    } catch (error) {
      console.error('Failed to fetch consent data:', error);
      setError('Failed to load consent request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleApprove = async () => {
    if (!agreed || !consentData) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('parental_consents')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_ip: await getClientIP()
        })
        .eq('consent_token', token);

      if (error) throw error;

      toast({
        title: 'Consent Approved',
        description: 'You have successfully approved access for your child.',
      });

      // Show success message
      setConsentData({ ...consentData, status: 'approved' });
    } catch (error) {
      console.error('Failed to approve consent:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve consent. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!consentData) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('parental_consents')
        .update({
          status: 'denied',
          denied_at: new Date().toISOString(),
          denied_ip: await getClientIP()
        })
        .eq('consent_token', token);

      if (error) throw error;

      toast({
        title: 'Consent Denied',
        description: 'You have denied access for your child.',
      });

      setConsentData({ ...consentData, status: 'denied' });
    } catch (error) {
      console.error('Failed to deny consent:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    // In production, this would get the actual IP
    // For now, return a placeholder
    return '0.0.0.0';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !consentData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error || 'An error occurred.'}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (consentData.status !== 'pending') {
    const isApproved = consentData.status === 'approved';
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isApproved ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Consent Approved
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Consent Denied
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              {isApproved 
                ? 'You have already approved this consent request.'
                : 'You have already denied this consent request.'
              }
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const childAge = calculateAge(consentData.child_birth_date);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Parental Consent Required
            </CardTitle>
            <Badge variant="secondary">UAE Compliant</Badge>
          </div>
          <CardDescription>
            Your child has requested access to MyDub.AI. Please review and approve or deny their request.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As per UAE Federal Law No. 45 of 2021, parental consent is required for users under 18 years of age.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Child's Age</p>
                <p className="text-sm text-muted-foreground">{childAge} years old</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Request Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(consentData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">What is MyDub.AI?</h3>
            <p className="text-sm text-muted-foreground">
              MyDub.AI is an AI-powered information platform for Dubai residents and visitors. 
              It provides access to government services information, news, tourism guides, and 
              AI-powered assistance in multiple languages.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">What we collect from minors:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Basic account information (name, email)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Usage data to improve the service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Chat interactions with our AI assistant</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Language and accessibility preferences</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Safety measures for minors:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Age-appropriate content filtering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>No marketing or advertising to minors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Enhanced privacy protections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ability to delete account and data at any time</span>
              </li>
            </ul>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="agree" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label htmlFor="agree" className="text-sm">
              I have read and understood the above information. I consent to my child using 
              MyDub.AI in accordance with the{' '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" target="_blank" className="text-primary hover:underline">
                Terms of Service
              </a>.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={submitting}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deny Access
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!agreed || submitting}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Access
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you have any questions, please contact our support team at{' '}
            <a href="mailto:support@mydub.ai" className="text-primary hover:underline">
              support@mydub.ai
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ParentalConsentPage;