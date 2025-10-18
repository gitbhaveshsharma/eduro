'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { useCurrentProfile, useCurrentProfileLoading } from '@/lib/profile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ComponentLoadingSpinner } from '@/components/ui/loading-spinner'
import { BookOpen, Users, Trophy, GraduationCap, ChevronRight } from 'lucide-react'
import { getAuthRedirectDestination } from '@/lib/utils/auth-redirect'

export default function HomePage() {
  const { user, isInitialized } = useAuthStore()
  const profile = useCurrentProfile()
  const profileLoading = useCurrentProfileLoading()
  const router = useRouter()

  // Redirect authenticated users based on onboarding status
  useEffect(() => {
    if (isInitialized && user && !profileLoading && profile) {
      // Determine redirect destination based on onboarding status
      const redirectResult = getAuthRedirectDestination(profile as any)
      router.push(redirectResult.destination)
    }
  }, [user, isInitialized, profileLoading, profile, router])

  // Show loading while checking auth state or profile
  if (!isInitialized || (user && profileLoading)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <ComponentLoadingSpinner
          component={user ? "profile" : "authentication"}
          size="lg"
        />
      </main>
    )
  }

  // Don't render if user is authenticated (they'll be redirected)
  if (user && profile) {
    return null
  }

  // Show public landing page for non-authenticated users
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#111827] mb-6">
              Welcome to <span className="text-[#1D4ED8]">Tutrsy</span>
            </h1>
            <p className="text-xl text-[#6B7280] mb-8 max-w-3xl mx-auto">
              Transform your learning journey with our comprehensive education platform.
              Connect with teachers, join courses, and achieve your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#1D4ED8] hover:bg-[#1e40af] text-white px-8 py-4 text-lg"
                onClick={() => router.push('/login')}
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#1D4ED8] text-[#1D4ED8] hover:bg-[#1D4ED8] hover:text-white px-8 py-4 text-lg"
                onClick={() => router.push('/about')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
              Why Choose Tutrsy?
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Our platform offers everything you need for a complete learning experience
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-[#1D4ED8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-[#1D4ED8]" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-4">
                  Quality Courses
                </h3>
                <p className="text-[#6B7280]">
                  Access hundreds of courses from expert instructors across various subjects
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-4">
                  Connect & Learn
                </h3>
                <p className="text-[#6B7280]">
                  Join a community of learners and educators from around the world
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-8 w-8 text-[#F59E0B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-4">
                  Track Progress
                </h3>
                <p className="text-[#6B7280]">
                  Monitor your learning journey with detailed analytics and achievements
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1D4ED8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and educators already using Tutrsy to reach their goals
          </p>
          <Button
            size="lg"
            className="bg-white text-[#1D4ED8] hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            onClick={() => router.push('/login')}
          >
            Sign Up Today
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Tutrsy</h3>
            <p className="text-gray-400 mb-6">
              Empowering education through technology
            </p>
            <div className="flex justify-center space-x-6">
              <button className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                Contact Us
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400">
                © 2025 Tutrsy. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
