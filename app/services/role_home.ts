import type { UserRole } from '#models/user'

export function roleHome(role: UserRole) {
  const paths: Record<UserRole, string> = {
    admin: '/admin',
    instructor: '/instructor',
    client: '/clases',
  }

  return paths[role]
}
