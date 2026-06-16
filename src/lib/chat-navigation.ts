import type { AppointmentStatus } from '@/types/database'

type ChatUserRole = 'caregiver' | 'family'

type ChatBackPathParams = {
  userRole: ChatUserRole
  status?: AppointmentStatus
  appointmentId?: string
}

export function getAppointmentChatBackPath({
  userRole,
  status,
  appointmentId,
}: ChatBackPathParams): string {
  if (userRole === 'caregiver' && status === 'pendente') {
    return '/caregiver/solicitations'
  }

  if (userRole === 'family' && status === 'pendente') {
    return '/family/matches'
  }

  if (userRole === 'caregiver') {
    return appointmentId ? `/caregiver/appointments/${appointmentId}` : '/caregiver/appointments'
  }

  return appointmentId ? `/family/appointments/${appointmentId}` : '/family/appointments'
}
