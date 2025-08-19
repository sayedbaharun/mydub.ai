import { Link } from 'react-router-dom'
import { Heart, Mail, MapPin, Globe } from 'lucide-react'
import { FooterArea } from '@/shared/components/accessibility/SkipLinks'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <FooterArea className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/mydub-logo-200.png" 
                alt="MyDub.AI" 
                className="h-16 w-auto brightness-0 invert object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Your AI-powered guide to Dubai. Discover the best of Dubai with intelligent recommendations and real-time information.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Dubai, UAE</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Explore</h3>
            <div className="space-y-2">
              <Link to="/news" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Today
              </Link>
              <Link to="/eatanddrink" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Dining
              </Link>
              <Link to="/tourism" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Experiences
              </Link>
              <Link to="/nightlife" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Nightlife
              </Link>
              <Link to="/luxurylife" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Luxury
              </Link>
              <Link to="/government" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Practical
              </Link>
            </div>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Support</h3>
            <div className="space-y-2">
              <Link to="/help" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Help Center
              </Link>
              <Link to="/about" className="block text-gray-400 hover:text-white transition-colors text-sm">
                About Us
              </Link>
              <Link to="/contact" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Contact
              </Link>
              <Link to="/faq" className="block text-gray-400 hover:text-white transition-colors text-sm">
                FAQ
              </Link>
              <Link to="/chat" className="block text-gray-400 hover:text-white transition-colors text-sm">
                AI Assistant
              </Link>
            </div>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Legal</h3>
            <div className="space-y-2">
              <Link to="/privacy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/legal/content-policy" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Content Policy
              </Link>
              <Link to="/legal/ai-ethics" className="block text-gray-400 hover:text-white transition-colors text-sm">
                AI Ethics
              </Link>
            </div>
            <div className="space-y-2 pt-4">
              <h4 className="text-sm font-medium text-white">Get in Touch</h4>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4" />
                <span>hello@mydub.ai</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Globe className="h-4 w-4" />
                <span>mydub.ai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {currentYear} MyDub.AI. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="hidden md:inline">•</span>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span className="hidden md:inline">•</span>
              <Link to="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-1">
                Made with <Heart className="h-4 w-4 text-red-500" /> for Dubai
              </div>
            </div>
          </div>
        </div>
      </div>
    </FooterArea>
  )
}