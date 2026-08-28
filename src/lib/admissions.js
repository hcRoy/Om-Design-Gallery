import { callEdgeFunction } from './razorpay.js'

/**
 * Public admission submission — only path to insert admissions (Edge Function).
 */
export async function submitAdmissionApplication(payload) {
  try {
    const data = await callEdgeFunction('submit-admission', payload, null)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message || 'Submission failed' }
  }
}
