'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Home, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  async function handleLogin(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-50 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-xl">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Accom<span className="text-green-600">Hub</span>
                </h1>
                <p className="text-xs text-slate-500">Operations Platform</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {!showForgot ? (
              <>
                {error && (
                  <div className="flex items-start gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <form action={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" required>Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@company.com.au"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" required>Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-slate-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    size="lg"
                    loading={isPending}
                  >
                    {isPending ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">
                    Need access?{' '}
                    <a href="mailto:admin@metrostudenthousing.com.au" className="text-green-600 hover:text-green-700 font-medium">
                      Contact your administrator
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <>
                {forgotSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✉️</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Check your email</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      We sent a password reset link to <strong>{forgotEmail}</strong>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowForgot(false); setForgotSent(false) }}
                    >
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowForgot(false)}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
                    >
                      ← Back to sign in
                    </button>
                    <h3 className="font-semibold text-slate-900 mb-1">Reset your password</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Enter your email and we'll send you a reset link.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="forgot-email" required>Email address</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="you@company.com.au"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setForgotSent(true)}
                      >
                        Send reset link
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Metro Student Housing Pty Ltd &copy; 2026
        </p>
      </div>
    </div>
  )
}
