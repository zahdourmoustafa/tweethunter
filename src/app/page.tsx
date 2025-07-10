"use client";

import { useAuth } from "@/lib/auth-client";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Twitter, Zap, Target, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">You're already signed in.</p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{APP_CONFIG.name}</span>
          </div>
          <LoginButton variant="outline">
            Sign In
          </LoginButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-Powered Content Creation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Turn Viral Tweets Into
              <span className="text-primary"> Your Content</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover high-engagement tweets and use AI to create authentic, 
              human-like variations that drive engagement and growth.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LoginButton size="lg" className="text-lg px-8 py-6">
              <Twitter className="mr-2 h-5 w-5" />
              Get Started with Twitter
            </LoginButton>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Free to start • No credit card required • Twitter OAuth
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to create viral content
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI tools and tweet discovery to transform your content strategy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Tweet Discovery</CardTitle>
                <CardDescription>
                  Find high-engagement tweets by topic with real metrics and engagement data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI Content Tools</CardTitle>
                <CardDescription>
                  12 powerful AI tools to transform tweets into your authentic voice and style
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Performance Tracking</CardTitle>
                <CardDescription>
                  Track your content performance and optimize your strategy with analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data is secure with enterprise-grade security and privacy protection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Twitter className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Twitter Integration</CardTitle>
                <CardDescription>
                  Seamless Twitter OAuth integration for secure and easy authentication
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Human-like AI</CardTitle>
                <CardDescription>
                  Generate content that feels natural and authentic, not robotic or generic
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to transform your content?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join creators who are already using TweetInspire to grow their audience
            </p>
          </div>

          <LoginButton size="lg" className="text-lg px-8 py-6">
            <Twitter className="mr-2 h-5 w-5" />
            Start Creating Now
          </LoginButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_CONFIG.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
