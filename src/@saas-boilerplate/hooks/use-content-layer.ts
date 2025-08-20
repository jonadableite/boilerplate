'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ContentHeading,
  type ContentTypeResult,
} from '../providers/content-layer/types'

/**
 * Configuration options for the useContentLayer hook
 * @interface UseContentLayerOptions
 */
interface UseContentLayerOptions {
  /**
   * Scroll offset in pixels to adjust heading activation point
   * A larger value makes headings activate earlier during scroll
   * @default 100
   */
  scrollOffset?: number

  /**
   * Delay in milliseconds before updating the active heading
   * Useful to prevent rapid updates during fast scrolling
   * @default 100
   */
  updateDelay?: number

  /**
   * Root margin for the Intersection Observer
   * Format: "top right bottom left" in pixels or percentage
   * @default "-80px 0px -80% 0px"
   */
  observerRootMargin?: string

  /**
   * Whether to initialize tracking automatically
   * If false, initializeObserver() must be called manually
   * @default true
   */
  autoInitialize?: boolean
}

/**
 * Return type for the useContentLayer hook
 * @interface UseContentLayerReturn
 */
interface UseContentLayerReturn {
  /** Currently active heading ID */
  activeId: string

  /** Function to manually set the active heading ID */
  setActiveId: (id: string) => void

  /**
   * Checks if a heading or any of its children is currently active
   * @param heading - The heading to check
   */
  isHeadingActive: (heading: ContentHeading) => boolean

  /**
   * Smoothly scrolls to the specified heading
   * @param id - The ID of the heading to scroll to
   */
  scrollToHeading: (id: string) => void

  /** Manually initialize the intersection observer */
  initializeObserver: () => void

  /** Clean up observers and timeouts */
  cleanup: () => void
}

/**
 * Hook for managing content layer navigation and heading tracking
 *
 * Provides functionality for:
 * - Tracking active headings during scroll
 * - Smooth scrolling to headings
 * - Managing heading hierarchy and active states
 * - Social sharing utilities
 *
 * @param content - The content object containing headings and metadata
 * @param options - Configuration options for the hook
 * @returns Object containing navigation and tracking utilities
 *
 * @example
 * ```tsx
 * const { isHeadingActive, scrollToHeading } = useContentLayer(content, {
 *   scrollOffset: 100,
 *   updateDelay: 100
 * })
 * ```
 */
export function useContentLayer(
  content: ContentTypeResult,
  options: UseContentLayerOptions = {},
): UseContentLayerReturn {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const headingElementsRef = useRef<HTMLElement[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    scrollOffset = 100,
    updateDelay = 100,
    observerRootMargin = '-80px 0px -80% 0px',
    autoInitialize = true,
  } = options

  /**
   * Checks if a heading or any of its children is currently active
   */
  const isHeadingActive = useCallback(
    (heading: ContentHeading): boolean => {
      if (heading.id === activeId) return true

      // Recursively check child headings
      if (heading.items && heading.items.length > 0) {
        return heading.items.some((item) => isHeadingActive(item))
      }

      return false
    },
    [activeId],
  )

  /**
   * Smoothly scrolls to the specified heading with offset adjustment
   */
  const scrollToHeading = useCallback(
    (id: string) => {
      const element = document.getElementById(id)
      if (element) {
        // Calculate position with scroll offset
        const position =
          element.getBoundingClientRect().top + window.scrollY - scrollOffset
        window.scrollTo({
          top: position,
          behavior: 'smooth',
        })
        setActiveId(id)
      }
    },
    [scrollOffset],
  )

  /**
   * Creates and configures the Intersection Observer for heading tracking
   */
  const createObserver = useCallback(() => {
    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Get all heading elements with IDs
    const headingElements = document.querySelectorAll(
      'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
    )
    headingElementsRef.current = Array.from(headingElements) as HTMLElement[]

    if (headingElementsRef.current.length === 0) {
      return () => {}
    }

    // Configure observer options
    const observerOptions = {
      rootMargin: observerRootMargin,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }

    // Create observer instance
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Stop observing elements that are no longer in the DOM
        if (!document.body.contains(entry.target)) {
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target)
          }
          return
        }

        // Update active heading when intersection threshold is met
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)

          timeoutRef.current = setTimeout(() => {
            setActiveId(entry.target.id)
          }, updateDelay)
        }
      })
    }, observerOptions)

    // Start observing all heading elements
    headingElementsRef.current.forEach((heading) => {
      observerRef.current?.observe(heading)
    })

    // Set initial active heading if none is set
    if (headingElementsRef.current.length > 0 && !activeId) {
      setActiveId(headingElementsRef.current[0].id)
    }

    // Return cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [activeId, observerRootMargin, updateDelay])

  /**
   * Initialize the observer with a slight delay to ensure DOM is ready
   */
  const initializeObserver = useCallback(() => {
    const timer = setTimeout(() => {
      createObserver()
    }, 200)

    return () => {
      clearTimeout(timer)
      cleanup()
    }
  }, [createObserver])

  /**
   * Clean up observers and timeouts
   */
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Initialize observer when content changes if autoInitialize is true
  useEffect(() => {
    if (!autoInitialize) return

    const cleanupFn = initializeObserver()
    return cleanupFn
  }, [content, initializeObserver, autoInitialize])

  return {
    activeId,
    setActiveId,
    isHeadingActive,
    scrollToHeading,
    initializeObserver,
    cleanup,
  }
}

/**
 * Utility function to generate a shareable URL for content
 *
 * @param content - The content object containing headings and metadata
 * @returns The share URL with optional hash fragment for the first heading
 */
export function getContentShareUrl(content: ContentTypeResult): string {
  const url = window.location.href.split('#')[0] // Remove any existing hash
  const firstHeadingId = content.headings[0]?.id || ''
  return firstHeadingId ? `${url}#${firstHeadingId}` : url
}
