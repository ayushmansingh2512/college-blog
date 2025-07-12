import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from 'axios'

const AuthCallBack = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if already processing or already authenticated
        if (localStorage.getItem('access_token')) {
          console.log('User already authenticated, redirecting...')
          navigate('/')
          return
        }

        // Extract the authorization code from URL parameters
        const urlParams = new URLSearchParams(location.search)
        const code = urlParams.get('code')
        const error_param = urlParams.get('error')
        
        if (error_param) {
          setError(`OAuth error: ${error_param}`)
          setLoading(false)
          return
        }

        if (!code) {
          setError('Authorization code not found in URL')
          setLoading(false)
          return
        }

        console.log('Authorization code received, processing...')

        // Send the code to your backend
        const response = await axios.get(`http://localhost:8000/auth/google/callback?code=${code}`, {
          timeout: 10000 // 10 second timeout
        })
        
        if (response.data.access_token) {
          // Store the token in localStorage
          localStorage.setItem('access_token', response.data.access_token)
          localStorage.setItem('token_type', response.data.token_type)
          
          console.log('Authentication successful')
          
          // Dispatch a custom event to notify other components of login
          window.dispatchEvent(new Event('loginEvent'))

          // Clear the URL parameters and redirect
          window.history.replaceState({}, document.title, '/')
          navigate('/')
        } else {
          setError('No access token received')
        }
      } catch (err: any) {
        console.error('Authentication error:', err)
        if (err.response?.status === 500) {
          setError('Server error during authentication. The authorization code may have expired or been used already. Please try logging in again.')
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.')
        } else {
          setError(err.response?.data?.detail || 'Authentication failed')
        }
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to prevent rapid re-execution
    const timeoutId = setTimeout(handleAuthCallback, 100)
    
    return () => clearTimeout(timeoutId)
  }, [location, navigate])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading...</h2>
        <p>Please wait while we log you in</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('token_type')
          navigate('/')
        }}>
          Go Home
        </button>
        <br />
        <button onClick={() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('token_type')
          window.location.href = 'http://localhost:8000/auth/google/login'
        }} style={{ marginTop: '10px' }}>
          Try Login Again
        </button>
      </div>
    )
  }

  return null
}

export default AuthCallBack