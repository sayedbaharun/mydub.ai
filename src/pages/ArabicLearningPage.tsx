import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Search, ChevronLeft, ChevronRight, Languages, BookOpen, Globe } from 'lucide-react'
import { ArabicPhrasesService, ArabicPhrase } from '@/shared/services/arabicPhrases.service'

export default function ArabicLearningPage() {
  const [phrases, setPhrases] = useState<ArabicPhrase[]>([])
  const [filteredPhrases, setFilteredPhrases] = useState<ArabicPhrase[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const phrasesPerPage = 20

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPhrases()
  }, [phrases, searchTerm, selectedCategory, selectedDifficulty])

  const loadData = async () => {
    try {
      setLoading(true)
      const [phrasesData, categoriesData] = await Promise.all([
        ArabicPhrasesService.getAllPhrases(),
        ArabicPhrasesService.getCategories()
      ])
      setPhrases(phrasesData.data)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading Arabic phrases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPhrases = () => {
    let filtered = [...phrases]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(phrase =>
        phrase.arabic_text.includes(searchTerm) ||
        phrase.english_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phrase.pronunciation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(phrase => phrase.category === selectedCategory)
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(phrase => phrase.difficulty === selectedDifficulty)
    }

    setFilteredPhrases(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      greetings: '👋',
      numbers: '🔢',
      directions: '🧭',
      food: '🍽️',
      shopping: '🛍️',
      emergency: '🚨',
      transport: '🚗',
      business: '💼',
      family: '👨‍👩‍👧‍👦',
      weather: '☀️',
      expressions: '💬'
    }
    return icons[category] || '📝'
  }

  // Pagination
  const totalPages = Math.ceil(filteredPhrases.length / phrasesPerPage)
  const startIndex = (currentPage - 1) * phrasesPerPage
  const endIndex = startIndex + phrasesPerPage
  const currentPhrases = filteredPhrases.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-light text-midnight-black mb-2">
            Arabic Language Learning
          </h1>
          <p className="text-lg text-gray-600">
            Master 300 essential Arabic phrases for life in Dubai
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Phrases</p>
                  <p className="text-2xl font-semibold text-midnight-black">{phrases.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-ai-blue" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-semibold text-midnight-black">{categories.length}</p>
                </div>
                <Languages className="h-8 w-8 text-desert-gold" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Phrase</p>
                  <p className="text-lg font-medium text-midnight-black">Check Homepage</p>
                </div>
                <Globe className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search phrases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedDifficulty('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phrases Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ai-blue"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Arabic</TableHead>
                        <TableHead className="w-[200px]">English</TableHead>
                        <TableHead className="w-[200px]">Pronunciation</TableHead>
                        <TableHead className="w-[150px]">Category</TableHead>
                        <TableHead className="w-[100px]">Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPhrases.map((phrase) => (
                        <TableRow key={phrase.id}>
                          <TableCell className="font-medium" dir="rtl">
                            <span className="text-lg">{phrase.arabic_text}</span>
                          </TableCell>
                          <TableCell>{phrase.english_text}</TableCell>
                          <TableCell className="text-gray-600 italic">
                            {phrase.pronunciation}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getCategoryIcon(phrase.category)}</span>
                              <span className="capitalize">{phrase.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDifficultyColor(phrase.difficulty)}>
                              {phrase.difficulty}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredPhrases.length)} of{' '}
                      {filteredPhrases.length} phrases
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}