import React from 'react';
import { Waves, Calendar, MapPin, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentDistributionService } from '@/shared/services/content-distribution.service';

const BeachesPage: React.FC = () => {
  const navigate = useNavigate();
  const featuredArticles = contentDistributionService.getFeaturedArticlesForCategory('beaches', 3);

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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                <Waves className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Dubai Beaches
            </h1>
            <p className="max-w-2xl mx-auto mt-6 text-xl text-cyan-100">
              Discover pristine coastlines, crystal-clear waters, and endless beach experiences in Dubai
            </p>
            <div className="inline-flex items-center px-6 py-3 mt-8 text-sm font-medium text-cyan-600 bg-white/90 backdrop-blur-sm rounded-full">
              <Calendar className="w-4 h-4 mr-2" />
              Coming Soon - Premium Beach Experiences
            </div>
          </div>
        </div>
      </div>

      {/* Featured Content Section */}
      {featuredArticles.length > 0 && (
        <div className="py-16 bg-white">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Latest Beach & Coastal Experiences
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the best beach activities, coastal dining, and waterfront experiences Dubai has to offer
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={getImageUrl(article.image_path)}
                      alt={article.image_alt || article.headline}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.background = 'linear-gradient(to bottom right, #06b6d4, #3b82f6)';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                        {article.category}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                      {article.headline}
                    </h3>
                    <div className="text-sm text-gray-600 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Dubai • {new Date(article.publish_date).toLocaleDateString()}
                    </div>
                    <button 
                      className="inline-flex items-center text-cyan-600 hover:text-cyan-700 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArticleClick(article);
                      }}
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Cards */}
      <div className="py-16 bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Beach Experiences Coming Soon
            </h2>
            <p className="text-lg text-gray-600">
              Get ready for the ultimate Dubai beach lifestyle
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Beach Clubs */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Premium Beach Clubs</h3>
              <p className="text-gray-600 mb-6">
                Exclusive access to Dubai's most luxurious beachfront destinations with world-class amenities
              </p>
              <div className="text-cyan-600 font-medium">Launching Soon</div>
            </div>

            {/* Water Sports */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Waves className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Water Sports & Activities</h3>
              <p className="text-gray-600 mb-6">
                Jet skiing, parasailing, diving, and more aquatic adventures along Dubai's stunning coastline
              </p>
              <div className="text-cyan-600 font-medium">Coming Soon</div>
            </div>

            {/* Coastal Dining */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Beachfront Dining</h3>
              <p className="text-gray-600 mb-6">
                Oceanview restaurants, beach bars, and seaside cafes offering the finest coastal cuisine
              </p>
              <div className="text-cyan-600 font-medium">Preview Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready for Beach Paradise?
          </h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Be the first to experience Dubai's most exclusive beach destinations and coastal adventures
          </p>
          <button 
            onClick={() => navigate('/contact')}
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-cyan-600 bg-white rounded-full hover:bg-cyan-50 transition-colors duration-200"
          >
            Get Notified When Live
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeachesPage; 