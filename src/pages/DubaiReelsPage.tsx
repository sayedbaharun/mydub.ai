import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Video, Camera, Play, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentDistributionService } from '@/shared/services/content-distribution.service';

export function DubaiReelsPage() {
  const navigate = useNavigate();
  const featuredArticles = contentDistributionService.getFeaturedArticlesForCategory('dubaireels', 3);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mb-6">
            <Video className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Dubai in Reels
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Capture Dubai's most Instagram-worthy moments and trending video content
          </p>
          <div className="inline-flex items-center bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4 mr-2" />
            Viral content & trending experiences
          </div>
        </div>

        {/* Featured Content Section */}
        {featuredArticles.length > 0 && (
          <div className="py-16 bg-white rounded-xl shadow-lg mb-12">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Trending Dubai Experiences
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Discover the most shareable and Instagram-worthy experiences in Dubai
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
                          target.parentElement!.style.background = 'linear-gradient(to bottom right, #ec4899, #ef4444)';
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
                        className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
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
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center text-pink-700">
                <Camera className="h-5 w-5 mr-2" />
                Photo Spots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Most Instagrammable locations and hidden gems
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center text-pink-700">
                <Play className="h-5 w-5 mr-2" />
                Trending Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Viral videos and popular social media trends
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center text-pink-700">
                <Video className="h-5 w-5 mr-2" />
                Creator Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Photography and videography guides for Dubai
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Create content that goes viral
          </h2>
          <p className="text-gray-600 mb-8">
            We're building the ultimate guide for content creators and social media enthusiasts
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/contact')}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
          >
            Get Notified When Live
          </Button>
        </div>
      </div>
    </div>
  );
} 