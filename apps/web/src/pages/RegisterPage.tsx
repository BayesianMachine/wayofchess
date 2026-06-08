import { useState, FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const USERNAME_RE = /^[a-zA-Z0-9_]+$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    const trimmedUsername = username.trim()
    if (!trimmedUsername) errs.push('Username is required')
    else if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      errs.push('Username must be 3–30 characters')
    } else if (!USERNAME_RE.test(trimmedUsername)) {
      errs.push('Username may only contain letters, numbers, and underscores')
    }
    if (!email.trim()) errs.push('Email is required')
    else if (!isValidEmail(email)) errs.push('Enter a valid email address')
    if (!password.trim()) errs.push('Password is required')
    else if (password.length < 8) errs.push('Password must be at least 8 characters')
    if (password !== confirmPassword) errs.push('Passwords do not match')
    setErrors(errs)
    if (errs.length > 0) return

    try {
      await register(trimmedUsername, email.trim(), password)
    } catch {
      // error shown from store
    }
  }

  if (isLoading && !error) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="rounded-xl border border-mando-gold/30 bg-space-bg/90 backdrop-blur-sm p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-mando-gold mb-8 text-center">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-mando-silver mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                clearError()
              }}
              className="w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver focus:outline-none focus:border-mando-gold"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-mando-silver mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
              className="w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver focus:outline-none focus:border-mando-gold"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-mando-silver mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError()
              }}
              className="w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver focus:outline-none focus:border-mando-gold"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm text-mando-silver mb-1">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                clearError()
              }}
              className="w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver focus:outline-none focus:border-mando-gold"
            />
          </div>

          {errors.length > 0 && (
            <ul className="text-imperial-red text-sm list-disc pl-5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}

          {error && <p className="text-imperial-red text-sm">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-mando-silver text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-mando-gold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
