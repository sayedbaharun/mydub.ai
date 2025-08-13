/**
 * Article Workflow - Manage article editorial workflow
 * Interface for managing articles through the editorial process
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { 
  FileText, 
  Edit3, 
  Eye, 
  Clock, 
  User,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useArticles } from '../hooks/useEditorialWorkflow';
import type { ArticleStatus, ArticleFilters } from '../types/editorial.types';

export function ArticleWorkflow() {
  const [filters, setFilters] = useState<ArticleFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const { articles, isLoading } = useArticles(filters);

  const statusCounts = {
    all: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    in_progress: articles.filter(a => a.status === 'in_progress').length,
    submitted: articles.filter(a => a.status === 'submitted').length,
    in_review: articles.filter(a => a.status === 'in_review').length,
    approved: articles.filter(a => a.status === 'approved').length,
    published: articles.filter(a => a.status === 'published').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Article Workflow
          </h2>
          <p className="text-gray-600 mt-1">Manage articles through the editorial process</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status?.[0] || 'all'} onValueChange={(value) => 
              setFilters({ ...filters, status: value === 'all' ? undefined : [value as ArticleStatus] })
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Articles</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Article Status Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all" className="relative">
            All <Badge className="ml-2 text-xs">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="relative">
            Drafts <Badge className="ml-2 text-xs">{statusCounts.draft}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="relative">
            In Progress <Badge className="ml-2 text-xs">{statusCounts.in_progress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="submitted" className="relative">
            Submitted <Badge className="ml-2 text-xs">{statusCounts.submitted}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_review" className="relative">
            In Review <Badge className="ml-2 text-xs">{statusCounts.in_review}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            Approved <Badge className="ml-2 text-xs">{statusCounts.approved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="published" className="relative">
            Published <Badge className="ml-2 text-xs">{statusCounts.published}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ArticleList articles={articles} />
        </TabsContent>
        <TabsContent value="draft">
          <ArticleList articles={articles.filter(a => a.status === 'draft')} />
        </TabsContent>
        <TabsContent value="in_progress">
          <ArticleList articles={articles.filter(a => a.status === 'in_progress')} />
        </TabsContent>
        <TabsContent value="submitted">
          <ArticleList articles={articles.filter(a => a.status === 'submitted')} />
        </TabsContent>
        <TabsContent value="in_review">
          <ArticleList articles={articles.filter(a => a.status === 'in_review')} />
        </TabsContent>
        <TabsContent value="approved">
          <ArticleList articles={articles.filter(a => a.status === 'approved')} />
        </TabsContent>
        <TabsContent value="published">
          <ArticleList articles={articles.filter(a => a.status === 'published')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArticleList({ articles }: { articles: any[] }) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No articles found</p>
          <p className="text-sm text-gray-400 mt-1">Articles matching your filters will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {articles.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleRow({ article }: { article: any }) {
  const isBreaking = article.breaking_news;
  const isOverdue = article.assignment?.deadline && 
    new Date(article.assignment.deadline) < new Date() && 
    !['published', 'approved'].includes(article.status);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-gray-900 truncate">{article.title}</h4>
            {isBreaking && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                BREAKING
              </Badge>
            )}
            {article.featured && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                FEATURED
              </Badge>
            )}
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                OVERDUE
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mb-2">
            <StatusBadge status={article.status} />
            <Badge variant="outline" className="text-xs">
              {article.category}
            </Badge>
            {article.word_count && (
              <span className="text-xs text-gray-500">{article.word_count} words</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {article.author_profile && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{article.author_profile.full_name}</span>
              </div>
            )}
            {article.assignment?.deadline && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Due {new Date(article.assignment.deadline).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
            </div>
            {article.scheduled_for && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Scheduled {new Date(article.scheduled_for).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {article.editor_profile && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={article.editor_profile.avatar_url} />
              <AvatarFallback>{article.editor_profile.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-800' },
    in_review: { label: 'In Review', color: 'bg-orange-100 text-orange-800' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    published: { label: 'Published', color: 'bg-green-100 text-green-800' },
    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800' }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  );
}