/** Shared password rules for signup and reset flows. */
export const PASSWORD_MIN_LENGTH = 8

export function validatePassword(password) {
  const value = String(password ?? '')
  const errors = []

  if (value.length < PASSWORD_MIN_LENGTH) {
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters`)
  }
  if (!/[a-zA-Z]/.test(value)) {
    errors.push('At least one letter')
  }
  if (!/[0-9]/.test(value)) {
    errors.push('At least one number')
  }

  return { valid: errors.length === 0, errors }
}

export function passwordsMatch(password, confirmPassword) {
  return String(password) === String(confirmPassword)
}
