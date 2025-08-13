import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Crown, Gem, Star, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentDistributionService } from '@/shared/services/content-distribution.service';

export function LuxuryLifePage() {
  const navigate = useNavigate();
  const featuredArticles = contentDistributionService.getFeaturedArticlesForCategory('luxurylife', 3);

  const handleArticleClick = (article: any) => {
    const articleId = article.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/news/${articleId}`);
  };

  // Helper function to fix image URLs
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('images/')) {
      return `/news_articles_images/${imagePath.replace('images/', '')}`;
    }
    return imagePath;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Clean Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-midnight-black tracking-tight mb-4">
            Luxury in Dubai
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            The finest experiences the city offers
          </p>
        </div>

        {/* Featured Content Section */}
        {featuredArticles.length > 0 && (
          <div className="py-20 bg-white mb-20">
            <div className="mb-16">
              <h2 className="text-2xl font-light text-midnight-black tracking-tight mb-2">
                Latest luxury
              </h2>
              <p className="text-gray-500">
                Exclusive experiences and premium lifestyle
              </p>
            </div>
            
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article, index) => (
                <article 
                  key={index} 
                  className="group cursor-pointer transition-all duration-300 hover:opacity-95"
                  onClick={() => handleArticleClick(article)}
                >
                  <div className="relative overflow-hidden rounded-lg mb-4 bg-gray-50">
                    <img
                      src={getImageUrl(article.image_path)}
                      alt={article.image_alt || article.headline}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.background = '#f9fafb';
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium">{article.category}</span>
                      <span>•</span>
                      <time>{new Date(article.publish_date).toLocaleDateString()}</time>
                    </div>
                    
                    <h3 className="font-medium text-lg leading-tight text-midnight-black tracking-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
                      {article.headline}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Clean Service Cards */}
        <div className="py-20 bg-gray-50">
          <div className="mb-16">
            <h2 className="text-2xl font-light text-midnight-black tracking-tight mb-2">
              Services
            </h2>
            <p className="text-gray-500">
              Premium experiences and exclusive access
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-100 p-8 transition-all duration-300 hover:opacity-95">
              <h3 className="text-lg font-medium text-midnight-black tracking-tight mb-4">Shopping</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Designer boutiques and exclusive luxury brands
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-8 transition-all duration-300 hover:opacity-95">
              <h3 className="text-lg font-medium text-midnight-black tracking-tight mb-4">Premium Services</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Concierge, private jets, and bespoke experiences
              </p>
            </div>

            <div className="bg-white border border-gray-100 p-8 transition-all duration-300 hover:opacity-95">
              <h3 className="text-lg font-medium text-midnight-black tracking-tight mb-4">Elite Venues</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Private clubs and members-only establishments
              </p>
            </div>
          </div>
        </div>

        {/* Clean CTA Section */}
        <div className="py-20 bg-white border-t border-gray-100 text-center">
          <h2 className="text-2xl font-light text-midnight-black tracking-tight mb-4">
            Get early access
          </h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">
            Be the first to experience the most exclusive luxury offerings
          </p>
          <button 
            onClick={() => navigate('/contact')}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-midnight-black hover:bg-gray-800 transition-colors duration-200"
          >
            Get Notified
          </button>
        </div>
      </div>
    </div>
  );
} 