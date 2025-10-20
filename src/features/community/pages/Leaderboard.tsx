/**
 * Leaderboard Page
 * Phase 3.5.2: Display top users by reputation
 */

import { useEffect, useState } from 'react'
import { ReputationService, LeaderboardEntry, ReputationLevelInfo } from '../services/reputation.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { Link } from 'react-router-dom'

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [levels, setLevels] = useState<ReputationLevelInfo[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    checkUserRank()
  }, [])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const data = await ReputationService.getLeaderboard(100)
      setLeaderboard(data)

      const levelData = await ReputationService.getReputationLevels()
      setLevels(levelData)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserRank = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const rank = await ReputationService.getUserRank(user.id)
        setUserRank(rank)
      }
    } catch (error) {
      console.error('Error checking user rank:', error)
    }
  }

  const getLevelInfo = (level: string): ReputationLevelInfo | undefined => {
    return levels.find(l => l.level === level)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-medium text-gray-500">#{rank}</span>
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-ai-blue" />
          Community Leaderboard
        </h1>
        <p className="text-gray-600">
          Top contributors building the MyDub.AI community
        </p>
      </div>

      {/* User's Rank Card */}
      {userId && userRank && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Rank</p>
                <p className="text-3xl font-bold text-ai-blue">#{userRank}</p>
              </div>
              <Link to="/profile" className="text-sm text-ai-blue hover:underline">
                View Your Profile →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="top100" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top100">Top 100</TabsTrigger>
          <TabsTrigger value="levels">Levels Guide</TabsTrigger>
        </TabsList>

        {/* Top 100 Tab */}
        <TabsContent value="top100">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>
                Users ranked by reputation score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-gray-500">
                  Loading leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No users yet. Be the first to earn reputation!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map(entry => {
                    const levelInfo = getLevelInfo(entry.level)
                    const isCurrentUser = userId === entry.userId

                    return (
                      <div
                        key={entry.userId}
                        className={`flex items-center gap-4 rounded-lg p-4 transition-colors ${
                          isCurrentUser
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex w-12 items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>

                        {/* Avatar */}
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${entry.userId}`} />
                          <AvatarFallback>
                            {entry.displayName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/profile/${entry.userId}`}
                              className="font-medium hover:text-ai-blue"
                            >
                              {entry.displayName || 'Anonymous'}
                            </Link>
                            {isCurrentUser && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {levelInfo && (
                              <>
                                <span>{levelInfo.icon}</span>
                                <span style={{ color: levelInfo.color || '#64748b' }}>
                                  {levelInfo.displayName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-ai-blue">
                            {entry.reputationScore.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Levels Guide Tab */}
        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle>Reputation Levels</CardTitle>
              <CardDescription>
                Earn points to level up and unlock new privileges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {levels.map(level => (
                  <div key={level.level} className="border-b pb-6 last:border-0">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{level.icon}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{level.displayName}</h3>
                          <p className="text-sm text-gray-500">
                            {level.minScore} - {level.maxScore || '∞'} points
                          </p>
                        </div>
                      </div>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: level.color || '#64748b' }}
                      />
                    </div>

                    <p className="mb-3 text-sm text-gray-600">{level.description}</p>

                    {level.privileges.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium">Privileges:</h4>
                        <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {level.privileges.map(privilege => (
                            <li key={privilege} className="flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              <span className="capitalize">{privilege.replace(/_/g, ' ')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* How to Earn Points */}
              <div className="mt-8 rounded-lg bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-semibold">How to Earn Points</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">+5</span>
                    <span className="text-sm">Post a comment</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">+10</span>
                    <span className="text-sm">Comment gets 5 upvotes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">+20</span>
                    <span className="text-sm">Comment gets 10 upvotes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">+50</span>
                    <span className="text-sm">Comment gets 25 upvotes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">+100</span>
                    <span className="text-sm">Comment gets 50 upvotes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">+15</span>
                    <span className="text-sm">Helpful content flag</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-600">-20</span>
                    <span className="text-sm">Comment flagged for moderation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
