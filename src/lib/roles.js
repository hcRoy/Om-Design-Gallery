/** Role helpers — prefer these over raw `profile.role === 'admin'` checks. */

export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  STAFF: 'staff',
}

export function isAdmin(role) {
  return role === ROLES.ADMIN
}

export function isStaff(role) {
  return role === ROLES.STAFF
}

/** Admin or staff — may enter the admissions office routes. */
export function canAccessAdmissions(role) {
  return isAdmin(role) || isStaff(role)
}

/** Create new admissions (admin + staff). */
export function canCreateAdmissions(role) {
  return canAccessAdmissions(role)
}

/** Edit existing admission fields / status / installments — admin only. */
export function canEditAdmissions(role) {
  return isAdmin(role)
}

/** Delete admissions — admin only. */
export function canDeleteAdmissions(role) {
  return isAdmin(role)
}

/** Full catalog / users / offers admin panel. */
export function canAccessAdminPanel(role) {
  return isAdmin(role)
}

/** Default landing after login when no `state.from` is set. */
export function defaultPathForRole(role) {
  if (isAdmin(role)) return '/admin'
  if (isStaff(role)) return '/admin/admissions'
  return '/account'
}

export function roleLabel(role) {
  if (role === ROLES.ADMIN) return 'Admin'
  if (role === ROLES.STAFF) return 'Staff'
  return 'Customer'
}
