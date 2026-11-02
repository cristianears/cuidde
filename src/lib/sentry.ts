import * as Sentry from '@sentry/react'
import { useEffect } from 'react'
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom'

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()

function scrubRequest<T extends Sentry.Event>(event: T): T {
  // OAuth callbacks and password-reset links can contain credentials.
  if (event.request) {
    event.request.url = event.request.url?.split(/[?#]/)[0]
    delete event.request.query_string
    delete event.request.headers
    delete event.request.cookies
    delete event.request.data
  }
  delete event.user
  return event
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    integrations: [
      Sentry.reactRouterBrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.breadcrumbsIntegration({ dom: false }),
      Sentry.consoleIntegration({ levels: [] }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    tracePropagationTargets: [],
    beforeSend: scrubRequest,
    beforeSendTransaction: scrubRequest,
    beforeSendSpan(span) {
      for (const key of ['url', 'http.url', 'url.full']) {
        if (typeof span.attributes[key] === 'string') {
          span.attributes[key] = span.attributes[key].split(/[?#]/)[0]
        }
      }
      span.name = span.name.split(/[?#]/)[0]
      return span
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'navigation') {
        for (const key of ['from', 'to']) {
          if (typeof breadcrumb.data?.[key] === 'string') {
            breadcrumb.data[key] = breadcrumb.data[key].split(/[?#]/)[0]
          }
        }
      }
      if (typeof breadcrumb.data?.url === 'string') {
        breadcrumb.data.url = breadcrumb.data.url.split(/[?#]/)[0]
      }
      return breadcrumb
    },
  })
}
