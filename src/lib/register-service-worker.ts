type NavigatorLike = {
  serviceWorker?: {
    register: (scriptURL: string, options?: RegistrationOptions) => Promise<{
      update?: () => Promise<unknown>
      waiting?: {
        postMessage?: (message: unknown) => void
      }
    }>
  }
}

type LocationLike = Pick<Location, 'protocol' | 'hostname'>

interface RegisterServiceWorkerOptions {
  navigatorLike?: NavigatorLike
  locationLike?: LocationLike
}

export type ServiceWorkerRegistrationStatus =
  | 'unsupported'
  | 'insecure-origin'
  | 'registered'
  | 'failed'

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export async function registerServiceWorker(
  options: RegisterServiceWorkerOptions = {},
): Promise<ServiceWorkerRegistrationStatus> {
  const navigatorLike = options.navigatorLike ?? globalThis.navigator
  const locationLike = options.locationLike ?? globalThis.location

  if (!navigatorLike.serviceWorker) return 'unsupported'
  if (locationLike.protocol !== 'https:' && !isLocalhost(locationLike.hostname)) {
    return 'insecure-origin'
  }

  try {
    const registration = await navigatorLike.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    await registration.update?.()
    registration.waiting?.postMessage?.({ type: 'SKIP_WAITING' })
    return 'registered'
  } catch {
    return 'failed'
  }
}
