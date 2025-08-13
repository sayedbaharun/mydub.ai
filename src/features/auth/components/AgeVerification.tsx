import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Shield, AlertCircle, User, Mail } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/lib/supabase';

interface AgeVerificationProps {
  onVerified: (data: { age: number; parentalConsent?: boolean }) => void;
  onCancel?: () => void;
}

interface VerificationData {
  birthDate: string;
  parentEmail?: string;
  parentPhone?: string;
  consentToken?: string;
}

export function AgeVerification({ onVerified, onCancel }: AgeVerificationProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState<'age' | 'parental-consent' | 'pending'>('age');
  const [verificationData, setVerificationData] = useState<VerificationData>({
    birthDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleAgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const birthDate = new Date(verificationData.birthDate);
    const age = calculateAge(birthDate);

    if (age < 13) {
      setError(t('ageVerification.tooYoung', 'You must be at least 13 years old to use this service.'));
      return;
    }

    if (age >= 18) {
      // Adult user - proceed directly
      await storeVerification(age, true);
      onVerified({ age, parentalConsent: false });
    } else {
      // Minor - require parental consent
      setStep('parental-consent');
    }
  };

  const handleParentalConsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Generate consent token
      const consentToken = crypto.randomUUID();
      
      // Store pending consent in database
      const { error: dbError } = await supabase
        .from('parental_consents')
        .insert({
          child_birth_date: verificationData.birthDate,
          parent_email: verificationData.parentEmail,
          parent_phone: verificationData.parentPhone,
          consent_token: consentToken,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      // Send consent request to parent
      await sendParentalConsentRequest({
        email: verificationData.parentEmail!,
        phone: verificationData.parentPhone,
        token: consentToken
      });

      setVerificationData({ ...verificationData, consentToken });
      setStep('pending');
      
      toast({
        title: t('ageVerification.consentSent', 'Consent Request Sent'),
        description: t('ageVerification.consentSentDesc', 'A consent request has been sent to your parent/guardian.'),
      });
    } catch (error) {
      console.error('Failed to send parental consent:', error);
      setError(t('ageVerification.consentError', 'Failed to send consent request. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const sendParentalConsentRequest = async (data: {
    email: string;
    phone?: string;
    token: string;
  }) => {
    // In production, this would send an actual email/SMS
    // For now, we'll simulate it
    const consentUrl = `${window.location.origin}/parental-consent?token=${data.token}`;
    
        // You would integrate with an email service here
    // await emailService.send({
    //   to: data.email,
    //   subject: 'Parental Consent Required - MyDub.AI',
    //   template: 'parental-consent',
    //   data: { consentUrl }
    // });
  };

  const storeVerification = async (age: number, isAdult: boolean) => {
    const verificationRecord = {
      birthDate: verificationData.birthDate,
      age,
      isAdult,
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };

    localStorage.setItem('age_verification', JSON.stringify(verificationRecord));
  };

  const checkPendingConsent = async () => {
    if (!verificationData.consentToken) return;

    try {
      const { data, error } = await supabase
        .from('parental_consents')
        .select('status')
        .eq('consent_token', verificationData.consentToken)
        .single();

      if (error) throw error;

      if (data?.status === 'approved') {
        const age = calculateAge(new Date(verificationData.birthDate));
        await storeVerification(age, false);
        onVerified({ age, parentalConsent: true });
        
        toast({
          title: t('ageVerification.consentApproved', 'Consent Approved'),
          description: t('ageVerification.consentApprovedDesc', 'Your parent/guardian has approved your access.'),
        });
      }
    } catch (error) {
      console.error('Failed to check consent status:', error);
    }
  };

  // Check pending consent status periodically
  React.useEffect(() => {
    if (step === 'pending' && verificationData.consentToken) {
      const interval = setInterval(checkPendingConsent, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [step, verificationData.consentToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('ageVerification.title', 'Age Verification Required')}
            </CardTitle>
            <Badge variant="secondary">UAE Compliant</Badge>
          </div>
          <CardDescription>
            {t('ageVerification.description', 'We need to verify your age to comply with UAE regulations.')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'age' && (
            <form onSubmit={handleAgeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('ageVerification.birthDate', 'Date of Birth')}
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={verificationData.birthDate}
                  onChange={(e) => setVerificationData({ ...verificationData, birthDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('ageVerification.minAge', 'You must be at least 13 years old to use MyDub.AI. Users aged 13-17 require parental consent.')}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    {t('common.cancel', 'Cancel')}
                  </Button>
                )}
                <Button type="submit" className="flex-1">
                  {t('ageVerification.verify', 'Verify Age')}
                </Button>
              </div>
            </form>
          )}

          {step === 'parental-consent' && (
            <form onSubmit={handleParentalConsentSubmit} className="space-y-4">
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  {t('ageVerification.parentalRequired', 'As you are under 18, we need your parent or guardian\'s consent.')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="parentEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('ageVerification.parentEmail', 'Parent/Guardian Email')}
                </Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={verificationData.parentEmail || ''}
                  onChange={(e) => setVerificationData({ ...verificationData, parentEmail: e.target.value })}
                  placeholder="parent@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone" className="flex items-center gap-2">
                  {t('ageVerification.parentPhone', 'Parent/Guardian Phone (Optional)')}
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={verificationData.parentPhone || ''}
                  onChange={(e) => setVerificationData({ ...verificationData, parentPhone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('age')}
                  disabled={loading}
                  className="flex-1"
                >
                  {t('common.back', 'Back')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading 
                    ? t('ageVerification.sending', 'Sending...')
                    : t('ageVerification.sendConsent', 'Send Consent Request')
                  }
                </Button>
              </div>
            </form>
          )}

          {step === 'pending' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('ageVerification.pendingDesc', 'We\'ve sent a consent request to your parent/guardian. You\'ll be able to access MyDub.AI once they approve.')}
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-2">
                <div className="animate-pulse">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('ageVerification.checkingStatus', 'Checking approval status...')}
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={onCancel}
                className="w-full"
              >
                {t('ageVerification.checkLater', 'I\'ll Check Back Later')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to check if age verification is needed
export function useAgeVerification() {
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('age_verification');
    
    if (!stored) {
      setNeedsVerification(true);
      return;
    }

    try {
      const data = JSON.parse(stored);
      const expiresAt = new Date(data.expiresAt);
      
      if (expiresAt < new Date()) {
        // Verification expired
        localStorage.removeItem('age_verification');
        setNeedsVerification(true);
      } else {
        setVerificationData(data);
        setNeedsVerification(false);
      }
    } catch {
      setNeedsVerification(true);
    }
  }, []);

  const clearVerification = () => {
    localStorage.removeItem('age_verification');
    setNeedsVerification(true);
    setVerificationData(null);
  };

  return {
    needsVerification,
    verificationData,
    clearVerification
  };
}