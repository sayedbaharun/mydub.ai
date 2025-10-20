/**
 * Verification Request Page
 * Phase 3.5.1: Request Dubai Resident or Business Owner verification
 */

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Home, Building2, Star } from 'lucide-react'
import { VerificationService, UserVerification } from '../services/verification.service'
import { supabase } from '@/shared/lib/supabase'
import { useNavigate } from 'react-router-dom'

export function VerificationRequest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingVerifications, setExistingVerifications] = useState<UserVerification[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  // Resident verification form
  const [phoneNumber, setPhoneNumber] = useState('')

  // Business verification form
  const [businessName, setBusinessName] = useState('')
  const [tradeLicense, setTradeLicense] = useState('')
  const [linkedInProfile, setLinkedInProfile] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login?redirect=/verification')
      return
    }
    setUserId(user.id)
    loadExistingVerifications(user.id)
  }

  const loadExistingVerifications = async (uid: string) => {
    try {
      const verifications = await VerificationService.getUserVerifications(uid)
      setExistingVerifications(verifications)
    } catch (error) {
      console.error('Error loading verifications:', error)
    }
  }

  const handleResidentVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await VerificationService.requestResidentVerification(phoneNumber)
      setSuccess('Dubai Resident verification requested! We will verify your UAE phone number shortly.')
      setPhoneNumber('')
      if (userId) loadExistingVerifications(userId)
    } catch (err: any) {
      setError(err.message || 'Failed to request verification')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await VerificationService.requestBusinessVerification(
        businessName,
        tradeLicense,
        linkedInProfile || undefined
      )
      setSuccess('Business Owner verification requested! Our team will review your submission.')
      setBusinessName('')
      setTradeLicense('')
      setLinkedInProfile('')
      if (userId) loadExistingVerifications(userId)
    } catch (err: any) {
      setError(err.message || 'Failed to request verification')
    } finally {
      setLoading(false)
    }
  }

  const getVerificationStatus = (type: string) => {
    return existingVerifications.find(v => v.verificationType === type)
  }

  const residentStatus = getVerificationStatus('resident')
  const businessStatus = getVerificationStatus('business')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Get Verified</h1>
        <p className="text-gray-600">
          Earn badges to show your connection to Dubai and build trust with the community
        </p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Badge Benefits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Why Get Verified?</CardTitle>
          <CardDescription>Stand out and build trust in the MyDub.AI community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Dubai Resident 🔵</h3>
                <p className="text-sm text-gray-600">Show you live in Dubai</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Business Owner 🏢</h3>
                <p className="text-sm text-gray-600">Promote your Dubai business</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium">Community Contributor ⭐</h3>
                <p className="text-sm text-gray-600">Earned at 1000+ reputation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Forms */}
      <Tabs defaultValue="resident" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resident">Dubai Resident</TabsTrigger>
          <TabsTrigger value="business">Business Owner</TabsTrigger>
        </TabsList>

        {/* Resident Verification */}
        <TabsContent value="resident">
          <Card>
            <CardHeader>
              <CardTitle>Dubai Resident Verification 🔵</CardTitle>
              <CardDescription>
                Verify your UAE phone number to earn the Dubai Resident badge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {residentStatus ? (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Status: <strong className="capitalize">{residentStatus.status}</strong>
                      </span>
                      {residentStatus.status === 'approved' && (
                        <span className="text-green-600">✓ Verified</span>
                      )}
                      {residentStatus.status === 'pending' && (
                        <span className="text-yellow-600">⏳ Under Review</span>
                      )}
                      {residentStatus.status === 'rejected' && (
                        <span className="text-red-600">✗ Rejected</span>
                      )}
                    </div>
                    {residentStatus.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">
                        Reason: {residentStatus.rejectionReason}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResidentVerification} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">UAE Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be a valid UAE phone number starting with +971
                    </p>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Verification
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Verification */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Owner Verification 🏢</CardTitle>
              <CardDescription>
                Verify your Dubai business to earn the Business Owner badge
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businessStatus ? (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Status: <strong className="capitalize">{businessStatus.status}</strong>
                      </span>
                      {businessStatus.status === 'approved' && (
                        <span className="text-green-600">✓ Verified</span>
                      )}
                      {businessStatus.status === 'pending' && (
                        <span className="text-yellow-600">⏳ Under Review</span>
                      )}
                      {businessStatus.status === 'rejected' && (
                        <span className="text-red-600">✗ Rejected</span>
                      )}
                    </div>
                    {businessStatus.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">
                        Reason: {businessStatus.rejectionReason}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleBusinessVerification} className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Your Dubai Business"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tradeLicense">Trade License Number</Label>
                    <Input
                      id="tradeLicense"
                      type="text"
                      placeholder="123456"
                      value={tradeLicense}
                      onChange={e => setTradeLicense(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Your Dubai trade license number
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedInProfile}
                      onChange={e => setLinkedInProfile(e.target.value)}
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Helps us verify your business ownership
                    </p>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Verification
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Community Contributor Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Community Contributor Badge ⭐</CardTitle>
          <CardDescription>
            Automatically earned when you reach 1000+ reputation points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Build your reputation by posting quality comments, helping others, and contributing to the
            community. The Community Contributor badge is awarded automatically when you reach 1000
            reputation points.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
