import React from 'react'
import { CONTRACTS } from '../lib/contracts'
import type { ListingRecord } from '../lib/types'

export function useListingsFeed() {
  const backend = CONTRACTS.sepolia.backendBaseUrl
  const [listings, setListings] = React.useState<ListingRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchListings = React.useCallback(async (retryCount = 0, forceRefresh = false): Promise<void> => {
    const maxRetries = 3
    try {
      setError(null)
      setLoading(true)
      
      // First check if backend is reachable (only on first attempt of force refresh)
      if (forceRefresh && retryCount === 0) {
        try {
          const healthCheckPromise = fetch(`${backend}/health`, { 
            method: 'GET',
            cache: 'no-cache',
          })
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
          const healthCheck = await Promise.race([healthCheckPromise, timeoutPromise]) as Response
          if (!healthCheck.ok) {
            throw new Error('Backend health check failed')
          }
        } catch (healthErr: any) {
          throw new Error(`Cannot connect to backend at ${backend}. Is the server running? Error: ${healthErr.message}`)
        }
      }
      
      // Add cache-busting parameter if forcing refresh
      const url = forceRefresh 
        ? `${backend}/api/listings?t=${Date.now()}`
        : `${backend}/api/listings`
      
      console.log('[Listings] Fetching from:', url, 'forceRefresh:', forceRefresh)
      
      // Add timeout to fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache',
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`)
      }
      
      const data = await response.json()
      const listingsCount = data.listings?.length || 0
      console.log('[Listings] Received data:', { 
        count: listingsCount, 
        forceRefresh, 
        hasError: !!data.error,
        listings: data.listings ? `Array(${listingsCount})` : 'null/undefined'
      })
      
      if (data.error) {
        throw new Error(data.error + (data.message ? ': ' + data.message : ''))
      }
      
      // Ensure we always set the listings array, even if empty
      const listingsArray = Array.isArray(data.listings) ? data.listings : []
      console.log('[Listings] Setting listings state with', listingsArray.length, 'items')
      console.log('[Listings] First listing sample:', listingsArray.length > 0 ? {
        title: listingsArray[0].title,
        cid: listingsArray[0].cid,
        owner: listingsArray[0].owner
      } : 'none')
      
      // Use functional update to ensure state is set correctly
      setListings(prevListings => {
        // If we got data, use it; otherwise keep previous if it exists
        if (listingsArray.length > 0) {
          return listingsArray
        }
        // If we got empty but had previous data, keep previous (might be database issue)
        if (prevListings.length > 0 && forceRefresh) {
          console.warn('[Listings] Got empty array on refresh but had', prevListings.length, 'previous listings. Keeping previous.')
          return prevListings
        }
        return listingsArray
      })
      setLoading(false)
      
      // Log if we got empty array when we expected data
      if (forceRefresh && listingsArray.length === 0) {
        console.warn('[Listings] Force refresh returned empty array - database fetch may have failed or no listings exist')
      }
    } catch (err: any) {
      console.error('[Listings] Failed to fetch listings feed:', err)
      
      // Handle abort/timeout errors
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        const errorMsg = 'Request timed out. Backend may be slow or unreachable.'
        if (retryCount < maxRetries) {
          const delay = 1000 * (retryCount + 1)
          console.log(`[Listings] Retrying after timeout in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchListings(retryCount + 1, forceRefresh)
        } else {
          setError(errorMsg)
          setLoading(false)
          return
        }
      }
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = 1000 * (retryCount + 1)
        console.log(`[Listings] Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchListings(retryCount + 1, forceRefresh)
      } else {
        const errorMsg = err.message || 'Failed to load listings'
        setError(errorMsg)
        setLoading(false)
        // Never throw - always handle errors gracefully
        // The error state in the UI will display the error
      }
    }
  }, [backend])

  React.useEffect(() => {
    let ignore = false
    
    // Initial fetch
    setLoading(true)
    fetchListings()
    
      // Listen for refresh events
      if (typeof window !== 'undefined') {
        const handler = () => {
          if (!ignore) {
            setLoading(true)
            fetchListings()
          }
        }
        window.addEventListener('tb-listing-updated', handler)
        
        return () => {
          ignore = true
          window.removeEventListener('tb-listing-updated', handler)
        }
      }

    return () => {
      ignore = true
    }
  }, [fetchListings])

  return { listings, loading, error, refresh: async () => await fetchListings(0, true) }
}


