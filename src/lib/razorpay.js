let razorpayScriptPromise = null

export async function loadRazorpayCheckoutScript() {
  if (typeof window === 'undefined') return
  if (window.Razorpay) return
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout.js'))
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export async function callEdgeFunction(functionName, payload, accessToken) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')

  // Public functions (e.g. validate-offer) can run with the anon key.
  // Auth-gated functions still require a user access token.
  const token = accessToken || anonKey
  if (!token) throw new Error('Missing Supabase access token')

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  if (anonKey) headers.apikey = anonKey

  const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const message = json?.error || json?.reason || json?.message || `Edge function ${functionName} failed`
    throw new Error(message)
  }

  return json
}

