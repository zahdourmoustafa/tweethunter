"use client";

import { useAuth } from "@/lib/auth-client";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Twitter, 
  Zap, 
  Target, 
  BarChart3, 
  Shield, 
  ArrowRight, 
  Check, 
  Star,
  Users,
  TrendingUp,
  Globe,
  Smartphone,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {value}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

// Floating Elements Component
function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-40 left-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"
        animate={{
          y: [0, -25, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const pricingRef = useRef(null);

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-100px" });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          className="rounded-full h-12 w-12 border-4 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <motion.div 
        className="flex min-h-screen items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground mt-2">You&apos;re already signed in.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button asChild size="lg" className="group">
              <Link href="/dashboard" className="flex items-center">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 -z-10" />
      
      {/* Header */}
      <motion.header 
        className="border-b backdrop-blur-md bg-background/80 sticky top-0 z-50"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {APP_CONFIG.name}
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LoginButton variant="outline" className="group">
              <span>Sign In</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </LoginButton>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex-1 flex items-center justify-center py-20 overflow-hidden">
        <FloatingElements />
        
        <motion.div 
          className="container mx-auto px-4 text-center space-y-8 relative z-10"
          variants={staggerContainer}
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
        >
          <motion.div className="space-y-6" variants={fadeInUp}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium border border-primary/20 bg-primary/10">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-Powered Content Creation
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
              variants={fadeInUp}
            >
              Turn Viral Tweets Into
              <motion.span 
                className="block bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Your Content
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Discover high-engagement tweets and use AI to create authentic, 
              human-like variations that drive engagement and growth.
            </motion.p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={fadeInUp}
          >
            <LoginButton size="lg" className="text-lg px-8 py-4 h-14 group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl">
              <Twitter className="mr-2 h-5 w-5" />
              Get Started with Twitter
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </LoginButton>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-14 group border-2" asChild>
              <Link href="#features" className="flex items-center">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          <motion.p 
            className="text-sm text-muted-foreground flex items-center justify-center gap-4 flex-wrap"
            variants={fadeInUp}
          >
            <span className="flex items-center">
              <Check className="mr-1 h-4 w-4 text-green-500" />
              Free to start
            </span>
            <span className="flex items-center">
              <Check className="mr-1 h-4 w-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center">
              <Check className="mr-1 h-4 w-4 text-green-500" />
              Twitter OAuth
            </span>
          </motion.p>
        </motion.div>

        {/* Parallax Elements */}
        <motion.div
          className="absolute top-1/4 left-10 w-2 h-2 bg-primary rounded-full"
          style={{ y: y1 }}
        />
        <motion.div
          className="absolute top-1/3 right-10 w-3 h-3 bg-blue-500 rounded-full"
          style={{ y: y2 }}
        />
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-muted/30">
        <motion.div 
          className="container mx-auto px-4"
          variants={staggerContainer}
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
        >
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={staggerContainer}
          >
            <motion.div className="space-y-2" variants={scaleIn}>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter value={10000} suffix="+" />
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </motion.div>
            <motion.div className="space-y-2" variants={scaleIn}>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter value={1000000} suffix="+" />
              </div>
              <p className="text-sm text-muted-foreground">Tweets Analyzed</p>
            </motion.div>
            <motion.div className="space-y-2" variants={scaleIn}>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter value={99} suffix="%" />
              </div>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </motion.div>
            <motion.div className="space-y-2" variants={scaleIn}>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter value={24} suffix="/7" />
              </div>
              <p className="text-sm text-muted-foreground">Support Available</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-20">
        <motion.div 
          className="container mx-auto px-4"
          variants={staggerContainer}
          initial="hidden"
          animate={featuresInView ? "visible" : "hidden"}
        >
          <motion.div className="text-center space-y-4 mb-16" variants={fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold">
              Everything you need to create
              <span className="block text-primary">viral content</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI tools and tweet discovery to transform your content strategy
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
          >
            {[
              {
                icon: Target,
                title: "Tweet Discovery",
                description: "Find high-engagement tweets by topic with real metrics and engagement data",
                gradient: "from-red-500 to-pink-500"
              },
              {
                icon: Zap,
                title: "AI Content Tools",
                description: "12 powerful AI tools to transform tweets into your authentic voice and style",
                gradient: "from-yellow-500 to-orange-500"
              },
              {
                icon: BarChart3,
                title: "Performance Tracking",
                description: "Track your content performance and optimize your strategy with analytics",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is secure with enterprise-grade security and privacy protection",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Twitter,
                title: "Twitter Integration",
                description: "Seamless Twitter OAuth integration for secure and easy authentication",
                gradient: "from-blue-400 to-blue-600"
              },
              {
                icon: Sparkles,
                title: "Human-like AI",
                description: "Generate content that feels natural and authentic, not robotic or generic",
                gradient: "from-purple-500 to-indigo-500"
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={scaleIn}>
                <Card className="group h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader className="space-y-4">
                    <motion.div 
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 bg-muted/30">
        <motion.div 
          className="container mx-auto px-4"
          variants={staggerContainer}
          initial="hidden"
          animate={pricingInView ? "visible" : "hidden"}
        >
          <motion.div className="text-center space-y-4 mb-16" variants={fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works best for you. All plans include our core features.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
          >
            {[
              {
                name: "Starter",
                price: "Free",
                description: "Perfect for getting started",
                features: ["5 tweets per day", "Basic AI tools", "Community support"],
                popular: false
              },
              {
                name: "Pro",
                price: "$19",
                period: "/month",
                description: "For serious content creators",
                features: ["Unlimited tweets", "All AI tools", "Priority support", "Analytics dashboard"],
                popular: true
              },
              {
                name: "Team",
                price: "$49",
                period: "/month",
                description: "For teams and agencies",
                features: ["Everything in Pro", "Team collaboration", "Custom integrations", "Dedicated support"],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div key={index} variants={scaleIn}>
                <Card className={`relative h-full ${plan.popular ? 'border-primary shadow-xl shadow-primary/20 scale-105' : 'border-2 hover:border-primary/50'} transition-all duration-300`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center space-y-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="text-4xl font-bold">
                        {plan.price}
                        {plan.period && <span className="text-lg text-muted-foreground">{plan.period}</span>}
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </CardHeader>
                  <CardHeader className="pt-0">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10" />
        <motion.div 
          className="container mx-auto px-4 text-center space-y-8 relative z-10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="space-y-4">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              Ready to transform your content?
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            >
              Join creators who are already using {APP_CONFIG.name} to grow their audience
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <LoginButton size="lg" className="text-lg px-8 py-4 h-14 group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl">
              <Twitter className="mr-2 h-5 w-5" />
              Start Creating Now
              <Rocket className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </LoginButton>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="border-t py-12 bg-muted/50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">{APP_CONFIG.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transform your content strategy with AI-powered tweet discovery and creation.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 {APP_CONFIG.name}. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
