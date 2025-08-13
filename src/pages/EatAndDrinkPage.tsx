import React from 'react';
import { Utensils, Calendar, MapPin, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentDistributionService } from '@/shared/services/content-distribution.service';
import { useStructuredData } from '@/hooks/useStructuredData';

const EatAndDrinkPage: React.FC = () => {
  const navigate = useNavigate();
  const featuredArticles = contentDistributionService.getFeaturedArticlesForCategory('eatanddrink', 3);
  
  // Add structured data for SEO
  useStructuredData('restaurant-listing');

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
      {/* Clean Header */}
      <div className="px-4 py-20 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-midnight-black tracking-tight mb-4">
            Dining in Dubai
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Discover culinary excellence across the city
          </p>
        </div>
      </div>

      {/* Featured Content Section */}
      {featuredArticles.length > 0 && (
        <div className="py-20 bg-white">
          <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="text-2xl font-light text-midnight-black tracking-tight mb-2">
                Latest discoveries
              </h2>
              <p className="text-gray-500">
                Explore Dubai's dynamic food scene
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
        </div>
      )}

      {/* Clean Experience Cards */}
      <div className="py-20 bg-gray-50">
        <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-2xl font-light text-midnight-black tracking-tight mb-2">
              Experiences
            </h2>
            <p className="text-gray-500">
              Curated dining adventures
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Fine Dining */}
            <div className="bg-white border border-gray-100 p-8 transition-all duration-300 hover:opacity-95">
              <h3 className="text-lg font-medium text-midnight-black tracking-tight mb-4">Fine Dining</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Exclusive access to Dubai's most sought-after restaurants and celebrity chef experiences
              </p>
              <div className="text-sm text-gray-400">Launching Soon</div>
            </div>

            {/* Food Tours */}
            <div className="bg-white border border-gray-100 p-8 transition-all duration-300 hover:opacity-95">
              <h3 className="text-lg font-medium text-midnight-black tracking-tight mb-4">Food Tours</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Guided culinary journeys through Dubai's diverse neighborhoods and hidden food gems
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            {/* Private Dining */}
            <div className="bg-white border border-gray-100 p-8 transition-all duration-300 hover:opacity-95">
              <h3 className="text-lg font-medium text-midnight-black tracking-tight mb-4">Private Chef</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Intimate dining experiences with world-class chefs in exclusive Dubai locations
              </p>
              <div className="text-sm text-gray-400">Preview Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean CTA Section */}
      <div className="py-20 bg-white border-t border-gray-100">
        <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-light text-midnight-black tracking-tight mb-4">
            Get early access
          </h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">
            Be the first to access Dubai's most exclusive culinary experiences
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
};

export default EatAndDrinkPage; 