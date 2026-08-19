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
  if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
  if (!accessToken) throw new Error('Missing Supabase access token')

  const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const message = json?.error || json?.message || `Edge function ${functionName} failed`
    throw new Error(message)
  }

  return json
}

