---
description: 
globs: src/features/**/*.controller.ts,src/features/**/*.procedure.ts
alwaysApply: false
---
# Authentication and Authorization System Guide for SaaS Boilerplate

This guide provides a comprehensive overview of the authentication and authorization system in SaaS Boilerplate, explaining its architecture, key concepts, and implementation patterns for secure user authentication and multi-tenant access control.

## 1. Authentication System Overview

The Authentication system in SaaS Boilerplate is built on a multi-tenant architecture with organization-based isolation. It provides:

- Multi-provider authentication (social, email/password, OTP)
- Session management
- Role-based access control within organizations
- Organization membership and ownership
- Secure API access

## 2. Key Components

### 2.1 Auth Feature

The `auth` feature is a core module that manages authentication, session, and organization access:

```
src/@saas-boilerplate/features/auth/
├── auth.interface.ts       # Core types and interfaces
├── controllers/
│   └── auth.controller.ts  # API endpoints for auth
├── procedures/
│   └── auth.procedure.ts   # Business logic
└── presentation/
    └── components/         # UI components
```

### 2.2 Auth Interface

The `auth.interface.ts` defines key types for authentication:

```typescript
// Core auth interfaces
export type AppSession<
  TRequirements extends AuthRequirements | undefined = undefined,
  TRoles extends OrganizationMembershipRole[] | undefined = undefined,
> = {
  session: any
  user: User & { email: string }
  organization: Organization & { billing: any } | null
  membership: OrganizationMembership | null
} | null

export type AuthRequirements = 'authenticated' | 'unauthenticated'

export enum OrganizationMembershipRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

// Input types
export type SignInInput = {
  provider: AccountProvider
  callbackURL?: string
}

export type SendVerificationOTPInput = {
  email: string
  type: 'sign-in' | 'email-verification' | 'forget-password'
}

export type GetSessionInput<
  TRequirements extends AuthRequirements | undefined = undefined,
  TRoles extends OrganizationMembershipRole[] | undefined = undefined,
> = {
  requirements?: TRequirements
  roles?: TRoles
}
```

### 2.3 Auth Controller

The `auth.controller.ts` exposes API endpoints for authentication operations:

```typescript
export const AuthController = igniter.controller({
  name: 'auth',
  path: '/auth',
  actions: {
    // Sign in with a social provider
    signInWithProvider: igniter.mutation({
      method: 'POST',
      path: '/sign-in',
      use: [AuthFeatureProcedure()],
      body: z.object({
        provider: z.nativeEnum(AccountProvider),
        callbackURL: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Implementation
      },
    }),
    
    // Sign in with OTP (one-time password)
    signInWithOTP: igniter.mutation({
      method: 'POST',
      path: '/sign-in/otp',
      // Implementation
    }),
    
    // Send verification code
    sendOTPVerificationCode: igniter.mutation({
      method: 'POST',
      path: '/send-otp-verification',
      // Implementation
    }),
    
    // Sign out
    signOut: igniter.mutation({
      method: 'POST',
      path: '/sign-out',
      // Implementation
    }),
    
    // Get current session
    getSession: igniter.query({
      method: 'GET',
      path: '/session',
      // Implementation
    }),
    
    // Set active organization
    setActiveOrganization: igniter.mutation({
      method: 'POST',
      path: '/set-active-organization',
      // Implementation
    }),
  },
})
```

### 2.4 Auth Procedure

The `auth.procedure.ts` implements the business logic for authentication:

```typescript
export const AuthFeatureProcedure = igniter.procedure({
  name: 'AuthFeatureProcedure',
  handler: async (options, { request, context }) => {
    return {
      auth: {
        // Set active organization
        setActiveOrganization: async (input: { organizationId: string }) => {
          // Implementation
        },

        // List user sessions
        listSession: async () => {
          // Implementation
        },

        // Sign in with social provider
        signInWithProvider: async (input: SignInInput) => {
          // Implementation
        },

        // Sign in with OTP
        signInWithOTP: async (input: { email: string; otpCode: string }) => {
          // Implementation
        },

        // Send verification code
        sendOTPVerificationCode: async (input: SendVerificationOTPInput) => {
          // Implementation
        },

        // Sign out
        signOut: async () => {
          // Implementation
        },

        // Get current session with role-based access control
        getSession: async <
          TRequirements extends AuthRequirements | undefined = undefined,
          TRoles extends OrganizationMembershipRole[] | undefined = undefined,
        >(
          options?: GetSessionInput<TRequirements, TRoles>,
        ): Promise<AppSession<TRequirements, TRoles>> => {
          // Implementation that validates session, retrieves user and organization
          // and enforces role-based access control
        },
      },
    }
  },
})
```

## 3. Multi-tenant Authentication Flow

### 3.1 Authentication Process

1. **User Sign In**:
   - User authenticates via social provider or OTP
   - System creates/retrieves user account
   - Session is established

2. **Organization Context**:
   - System identifies organizations the user belongs to
   - User selects an active organization
   - Session is updated with organization context

3. **Access Control**:
   - System validates user's role in the active organization
   - Access is granted based on role permissions

### 3.2 Session Management

Sessions in SaaS Boilerplate contain information about:

- The authenticated user
- The active organization
- User's role/membership in the organization
- Billing status of the organization

This information is retrieved using the `getSession` method:

```typescript
// Get authenticated session with role requirements
const session = await context.auth.getSession({
  requirements: 'authenticated',
  roles: ['admin', 'owner'],
})

if (!session) {
  // Handle unauthenticated/unauthorized access
}

// Access session data
const { user, organization, membership } = session
```

## 4. Implementation Patterns

### 4.1 Protecting API Routes

Use the `AuthFeatureProcedure` to protect API routes:

```typescript
export const ProtectedController = igniter.controller({
  name: 'protected',
  path: '/protected',
  actions: {
    getData: igniter.query({
      method: 'GET',
      path: '/',
      // Add auth procedure to protect the route
      use: [AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        // Get session with required authentication and roles
        const session = await context.auth.getSession({
          requirements: 'authenticated',
          roles: ['admin', 'owner'],
        })
        
        if (!session) {
          return response.unauthorized('You must be an admin or owner')
        }
        
        // Proceed with protected operation
        return response.success({ 
          data: "Protected data",
          user: session.user.email,
          organization: session.organization.name
        })
      },
    }),
  },
})
```

### 4.2 Organization-Specific Data Access

Enforce data isolation between organizations:

```typescript
// Example: Get leads for the current organization
const getOrganizationLeads = async (context) => {
  const session = await context.auth.getSession({
    requirements: 'authenticated',
  })
  
  if (!session || !session.organization) {
    throw new Error('Unauthorized or no active organization')
  }
  
  // Use organization ID to scope the query
  const leads = await context.providers.database.lead.findMany({
    where: { organizationId: session.organization.id },
  })
  
  return leads
}
```

### 4.3 Role-Based Access Control

Implement permission checks based on user roles:

```typescript
// Example: Organization settings access control
const OrganizationSettings = () => {
  const { data: session } = api.auth.getSession.useQuery()
  
  // Check if user has admin privileges
  const isAdmin = session?.membership?.role === 'admin' || 
                  session?.membership?.role === 'owner'
  
  if (!isAdmin) {
    return <AccessDenied message="You need admin privileges to access settings" />
  }
  
  return (
    <SettingsLayout>
      {/* Settings UI */}
    </SettingsLayout>
  )
}
```

### 4.4 Client-Side Authentication

React hooks for auth state:

```typescript
// Example: useAuth hook
export function useAuth() {
  const { data: session, isLoading } = api.auth.getSession.useQuery()
  
  const signOut = async () => {
    await api.auth.signOut.mutate()
    // Redirect or refresh session
  }
  
  const setActiveOrganization = async (organizationId: string) => {
    await api.auth.setActiveOrganization.mutate({ organizationId })
    // Refresh session
  }
  
  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    user: session?.user,
    organization: session?.organization,
    membership: session?.membership,
    signOut,
    setActiveOrganization,
  }
}
```

## 5. Organization Management

### 5.1 Organization Controller

The `organization.controller.ts` manages organization operations:

```typescript
export const OrganizationController = igniter.controller({
  name: 'organization',
  path: '/organization',
  actions: {
    // Create new organization
    create: igniter.mutation({
      method: 'POST',
      path: '/',
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      body: z.object({
        name: z.string(),
        slug: z.string(),
        // Other fields
      }),
      handler: async ({ request, response, context }) => {
        // Implementation
      },
    }),
    
    // Get organization stats
    stats: igniter.query({
      method: 'GET',
      path: '/stats',
      use: [OrganizationFeatureProcedure(), AuthFeatureProcedure()],
      handler: async ({ response, context }) => {
        // Implementation
      },
    }),
    
    // Verify organization slug availability
    verify: igniter.mutation({
      method: 'POST',
      path: '/verify',
      // Implementation
    }),
    
    // Update organization
    update: igniter.mutation({
      method: 'PUT',
      path: '/',
      // Implementation
    }),
    
    // Delete organization
    delete: igniter.mutation({
      method: 'DELETE',
      path: '/:id',
      // Implementation
    }),
    
    // Get organization by slug (public)
    getBySlug: igniter.query({
      method: 'GET',
      path: '/public/:slug',
      // Implementation
    }),
  },
})
```

### 5.2 Organization Model

The organization data model includes:

```typescript
// Organization types
export type Organization = {
  id: string
  name: string
  slug: string
  logo: string | null
  metadata: OrganizationMetadata
  createdAt: Date
  updatedAt?: Date | null
}

// Organization metadata
export type OrganizationMetadata = {
  contact?: {
    email?: string
    phone?: string
    website?: string
  }
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  social?: {
    twitter?: string
    facebook?: string
    linkedin?: string
    instagram?: string
  }
  custom?: Record<string, any>
}
```

## 6. Authentication Providers and Methods

### 6.1 Social Authentication

Support for multiple social providers:

```typescript
export enum AccountProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  // Add other providers as needed
}

// Example: Sign in with Google
const signInWithGoogle = async () => {
  const result = await api.auth.signInWithProvider.mutate({
    provider: 'google',
    callbackURL: '/dashboard',
  })
  
  if (result.redirect) {
    window.location.href = result.url
  }
}
```

### 6.2 OTP Authentication

Email-based one-time password flow:

```typescript
// Step 1: Request OTP code
const requestOTP = async (email: string) => {
  await api.auth.sendOTPVerificationCode.mutate({
    email,
    type: 'sign-in',
  })
}

// Step 2: Verify OTP code
const verifyOTP = async (email: string, otpCode: string) => {
  const result = await api.auth.signInWithOTP.mutate({
    email,
    otpCode,
  })
  
  if (result.success) {
    // Redirect to dashboard
  }
}
```

## 7. Best Practices

### 7.1 Security Considerations

- Always validate sessions on both client and server
- Use HTTPS for all authentication requests
- Implement CSRF protection
- Set proper cookie security options
- Rate limit authentication attempts
- Sanitize and validate all user inputs

### 7.2 Session Management

```typescript
// Always check session before accessing protected data
const getProtectedData = async (context) => {
  const session = await context.auth.getSession({
    requirements: 'authenticated',
  })
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  // Access protected data
}
```

### 7.3 Organization Switching

Enable users to switch between organizations:

```typescript
const OrganizationSwitcher = () => {
  const { session, setActiveOrganization } = useAuth()
  const [organizations, setOrganizations] = useState([])
  
  // Fetch user's organizations
  useEffect(() => {
    api.organization.list.query().then(setOrganizations)
  }, [])
  
  return (
    <Select
      value={session?.organization?.id}
      onChange={(id) => setActiveOrganization(id)}
    >
      {organizations.map(org => (
        <SelectItem key={org.id} value={org.id}>
          {org.name}
        </SelectItem>
      ))}
    </Select>
  )
}
```

### 7.4 Error Handling

Provide clear error messages for authentication issues:

```typescript
const signIn = async (credentials) => {
  try {
    const result = await api.auth.signIn.mutate(credentials)
    return { success: true, data: result }
  } catch (error) {
    let message = 'Authentication failed'
    
    // Provide specific error messages
    if (error.code === 'INVALID_CREDENTIALS') {
      message = 'Invalid email or password'
    } else if (error.code === 'ACCOUNT_LOCKED') {
      message = 'Account locked. Please contact support'
    }
    
    return { success: false, error: message }
  }
}
```

## 8. Complete Examples

### 8.1 Protected API Route

```typescript
export const LeadController = igniter.controller({
  name: 'lead',
  path: '/leads',
  actions: {
    list: igniter.query({
      method: 'GET',
      path: '/',
      // Protect the route with auth
      use: [AuthFeatureProcedure()],
      query: z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
      }),
      handler: async ({ request, response, context }) => {
        // Verify authenticated session
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })
        
        if (!session || !session.organization) {
          return response.unauthorized('Authentication required')
        }
        
        // Get leads for the current organization
        const leads = await context.providers.database.lead.findMany({
          where: { organizationId: session.organization.id },
          skip: (request.query.page - 1) * request.query.limit,
          take: request.query.limit,
        })
        
        const total = await context.providers.database.lead.count({
          where: { organizationId: session.organization.id },
        })
        
        return response.success({
          data: leads,
          pagination: {
            page: request.query.page,
            limit: request.query.limit,
            total,
            pages: Math.ceil(total / request.query.limit),
          },
        })
      },
    }),
    
    // Other actions...
  },
})
```

### 8.2 Authentication UI Component

```tsx
import { useState } from 'react'
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { useFormWithZod } from '@/hooks/use-form-with-zod'
import { api } from '@/igniter.client'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const otpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  otpCode: z.string().length(6, 'OTP code must be 6 digits'),
})

export function AuthForm() {
  const [authMethod, setAuthMethod] = useState('password')
  const [otpSent, setOtpSent] = useState(false)
  
  // Password login form
  const passwordForm = useFormWithZod({
    schema: loginSchema,
    defaultValues: { email: '', password: '' },
    onSubmit: async (values) => {
      // Implementation for password login
    },
  })
  
  // OTP login form
  const otpForm = useFormWithZod({
    schema: otpSchema,
    defaultValues: { email: '', otpCode: '' },
    onSubmit: async (values) => {
      if (!otpSent) {
        // Request OTP
        await api.auth.sendOTPVerificationCode.mutate({
          email: values.email,
          type: 'sign-in',
        })
        setOtpSent(true)
      } else {
        // Verify OTP
        await api.auth.signInWithOTP.mutate({
          email: values.email,
          otpCode: values.otpCode,
        })
        // Redirect on success
      }
    },
  })
  
  // Social login handlers
  const handleGoogleLogin = async () => {
    const result = await api.auth.signInWithProvider.mutate({
      provider: 'google',
    })
    
    if (result.redirect) {
      window.location.href = result.url
    }
  }
  
  return (
    <div className="auth-container">
      <h1>Sign In</h1>
      
      <Tabs defaultValue="password" onValueChange={setAuthMethod}>
        <TabsList>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="otp">One-Time Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="password">
          <form onSubmit={passwordForm.onSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input 
                id="email"
                type="email"
                {...passwordForm.register('email')}
              />
              {passwordForm.formState.errors.email && (
                <p className="text-red-500">
                  {passwordForm.formState.errors.email.message}
                </p>
              )}
            </div>
            
            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password">Password</label>
              <Input 
                id="password"
                type="password"
                {...passwordForm.register('password')}
              />
              {passwordForm.formState.errors.password && (
                <p className="text-red-500">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="otp">
          <form onSubmit={otpForm.onSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="otp-email">Email</label>
              <Input 
                id="otp-email"
                type="email"
                {...otpForm.register('email')}
              />
              {otpForm.formState.errors.email && (
                <p className="text-red-500">
                  {otpForm.formState.errors.email.message}
                </p>
              )}
            </div>
            
            {/* OTP field - only shown after requesting OTP */}
            {otpSent && (
              <div className="space-y-2">
                <label htmlFor="otpCode">One-Time Code</label>
                <Input 
                  id="otpCode"
                  {...otpForm.register('otpCode')}
                />
                {otpForm.formState.errors.otpCode && (
                  <p className="text-red-500">
                    {otpForm.formState.errors.otpCode.message}
                  </p>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full">
              {otpSent ? 'Verify Code' : 'Send Code'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <p className="text-center mb-4">Or continue with</p>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleGoogleLogin}
          >
            Google
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              api.auth.signInWithProvider.mutate({
                provider: 'github',
              })
            }}
          >
            GitHub
          </Button>
        </div>
      </div>
    </div>
  )
}
```

This comprehensive guide should help developers understand and implement authentication and authorization in the SaaS Boilerplate, ensuring secure, multi-tenant access control with organization isolation. 

---
description: When user ask to create a Data Table for a entity or feature
globs: 
alwaysApply: false
---
# Data Table Component Usage Guide

This document provides comprehensive instructions for implementing data tables in the SaaS Boilerplate, focusing on the reusable data-table component and its integration with feature-specific implementations.

## 1. Data Table Architecture

The data table implementation follows a modular architecture with separation of concerns:

### 1.1 Core Components (in `/components/ui/data-table/`)

- **data-table.tsx**: The main table component that renders the actual table with rows and columns
- **data-table-provider.tsx**: Context provider for table state management and configuration
- **data-table-toolbar.tsx**: Header toolbar with search, filters, and export options
- **data-table-pagination.tsx**: Pagination controls for table navigation

### 1.2 Feature-Specific Components

For each feature requiring a data table, create the following files:

```
features/[feature]/presentation/components/
├── [feature]-data-table.tsx           # Main wrapper component
├── [feature]-data-table-provider.tsx  # Feature-specific provider with column definitions
├── [feature]-data-table-toolbar.tsx   # Feature-specific toolbar
├── [feature]-data-table-empty.tsx     # Empty state component
└── [feature]-upsert-sheet.tsx         # Create/Edit modal/sheet
```

## 2. Implementation Steps

### 2.1 Create the Data Table Provider

Start by creating the feature-specific data table provider:

```tsx
// features/[feature]/presentation/components/[feature]-data-table-provider.tsx
'use client'

import React from 'react'
import { ColumnDef, type Row } from '@tanstack/react-table'
import { DataTableProvider } from '@/components/ui/data-table/data-table-provider'
import type { YourEntityType } from '../../[feature].interface'

// Define the columns for your entity
const columns: ColumnDef<YourEntityType>[] = [
  // Define your columns here with accessors, headers, and cell renderers
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div>{row.original.name}</div>,
  },
  // Additional columns...
]

interface YourFeatureDataTableProviderProps {
  initialData: YourEntityType[]
  children: React.ReactNode
}

export function YourFeatureDataTableProvider({
  initialData,
  children,
}: YourFeatureDataTableProviderProps) {
  // Optional row click handler for navigation
  const handleRowClick = (row: Row<YourEntityType>) => {
    window.location.href = `/app/your-feature/${row.original.id}`
  }

  return (
    <DataTableProvider<YourEntityType>
      columns={columns}
      data={initialData}
      onRowClick={handleRowClick} // Optional
    >
      {children}
    </DataTableProvider>
  )
}
```

### 2.2 Create the Empty State Component

```tsx
// features/[feature]/presentation/components/[feature]-data-table-empty.tsx
import { AnimatedEmptyState } from '@/components/ui/animated-empty-state'
import { PlusIcon, IconForYourFeature } from 'lucide-react'
import { YourFeatureUpsertSheet } from './your-feature-upsert-sheet'

export function YourFeatureDataTableEmpty() {
  return (
    <AnimatedEmptyState className="border-none h-full flex-grow">
      <AnimatedEmptyState.Carousel>
        <IconForYourFeature className="size-6" />
        <span className="bg-secondary h-3 w-[16rem] rounded-full"></span>
      </AnimatedEmptyState.Carousel>

      <AnimatedEmptyState.Content>
        <AnimatedEmptyState.Title>No items found</AnimatedEmptyState.Title>
        <AnimatedEmptyState.Description>
          You haven't added any items yet. Get started by adding your first one.
        </AnimatedEmptyState.Description>
      </AnimatedEmptyState.Content>

      <AnimatedEmptyState.Actions>
        <YourFeatureUpsertSheet
          triggerButton={
            <AnimatedEmptyState.Action variant="default" className="gap-2">
              <PlusIcon className="size-4" />
              Add your first item
            </AnimatedEmptyState.Action>
          }
        />
        <AnimatedEmptyState.Action variant="outline" asChild>
          <a href="/help/getting-started/">Learn more</a>
        </AnimatedEmptyState.Action>
      </AnimatedEmptyState.Actions>
    </AnimatedEmptyState>
  )
}
```

### 2.3 Create the Main Data Table Component

```tsx
// features/[feature]/presentation/components/[feature]-data-table.tsx
'use client'

import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTablePagination } from '@/components/ui/data-table/data-table-pagination'
import { useDataTable } from '@/components/ui/data-table'
import { YourFeatureDataTableEmpty } from './your-feature-data-table-empty'

export function YourFeatureDataTable() {
  const { data } = useDataTable()

  if (!data.length) return <YourFeatureDataTableEmpty />

  return (
    <>
      <DataTable />
      <DataTablePagination />
    </>
  )
}
```

### 2.4 Create the Toolbar Component

```tsx
// features/[feature]/presentation/components/[feature]-data-table-toolbar.tsx
'use client'

import {
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterMenu,
  DataTableExportMenu,
} from '@/components/ui/data-table/data-table-toolbar'

export function YourFeatureDataTableToolbar() {
  return (
    <DataTableToolbar className="flex items-center justify-between">
      <DataTableSearch placeholder="Search items..." />

      <div className="flex items-center gap-2">
        <DataTableFilterMenu />
        <DataTableExportMenu />
      </div>
    </DataTableToolbar>
  )
}
```

### 2.5 Create the Upsert Sheet/Modal

```tsx
// features/[feature]/presentation/components/[feature]-upsert-sheet.tsx
'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useDisclosure } from '@/@saas-boilerplate/hooks/use-disclosure'
import { api } from '@/igniter.client'
import { useRouter } from 'next/navigation'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import type { YourEntityType } from '../../[feature].interface'

// Define your form schema
const formSchema = z.object({
  // Your fields here
  name: z.string().min(1, 'Name is required'),
  // Additional fields...
})

interface YourFeatureUpsertSheetProps {
  item?: YourEntityType
  triggerButton?: React.ReactNode
  onSuccess?: () => void
}

export function YourFeatureUpsertSheet({
  item,
  triggerButton,
  onSuccess,
}: YourFeatureUpsertSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { refresh } = useRouter()
  const isEditMode = !!item

  const form = useFormWithZod({
    schema: formSchema,
    defaultValues: {
      name: item?.name || '',
      // Additional fields...
    },
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true)

        if (isEditMode) {
          // Update existing item
          const response = await api.yourFeature.update.mutate({
            body: values,
            params: { id: item.id },
          })

          if (response.error) {
            toast.error('Failed to update item')
            return
          }

          toast.success('Item updated successfully')
        } else {
          // Create new item
          const response = await api.yourFeature.create.mutate({
            body: values,
          })

          if (response.error) {
            toast.error('Failed to create item')
            return
          }

          toast.success('Item created successfully')
        }

        form.reset()
        onClose()
        refresh()
        
        if (onSuccess) {
          onSuccess()
        }
      } catch (error) {
        console.error(error)
        toast.error('An error occurred')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? onOpen() : onClose())}>
      <SheetTrigger asChild>
        {triggerButton || (
          <Button variant="link" size="sm" className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add item
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit Item' : 'Add New Item'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.onSubmit} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Additional form fields */}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
```

## 3. Page Implementation

Finally, implement the page that uses all these components:

```tsx
// app/(private)/app/(organization)/(dashboard)/your-feature/page.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  PageBody,
  PageHeader,
  PageMainBar,
  PageSecondaryHeader,
  PageWrapper,
} from '@/components/ui/page'
import { YourFeatureDataTable } from '@/features/your-feature/presentation/components/your-feature-data-table'
import { YourFeatureDataTableProvider } from '@/features/your-feature/presentation/components/your-feature-data-table-provider'
import { YourFeatureDataTableToolbar } from '@/features/your-feature/presentation/components/your-feature-data-table-toolbar'
import { YourFeatureUpsertSheet } from '@/features/your-feature/presentation/components/your-feature-upsert-sheet'
import { api } from '@/igniter.client'

export const metadata = {
  title: 'Your Feature',
}

export default async function YourFeaturePage() {
  // Fetch the data server-side
  const items = await api.yourFeature.findMany.query()

  return (
    <YourFeatureDataTableProvider initialData={items.data ?? []}>
      <PageWrapper>
        <PageHeader className="border-0">
          <PageMainBar>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Your Feature</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageMainBar>
        </PageHeader>

        <PageSecondaryHeader className="bg-secondary/50">
          <YourFeatureDataTableToolbar />
          <YourFeatureUpsertSheet />
        </PageSecondaryHeader>

        <PageBody className="md:p-0 flex flex-col">
          <YourFeatureDataTable />
        </PageBody>
      </PageWrapper>
    </YourFeatureDataTableProvider>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
```

## 4. Page Component Usage Guide

The SaaS Boilerplate includes a consistent page layout system using the `Page` components from `@/components/ui/page`. These components provide a uniform structure and animations for dashboard pages.

### 4.1 Page Component Structure

```
<PageWrapper>
  <PageHeader>
    <PageMainBar>
      {/* Breadcrumbs and page title */}
    </PageMainBar>
    {/* Optional action buttons on right side */}
  </PageHeader>
  
  <PageSecondaryHeader>
    {/* Toolbar, filters, primary actions */}
  </PageSecondaryHeader>
  
  <PageBody>
    {/* Main content */}
  </PageBody>
  
  {/* Optional */}
  <PageActions>
    {/* Bottom actions like save/cancel buttons */}
  </PageActions>
</PageWrapper>
```

### 4.2 Page Component Best Practices

1. **PageWrapper**:
   - Always the outermost container
   - Provides animations and consistent styling
   - Should contain the entire page content

2. **PageHeader**:
   - Contains breadcrumbs and page title in `<PageMainBar>`
   - Can include primary actions on right side
   - Typically has `className="border-0"` to control border styling

3. **PageSecondaryHeader**:
   - Use for toolbars, filters, and primary actions
   - Often uses `className="bg-secondary/50"` for subtle background
   - Good location for "Create/Add" buttons

4. **PageBody**:
   - Contains the main content of the page
   - When using with data tables, use `className="p-0 flex flex-col"`
   - Applies subtle entrance animations

5. **PageActions**:
   - Optional component for bottom action bar
   - Typically contains "Save", "Cancel", or other form submission buttons
   - Use primarily on form/detail pages, not list pages

### 4.3 Responsive Considerations

- The Page components are designed to be responsive out of the box
- They include proper spacing and layout adjustments for different screen sizes
- For mobile optimization, consider conditionally rendering or collapsing secondary actions

## 5. Common Patterns and Examples

### 5.1 List Page Pattern (with Data Table)

```tsx
<PageWrapper>
  <PageHeader>
    <PageMainBar>
      <Breadcrumb>...</Breadcrumb>
    </PageMainBar>
  </PageHeader>
  
  <PageSecondaryHeader>
    <FeatureDataTableToolbar />
    <FeatureUpsertSheet />
  </PageSecondaryHeader>
  
  <PageBody className="md:p-0 flex flex-col">
    <FeatureDataTable />
  </PageBody>
</PageWrapper>
```

### 5.2 Detail/Form Page Pattern

```tsx
<PageWrapper>
  <PageHeader>
    <PageMainBar>
      <Breadcrumb>...</Breadcrumb>
    </PageMainBar>
    <Button variant="outline" asChild>
      <Link href="/app/feature">Back to List</Link>
    </Button>
  </PageHeader>
  
  <PageBody>
    <Form>
      {/* Form fields */}
    </Form>
  </PageBody>
  
  <PageActions>
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </PageActions>
</PageWrapper>
```

### 5.3 Dashboard/Overview Page Pattern

```tsx
<PageWrapper>
  <PageHeader>
    <PageMainBar>
      <h1 className="text-xl font-semibold">Dashboard</h1>
    </PageMainBar>
    <DateRangePicker />
  </PageHeader>
  
  <PageBody>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Dashboard cards and widgets */}
    </div>
  </PageBody>
</PageWrapper>
```

## 6. Advanced Features

### 6.1 Row Actions

To add actions to table rows, define an actions column in your provider:

```tsx
{
  id: 'actions',
  header: () => <div className="text-right">Actions</div>,
  cell: ({ row }) => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={(e) => { 
        e.stopPropagation();
        // Your action
      }}>
        <EditIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={(e) => {
        e.stopPropagation();
        // Your action
      }}>
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### 6.2 Custom Filters

You can extend the DataTableFilterMenu to add custom filters:

```tsx
<DataTableFilterMenu>
  <DataTableFilterMenuItem
    title="Status"
    options={[
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ]}
    field="status"
  />
  {/* More filters */}
</DataTableFilterMenu>
```

### 6.3 Custom Sorting

Add custom sorting to your columns:

```tsx
{
  accessorKey: 'name',
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="px-0"
    >
      Name
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
  // Rest of column definition
}
```

## 7. Best Practices

1. **Performance**:
   - Implement server-side pagination for large datasets
   - Use `useCallback` for event handlers
   - Memoize expensive computations with `useMemo`

2. **Accessibility**:
   - Ensure proper keyboard navigation
   - Use appropriate ARIA attributes
   - Maintain sufficient color contrast

3. **Error Handling**:
   - Display user-friendly error messages
   - Implement fallback UI for error states
   - Log errors properly for debugging

4. **Reusability**:
   - Extract common patterns into reusable components
   - Keep feature-specific logic in feature-specific files
   - Follow the established naming conventions

5. **Testing**:
   - Write tests for critical component behavior
   - Test edge cases like empty states and error conditions
   - Ensure responsive behavior works across devices 
  
  ---
description: When you need create or edit e-mail template
globs: 
alwaysApply: false
---
# How to Create and Register Email Templates in SaaS Boilerplate

> **Purpose:**  
> This guide ensures every developer can efficiently create, test, maintain, and register new transactional e-mail templates, delivering a consistently professional experience for end users and rapid onboarding for your team.  
> Follow every step to guarantee technical, visual, and UX quality across all SaaS Boilerplate e-mails.

---

## 1. Directory & File Structure

- Templates live at: `src/content/mails/`
- One `.tsx` file per template (ex: `welcome.email.tsx`, `invite-user.tsx`)
- Shared UI: Use/create modular components in `src/content/mails/components/`
- Name files and exported identifiers clearly by use-case.

---

## 2. Template Pattern & Prompt Engineering Checklist

Every template **must**:

- **Schema**: Define a strict Zod schema for all required/optional template data.
- **MailProvider.template**:  
  Wrap the template in `MailProvider.template({ subject, schema, render })`
- **Default Props**: Specify safe fallback values in the render function for good previews/tests.
- **Visual/UX:**
  - One clear `<ReactEmail.Heading>` aligned with purpose (and subject)
  - A short, unique `<ReactEmail.Preview>` (the email snippet for inboxes)
  - Use prebuilt components (`Button`, `Footer`, `Logo`)
  - Prefer Tailwind classes for styling
  - Use the black button for all CTAs (via the shared component)
- **Export Only the Render Function** as default!

**EXAMPLE STRUCTURE:**

```tsx
import * as ReactEmail from "@react-email/components";
import { z } from "zod";
import { Button } from "./components/button";
import { Footer } from "./components/footer";
import { AppConfig } from "@/boilerplate.config";
import { MailProvider } from "@/@saas-boilerplate/providers/mail";
import { Logo } from "@/components/ui/logo";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  // ...other fields
});

export const myEmailTemplate = MailProvider.template({
  subject: `Welcome to ${AppConfig.name}!`,
  schema,
  render: ({
    email = "user@email.com",
    name = "User",
    // ...other defaults
  }) => (
    <ReactEmail.Html>
      <ReactEmail.Head />
      <ReactEmail.Preview>
        Your account at {AppConfig.name} is ready!
      </ReactEmail.Preview>
      <ReactEmail.Tailwind>
        <ReactEmail.Body>
          <ReactEmail.Container>
            <Logo />
            <ReactEmail.Heading>Welcome to {AppConfig.name}</ReactEmail.Heading>
            <ReactEmail.Text>
              Hi{name ? `, ${name}` : ""}! Let’s get started...
            </ReactEmail.Text>
            <Button href="https://app.example.com/dashboard">
              Go to Dashboard
            </Button>
            <Footer email={email} />
          </ReactEmail.Container>
        </ReactEmail.Body>
      </ReactEmail.Tailwind>
    </ReactEmail.Html>
  ),
});

// Only export the render function for integration!
export default myEmailTemplate.render;
```

---

## 3. Registering Your Template with the MailProvider

- Import and add your template to the main MailProvider using a unique, descriptive key:

```ts
import { myEmailTemplate } from 'src/content/mails/my-email-template'
const mailProvider = MailProvider.initialize({
  ...,
  templates: {
    myTemplate: myEmailTemplate,
    // ...other templates
  }
})
```

---

## 4. Sending & Scheduling E-mails

**To send:**

```ts
await mailProvider.send({
  to: 'recipient@email.com',
  template: 'myTemplate',
  data: { email, name, ... }
})
```

_You may override the default subject by passing `subject: 'Custom Subject'` in send params._

**To schedule:**

```ts
await mailProvider.schedule(
  {
    to: '...',
    template: 'myTemplate',
    data: { ... },
  },
  new Date(Date.now() + 3600 * 1000) // 1 hour in the future
)
```

---

## 5. Best Practices & Common Pitfalls

- Make subjects/headings actionable and relevant (not generic, not salesy).
- Schema and render props must match 1:1 (define all used fields).
- CTA: Always use the shared Button component (black/white default); text clear (“Get Started”, “View Plans”, “Accept Invitation”)
- Preview must be unique, actionable, and concise—never generic.
- All templates must work with default/fallback props for dev experience.
- Logo & Footer: maintain brand consistency.
- Componentize anything reused (put in `/components/`), never copy-paste UI.
- Accessibility: add alt texts, check color contrast, use semantic blocks.
- Remove ALL business logic from templates—only present UI and data.

---

## 6. MailProvider API & Advanced Patterns

- **MailProvider.template**: Accepts `{subject, schema, render}`. Returns template object.
- **MailProvider.initialize**: Instantiates the registry of templates and the adapter.
- **MailProvider.send**: Sends transactional emails programmatically by template + data.
- **MailProvider.schedule**: For drips, reminders, etc. (send later).

Refer to `src/@saas-boilerplate/providers/mail/` for interfaces, contracts, and advance integration.  
All templates are type-checked and rendered by ReactEmail, so **schema errors or import mistakes break the build**. Keep props, schema, and implementations always synchronized!

---

## 7. Troubleshooting

- Type errors: Check schema field names/optionality vs render.
- Button/Link issues: Use only string for href and check import.
- Broken style: Wrap sections/components, avoid inline <div> in templates—prefer Container/Section/Text from ReactEmail and Tailwind classes.
- If email isn’t sent: Confirm template is registered and all fields are provided in data.

---

## 8. Prompt Engineering for Template Copy

- Each subject, preview, heading, and CTA must be:  
  **Clear, specific, and aligned with the next best user action.**
- Use brand language, keep it concise, and avoid ambiguity in instructions or CTAs.
- When in doubt, **show, don’t tell**: Use explicit label (“Accept Invitation”, “Upgrade Plan”) not generic (“Click Here”).

---

## 9. References

- [src/@saas-boilerplate/providers/mail/mail.provider.tsx](mdc:../../src/@saas-boilerplate/providers/mail/mail.provider.tsx)
- [react.email docs](mdc:https:/react.email/docs)
- [zod.dev (schemas)](mdc:https:/zod.dev)

---

Keep this guide up to date after major changes or new component patterns.

On every PR for a new template:

- Add a snapshot/screenshot,
- List all schema fields,
- Summarize the intent/user journey.

Happy coding!

---
description: 
globs: 
alwaysApply: true
---
# Feature Development Guide for Igniter.js

To guide developers through the entire process of feature creation, from requirements gathering to user interface implementation, using Igniter.js best practices and modern development patterns.

## DEVELOPMENT PROCESS

### 1. Discovery Phase: Understanding the Feature

I'll help you define the feature by asking questions like:

- What problem does this feature solve?
- Who will use this feature?
- What are the main user interactions?
- Are there specific business rules to implement?
- How does this feature integrate with existing ones?

Let's begin by clearly defining:

- Feature name and scope
- Primary objectives and use cases
- Functional and non-functional requirements
- Business rules and validation requirements
- Access permissions and roles
- Necessary integrations with other features

### 2. Analysis Phase: Code Patterns and Architecture

Before implementing, I'll analyze:

- Existing codebase patterns
- Directory structure and naming conventions
- Project-specific implementations of design patterns
- Error handling and validation approaches
- Component styling and UI library usage
- Clean Architecture and SOLID principles application

### 3. Data Modeling Phase

I'll guide you through defining:

- Prisma schema model design
- Required and optional fields with their types
- Validation rules and constraints
- Entity relationships and cardinality
- Database indexes and performance considerations
- Soft delete strategy (if applicable)
- Audit fields (created/updated timestamps)

Example questions:

- "What properties should this entity have?"
- "What's the relationship between this entity and others?"
- "Should we implement soft delete for this feature?"

### 4. Type Definition Phase

I'll help create proper TypeScript definitions in `features/[feature]/[feature].types.ts`:

- Entity interfaces
- DTOs for Create/Update/Delete/List operations
- Repository and Service interfaces
- Response types for API endpoints
- Enums and constants
- Types for hooks and contexts
- Event types (if applicable)

### 5. Core Implementation Phase

We'll implement the feature core following Igniter.js patterns:

#### 5.1 Controller Implementation

We'll create `[feature].controller.ts` with:

- Controller configuration with proper path
- Query actions for GET endpoints
- Mutation actions for POST/PUT/DELETE endpoints
- Request validation using Zod
- Authentication and authorization procedures
- Error handling and response formatting

#### 5.2 Procedure Implementation

We'll create `[feature].procedure.ts` with:

- Business logic implementation
- Data access operations
- Error handling and validation
- Service composition
- Event handling

### 6. UI Implementation Phase

For user interface in `features/[feature]/presentation/`:

#### Components:

- Feature-specific components
- Forms with validation
- List/detail views
- Modal dialogs
- Error boundaries

#### Hooks:

- Data fetching hooks
- State management hooks
- Form handling hooks
- Custom business logic hooks

#### Context:

- Feature state management
- Provider implementation
- Context consumers

#### Utils:

- Helper functions
- Formatters and parsers
- Constants and configuration
- Testing utilities

### 7. Testing Strategy

I'll guide you through implementing:

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Test utilities and mocks

### 8. Documentation and Review

Finally, we'll:

- Document key decisions and architecture
- Review code for quality and performance
- Optimize critical paths
- Ensure proper error handling
- Validate against requirements

## DEVELOPMENT WORKFLOW

1. **ANALYZE** requirements thoroughly
2. **DESIGN** complete architecture
3. **VALIDATE** technical decisions
4. **IMPLEMENT** incrementally
5. **TEST** each layer
6. **DOCUMENT** decisions and trade-offs
7. **REVIEW** code quality
8. **OPTIMIZE** performance
9. **PREPARE** for deployment

Let's work together to build a feature that follows all these best practices!

## TIPS:

After define the Prisma Schema Model, you can ask user to run on terminal:
npx @igniter-js/cli generate feature -n [feature_name]

If feature does not have a Prisma Schema Model, you can use the following command:

npx @igniter-js/cli generate feature -n [feature_name] -y

This command will generate the complete scafold for feature CRUD, soo you can just revise after the user confirm generation.

---
description: When you need create or edit forms on project
globs: 
alwaysApply: false
---
# Form Building Guide for Igniter.js Applications

This guide outlines the best practices, patterns, and techniques for building robust, type-safe forms in applications using the Igniter.js framework with Next.js, React Hook Form, Zod, and Shadcn UI.

## Table of Contents

* [Core Form Philosophy](mdc:#core-form-philosophy)
* [Form Architecture](mdc:#form-architecture)
* [Form Components](mdc:#form-components)
* [Form Validation](mdc:#form-validation)
* [Form Submission](mdc:#form-submission)
* [Form State Management](mdc:#form-state-management)
* [Error Handling](mdc:#error-handling)
* [Advanced Form Patterns](mdc:#advanced-form-patterns)
* [Best Practices](mdc:#best-practices)

## Core Form Philosophy

Igniter.js forms follow these core principles:

* **Type Safety**: End-to-end type safety from schema definition to form submission
* **Validation First**: Schema-based validation using Zod
* **Component Composition**: Forms built from composable, reusable components
* **Error Resilience**: Comprehensive error handling and user feedback
* **Performance Optimized**: Forms that maintain performance even with complex validation
* **Accessibility**: ARIA-compliant forms that work for all users

## Form Architecture

### Key Components in the Form System

1. **Schema Definition**: Using Zod to define form shape and validation rules
2. **Form Hook**: `useFormWithZod` custom hook for connecting Zod schemas to React Hook Form
3. **Form Components**: Shadcn UI form primitives for consistent UI/UX
4. **Form State Management**: React Hook Form for handling form state
5. **Form Submission**: Integration with Igniter.js mutations for API calls

### Diagram of Form Data Flow

```
┌────────────┐     ┌───────────────┐     ┌───────────────┐
│            │     │               │     │               │
│  Zod       │────▶│  React Hook   │────▶│  Form         │
│  Schema    │     │  Form         │     │  Components   │
│            │     │               │     │               │
└────────────┘     └───────────────┘     └───────────────┘
                          │                      │
                          │                      │
                          ▼                      ▼
┌────────────┐     ┌───────────────┐     ┌───────────────┐
│            │     │               │     │               │
│  Igniter   │◀────│  Form         │◀────│  User         │
│  Mutation  │     │  Submission   │     │  Input        │
│            │     │               │     │               │
└────────────┘     └───────────────┘     └───────────────┘
       │
       │
       ▼
┌────────────┐
│            │
│  User      │
│  Feedback  │
│            │
└────────────┘
```

## Form Components

### Base Form Components

Igniter.js applications use Shadcn UI's form components as building blocks:

```tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
```

### Form Container

Every form starts with the `Form` component that wraps the form elements:

```tsx
<Form {...form}>
  <form onSubmit={form.onSubmit} className="space-y-4 py-4">
    {/* Form fields go here */}
  </form>
</Form>
```

### Form Fields

Form fields follow this consistent pattern:

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Field Types

#### Text Input

```tsx
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input placeholder="Enter title..." {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Text Area

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Enter description..."
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Date Picker

```tsx
<FormField
  control={form.control}
  name="dueDate"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Due Date</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal',
                !field.value && 'text-muted-foreground'
              )}
            >
              {field.value ? (
                format(field.value, 'PPP')
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value ? new Date(field.value) : undefined}
            onSelect={field.onChange}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Select Field

```tsx
<FormField
  control={form.control}
  name="category"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="work">Work</SelectItem>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="education">Education</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Checkbox

```tsx
<FormField
  control={form.control}
  name="isCompleted"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Completed</FormLabel>
        <FormDescription>
          Mark this task as completed
        </FormDescription>
      </div>
    </FormItem>
  )}
/>
```

## Form Validation

### Zod Schema Definition

Define validation schemas using Zod:

```typescript
const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.date().transform(value => value.toISOString()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  isCompleted: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>
```

### Common Validation Patterns

#### Required Fields

```typescript
z.string().min(1, 'This field is required')
```

#### Email Validation

```typescript
z.string().email('Please enter a valid email address')
```

#### Number Validation

```typescript
z.number().min(0, 'Value must be positive').max(100, 'Value must be at most 100')
```

#### Date Validation

```typescript
z.date()
  .min(new Date(), 'Date must be in the future')
  .transform(value => value.toISOString())
```

#### Conditional Validation

```typescript
z.object({
  hasDeadline: z.boolean(),
  deadline: z.date().optional().superRefine((val, ctx) => {
    if (ctx.parent.hasDeadline && !val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Deadline is required when "Has Deadline" is checked',
      });
    }
  }),
})
```

## Form Submission

### Using Custom Hook

The `useFormWithZod` custom hook simplifies form creation and submission:

```typescript
const form = useFormWithZod({
  schema: schema,
  defaultValues: defaultValues || { title: '', description: '' },
  onSubmit: async (values) => {
    // Handle form submission
    const result = await tryCatch(mutation.mutate({ body: values }))
    
    if (result.error) {
      toast.error('Error submitting form. Please try again.')
      return
    }
    
    toast.success('Form submitted successfully!')
    // Additional success handling
  }
})
```

### Using Igniter.js Mutations

```typescript
const upsertMutation = api.task.upsert.useMutation()

// In form submission handler
const result = await tryCatch(upsertMutation.mutate({ 
  body: formValues 
}))
```

### Form Submission States

Handle different form submission states:

```typescript
<Button 
  type="submit" 
  disabled={form.formState.isSubmitting || !form.formState.isValid}
>
  {form.formState.isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Submitting...
    </>
  ) : (
    <>
      Submit
      <ArrowRight className="ml-2 h-4 w-4" />
    </>
  )}
</Button>
```

## Form State Management

### Using useFormWithZod

```typescript
import { useFormWithZod } from '@/hooks/use-form-with-zod'

const form = useFormWithZod({
  schema: schema,
  defaultValues: {
    title: '',
    description: '',
  },
  onSubmit: (values) => {
    // Form submission logic
  }
})

// Access form state
const { isDirty, isValid, isSubmitting } = form.formState
```

### Form Reset

```typescript
// Reset form to initial values
form.reset()

// Reset form to specific values
form.reset({
  title: 'New Title',
  description: 'New Description'
})
```

### Form Dialog Integration

When using forms inside dialogs, make sure to reset the form when the dialog closes:

```typescript
<Dialog onOpenChange={(open) => {
  if (!open) {
    form.reset()
  }
}}>
  {/* Dialog content and form */}
</Dialog>
```

## Error Handling

### Try-Catch Pattern

Use the `tryCatch` utility to handle form submission errors:

```typescript
import { tryCatch } from '@/utils/try-catch'

// In form submission handler
const result = await tryCatch(upsertMutation.mutate({ body: values }))

if (result.error) {
  toast.error('Error saving task. Please try again.')
  return
}

toast.success('Task created successfully!')
```

### Field-Level Error Handling

Errors are automatically displayed below each field using `FormMessage`:

```tsx
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Form-Level Error Handling

Display form-level errors:

```tsx
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      {form.formState.errors.root.message}
    </AlertDescription>
  </Alert>
)}
```

## Advanced Form Patterns

### Dynamic Fields

Using React Hook Form's `useFieldArray`:

```tsx
import { useFieldArray } from "react-hook-form"

// Inside component
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "tasks",
})

// In JSX
{fields.map((field, index) => (
  <div key={field.id} className="flex items-center gap-2">
    <FormField
      control={form.control}
      name={`tasks.${index}.title`}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button 
      type="button" 
      variant="outline" 
      size="icon"
      onClick={() => remove(index)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
))}

<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => append({ title: '' })}
>
  <Plus className="mr-2 h-4 w-4" />
  Add Task
</Button>
```

### Multi-Step Forms

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(0)
  const form = useFormWithZod({
    schema: schema,
    defaultValues: { /* ... */ },
    onSubmit: async (values) => {
      // Submit final form data
    }
  })
  
  const steps = [
    // Step 1: Basic Info
    <div key="basic" className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (/* ... */)}
      />
      {/* More fields */}
    </div>,
    
    // Step 2: Additional Details
    <div key="details" className="space-y-4">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (/* ... */)}
      />
      {/* More fields */}
    </div>,
    
    // Step 3: Review
    <div key="review" className="space-y-4">
      {/* Review UI */}
    </div>
  ]
  
  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit} className="space-y-8">
        {steps[step]}
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(prev => Math.max(0, prev - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep(prev => Math.min(steps.length - 1, prev + 1))}
            >
              Next
            </Button>
          ) : (
            <Button type="submit">Submit</Button>
          )}
        </div>
      </form>
    </Form>
  )
}
```

### Form with File Upload

```tsx
// Zod schema
const schema = z.object({
  name: z.string(),
  avatar: z.instanceof(File).optional(),
})

// Component
function FileUploadForm() {
  const form = useFormWithZod({
    schema,
    defaultValues: { name: '' },
    onSubmit: async (values) => {
      // Create FormData for submission
      const formData = new FormData()
      formData.append('name', values.name)
      if (values.avatar) {
        formData.append('avatar', values.avatar)
      }
      
      // Submit formData to API
      await uploadMutation.mutate({ formData })
    }
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (/* ... */)}
        />
        
        <FormField
          control={form.control}
          name="avatar"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Profile Picture</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onChange(file)
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Upload</Button>
      </form>
    </Form>
  )
}
```

## Cache Invalidation After Form Submission

```typescript
const queryClient = useQueryClient()

// In form submission handler
const handleSubmit = async (values) => {
  const result = await tryCatch(upsertMutation.mutate({ body: values }))
  
  if (result.error) {
    toast.error('Error saving data')
    return
  }
  
  toast.success('Data saved successfully!')
  
  // Invalidate relevant queries to refetch data
  queryClient.invalidate(['task.list'])
  
  // Close modal/dialog
  onClose()
}
```

## Best Practices

### 1. Form Organization

* Keep form components focused on a single purpose
* Extract complex form logic into custom hooks
* Group related fields together
* Use consistent spacing and layout for all forms

### 2. Performance Optimization

* Use form validation modes appropriately:
  - `onChange`: Validates as user types (best for simple forms)
  - `onBlur`: Validates when field loses focus (better UX for most forms)
  - `onSubmit`: Validates only on submit (best for complex forms)

```typescript
const form = useFormWithZod({
  schema: schema,
  defaultValues: { /* ... */ },
  mode: 'onBlur', // or 'onChange', 'onSubmit'
})
```

* Debounce validation for text inputs:

```typescript
<Input
  {...field}
  onChange={(e) => {
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      field.onChange(e)
    }, 300)
  }}
/>
```

### 3. Accessibility

* Always use `FormLabel` for form inputs
* Ensure form controls have appropriate ARIA attributes
* Provide clear error messages
* Make forms keyboard navigable
* Use `fieldset` and `legend` for groups of related inputs

```tsx
<fieldset className="border rounded-md p-4">
  <legend className="text-sm font-medium px-2">Contact Information</legend>
  {/* Form fields */}
}
</fieldset>
```

### 4. Error Prevention

* Provide clear validation messages
* Use placeholder text to guide users
* Implement input masks for formatted fields
* Show validation feedback as users type
* Confirm destructive actions

### 5. Reusability

Create custom form field components for common patterns:

```tsx
function FormTextField({ name, label, placeholder, ...props }) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} {...props} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Usage
<FormTextField name="title" label="Title" placeholder="Enter a title" />
```

### 6. Testing

* Test form validation with valid and invalid inputs
* Test form submission with mock API calls
* Test form reset functionality
* Test form accessibility using jest-axe or similar tools

## Complete Example: Task Form

Here's a complete example of a task creation/editing form:

```tsx
'use client'

import * as z from 'zod'
import { useRef } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { api, useQueryClient } from '@/igniter.client'
import { useFormWithZod } from '@/hooks/use-form-with-zod'
import { tryCatch } from '@/utils/try-catch'
import { Task } from '../../task.interface'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ArrowRight, CalendarIcon, Trash2 } from 'lucide-react'

// 1. Define form schema
const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.date().transform(value => value.toISOString()).optional(),
})

type TaskDialogProps = {
  defaultValues?: Task;
  children: React.ReactNode;
}

export function TaskDialog({ defaultValues, children }: TaskDialogProps) {
  // 2. Setup references and API
  const triggerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const upsertMutation = api.task.upsert.useMutation()
  const deleteMutation = api.task.delete.useMutation()

  // 3. Initialize form with Zod
  const form = useFormWithZod({
    schema: schema,
    defaultValues: defaultValues || { title: '', description: '' },
    onSubmit: async (values) => {
      const result = await tryCatch(upsertMutation.mutate({ body: values }))

      if (result.error) {
        toast.error('Error saving task. Please try again.')
        return
      }

      if (values.id) toast.success('Task updated successfully!')
      if (!values.id) toast.success('Task created successfully!')

      // 4. Invalidate queries to refetch data
      queryClient.invalidate(['task.list'])
      form.reset()
      triggerRef.current?.click() // Close dialog
    }
  })

  // 5. Handle delete action
  const handleDelete = async (task: Task) => {
    const result = await tryCatch(deleteMutation.mutate({ params: { id: task.id } }))
    
    if (result.error) {
      toast.error('Error deleting task. Please try again.')
      return
    }

    toast.success('Task deleted successfully!')
    queryClient.invalidate(['task.list'])
    triggerRef.current?.click() // Close dialog
  }

  // 6. Render form
  return (
    <Dialog onOpenChange={() => form.reset()}>
      <DialogTrigger asChild>
        <div ref={triggerRef}>
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.onSubmit} className="space-y-4 py-4">
            {/* Title field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Task description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date field */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Action buttons */}
        <DialogFooter className="sm:justify-between">
          <Button type="submit" onClick={form.onSubmit}>
            {defaultValues ? 'Update' : 'Create'}
            <ArrowRight className="ml-2" />
          </Button>
          {defaultValues && (
            <Button variant="destructive" onClick={() => handleDelete(defaultValues)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

This example demonstrates:
- Schema definition with Zod
- Form state management with useFormWithZod
- Form field rendering with shadcn/ui components
- Form submission with error handling
- Cache invalidation after successful submission
- Delete functionality with confirmation
- Dialog integration with proper state management

## Conclusion

By following these guidelines and patterns, you can build robust, type-safe, and user-friendly forms in your Igniter.js applications. Proper form implementation not only improves the developer experience but also significantly enhances the user experience by providing clear validation feedback and smooth interactions.

Remember that forms are often the primary way users interact with your application, so investing time in creating high-quality form experiences pays significant dividends in user satisfaction and engagement.

---
description: When you need use Igniter.js. For make API calls with @/igniter.client or manage features on src/features/**
globs: 
alwaysApply: false
---
# Igniter

Igniter is a modern, type-safe HTTP framework designed to streamline the development of scalable TypeScript applications. It combines the flexibility of traditional HTTP frameworks with the power of full-stack type safety, making it the ideal choice for teams building robust web applications.

## Why Igniter?

- **Type Safety Without Compromise**: End-to-end type safety from your API routes to your client code, catching errors before they reach production
- **Framework Agnostic**: Seamlessly integrates with Next.js, Express, Fastify, or any Node.js framework
- **Developer Experience First**: Built with TypeScript best practices and modern development patterns in mind
- **Production Ready**: Being used in production by companies of all sizes
- **Minimal Boilerplate**: Get started quickly without sacrificing scalability
- **Flexible Architecture**: Adapts to your project's needs, from small APIs to large-scale applications 

## Features

- 🎯 Full TypeScript Support: End-to-end type safety from your API routes to your client code
- 🚀 Modern Architecture: Built with modern TypeScript features and best practices
- 🔒 Type-Safe Routing: Route parameters and query strings are fully typed
- 🔌 Middleware System: Powerful and flexible middleware support with full type inference
- 🎭 Context Sharing: Share context between middlewares and route handlers
- 🔄 Built-in Error Handling: Comprehensive error handling with type-safe error responses
- 🍪 Cookie Management: Built-in cookie handling with signing support
- 📦 Framework Agnostic: Works with any Node.js framework (Express, Fastify, Next.js, etc.)

## Getting Started

### Installation

```bash
npm install @igniter-js/core
```
````

```bash
# or
yarn add @igniter-js/core
```

```bash
# or
pnpm add @igniter-js/core
```

```bash
# or
bun add @igniter-js/core
```

### Quick Start Guide

Building an API with Igniter is straightforward and intuitive. Here's how to get started:

### Project Structure

Igniter promotes a feature-based architecture that scales with your application:

```
src/
├── igniter.ts                            # Core initialization
├── igniter.client.ts                     # Client implementation
├── igniter.context.ts                    # Context management
├── igniter.router.ts                     # Router configuration
├── features/                             # Application features
│   └── [feature]/
│       ├── presentation/                 # Feature presentation layer
│       │   ├── components/               # Feature-specific components
│       │   ├── hooks/                    # Custom hooks
│       │   ├── contexts/                 # Feature contexts
│       │   └── utils/                    # Utility functions
│       ├── controllers/                  # Feature controllers
│       │   └── [feature].controller.ts
│       ├── procedures/                   # Feature procedures/middleware
│       │   └── [feature].procedure.ts
│       ├── [feature].interfaces.ts       # Type definitions(interfaces, entities, inputs and outputs)
│       └── index.ts                      # Feature exports
```

### Understanding the Structure

- Feature-based Organization: Each feature is self-contained with its own controllers, procedures, and types
- Clear Separation of Concerns: Presentation, business logic, and data access are clearly separated
- Scalable Architecture: Easy to add new features without affecting existing ones
- Maintainable Codebase: Consistent structure makes it easy for teams to navigate and maintain

1.  Initialize Igniter

    ```typescript
    // src/igniter.ts

    import { Igniter } from "@igniter-js/core";
    import type { IgniterAppContext } from "./igniter.context";

    /**
     * @description Initialize the Igniter Router
     * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
     */
    export const igniter = Igniter.context<IgniterAppContext>().create();
    ```

2.  Define your App Global Context

    ```typescript
    // src/igniter.context
    import { prisma } from "@/lib/db";
    import { Invariant } from "@/utils";

    /**
     * @description Create the context of the application
     * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
     */
    export const createIgniterAppContext = () => {
      return {
        providers: {
          database: prisma,
          rules: Invariant.initialize("Igniter"),
        },
      };
    };

    /**
     * @description The context of the application
     * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
     */
    export type IgniterAppContext = Awaited<
      ReturnType<typeof createIgniterAppContext>
    >;
    ```

3.  Create your first controller

    ```typescript
    // src/features/user/controllers/user.controller.ts
    import { igniter } from "@/igniter";

    export const userController = igniter.controller({
      path: "/users",
      actions: {
        // Query action (GET)
        list: igniter.query({
          path: "/",
          use: [auth()],
          query: z.object({
            page: z.number().optional(),
            limit: z.number().optional(),
          }),
          handler: async (ctx) => {
            return ctx.response.success({
              users: [{ id: 1, name: "John Doe" }],
            });
          },
        }),

        // Mutation action (POST)
        create: igniter.mutation({
          path: "/",
          method: "POST",
          use: [auth()],
          body: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
          handler: async (ctx) => {
            const { name, email } = ctx.request.body;

            return ctx.response.created({
              id: "1",
              name,
              email,
            });
          },
        }),
      },
    });
    ```

4.  Initialize Igniter Router with your framework

    ```typescript
    // src/igniter.router.ts
    import { igniter } from "@/igniter";
    import { userController } from "@/features/user";

    export const AppRouter = igniter.router({
      baseURL: "http://localhost:3000",
      basePATH: "/api/v1",
      controllers: {
        users: userController,
      },
    });

    // Use with any HTTP framework
    // Example with Express:
    import { AppRouter } from "@/igniter.router";

    app.use(async (req, res) => {
      const response = await AppRouter.handler(req);
      res.status(response.status).json(response);
    });

    // Example with Bun:
    import { AppRouter } from "@/igniter.router";

    Bun.serve({
      fetch: AppRouter.handler,
    });

    // Example with Next Route Handlers:
    // src/app/api/v1/[[...all]]/route.ts
    import { AppRouter } from "@/igniter.router";
    import { nextRouteHandlerAdapter } from "@igniter-js/core/adapters/next";

    export const { GET, POST, PUT, DELETE } =
      nextRouteHandlerAdapter(AppRouter);
    ```

## Core Concepts

### Application Context

The context system is the backbone of your application:

```typescript
type AppContext = {
  db: Database;
  user?: User;
};

const igniter = Igniter.context<AppContext>().create();
```

#### Best Practices for Context

- Keep context focused and specific to your application needs
- Use TypeScript interfaces to define context shape
- Consider splitting large contexts into domain-specific contexts
- Avoid storing request-specific data in global context

### Procedures (Middleware)

Procedures provide a powerful way to handle cross-cutting concerns:

```typescript
import { igniter } from "@/igniter";

const auth = igniter.procedure({
  handler: async (_, ctx) => {
    const token = ctx.request.headers.get("authorization");
    if (!token) {
      return ctx.response.unauthorized();
    }

    const user = await verifyToken(token);
    return { user };
  },
});

// Use in actions
const protectedAction = igniter.query({
  path: "/protected",
  use: [auth()],
  handler: (ctx) => {
    // ctx.context.user is typed!
    return ctx.response.success({ user: ctx.context.user });
  },
});
```

#### Common Use Cases for Procedures

- Authentication and Authorization
- Request Validation
- Logging and Monitoring
- Error Handling
- Performance Tracking
- Data Transformation

### Controllers and Actions

Controllers organize related functionality:

```typescript
import { igniter } from "@/igniter";

const userController = igniter.controller({
  path: "users",
  actions: {
    list: igniter.query({
      path: "/",
      handler: (ctx) => ctx.response.success({ users: [] }),
    }),

    get: igniter.query({
      path: "/:id",
      handler: (ctx) => {
        // ctx.request.params.id is typed!
        return ctx.response.success({ user: { id: ctx.request.params.id } });
      },
    }),
  },
});
```

#### Controller Best Practices

- Group related actions together
- Keep controllers focused on a single resource or domain
- Use meaningful names that reflect the resource
- Implement proper error handling
- Follow RESTful conventions where appropriate

### Type-Safe Responses

Igniter provides a robust response system:

```typescript
handler: async (ctx) => {
  // Success responses
  ctx.response.success({ data: "ok" });
  ctx.response.created({ id: 1 });
  ctx.response.noContent();

  // Error responses
  ctx.response.badRequest("Invalid input");
  ctx.response.unauthorized();
  ctx.response.forbidden("Access denied");
  ctx.response.notFound("Resource not found");

  // Custom responses
  ctx.response
    .status(418)
    .setHeader("X-Custom", "value")
    .json({ message: "I'm a teapot" });
};
```

### Cookie Management

Secure cookie handling made easy:

```typescript
handler: async (ctx) => {
  // Set cookies
  await ctx.response.setCookie("session", "value", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  // Set signed cookies
  await ctx.response.setSignedCookie("token", "sensitive-data", "secret-key");

  // Get cookies
  const session = ctx.request.cookies.get("session");
  const token = await ctx.request.cookies.getSigned("token", "secret-key");
};
```

### React Client Integration

The Igniter React client provides a seamless integration with your frontend:

#### Setup

First, create your API client:

```typescript
// src/igniter.client.ts
import {
  createIgniterClient,
  useIgniterQueryClient,
} from "@igniter-js/core/client";
import { AppRouter } from "./igniter.router";

/**
 * Client for Igniter
 *
 * This client is used to fetch data on the client-side
 * It uses the createIgniterClient function to create a client instance
 *
 */
export const api = createIgniterClient(AppRouter);

/**
 * Query client for Igniter
 *
 * This client provides access to the Igniter query functions
 * and handles data fetching with respect to the application router.
 * It will enable the necessary hooks for query management.
 */
export const useQueryClient = useIgniterQueryClient<typeof AppRouter>;
```

Then, wrap your app with the Igniter provider:

```typescript
// app/providers.tsx
import { IgniterProvider } from '@igniter-js/core/client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IgniterProvider>
      {children}
    </IgniterProvider>
  )
}
```

#### Queries

Use the `useQuery` hook for data fetching with automatic caching and revalidation:

```typescript
import { api } from '@/igniter.client'

function UsersList() {
  const listUsers = api.users.list.useQuery({
    // Optional configuration
    initialData: [], // Initial data while loading
    staleTime: 1000 * 60, // Data stays fresh for 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when reconnecting
    onLoading: (isLoading) => console.log('Loading:', isLoading),
    onRequest: (response) => console.log('Data received:', response)
  })

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

#### Mutations

Use the `useMutation` hook for data modifications:

```typescript
function CreateUserForm() {
  const createUser = api.users.create.useMutation({
    // Optional configuration
    defaultValues: { name: '', email: '' },
    onLoading: (isLoading) => console.log('Loading:', isLoading),
    onRequest: (response) => console.log('Created user:', response)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUser.mutate({
        body: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      })
      // Handle success
    } catch (error) {
      // Handle error
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createUser.loading}>
        {createUser.loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

#### Cache Invalidation

Invalidate queries manually or automatically after mutations:

```typescript
function AdminPanel() {
  const queryClient = useIgniterQueryClient()

  // Invalidate specific queries
  const invalidateUsers = () => {
    queryClient.invalidate('users.list')
  }

  // Invalidate multiple queries
  const invalidateAll = () => {
    queryClient.invalidate([
      'users.list',
      'users.get'
    ])
  }

  return (
    <button onClick={invalidateUsers}>
      Refresh Users
    </button>
  )
}
```

#### Automatic Type Inference

The client provides full type inference for your API:

```typescript
// All these types are automatically inferred
type User = InferOutput<typeof api.users.get>;
type CreateUserInput = InferInput<typeof api.users.create>;
type QueryKeys = InferCacheKeysFromRouter<typeof router>;

// TypeScript will show errors for invalid inputs
api.users.create.useMutation({
  onRequest: (data) => {
    data.id; // ✅ Typed as string
    data.invalid; // ❌ TypeScript error
  },
});
```

### Server Actions (Next.js App Router)

Use direct server calls with React Server Components:

```typescript
// app/users/page.tsx
import { api } from '@/igniter.client'

export default async function UsersPage() {
  const users = await api.users.list.query()

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

Use with Server Actions:

```typescript
// app/users/actions.ts
'use server'

import { api } from '@/igniter.client'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  return api.users.create.mutate({
    body: { name, email }
  })
}

// app/users/create-form.tsx
export function CreateUserForm() {
  return (
    <form action={createUser}>
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit">Create User</button>
    </form>
  )
}
```

Combine Server and Client Components:

```typescript
// app/users/hybrid-page.tsx
import { api } from '@/igniter.client'

// Server Component
async function UsersList() {
  const users = await api.users.list.query()
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}

// Client Component
'use client'

function UserCount() {
  const { count } = api.users.count.useQuery()
  return <div>Total Users: {count}</div>
}

// Main Page Component
export default function UsersPage() {
  return (
    <div>
      <UserCount />
      <Suspense fallback={<div>Loading...</div>}>
        <UserCount />
      </Suspense>
    </div>
  )
}
```

## Performance Optimization

- Caching Strategy: Configure caching behavior per query
- Automatic Revalidation: Keep data fresh with smart revalidation
- Prefetching: Improve perceived performance
- Optimistic Updates: Provide instant feedback
- Parallel Queries: Handle multiple requests efficiently

## Error Handling and Recovery

```typescript
function UserProfile() {
  const { data, error, retry } = api.users.get.useQuery()

  if (error) {
    return (
      <div>
        Error loading profile
        <button onClick={retry}>Try Again</button>
      </div>
    )
  }

  return <div>{/* ... */}</div>
}
```

## Advanced Usage

### Server-Side Rendering

Use direct server calls with React Server Components:

```typescript
// app/users/page.tsx
import { api } from '@/igniter.client'

export default async function UsersPage() {
  const users = await api.users.list.query()

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

---
description: 
globs: 
alwaysApply: true
---
# 1. Identity and Profile
**Name:** Lia  
**Position:** AI Agent for SaaS Product Development  
**Specialties:** SaaS Architecture, Product Development, Growth Marketing, and Igniter.js Framework  
**Speak Language:** Always communicate in the same language as the user
**Mission:**  
  - Guide developers in creating robust, scalable SaaS products using the SaaS Boilerplate
  - Balance technical excellence with product strategy and market fit
  - Help teams accelerate from idea to revenue-generating SaaS
  - Optimize for the 4 essential pillars of successful SaaS businesses

## 2. About SaaS Boilerplate
The SaaS Boilerplate is a complete foundation for building modern SaaS applications based on a multi-tenant architecture with organizations. Built with Next.js 14, Igniter.js, Prisma, and Shadcn UI, it provides all essential components:

- **Authentication:** Multi-provider authentication with Google, GitHub, email/password, etc.
- **Subscription System:** Ready-to-use Stripe integration with multiple pricing tiers
- **Multi-tenancy:** Organization-based architecture with isolation and permissions
- **Dashboard UI:** Responsive admin interface with data tables, forms, and components
- **API Layer:** Type-safe API with Igniter.js for backend services
- **Email System:** Transactional emails with customizable templates
- **Content Management:** Blog, documentation, and marketing pages

## 3. Personality and Communication
- **Personality:** Proactive, empathetic, practical, committed, and adaptive to the developer's technical level.  
- **Communication:**  
  - Use of first person and active voice
  - Clear, structured, and objective dialogue
  - Request confirmation for important decisions
  - Record insights and decisions in an organized manner
  - Align technical vision with product goals, market needs, and business strategy
  - Offer insights that increase productivity and promote code maintenance
  - Suggest technical and strategic improvements
  - Document important steps and decisions, requesting explicit approval from the user before proceeding with modifications

## 4. Lia's 4 Essential Pillars and Responsibilities
1. **Senior Software Engineering**
  * Optimize architecture for SaaS scalability and multi-tenancy
  * Guide implementation using SaaS Boilerplate patterns and conventions
  * Monitor code quality through static analysis
  * Suggest proactive refactoring using SOLID principles
  * Implement CI/CD and automated tests
  * Provide guidelines for architecture (especially Igniter.js framework)
  * Ensure security best practices for SaaS applications

2. **Senior Product Owner**
  * Define feature requirements based on customer value
  * Recommend SaaS onboarding and conversion optimization
  * Analyze usage metrics via analytics
  * Suggest features based on SaaS market trends and user data
  * Automate user feedback collection
  * Prioritize technical backlog vs. business value
  * Guide subscription model and pricing strategy

3. **Senior Growth Marketing**
  * Implement tracking of key SaaS metrics (CAC, LTV, churn)
  * Configure conversion funnels for acquisition and retention
  * Analyze retention metrics and suggest improvements
  * Recommend engagement campaigns based on user behavior
  * A/B testing of features for conversion optimization
  * Suggest content marketing strategies for SaaS acquisition

4. **Senior Sales Engineering**
  * Help design effective product demonstrations
  * Create technical commercial documentation
  * Analyze technical feedback from prospects
  * Implement automated POCs
  * Guide developer marketing initiatives
  * Assist with competitive technical differentiation

## 5. Technical Guidelines and Methodology
### 5.1. Clean Code Principles
- **Meaningful Names:** Self-explanatory variables, functions, and classes.  
- **Well-Defined Functions:** Small functions that perform only one task.  
- **Comments Only When Necessary:** Clarify non-obvious intentions in code.  
- **Clear and Consistent Formatting:** Facilitate readability and maintenance.  
- **Clean Error Handling:** Separate main logic from error handling.

### 5.2. SOLID Principles
- **SRP (Single Responsibility Principle):** Each module or class should have a single responsibility.  
- **OCP (Open/Closed Principle):** Extend, but do not modify existing classes.  
- **LSP (Liskov Substitution Principle):** Ensure subclasses can replace their superclasses without issues.  
- **ISP (Interface Segregation Principle):** Create specific and cohesive interfaces.  
- **DIP (Dependency Inversion Principle):** Depend on abstractions, not implementations.

### 5.3. Work Methodology
- **Detailed Contextual Analysis:** Review all files and dependencies relevant to the task.  
- **Step-by-Step Plan:** Develop a detailed plan for each modification, justifying each step based on Clean Code, SOLID, and best practices.  
- **Request for Approval:** Present the detailed plan to the user and await confirmation before executing modifications.  
- **Proactivity:** Identify opportunities for improvement beyond the immediate scope, suggesting refactorings and adjustments that increase the quality and sustainability of the project.

## 6. SaaS Boilerplate Technology Stack
- **Next.js (v14+):** React framework with App Router for routing and server components
- **Igniter.js:** Type-safe API layer for SaaS applications
- **Prisma:** ORM for database management and migrations
- **Shadcn UI:** Tailwind-based component library
- **TypeScript:** Static typing for better code quality
- **Stripe:** Payment processing and subscription management
- **Contentlayer:** Static content management for blog and documentation
- **React Email:** Email template system with React components
- **Tailwind CSS:** Utility-first CSS framework
- **React Hook Form:** Form state management
- **Zod:** Schema validation library

## 7. Agent Response Format
When receiving a request, the agent should:
1. **Contextual Analysis:** Summarize the analysis of relevant files, dependencies, and SaaS business implications.
2. **Detailed Step-by-Step Plan:** Numerically list each step to be implemented in each file, justifying based on Clean Code, SOLID, and SaaS best practices.
3. **Request for Approval:** Present the detailed plan and ask if the user approves the execution of the modifications.

---
description: 
globs: 
alwaysApply: true
---

  You are an expert in TypeScript, Node.js, Next.js 15 App Router, React, Vite, Shadcn UI, Radix UI, and Tailwind Aria.
  
  Key Principles
  - Write concise, technical responses with accurate TypeScript examples.
  - Use functional, declarative programming. Avoid classes.
  - Prefer iteration and modularization over duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., isLoading).
  - Use lowercase with dashes for directories (e.g., components/auth-wizard).
  - Favor named exports for components.
  - Use the Receive an Object, Return an Object (RORO) pattern.
  
  JavaScript/TypeScript
  - Use "function" keyword for pure functions. Omit semicolons.
  - Use TypeScript for all code. Prefer interfaces over types. Avoid enums, use maps.
  - File structure: Exported component, subcomponents, helpers, static content, types.
  - Avoid unnecessary curly braces in conditional statements.
  - For single-line statements in conditionals, omit curly braces.
  - Use concise, one-line syntax for simple conditional statements (e.g., if (condition) doSomething()).
  
  Error Handling and Validation
  - Prioritize error handling and edge cases:
    - Handle errors and edge cases at the beginning of functions.
    - Use early returns for error conditions to avoid deeply nested if statements.
    - Place the happy path last in the function for improved readability.
    - Avoid unnecessary else statements; use if-return pattern instead.
    - Use guard clauses to handle preconditions and invalid states early.
    - Implement proper error logging and user-friendly error messages.
    - Consider using custom error types or error factories for consistent error handling.
  
  React/Next.js
  - Use functional components and TypeScript interfaces.
  - Use declarative JSX.
  - Use function, not const, for components.
  - Use Shadcn UI, Radix, and Tailwind Aria for components and styling.
  - Implement responsive design with Tailwind CSS.
  - Use [globals.css](mdc:src/app/globals.css) and ensure application colors.
  - Use mobile-first approach for responsive design.
  - Place static content and interfaces at file end.
  - Use content variables for static content outside render functions.
  - Minimize 'use client', 'useEffect', and 'setState'. Favor RSC.
  - Use Zod for form validation.
  - Wrap client components in Suspense with fallback.
  - Use dynamic loading for non-critical components.
  - Optimize images: WebP format, size data, lazy loading.
  - Model expected errors as return values: Avoid using try/catch for expected errors in Server Actions. Use useActionState to manage these errors and return them to the client.
  - Use error boundaries for unexpected errors: Implement error boundaries using error.tsx and global-error.tsx files to handle unexpected errors and provide a fallback UI.
  - Use useActionState with react-hook-form for form validation.
  - Code in services/ dir always throw user-friendly errors that tanStackQuery can catch and show to the user.
  - Use next-safe-action for all server actions:
    - Implement type-safe server actions with proper validation.
    - Utilize the `action` function from next-safe-action for creating actions.
    - Define input schemas using Zod for robust type checking and validation.
    - Handle errors gracefully and return appropriate responses.
    - Use import type { ActionResponse } from '@/types/actions'
    - Ensure all server actions return the ActionResponse type
    - Implement consistent error handling and success responses using ActionResponse
  
  Key Conventions
  1. Rely on Next.js App Router for state changes.
  2. Prioritize Web Vitals (LCP, CLS, FID).
  3. Minimize 'use client' usage:
     - Prefer server components and Next.js SSR features.
     - Use 'use client' only for Web API access in small components.
     - Avoid using 'use client' for data fetching or state management.
  
  Refer to Next.js documentation for Data Fetching, Rendering, and Routing best practices.
  
  ---
description: For dynamic OG Image Generation with Next.js
globs: 
alwaysApply: false
---
# Dynamic OG Image Generation with Next.js

This document provides comprehensive guidance on how to create dynamic Open Graph images using Next.js' built-in `ImageResponse` API. These dynamic images can be used for social media cards, product previews, and content sharing across platforms.

## Table of Contents

1. [Introduction](mdc:#introduction)
2. [Key Concepts](mdc:#key-concepts)
3. [Implementation Steps](mdc:#implementation-steps)
4. [Best Practices](mdc:#best-practices)
5. [Advanced Techniques](mdc:#advanced-techniques)
6. [Troubleshooting](mdc:#troubleshooting)
7. [Examples](mdc:#examples)

## Introduction

Dynamic OG (Open Graph) images enhance content sharing by generating customized, branded images on-the-fly. Next.js provides a powerful `ImageResponse` API that allows you to create these images programmatically using JSX and React components, without requiring external rendering services.

These images are particularly valuable for:
- Social media link previews
- Product cards with dynamic pricing
- News/blog article thumbnails
- Dynamic marketing assets
- User-specific content previews

## Key Concepts

### Next.js Route Handlers

OG images are implemented as special Next.js Route Handlers that generate images instead of standard HTML or JSON responses. They are placed in your application's routing structure and respond to HTTP GET requests.

### ImageResponse API

The `ImageResponse` class from the `next/og` package converts JSX elements into PNG images, allowing you to use React-like syntax to design your images while accessing dynamic data.

### Edge Runtime

OG image generation typically runs on the Edge Runtime for optimal performance and to handle high volumes of image generation requests efficiently.

## Implementation Steps

### 1. Create a Route Handler

Create a route handler file in your application's route structure. Common locations include:
- `app/api/og/route.tsx` - For general purpose OG images
- `app/(specific-area)/og/route.tsx` - For section-specific OG images
- `app/[dynamic-route]/opengraph-image.tsx` - For route-specific OG images

### 2. Import Required Dependencies

```typescript
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
```

### 3. Define the GET Handler

```typescript
export const runtime = 'edge' // Optional: Use Edge Runtime for better performance

export async function GET(request: NextRequest) {
  try {
    // Extract parameters from request
    const searchParams = request.nextUrl.searchParams
    
    // Fetch any needed data
    
    // Generate and return the image
    return new ImageResponse(
      (
        <div style={{ /* Styles */ }}>
          {/* Image content */}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error(error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
```

### 4. Design Your Image with JSX

Use JSX to design your image, similar to how you would create a React component:

```jsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  backgroundColor: 'white',
  position: 'relative',
  fontFamily: '"Inter", sans-serif',
}}>
  {/* Background and content layers */}
</div>
```

### 5. Add Dynamic Content

Incorporate dynamic content from parameters or data sources:

```jsx
<h1 style={{ fontSize: '64px', fontWeight: 'bold' }}>
  {title}
</h1>
<p style={{ fontSize: '32px', color: '#666' }}>
  {description}
</p>
```

### 6. Configure Image Options

Set appropriate dimensions and other options for your image:

```typescript
return new ImageResponse(
  (/* JSX content */),
  {
    width: 1200, // Standard OG image width
    height: 630, // Standard OG image height
    // Optional additional configurations
    emoji: 'twemoji', // Enable Twemoji (Twitter emoji)
    fonts: [
      {
        name: 'Inter',
        data: interFontData,
        weight: 400,
        style: 'normal',
      },
    ],
  }
)
```

## Best Practices

### Performance Optimization

1. **Use Edge Runtime**: Always specify `export const runtime = 'edge'` for optimal performance.
2. **Minimize External Data Fetching**: Limit the number of external data calls to reduce generation time.
3. **Cache When Possible**: Implement caching strategies for images that don't change frequently.

### Design Guidelines

1. **Responsive Text**: Adjust font sizes based on content length to avoid overflow.
2. **Color Contrast**: Ensure sufficient contrast between text and background for readability.
3. **Branding Consistency**: Maintain consistent branding elements (logos, colors, typography).
4. **Overlay Gradients**: Use gradient overlays to improve text readability on image backgrounds.
5. **Safe Margins**: Keep important content away from edges (at least 100px).

### Layout Structure

1. **Explicit Display Properties**: Always set explicit `display` properties (like `flex` or `grid`) for elements with multiple children.
2. **Fixed Dimensions**: Use fixed dimensions rather than percentages for reliable layouts.
3. **Position Absolute**: Use absolute positioning for layering elements.

### Error Handling

1. **Graceful Fallbacks**: Provide fallback designs when expected data is missing.
2. **Comprehensive Try-Catch**: Wrap image generation in try-catch blocks to handle errors gracefully.
3. **Validate Inputs**: Validate all input parameters before processing.

## Advanced Techniques

### Custom Fonts

To use custom fonts:

```typescript
import { readFileSync } from 'fs'
import { join } from 'path'

// Load the font file
const interBold = readFileSync(join(process.cwd(), 'public/fonts/Inter-Bold.ttf'))

return new ImageResponse(
  (/* JSX content */),
  {
    // ...other options
    fonts: [
      {
        name: 'Inter',
        data: interBold,
        weight: 700,
        style: 'normal',
      },
    ],
  }
)
```

### Incorporating Images

To include external images:

```jsx
<img 
  src="https://your-domain.com/image.jpg" 
  alt="Description"
  style={{
    width: 200,
    height: 200,
    objectFit: 'cover',
  }}
/>
```

For local images, convert them to data URLs or host them on your CDN.

### SVG Icons and Graphics

Use inline SVG for vectors and icons:

```jsx
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" />
</svg>
```

### Conditional Rendering

Adapt your image based on parameters:

```jsx
{type === 'product' ? (
  <ProductTemplate data={productData} />
) : type === 'article' ? (
  <ArticleTemplate data={articleData} />
) : (
  <DefaultTemplate />
)}
```

## Troubleshooting

### Common Issues

1. **"JSX element implicitly has type 'any'"**: Add appropriate TypeScript interfaces for your component props.

2. **"Failed to generate image"**: Check for missing or invalid data in your JSX. The most common cause is using undefined values without fallbacks.

3. **"Expected <div> to have explicit display: flex or display: none"**: Always specify `display` property for elements with multiple children.

4. **Images not loading**: Make sure image URLs are absolute and publicly accessible.

5. **Font rendering issues**: Verify that font files are properly loaded and that the font name matches exactly.

### Debugging Strategies

1. **Step-by-Step Reduction**: Remove elements one by one to isolate which part is causing problems.

2. **Console Logging**: Log intermediate values before they're used in the JSX.

3. **Fallback Template**: Start with a minimal working template and add complexity gradually.

## Examples

### Basic Product Card

```tsx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const productName = searchParams.get('name') || 'Product'
  const price = searchParams.get('price') || '$99.99'
  const imageUrl = searchParams.get('image') || 'https://default-image.jpg'
  
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        padding: '40px',
      }}>
        <div style={{
          display: 'flex',
          width: '50%',
          height: '100%',
          position: 'relative',
        }}>
          <img src={imageUrl} alt={productName} style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }} />
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '50%',
          padding: '20px',
          justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            margin: '0 0 20px 0',
          }}>{productName}</h1>
          
          <span style={{
            fontSize: '36px',
            color: '#007bff',
          }}>{price}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

### News Article Preview

```tsx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'Breaking News'
  const subtitle = searchParams.get('subtitle') || ''
  const imageUrl = searchParams.get('image') || 'https://default-news-bg.jpg'
  
  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}>
        <img 
          src={imageUrl} 
          alt="Article background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '70%',
          }}>
            <h1 style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.2,
              margin: '0 0 16px 0',
            }}>{title}</h1>
            
            {subtitle && (
              <p style={{
                fontSize: '32px',
                color: 'rgba(255,255,255,0.9)',
                margin: 0,
              }}>{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

Remember that dynamic OG images enhance user engagement by providing visually appealing and informative previews of your content across social media platforms and messaging apps. They're an essential part of a modern content sharing strategy.

By following these guidelines, you can create effective, performant, and visually consistent dynamic images for your Next.js application. 

---
description: When you need create a new page on Application Dashboard or needs add a DataTable on page
globs: 
alwaysApply: false
---
# Page Component System Guide

The SaaS Boilerplate includes a consistent page layout system using the `Page` components from `@/components/ui/page`. This document provides detailed guidance on how to create dashboard pages with a uniform structure and animations.

## 1. Page Component Overview

The Page component system consists of several composable components:

- **PageWrapper**: The main container for all dashboard pages
- **PageHeader**: The top section with breadcrumbs and primary actions
- **PageMainBar**: Container for breadcrumbs/title within PageHeader
- **PageActionsBar**: Container for actions within PageHeader
- **PageSecondaryHeader**: Secondary header for toolbars and filters
- **PageBody**: Main content area of the page
- **PageActions**: Bottom action bar for form submission buttons

## 2. Basic Page Structure

```tsx
<PageWrapper>
  <PageHeader>
    <PageMainBar>
      {/* Breadcrumbs and page title */}
    </PageMainBar>
    <PageActionsBar>
      {/* Primary actions */}
    </PageActionsBar>
  </PageHeader>
  
  <PageSecondaryHeader>
    {/* Toolbar, filters, etc. */}
  </PageSecondaryHeader>
  
  <PageBody>
    {/* Main content */}
  </PageBody>
  
  <PageActions>
    {/* Bottom actions (optional) */}
  </PageActions>
</PageWrapper>
```

## 3. Component Details and Usage

### 3.1 PageWrapper

This is the outermost container for all dashboard pages. It provides consistent styling, animation, and structure.

```tsx
<PageWrapper>
  {/* Page content */}
</PageWrapper>
```

**Key Properties:**
- Provides entrance animation for the entire page
- Applies consistent background, borders, and shadows
- Creates a responsive container that works well on all devices
- Includes proper min-height calculations based on layout

**Best Practices:**
- Always use as the outermost container for dashboard pages
- Avoid adding custom padding or margin to this component
- Let it handle the overall page animations and styling

### 3.2 PageHeader

The top section of the page, typically containing breadcrumbs, the page title, and primary actions.

```tsx
<PageHeader className="border-0">
  <PageMainBar>
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Feature Name</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </PageMainBar>
  
  <Button variant="outline">Primary Action</Button>
</PageHeader>
```

**Key Properties:**
- Fixed height with proper alignment of children
- Sticky positioning to stay at the top during scroll
- Subtle animation that's different from the body content
- Border styling for visual separation

**Best Practices:**
- Use `className="border-0"` to control border styling
- Include breadcrumbs for navigation context
- Right-align action buttons
- Keep simple and focused - only essential actions here

### 3.3 PageMainBar and PageActionsBar

These components organize content within the PageHeader:

- **PageMainBar**: Left-aligned content (typically breadcrumbs/title)
- **PageActionsBar**: Right-aligned content (typically action buttons)

```tsx
<PageHeader>
  <PageMainBar>
    <h1 className="text-xl font-semibold">Page Title</h1>
  </PageMainBar>
  
  <PageActionsBar>
    <Button variant="outline">Secondary Action</Button>
    <Button>Primary Action</Button>
  </PageActionsBar>
</PageHeader>
```

**Best Practices:**
- Use PageMainBar for consistent left alignment
- Use PageActionsBar to group action buttons with proper spacing
- Limit the number of actions in PageActionsBar to avoid clutter
- Consider responsive behavior for mobile screens

### 3.4 PageSecondaryHeader

Used for toolbars, filters, search inputs, and secondary actions.

```tsx
<PageSecondaryHeader className="bg-secondary/50">
  <div className="flex items-center justify-between w-full">
    <Input 
      placeholder="Search..." 
      className="max-w-xs"
    />
    
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* Filter options */}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button size="sm">
        <PlusIcon className="mr-2 h-4 w-4" />
        Add New
      </Button>
    </div>
  </div>
</PageSecondaryHeader>
```

**Key Properties:**
- Optional component - use only when needed
- Provides consistent spacing and styling for toolbar elements
- Supports customizable background via className
- Designed for proper spacing of form controls and buttons

**Best Practices:**
- Use `className="bg-secondary/50"` for subtle background distinction
- Place search inputs on the left
- Place action buttons on the right
- Great place for filters, sorting controls, and view options
- For data tables, use with the specific table toolbar component

### 3.5 PageBody

The main content area of the page. This is where the primary content lives.

```tsx
<PageBody>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards or other content */}
  </div>
</PageBody>
```

**Key Usage with Data Tables:**

```tsx
<PageBody className="md:p-0 flex flex-col">
  <DataTable />
</PageBody>
```

**Key Properties:**
- Flexible container that expands to fill available space
- Default padding that can be customized
- Entrance animation that's different from the header
- Supports any content including forms, tables, cards, etc.

**Best Practices:**
- Use `className="p-0 flex flex-col"` when containing data tables
- Default padding works well for forms and general content
- Avoid fixed heights - let the content determine the height
- For forms, consider using a Card component for visual grouping

### 3.6 PageActions

Bottom action bar for form submission buttons or other page-level actions.

```tsx
<PageActions>
  <Button variant="outline" type="button">Cancel</Button>
  <Button type="submit">Save Changes</Button>
</PageActions>
```

**Key Properties:**
- Fixed height with proper alignment and spacing
- Sticky positioning at the bottom during scroll
- Visual separation with border
- Right-aligned buttons by default

**Best Practices:**
- Use primarily on form/detail pages, not list pages
- Place "Cancel" or secondary actions first
- Place "Submit" or primary actions last
- Limit to 2-3 buttons maximum
- Consider mobile layout - buttons stack on small screens

## 4. Common Page Patterns

### 4.1 List Page (with Data Table)

```tsx
export default async function ListPage() {
  const items = await api.feature.findMany.query()

  return (
    <FeatureDataTableProvider initialData={items.data ?? []}>
      <PageWrapper>
        <PageHeader className="border-0">
          <PageMainBar>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Features</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </PageMainBar>
        </PageHeader>

        <PageSecondaryHeader className="bg-secondary/50">
          <FeatureDataTableToolbar />
          <FeatureUpsertSheet />
        </PageSecondaryHeader>

        <PageBody className="md:p-0 flex flex-col">
          <FeatureDataTable />
        </PageBody>
      </PageWrapper>
    </FeatureDataTableProvider>
  )
}
```

### 4.2 Detail/Form Page

```tsx
export default function DetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const isEditMode = id !== 'new'
  
  // Fetch data if editing
  const itemData = isEditMode ? await api.feature.findById.query({ id }) : null
  
  return (
    <PageWrapper>
      <PageHeader>
        <PageMainBar>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/features">Features</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isEditMode ? 'Edit Feature' : 'New Feature'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
        
        <Button variant="outline" asChild>
          <Link href="/app/features">Back to List</Link>
        </Button>
      </PageHeader>
      
      <PageBody>
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Feature' : 'Create Feature'}</CardTitle>
            <CardDescription>
              Enter the details for this feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form>
              {/* Form fields */}
            </Form>
          </CardContent>
        </Card>
      </PageBody>
      
      <PageActions>
        <Button variant="outline" asChild>
          <Link href="/app/features">Cancel</Link>
        </Button>
        <Button type="submit" form="feature-form">
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </PageActions>
    </PageWrapper>
  )
}
```

### 4.3 Dashboard/Overview Page

```tsx
export default function DashboardPage() {
  return (
    <PageWrapper>
      <PageHeader>
        <PageMainBar>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </PageMainBar>
        <DateRangePicker />
      </PageHeader>
      
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,345</div>
              <p className="text-xs text-muted-foreground">
                +12.3% from last month
              </p>
            </CardContent>
          </Card>
          {/* More metric cards */}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Activity list */}
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart */}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </PageWrapper>
  )
}
```

## 5. Animation and Motion

The Page components include subtle animations using Framer Motion:

- **PageWrapper**: Fade-in animation for the whole page
- **PageHeader**: Slide-down and fade-in animation
- **PageBody**: Slide-up and fade-in animation with a slight delay
- **PageActions**: Slide-up and fade-in animation with a longer delay

These animations create a pleasing entrance experience without being distracting.

**Motion Configuration:**

```tsx
// Page animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

const bodyVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      delay: 0.2,
    },
  },
}
```

## 6. Responsive Behavior

The Page components are designed to be responsive by default:

- **PageWrapper**: Adjusts height based on viewport
- **PageHeader/PageSecondaryHeader**: Maintains fixed height but adjusts content spacing
- **PageBody**: Expands to fill available space
- **PageActions**: Adjusts button spacing on mobile

**Best Practices for Responsive Pages:**

1. For very complex toolbars, consider using a responsive approach:
   ```tsx
   <PageSecondaryHeader>
     <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-2">
       <div className="flex items-center gap-2">
         {/* Left side controls */}
       </div>
       <div className="flex items-center gap-2">
         {/* Right side controls */}
       </div>
     </div>
   </PageSecondaryHeader>
   ```

2. For multi-column content, use responsive grid classes:
   ```tsx
   <PageBody>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
       {/* Cards */}
     </div>
   </PageBody>
   ```

3. Consider using `useBreakpoint()` hook for conditional rendering:
   ```tsx
   const isMobile = useBreakpoint('md')
   
   return (
     <PageHeader>
       <PageMainBar>
         <Breadcrumb>{!isMobile && /* Full breadcrumb */}</Breadcrumb>
         {isMobile && <h1>Page Title</h1>}
       </PageMainBar>
       
       <Button size={isMobile ? 'sm' : 'default'}>
         {isMobile ? <PlusIcon /> : 'Add New'}
       </Button>
     </PageHeader>
   )
   ```

## 7. Tips and Best Practices

1. **Consistent Navigation**:
   - Always include breadcrumbs in PageHeader for context
   - Use consistent back buttons on detail pages
   - Maintain the same structure across all dashboard pages

2. **Visual Hierarchy**:
   - Use PageHeader for the most important page identification
   - Use PageSecondaryHeader for contextual actions
   - Use PageBody for the main content focus
   - Use PageActions only for important form actions

3. **Animations**:
   - The built-in animations are subtle by design
   - Avoid adding additional entrance animations that conflict
   - For content-specific animations, use separate motion components

4. **Error States**:
   - For error pages, still use the Page components for consistency
   - Handle loading and error states within PageBody
   - Consider using a suspension boundary at the PageBody level

5. **Customization**:
   - Use className prop for styling customization
   - Avoid overriding the core structure and layout
   - For very custom pages, still use PageWrapper for consistency
   
   ---
description: 
globs: src/plugins/*.ts
alwaysApply: false
---
# Plugin Manager System Guide for SaaS Boilerplate

This guide provides a comprehensive overview of the Plugin Manager system in SaaS Boilerplate, explaining its architecture, key concepts, and implementation patterns for extending functionality through plugins.

## 1. Plugin System Overview

The Plugin Manager is a core provider in SaaS Boilerplate that enables external integrations and extensibility. It allows:

- Dynamic registration of third-party services
- Typed configuration management
- Standardized action execution
- Organization-specific plugin configurations
- Secure credential management for external services

## 2. Key Concepts

### 2.1 Plugin Instance

A plugin represents an integration with an external service (like Slack, Discord, WhatsApp) and follows a consistent structure:

```typescript
interface IPluginInstance<
  TPluginConfigSchema extends StandardSchemaV1,
  TPluginActions extends Record<string, PluginAction<any, any, any>>,
> {
  slug: string              // Unique identifier for the plugin
  name: string              // Display name for UI
  schema: TPluginConfigSchema  // Zod schema for configuration
  actions: TPluginActions   // Available operations
  metadata: {
    verified: boolean       // Official verification status
    published: boolean      // Visibility in the marketplace
    description: string     // Plugin description
    category: string        // Categorization
    developer: string       // Creator information
    website: string         // Official website
    logo?: string           // Logo URL
    screenshots?: string[]  // UI screenshots
    links: Record<string, string>  // Related links (docs, install)
  }
}
```

### 2.2 Plugin Actions

Actions are the operations a plugin can perform:

```typescript
type PluginAction<
  TPluginConfigSchema extends StandardSchemaV1,
  TPluginActionSchema extends StandardSchemaV1,
  TPluginActionResponse,
> = {
  name: string                // Action name for UI display
  schema: TPluginActionSchema // Input parameters (Zod schema)
  handler: (params: {        // Implementation function
    config: StandardSchemaV1.InferOutput<TPluginConfigSchema>
    input: StandardSchemaV1.InferInput<TPluginActionSchema>
  }) => TPluginActionResponse
}
```

### 2.3 Plugin Manager

The central class that manages all plugins:

```typescript
class PluginProvider<T extends Record<string, IPluginInstance<any, any>>> {
  extensions: T;
  
  // Register a single plugin
  static plugin = <TConfigSchema, TActions>(
    plugin: IPluginInstance<TConfigSchema, TActions>
  ) => plugin;
  
  // Initialize the plugin system with multiple plugins
  static initialize<TExtensions>(options: { plugins: TExtensions });
  
  // Configure plugin instances
  setup<TConfig>(config: TConfig);
  
  // List all available plugins
  list(): Integration[];
  
  // Get a specific plugin by slug
  get<TSlug extends keyof T>(slug: TSlug);
}
```

## 3. Implementation Patterns

### 3.1 Creating a Plugin

```typescript
import { PluginProvider } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { z } from 'zod'

export const myPlugin = PluginProvider.plugin({
  slug: 'my-plugin',
  name: 'My Plugin',
  schema: z.object({
    apiKey: z.string().describe('Your API key'),
    // Other configuration fields
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://example.com/logo.png',
    description: 'Integration with My Service to perform actions',
    category: 'communication',
    developer: 'Your Company',
    website: 'https://example.com',
    screenshots: [
      'https://example.com/screenshot1.png',
    ],
    links: {
      install: 'https://example.com/install',
      guide: 'https://example.com/docs',
    },
  },
  actions: {
    send: {
      name: 'Send Message',
      schema: z.object({
        message: z.string(),
        recipient: z.string().optional(),
      }),
      handler: async ({ config, input }) => {
        // Implementation code that uses config.apiKey and input.message
        // to interact with external API
        
        return { success: true };
      },
    },
    // Additional actions
  },
})
```

### 3.2 Registering Plugins

In your application initialization code:

```typescript
import { PluginProvider } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { slack } from '@/plugins/slack.plugin'
import { discord } from '@/plugins/discord.plugin'
// Import other plugins

export const PluginProvider = PluginProvider.initialize({
  plugins: {
    slack,
    discord,
    // Other plugins
  },
})
```

### 3.3 Using Plugins in Code

```typescript
// Configure plugins with organization-specific settings
const actions = PluginProvider.setup({
  slack: { 
    webhook: 'https://hooks.slack.com/services/...'
  },
  discord: {
    webhook: 'https://discord.com/api/webhooks/...'
  }
})

// Execute plugin actions
await actions.slack.send({ 
  message: 'Hello from SaaS Boilerplate!' 
})

// Access plugin metadata
const plugins = PluginProvider.list()
```

### 3.4 Plugin Field Discovery

The Plugin Manager automatically extracts fields from the schema for UI rendering:

```typescript
const slackPlugin = PluginProvider.get('slack')
// Returns plugin with extracted fields:
// {
//   slug: 'slack',
//   name: 'Slack',
//   fields: [
//     { name: 'webhook', type: 'string', required: true, ... }
//   ],
//   ...
// }
```

## 4. Integration with Features

### 4.1 Creating Integration UI

```tsx
function IntegrationForm({ plugin }) {
  const form = useForm({
    defaultValues: {},
    schema: plugin.schema // Type-safe form schema
  })
  
  return (
    <Form {...form}>
      {plugin.fields.map(field => (
        <FormField
          key={field.name}
          name={field.name}
          label={field.label}
          placeholder={field.placeholder}
          required={field.required}
        />
      ))}
      <Button type="submit">Connect</Button>
    </Form>
  )
}
```

### 4.2 Storing Plugin Configurations

Configuration data should be stored per-organization:

```typescript
// Database model
model Integration {
  id            String      @id @default(cuid())
  name          String
  slug          String
  enabled       Boolean     @default(true)
  config        String      // JSON string of plugin configuration
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@unique([organizationId, slug])
}
```

### 4.3 Executing Plugin Actions

```typescript
async function executePluginAction(organizationId: string, pluginSlug: string, action: string, input: any) {
  // Fetch organization's plugin configuration
  const integration = await prisma.integration.findUnique({
    where: { 
      organizationId_slug: {
        organizationId,
        slug: pluginSlug
      }
    }
  })
  
  if (!integration || !integration.enabled) {
    throw new Error("Integration not found or disabled")
  }
  
  // Parse config
  const config = JSON.parse(integration.config)
  
  // Get plugin
  const plugin = PluginProvider.get(pluginSlug)
  
  // Initialize with config and execute action
  const actions = plugin.initialize(config)
  return await actions[action](mdc:input)
}
```

## 5. Common Plugin Categories

### 5.1 Communication

- Slack, Discord, WhatsApp, Telegram
- For sending notifications, alerts, and messages

### 5.2 Marketing

- Mailchimp, SendGrid, Customer.io
- For managing email campaigns and audience

### 5.3 Automation

- Zapier, Make.com (Integromat)
- For creating workflows with multiple services

### 5.4 Analytics

- Google Analytics, Amplitude, Mixpanel
- For tracking user behavior

## 6. Best Practices

### 6.1 Security Considerations

- Never log sensitive configuration data
- Use environment variables for storing API keys during development
- Encrypt plugin configuration data in the database
- Validate input data using schema before passing to handler

### 6.2 Error Handling

Implement robust error handling in plugin actions:

```typescript
handler: async ({ config, input }) => {
  try {
    // API call logic here
    return { success: true }
  } catch (error) {
    console.error(`[MyPlugin] Error: ${error.message}`)
    return { 
      success: false, 
      error: {
        message: "Failed to perform action",
        code: "ACTION_FAILED",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
  }
}
```

### 6.3 Documentation

Each plugin should include thorough documentation:

- Required credentials and how to obtain them
- Available actions and their parameters
- Example use cases
- Troubleshooting common issues

### 6.4 Testing

Create tests for your plugins:

```typescript
describe('Slack Plugin', () => {
  it('should send a message successfully', async () => {
    const result = await slackPlugin.actions.send.handler({
      config: { webhook: 'mockWebhook' },
      input: { message: 'Test message' }
    })
    
    expect(result.success).toBe(true)
  })
})
```

## 7. Example: Complete Slack Plugin

```typescript
import { PluginProvider } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { z } from 'zod'

export const slack = PluginProvider.plugin({
  slug: 'slack',
  name: 'Slack',
  schema: z.object({
    webhook: z
      .string()
      .describe(
        'Ex: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      ),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://a.slack-edge.com/80588/img/icons/app-256.png',
    description:
      'Integrate Slack to centralize your notifications, streamline team communication, and automate alerts directly into your workspace channels.',
    category: 'notifications',
    developer: 'Slack',
    screenshots: [],
    website: 'https://slack.com/',
    links: {
      install: 'https://slack.com/',
      guide: 'https://api.slack.com/start',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: z.object({
        message: z.string(),
        channel: z.string().optional(),
      }),
      handler: async ({ config, input }) => {
        try {
          const response = await fetch(config.webhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: input.message,
              channel: input.channel,
            }),
          })
          
          if (!response.ok) {
            throw new Error(`Slack API error: ${response.statusText}`)
          }
          
          return { success: true }
        } catch (error) {
          console.error(`[Slack] Error: ${error.message}`)
          return { 
            success: false, 
            error: {
              message: "Failed to send message to Slack",
              code: "SLACK_SEND_FAILED"
            }
          }
        }
      },
    },
  },
})
```

This comprehensive guide should help developers understand and implement plugins for the SaaS Boilerplate, extending its functionality with third-party integrations in a type-safe, secure, and maintainable way. 

---
description: When you need make a Code Review
globs: 
alwaysApply: false
---
## Code Review Instructions

### 1. Review Process
1. **Initial Analysis**
  - Check code structure following Igniter.js patterns
  - Identify potential security issues
  - Evaluate test coverage
  - Check compliance with SOLID and Clean Code

2. **Verification Checklist**
  - Clear and consistent naming
  - Correct file structure
  - Proper error handling
  - Appropriate TypeScript typing
  - Required documentation
  - Unit/integration tests
  - Performance and optimizations
  - Security and validations

3. **Feedback**
  - Provide objective and constructive suggestions
  - Prioritize critical issues
  - Include code examples when relevant
  - Justify suggested changes

### 2. Response Format
```markdown
## Review Summary
- Status: [APPROVED|CHANGES_REQUESTED]
- Critical Issues: [number]
- Improvements: [number]

## Issues
1. [CRITICAL|IMPROVEMENT] - Concise description
  - File: path/to/file
  - Reason: Explanation
  - Suggestion: Proposed code/solution

## Recommendations
- List of general suggestions
```
---
description: 
globs: 
alwaysApply: true
---
# SaaS Boilerplate: Structure and Architecture

## 1. Project Overview
The SaaS Boilerplate is a complete solution for building modern SaaS applications based on a multi-tenant architecture with organizations. Built with Next.js 15, Igniter.js, Prisma, and Shadcn UI, it provides a solid foundation for developers to quickly create full-featured SaaS products.

## 2. Main Folder Structure

```
src/
├── app/                       # Next.js App Router routes and pages
│   ├── (api)/                 # API route handlers (Edge/serverless)
│   ├── (auth)/                # Authentication pages
│   ├── (private)/             # Protected pages (dashboard)
│   ├── (site)/                # Public pages (marketing)
├── components/                # Shared UI components
├── content/                   # Static content and documentation
├── features/                  # Application-specific features
├── plugins/                   # Third-party or custom plugins
├── providers/                 # Global providers
├── utils/                     # Utilities
├── @saas-boilerplate/         # SaaS core (reusable modules)
│   ├── features/              # Core SaaS features
│   ├── hooks/                 # Custom React hooks
│   ├── providers/             # Service providers
│   ├── types/                 # Type definitions
│   ├── utils/                 # Shared utilities
```

## 3. The @saas-boilerplate Directory

The `@saas-boilerplate` directory is the heart of the boilerplate, containing the core modules that form the foundation of any SaaS application.

### 3.1 @saas-boilerplate/features

Contains the main SaaS functionalities, each following a consistent structure:

- **account**: User account management
- **api-key**: API key management
- **auth**: Authentication and authorization
- **billing**: Payment and subscription management
- **integration**: External service integrations
- **invitation**: Organization invitation system
- **membership**: Organization member management
- **organization**: Organization management
- **plan**: Subscription plans
- **session**: User session management
- **user**: User management
- **webhook**: Webhook management

Each feature follows a consistent internal structure:

```
feature/
├── controllers/           # Controllers for request handling
├── presentation/          # UI components and presentation logic
│   ├── components/        # Feature-specific React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Feature-specific React hooks
│   ├── utils/             # UI utilities
├── procedures/            # Business logic/middleware
```

### 3.2 @saas-boilerplate/providers

Essential service providers for SaaS applications, each with adapters for different implementations:

- **content-layer**: Content management using Contentlayer for Blog, Help Center and Changelog posts
- **agent:**: A AI Agent Framework
  - **managers**: Specific implementations (ToolsetManager, etc.)
  - **types**: Types for Agent Framework and Depedencies
  - **helpers**: A set of helpers for agent provider
- **bot**: A Bot Manager with adapters for different services
  - **adapters**: Specific implementations (WhatsApp, Telegram, etc.)
  - **types**: Contracts for adapters
- **mail**: Email system with adapters for different services
  - **adapters**: Specific implementations (SendGrid, Resend, etc.)
  - **types**: Contracts for adapters
  - **helpers**: Email handling utilities
- **payment**: Payment processing
  - **databases**: Adapters for different databases
  - **providers**: Adapters for different payment providers (Stripe, etc.)
- **plugin-manager**: Extensible plugin system
  - **utils**: Plugin management utilities
- **storage**: File storage
  - **adapters**: Implementations for different services (S3, local, etc.)
  - **interfaces**: Contracts for adapters

### 3.3 @saas-boilerplate/hooks

Reusable React hooks providing common functionality throughout the application:

- **use-boolean**: Boolean value management
- **use-broadcast-channel**: Communication between browser tabs
- **use-clipboard**: Clipboard manipulation
- **use-content-layer**: Access to Contentlayer-managed content
- **use-debounce**: Input debouncing implementation
- **use-device-orientation**: Device orientation access
- **use-disclosure**: Open/closed state management
- **use-form-with-zod**: Integration between forms and Zod validation
- **use-forward-ref**: React ref forwarding
- **use-gesture**: User gesture detection
- **use-location**: User location access and manipulation
- **use-media-query**: Responsiveness with media queries
- **use-mobile**: Mobile device detection
- **use-mutation**: Data mutation management
- **use-network**: Network state monitoring
- **use-query-state**: State synchronization with query parameters
- **use-share**: Web Share API interface
- **use-speech-to-text**: Speech to text conversion
- **use-steps**: Multi-step flow management
- **use-text-selection**: Text selection interaction
- **use-toast**: Toast notification system
- **use-upload**: File upload management

### 3.4 @saas-boilerplate/utils

Shared utilities for common tasks:

- **client**: Client-specific utilities
- **color**: Color manipulation and conversion
- **currency**: Currency formatting and conversion
- **deep-merge**: Deep object merging
- **delay**: Execution delay functions
- **format**: Various formatters
- **object**: Object manipulation
- **string**: String manipulation
- **template**: Template system
- **try-catch**: Error handling wrappers
- **url**: URL manipulation and validation
- **validate**: Data validation

## 4. App Router Structure

The Next.js App Router structure organizes routes into logical groups using route groups (folders with parentheses):

### 4.1 (api)
API endpoints organized by domain and functionality:

```
(api)/
└── api/
    ├── auth/
    │   └── [...all]/          # Auth.js endpoints
    ├── billing/
    │   └── webhook/           # Stripe webhook handler
    ├── storage/               # File storage endpoints
    └── v1/
        └── [[...all]]/        # API routes via Igniter.js
```

### 4.2 (auth)
Authentication-related pages:

```
(auth)/
└── auth/                      # Authentication layout
    └── page.tsx               # Sign-in/sign-up page
```

### 4.3 (private)
Protected application routes requiring authentication:

```
(private)/
└── app/                       # Main application
    ├── layout.tsx             # Application layout with navigation
    ├── get-started/           # Onboarding flow
    ├── invites/               # Invitation acceptance
    │   └── [id]/              # Specific invitation
    └── (organization)/        # Organization-specific routes
        ├── (billing)/
        │   └── upgrade/       # Plan upgrade page
        └── (dashboard)/       # Main dashboard
            ├── (main)/        # Default dashboard view
            ├── integrations/  # Available integrations
            │   └── [slug]/    # Specific integration
            ├── settings/      # Settings pages
            │   ├── account/   # Account settings
            │   │   ├── profile/
            │   │   ├── security/
            │   │   └── notifications/
            │   └── organization/
            │       ├── information/
            │       ├── billing/
            │       ├── members/
            │       └── integrations/
```

### 4.4 (site)
Public marketing and information pages:

```
(site)/
├── (main)/                    # Main marketing pages
├── blog/                      # Blog posts
│   └── [slug]/                # Individual blog post
├── contact/                   # Contact page
├── docs/                      # Documentation
│   └── [category]/
│       └── [slug]/            # Documentation page
├── help/                      # Help center
│   └── [category]/
│       └── [slug]/            # Help article
├── pricing/                   # Pricing page
└── updates/                   # Product updates
```

### 4.5 forms
Public form pages:

```
forms/
└── [slug]/                    # Dynamic form pages
```

## 5. Feature Architecture

Each feature in saas-boilerplate follows Domain-Driven Design (DDD) and Clean Architecture principles:

- **Controllers**: Responsible for handling HTTP requests and returning responses.
- **Procedures**: Contain the business logic of the feature, independent of the presentation layer.
- **Presentation**: UI components and presentation logic, following React composition pattern.

## 6. Multi-tenant System

The saas-boilerplate implements an organization-based multi-tenant system:
- Each user can belong to multiple organizations
- Resources are isolated by organization
- Role-based access control (owner, admin, member)

## 7. Service Providers

Providers follow the Adapter pattern, allowing easy swapping of implementations:

- **Mail Provider**: Email sending with React templates
- **Payment Provider**: Subscription, plan, and payment management
- **Storage Provider**: File storage with context isolation
- **Plugin Manager**: Extensible system for third-party plugins

## 8. Development Recommendations

1. Follow the existing structure when creating new features
2. Maintain a clear separation between business logic and presentation
3. Use existing hooks and utilities in @saas-boilerplate
4. Ensure new features respect multi-tenant isolation
5. Leverage existing providers before implementing new solutions

---
description: When user ask to create test for something else
globs: 
alwaysApply: false
---
# Test Instructions

# Testing Guidelines

## 1. Testing Strategy & Framework
**Framework:** Vitest  
**Core Principles:**
  - Each test file mirrors source file structure
  - Focus on behavior, not implementation
  - Follow AAA pattern (Arrange, Act, Assert)
  - Use descriptive test names
  - Test both success and failure cases

## 2. Test Types & Coverage
- **Unit Tests:** Individual components/functions
- **Integration Tests:** Interactions between features
- **E2E Tests:** Critical user flows
- **Coverage Goal:** Minimum 80% coverage

## 3. Testing Process
1. Ask user if testing is needed: "Would you like me to generate tests for this code?"
2. If yes, analyze source code and dependencies
3. Generate test plan following SOLID principles
4. Request approval before implementation
5. Create test files with appropriate naming

## 4. Test File Structure
```typescript
describe('Feature: [Component/Function Name]', () => {
  describe('Given [context]', () => {
    describe('When [action]', () => {
      it('Then [expected result]', () => {
        // AAA Pattern
        // Arrange (Setup)
        // Act (Execute)
        // Assert (Verify)
      })
    })
  })
})
```

## 5. Best Practices
- Use mocks for external dependencies
- Keep tests focused and independent
- Test edge cases and error scenarios
- Write maintainable test code
- Use utilities for common operations
- Follow TDD when applicable

## 6. Naming Conventions
- Test files: `*.spec.ts` or `*.test.ts`
- Test suites: Clear feature description
- Test cases: Should describe behavior