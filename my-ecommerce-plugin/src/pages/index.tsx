import { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Zap, Brain, ArrowRight, Star, Play, Check, Heart, TrendingUp, Users, Award } from 'lucide-react';

export default function ModernLandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating animation for hero elements
  const floatingAnimation = {
    transform: `translateY(${Math.sin(Date.now() * 0.001) * 10}px)`,
    transition: 'transform 0.1s ease-out'
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Style Matching via Image",
      description: "Upload photos, selfies, or screenshots to get matching and complementary product recommendations powered by advanced AI."
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Function-Based Product Search",
      description: `Natural language queries like "pink shirt for a picnic" return curated recommendations based on purpose and context.`
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Retailer API Integration",
      description: "Plug-and-play solution for major brands to connect their catalogs and enable real-time, stock-based recommendations."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Style Persona Recognition",
      description: "Personalized recommendations that align with individual aesthetic preferences using multimodal AI embeddings."
    }
  ];

  const stats = [
    { number: "26M+", label: "User in Thailand", icon: <Users className="w-6 h-6" /> },
    { number: "500M", label: "Digital buyers across Asia", icon: <Award className="w-6 h-6" /> },
    { number: "50+", label: "Major e-commerce platforms in SEA", icon: <TrendingUp className="w-6 h-6" /> },
    { number: "85%", label: "Consumers prefer personalized shopping", icon: <Brain className="w-6 h-6" /> }
  ];

  const testimonials = [
    {
      name: "Pattarathon Nopwattanapong",
      role: "Kong",
      content: "Redbull mixed well with jagermeister",
      rating: 5,
      avatar: "/assets/Kong.png"
    },
    {
      name: "Kandanai Leenutaphong",
      role: "Mew",
      content: "@warwick_cuteboy_thailand",
      rating: 5,
      avatar: "/assets/Mew.png"
    },
    {
      name: "Phudish Prateepamornkul",
      role: "Tam",
      content: "Warwick is not the place, it's the people",
      rating: 5,
      avatar: "assets/Tam.png"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-black to-gray-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-gray-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
                VibeShopping.AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#demo" className="text-gray-300 hover:text-white transition-colors">Video Demo</a>
              <a href="/demo" className="text-gray-300 hover:text-white transition-colors">Live Demo</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-8" style={floatingAnimation}>
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm text-gray-300">Next Hackathon</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-200 to-gray-200 bg-clip-text text-transparent">
              Shop Smarter
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
              with AI Magic
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your shopping experience with AI that understands your style, predicts your preferences,
            and discovers products you'll absolutely love.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <a href="/demo">
              <button className="cursor-pointer group px-8 py-4 bg-gradient-to-r from-blue-600 to-gray-600 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-gray-700 transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/25 flex items-center">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Play with Live Demo
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </a>
            <a href="#demo">
              <button className="px-8 py-4 border-2 border-white/20 rounded-full font-semibold text-lg hover:bg-white/10 backdrop-blur-lg transition-all">
                Video Demo
              </button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-gray-600 rounded-xl mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
                Revolutionary Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of e-commerce with AI-powered features that understand you better than you understand yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-500 hover:transform hover:scale-105"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-gray-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section id="demo" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
                See It In Action
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Watch how our AI transforms the shopping experience in real-time.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600/20 to-gray-600/20 rounded-3xl p-4 sm:p-8 backdrop-blur-lg border border-white/10">
              <div className="aspect-video rounded-2xl overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src="https://youtu.be/lxaSaxQhsJ8"
                  title="VibeShopping.AI Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
                Meet Our Founder
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The Warwick Cute Boy - just a university reunion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-gray-600/20 rounded-3xl p-12 backdrop-blur-lg border border-white/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
                Your Shopping?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join millions of smart shoppers who've discovered the future of e-commerce with AI-powered recommendations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-gray-600 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-gray-700 transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/25 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Shopping Smarter
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border-2 border-white/20 rounded-full font-semibold text-lg hover:bg-white/10 backdrop-blur-lg transition-all">
                Try Free Demo
              </button>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-gray-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-gray-400 bg-clip-text text-transparent">
              VibeShopping AI
            </span>
          </div>
          <p className="text-gray-400 mb-8">
            © {new Date().getFullYear()} VibeShopping.AI. Revolutionizing e-commerce with artificial intelligence.
          </p>
          <div className="flex items-center justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Support</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}