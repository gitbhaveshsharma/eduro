import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/auth-store'
import { 
  OtpVerificationData, 
  EmailOtpRequestData,
  PhoneOtpRequestData,
  PhoneOtpVerificationData
} from '@/lib/validations'
import { AuthError, AuthResponse, OAuthResponse } from '@supabase/supabase-js'

// Provider type for OAuth
export type Provider = 'google' | 'github' | 'facebook'

// Auth service response types
export interface AuthServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  isNewUser?: boolean
}

// Profile data type
export interface ProfileData {
  full_name?: string
  role?: 'S' | 'T' | 'C'
}

class AuthService {
  private getRedirectUrl(): string {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'http://localhost:3000'
    return `${baseUrl}/auth/callback`
  }







  /**
   * Sign in with Email OTP
   */
  async signInWithEmailOtp(data: EmailOtpRequestData): Promise<AuthServiceResponse> {
    try {
      console.log('Attempting to send email OTP to:', data.email)
      
      const { data: authData, error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          // Add default role for new users created via OTP
          data: {
            role: 'S' // Default to Student role for OTP signups
          }
        },
      })

      console.log('Supabase email OTP response:', { authData, error })

      if (error) {
        console.error('Supabase email OTP error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.status,
          name: error.name,
          cause: error.cause
        })
        return {
          success: false,
          error: this.formatAuthError(error),
        }
      }

      return {
        success: true,
        data: authData,
        message: 'Check your email for the verification code',
      }
    } catch (error) {
      console.error('Unexpected error in signInWithEmailOtp:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while sending email OTP',
      }
    }
  }

  /**
   * Sign in with Phone OTP
   */
  async signInWithPhoneOtp(data: PhoneOtpRequestData): Promise<AuthServiceResponse> {
    try {
      console.log('Attempting to send phone OTP to:', data.phone)
      
      const { data: authData, error } = await supabase.auth.signInWithOtp({
        phone: data.phone,
        options: {
          shouldCreateUser: true,
          // Add default role for new users created via OTP
          data: {
            role: 'S' // Default to Student role for OTP signups
          }
        },
      })

      console.log('Supabase phone OTP response:', { authData, error })

      if (error) {
        console.error('Supabase phone OTP error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.status,
          name: error.name,
          cause: error.cause
        })
        return {
          success: false,
          error: this.formatAuthError(error),
        }
      }

      return {
        success: true,
        data: authData,
        message: 'Check your phone for the verification code',
      }
    } catch (error) {
      console.error('Unexpected error in signInWithPhoneOtp:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while sending phone OTP',
      }
    }
  }

  /**
   * Verify Email OTP
   */
  async verifyEmailOtp(data: OtpVerificationData): Promise<AuthServiceResponse> {
    try {
      const { data: authData, error } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type: 'email',
      })

      if (error) {
        return {
          success: false,
          error: this.formatAuthError(error),
        }
      }

      // Fetch user profile
      if (authData.user) {
        await this.fetchUserProfile(authData.user.id)
      }

      return {
        success: true,
        data: authData,
        message: 'Login successful',
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during email OTP verification',
      }
    }
  }

  /**
   * Verify Phone OTP
   */
  async verifyPhoneOtp(data: PhoneOtpVerificationData): Promise<AuthServiceResponse> {
    try {
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: data.phone,
        token: data.otp,
        type: 'sms',
      })

      if (error) {
        return {
          success: false,
          error: this.formatAuthError(error),
        }
      }

      // Fetch user profile
      if (authData.user) {
        await this.fetchUserProfile(authData.user.id)
      }

      return {
        success: true,
        data: authData,
        message: 'Login successful',
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during phone OTP verification',
      }
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: Provider): Promise<AuthServiceResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: this.getRedirectUrl(),
        },
      })

      if (error) {
        return {
          success: false,
          error: this.formatAuthError(error),
        }
      }

      return {
        success: true,
        data,
        message: `Redirecting to ${provider}...`,
      }
    } catch (error) {
      return {
        success: false,
        error: `An unexpected error occurred during ${provider} login`,
      }
    }
  }



  /**
   * Sign out
   */
  async signOut(): Promise<AuthServiceResponse> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: this.formatAuthError(error),
        }
      }

      // Clear auth store
      useAuthStore.getState().clearAuth()

      return {
        success: true,
        message: 'Signed out successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign out',
      }
    }
  }

  /**
   * Fetch user profile from database
   */
  private async fetchUserProfile(userId: string): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && profile) {
        useAuthStore.getState().setProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  /**
   * Format Supabase auth errors into user-friendly messages
   */
  private formatAuthError(error: any): string {
    const msg: string = (error && error.message) || String(error || '')
    console.log('Formatting auth error:', { error, message: msg })
    
    switch (msg) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.'
      case 'User already registered':
        return 'An account with this email already exists. Please sign in instead.'
      case 'Signup not allowed for this instance':
        return 'Account registration is currently disabled. Please contact support.'
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.'
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address.'
      case 'Token has expired or is invalid':
        return 'The verification code has expired. Please request a new one.'
      case 'Email rate limit exceeded':
        return 'Too many emails sent. Please wait a few minutes before trying again.'
      case 'Too many requests':
        return 'Too many login attempts. Please wait a few minutes before trying again.'
      case 'Database error saving new user':
        // This typically indicates a database trigger/constraint prevented creating the profile row
        return 'We were unable to create your account due to a database schema or trigger issue. Please contact support or ensure your Supabase database has the latest migrations applied.'
      case 'Email sending is disabled':
        return 'Email authentication is currently disabled. Please contact support.'
      case 'SMTP settings not configured':
        return 'Email service is not properly configured. Please contact support.'
      default:
        // Fallback: handle substrings (some errors come prefixed)
        if (msg.includes('Database error saving new user')) {
          return 'We were unable to create your account due to a database schema or trigger issue. Please contact support or ensure your Supabase database has the latest migrations applied.'
        }
        if (msg.includes('SMTP') || msg.includes('email') || msg.includes('mail')) {
          return 'There was an issue sending the email. Please check your email address and try again, or contact support if the problem persists.'
        }
        if (msg.includes('rate limit') || msg.includes('too many')) {
          return 'Too many attempts. Please wait a few minutes before trying again.'
        }
        console.error('Unhandled auth error:', error)
        return msg || 'An unexpected error occurred. Please try again.'
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!useAuthStore.getState().user
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return useAuthStore.getState().user
  }

  /**
   * Get current user profile
   */
  getCurrentProfile() {
    return useAuthStore.getState().profile
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export provider names for UI components
export const OAUTH_PROVIDERS = {
  google: {
    name: 'Google',
    icon: 'google',
    bgColor: 'bg-white',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  github: {
    name: 'GitHub',
    icon: 'github',
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-gray-900',
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-600',
  },
} as const