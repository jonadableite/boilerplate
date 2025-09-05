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

# Igniter.js

> Igniter is a modern, type-safe HTTP framework designed to streamline the development of scalable TypeScript applications.

This documentation provides comprehensive information about Igniter.js, a modern, type-safe HTTP framework for TypeScript applications. The content is organized to help LLMs understand the framework's architecture, features, and usage patterns.

## Project Information

- **Framework**: Igniter.js
- **Language**: TypeScript
- **Type**: HTTP Framework
- **Focus**: Type-safety, Developer Experience, Performance

## Getting Started

- [Installation](/docs/getting-started/installation): Documentation page
- [Quick Start Guide](/docs/getting-started/quick-start-guide): Documentation page
- [Recommended Project Structure](/docs/getting-started/project-structure): Documentation page

## Core Concepts

- [Context: The Heart of Your Application's State](/docs/core-concepts/context): Documentation page
- [Controllers & Actions: Building Your API Logic](/docs/core-concepts/controllers-and-actions): Documentation page
- [Procedures in Igniter.js](/docs/core-concepts/procedures): Documentation page
- [Routing: Assembling Your API](/docs/core-concepts/routing): Documentation page
- [The Igniter Builder: Your Application's Foundation](/docs/core-concepts/igniter-builder): Documentation page
- [Validation: Ensuring Data Integrity and Business Rules](/docs/core-concepts/validation): Documentation page

## Client-Side Integration

- [Client-Side: Fetching Data with `useQuery`](/docs/client-side/use-query): Documentation page
- [Client-Side: Modifying Data with `useMutation`](/docs/client-side/use-mutation): Documentation page
- [Client-Side: Subscribing with `useRealtime`](/docs/client-side/use-realtime): Documentation page
- [Client-Side: The `<IgniterProvider>`](/docs/client-side/igniter-provider): Documentation page
- [Client-Side: The Type-Safe API Client](/docs/client-side/api-client): Documentation page

## Starter Guides

- [Full-Stack Guide: Building a High-Performance SPA with Bun, React, and Igniter.js](/docs/starter-guides/bun-react-starter-guide): Documentation page
- [Full-Stack Guide: Building with the Igniter.js Next.js Starter](/docs/starter-guides/nextjs-starter-guide): Documentation page
- [Full-Stack Guide: Building with the Igniter.js TanStack Start Starter](/docs/starter-guides/tanstack-start-starter-guide): Documentation page
- [Guide: Building High-Performance, Type-Safe REST APIs with Igniter.js](/docs/starter-guides/rest-api-starter-guide): Documentation page

## CLI and Tooling

- [`igniter generate`: Scaffolding & Schema Generation](/docs/cli-and-tooling/igniter-generate): Documentation page
- [CLI: Scaffolding with `igniter init`](/docs/cli-and-tooling/igniter-init): Documentation page
- [CLI: The Interactive Dev Server `igniter dev`](/docs/cli-and-tooling/igniter-dev): Documentation page

## Advanced Features

- [Igniter Studio (API Playground)](/docs/advanced-features/igniter-studio): Documentation page
- [Igniter.js Queues: Reliable Background Processing](/docs/advanced-features/queues): Documentation page
- [Igniter.js Realtime: Live Data, Effortlessly](/docs/advanced-features/realtime): Documentation page
- [Igniter.js Store: High-Performance Caching and Messaging](/docs/advanced-features/store): Documentation page
- [OpenAPI Documentation](/docs/advanced-features/openapi-documentation): Documentation page

## code-agents

- [Guiding LLMs with llms.txt](/docs/code-agents/llms-txt): Documentation page
- [Igniter.js MCP Server](/docs/code-agents/mcp-server): Documentation page
- [Initialize a Project with Lia](/docs/code-agents/initialize-project): Documentation page
- [Introduction to Code Agents](/docs/code-agents/introduction): Documentation page
- [Next.js Starter Rules for Code Agents](/docs/code-agents/nextjs-starter-rules): Documentation page
- [Using Claude with Igniter.js](/docs/code-agents/claude-code): Documentation page
- [Using Cursor with Igniter.js](/docs/code-agents/cursor): Documentation page
- [Using Google's Gemini CLI with Igniter.js for AI-Powered Development](/docs/code-agents/gemini-cli): Documentation page
- [Using VS Code Copilot with Igniter.js](/docs/code-agents/vscode-copilot): Documentation page
- [Using Windsurf with Igniter.js for AI-Powered Development](/docs/code-agents/windsurf): Documentation page
- [Using Zed Editor with Igniter.js for AI-Powered Development](/docs/code-agents/zed-editor): Documentation page

## Full Documentation Content

Below is the complete content of all documentation pages for comprehensive LLM understanding:

### Installation

**Category**: getting-started
**URL**: /docs/getting-started/installation

# Installation

Welcome to Igniter.js! This guide provides everything you need to get started, whether you're building a new application from the ground up or integrating Igniter.js into an existing project. Our goal is to get you running in minutes.

## 1. Start with a Template

The fastest and most effective way to start a new project is with one of our official templates. These are production-ready boilerplates, meticulously configured with best practices, end-to-end type safety, and all the essential tooling. They embody our development philosophy, saving you valuable setup time.

### Official Project Starters

<TemplateShowcase />

## 2. Use the `igniter init` CLI

If our templates don't perfectly match your requirements, the `igniter init` command is your best alternative. This interactive CLI scaffolds a clean, structured project, giving you the freedom to choose your own integrations while still benefiting from our proven project setup.

<CodeGroup>
  <Code title="npm">
  ```bash
  npx @igniter-js/cli init my-new-app
  ```
  </Code>
  <Code title="pnpm">
  ```bash
  pnpm dlx @igniter-js/cli init my-new-app
  ```
  </Code>
  <Code title="bun">
  ```bash
  bunx @igniter-js/cli init my-new-app
  ```
  </Code>
</CodeGroup>

For a detailed walkthrough of the CLI, please see our **[Quick Start Guide](/docs/getting-started/quick-start-guide)**.

## 3. Manual Installation for Existing Projects

For those who wish to integrate Igniter.js into an existing codebase, a manual setup is the way to go. This approach allows you to adopt our framework incrementally, without needing to refactor your entire project.

Simply install the core package using your preferred package manager:

<CodeGroup>
  <Code title="npm">
  ```bash
  npm install @igniter-js/core
  ```
  </Code>
  <Code title="yarn">
  ```bash
  yarn add @igniter-js/core
  ```
  </Code>
  <Code title="pnpm">
  ```bash
  pnpm add @igniter-js/core
  ```
  </Code>
  <Code title="bun">
  ```bash
  bun add @igniter-js/core
  ```
  </Code>
</CodeGroup>

This single package gives you access to the core builder, router, and all the foundational tools needed to bring type-safe APIs to your application.

## 4. Optional: Add Adapters and Dependencies

Igniter.js features a powerful, adapter-based architecture. This means advanced functionalities like caching, background jobs, and observability are handled by separate, dedicated packages. This keeps the framework's core lightweight and ensures you only install what you truly need.

### Store Adapter (Caching & Pub/Sub)

For a high-performance Redis-based store, install the adapter and its peer dependencies. For a seamless TypeScript experience, we also recommend installing the type definitions.

<CodeGroup>
  <Code title="npm">
  ```bash
  npm install @igniter-js/adapter-redis ioredis
  npm install @types/ioredis --save-dev
  ```
  </Code>
  <Code title="yarn">
  ```bash
  yarn add @igniter-js/adapter-redis ioredis
  yarn add @types/ioredis --dev
  ```
  </Code>
</CodeGroup>

### Queues Adapter (Background Jobs)

To enable robust background job processing powered by BullMQ, install the official adapter and its dependency.

<CodeGroup>
  <Code title="npm">
  ```bash
  npm install @igniter-js/adapter-bullmq bullmq
  ```
  </Code>
  <Code title="yarn">
  ```bash
  yarn add @igniter-js/adapter-bullmq bullmq
  ```
  </Code>
</CodeGroup>

### Telemetry Adapter (OpenTelemetry)

For comprehensive observability, install our OpenTelemetry adapter and its required peer dependencies.

<CodeGroup>
  <Code title="npm">
  ```bash
  npm install @igniter-js/adapter-opentelemetry @opentelemetry/api @opentelemetry/sdk-node
  ```
  </Code>
  <Code title="yarn">
  ```bash
  yarn add @igniter-js/adapter-opentelemetry @opentelemetry/api @opentelemetry/sdk-node
  ```
  </Code>
</CodeGroup>

### MCP Server Adapter (AI Code Agents)

To transform your API into a set of executable tools for AI code agents, install our Model-Context Protocol (MCP) Server adapter.

<CodeGroup>
  <Code title="npm">
  ```bash
  npm install @igniter-js/adapter-mcp-server @vercel/mcp-adapter @modelcontextprotocol/sdk
  ```
  </Code>
  <Code title="yarn">
  ```bash
  yarn add @igniter-js/adapter-mcp-server @vercel/mcp-adapter @modelcontextprotocol/sdk
  ```
  </Code>
</CodeGroup>

### Validation with Zod

While optional, we highly recommend using `zod` for validating request bodies, queries, and parameters. It is deeply integrated into the Igniter.js type system.

<CodeGroup>
  <Code title="npm">
  ```bash
  npm install zod
  ```
  </Code>
  <Code title="yarn">
  ```bash
  yarn add zod
  ```
  </Code>
</CodeGroup>

---

## Next Steps

With Igniter.js installed, you're all set to start building. Here are some great next steps:

-   **[Quick Start Guide](/docs/getting-started/quick-start-guide)**: Build your first API endpoint in under 5 minutes.
-   **[Project Structure](/docs/getting-started/project-structure)**: Learn our recommended approach to organizing your project.
-   **[Core Concepts](/docs/core-concepts/the-igniter-builder)**: Dive deep into the fundamental building blocks of the framework.

---

### Quick Start Guide

**Category**: getting-started
**URL**: /docs/getting-started/quick-start-guide

# Quick Start Guide

Welcome to the Igniter.js Quick Start Guide! This tutorial provides a detailed, step-by-step walkthrough to build your first fully type-safe API endpoint. We'll go from an empty directory to a running server, explaining each concept along the way.

## Prerequisites

Before we begin, please ensure you have the following installed on your system:

*   **Node.js**: Version 18.x or higher.
*   **A Package Manager**: This guide provides commands for `npm`, `pnpm`, and `bun`.

## Step 1: Create Your Igniter.js Project

We'll start by using the official `igniter init` command, which scaffolds a new, production-ready project with a logical folder structure and all necessary configurations.

Open your terminal and run the command below using your preferred package manager:

<CodeGroup>
  <Code title="npm">
  ```bash
  npx @igniter-js/cli init my-first-api
  ```
  </Code>
  <Code title="pnpm">
  ```bash
  pnpm dlx @igniter-js/cli init my-first-api
  ```
  </Code>
  <Code title="bun">
  ```bash
  bunx @igniter-js/cli init my-first-api
  ```
  </Code>
</CodeGroup>

This command creates a new directory called `my-first-api`, installs dependencies, and sets up your project.

<Callout type="info" title="What did the CLI just do?">
  The `igniter init` command created a starter project that includes the Igniter.js core, essential configuration files (`igniter.ts`, `igniter.router.ts`), and a logical, feature-based directory structure under `src/`. This setup is designed for scalability and maintainability.
</Callout>

Once the process is complete, navigate into your new project directory:

```bash
cd my-first-api
```

## Step 2: Create Your First Controller

In Igniter.js, a `Controller` is a file that groups related API endpoints. These endpoints are called `Actions` (either a `Query` for GET requests or a `Mutation` for POST, PUT, DELETE, etc.).

Let's create a "hello world" controller. First, create the necessary folders:

```bash
mkdir -p src/features/greeting/controllers
```

Now, create a new file at `src/features/greeting/controllers/greeting.controller.ts` and add the following code:

```typescript
// src/features/greeting/controllers/greeting.controller.ts
import { igniter } from '@/igniter';
import { z } from 'zod';

export const greetingController = igniter.controller({
  name: 'GreetingController',
  path: '/greetings',
  actions: {
    hello: igniter.query({
      query: z.object({
        name: z.string().optional().default('World'),
      }),
      handler: ({ request, response }) => {
        const { name } = request.query;
        return response.success({ message: `Hello, ${name}!` });
      },
    }),
  },
});
```

### Understanding the Code: A Properties Breakdown

To understand what we just wrote, you can expand the sections below to see a detailed breakdown of the properties for both the `controller` and the `actions` within it.

<Accordion title="igniter.controller Properties">
  <Field name="name" type="string" required>
    A descriptive name for the controller, recommended for clarity and debugging.
  </Field>
  <Field name="path" type="string" required>
    The base URL segment for all actions within this controller. For example, `/greetings`.
  </Field>
  <Field name="description" type="string">
    A high-level summary of the controller's purpose, useful for documentation.
  </Field>
  <Field name="actions" type="object" required>
    An object containing all the API endpoints (`Actions`) for this controller.
  </Field>
</Accordion>

<Accordion title="Action Properties (Query vs. Mutation)">
  <p className="text-sm text-muted-foreground mb-4">
    Igniter.js has two types of actions: `igniter.query()` for data fetching (GET) and `igniter.mutation()` for data modification (POST, PUT, DELETE). They share some properties but have key differences.
  </p>

  **Query Action (`igniter.query`)**
  <Field name="name" type="string">
    A descriptive name for the action, useful for DevTools and documentation.
  </Field>
  <Field name="description" type="string">
    A summary of what the action does.
  </Field>
  <Field name="path" type="string" required>
    The URL segment for this action, appended to the controller's path. Final URL: `/greetings/hello`.
  </Field>
  <Field name="query" type="object">
    A Zod schema to validate URL query parameters. For more information on Zod, see the <a href="https://zod.dev/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">official Zod documentation</a>.
  </Field>
  <Field name="use" type="array">
    An array of middleware to run before the handler.
  </Field>
  <Field name="handler" type="object" required>
    The function containing your business logic, receiving `request` and `response` in its context.
  </Field>

  **Mutation Action (`igniter.mutation`)**
  <Field name="name" type="string">
    A descriptive name for the action.
  </Field>
  <Field name="description" type="string">
    A summary of what the action does.
  </Field>
  <Field name="path" type="string" required>
    The URL segment for this action.
  </Field>
  <Field name="method" type="string" required>
    The HTTP method to use, e.g., `'POST'`, `'PUT'`, `'DELETE'`.
  </Field>
  <Field name="body" type="object">
    A Zod schema to validate the incoming request body (JSON).
  </Field>
  <Field name="query" type="object">
    A Zod schema to validate URL query parameters. Yes, mutations can have them too!
  </Field>
  <Field name="use" type="array">
    An array of middleware to run before the handler.
  </Field>
  <Field name="handler" type="object" required>
    The function containing your logic.
  </Field>
</Accordion>

## Step 3: Register the Controller with the Router

Your controller is ready, but the application doesn't know about it yet. We need to register it in the main router.

Open `src/igniter.router.ts` and modify it to include your new controller:

```typescript
// src/igniter.router.ts
import { igniter } from '@/igniter';
// 1. Import your new controller
import { greetingController } from '@/features/greeting/controllers/greeting.controller';

export const AppRouter = igniter.router({
  controllers: {
    // 2. Register the controller under a key.
    // This key is used for client-side type inference.
    greetings: greetingController,
  },
});

// This export is crucial for client-side type safety!
export type AppRouterType = typeof AppRouter;
```

<Callout type="info" title="What is the AppRouter?">
  The `AppRouter` is the heart of your application's API. It aggregates all your controllers and defines the overall shape of your API. By exporting its *type*, you enable the Igniter.js client to have fully type-safe access to your backend.
</Callout>

## Step 4: Run the Development Server

Igniter.js includes an interactive development server that provides real-time feedback and a dashboard for your API.

Start the server by running the following command in your terminal:

```bash
npm run dev
```

This command executes `igniter dev --interactive`. You should see a dashboard in your terminal, confirming that the server is running successfully on `http://localhost:3000`.

## Step 5: Test Your API Endpoint

Your API is now live and ready to be tested! You can use a tool like `cURL` or simply open the URL in your web browser.

Open a new terminal window and run this command:

```bash
# Test with the default name ('World')
curl http://localhost:3000/api/v1/greetings/hello
```
You should see the following JSON response:
```json
{"message":"Hello, World!"}
```
Now, let's provide a custom name via the query string:
```bash
# Test with a custom name
curl "http://localhost:3000/api/v1/greetings/hello?name=Igniter"
```
And the response will be:
```json
{"message":"Hello, Igniter!"}
```
## Congratulations!

You have successfully built and tested your first fully type-safe API endpoint with Igniter.js!

In this guide, you have learned how to:
-   **Scaffold a project** using `igniter init`.
-   **Create a `Controller`** to group related API actions.
-   **Define a `Query Action`** with input validation using Zod.
-   **Register the controller** with the main application `Router`.
-   **Run the interactive development server** and test your endpoint.

## Ready for a Real Project?

You've learned the basics, now it's time to build something more substantial. Our official starter templates are the perfect way to kickstart your next project with a production-ready foundation.

<TemplateShowcase />

### Next Steps

*   **[Core Concepts](/docs/core-concepts/the-igniter-builder)**: Take a deep dive into the fundamental building blocks of the framework.
*   **[Routing in Depth](/docs/core-concepts/routing)**: Learn more about file-based routing, parameters, and advanced routing techniques.
*   **[Project Structure](/docs/getting-started/project-structure)**: Understand our best practices for organizing large and scalable applications.

---

### Recommended Project Structure

**Category**: getting-started
**URL**: /docs/getting-started/project-structure

# Recommended Project Structure

A well-organized project structure is crucial for building scalable, maintainable, and collaborative applications. Igniter.js promotes a **Feature-Sliced Architecture** that is designed to grow with your project, keeping your codebase clean and easy to navigate.

The `igniter init` command automatically scaffolds a project with this structure.

---

## The Feature-Based Philosophy

Instead of organizing your code by file type (e.g., a single folder for all controllers, another for all services), we organize it by **feature**. A feature is a self-contained vertical slice of your application's functionality, such as `users`, `products`, or `auth`.

This approach has several key benefits:
*   **High Cohesion**: All code related to a single feature (its routes, logic, types, etc.) lives together.
*   **Low Coupling**: Features are isolated and have minimal dependencies on each other, making them easier to develop, test, and remove if needed.
*   **Scalability**: As your application grows, you simply add new feature folders without cluttering existing ones.
*   **Improved Developer Experience**: It's intuitive to find the code you're looking for because it's grouped by its business purpose.

---

## Top-Level Directory Structure

Here is the recommended top-level structure for an Igniter.js project:

```
src/
├── app/
│   └── api/
│       └── v1/
│           └── [[...all]]/
│               └── route.ts              # Framework-specific route handler (e.g., Next.js)
├── features/                             # ★ Your application's features live here
│   └── [feature]/
│       ├── controllers/
│       ├── procedures/
│       ├── [feature].interfaces.ts
│       └── index.ts
├── services/                             # Third-party service initializations (Prisma, Redis)
│   ├── database.ts
│   └── redis.ts
├── igniter.ts                            # Core Igniter.js instance initialization
├── igniter.client.ts                     # Type-safe client for frontend use
├── igniter.context.ts                    # Global application context definition
└── igniter.router.ts                     # The main application router where all controllers are assembled
```

### Explanation of Directories

*   **`src/app`**: Contains framework-specific integration files. In a Next.js project, this is where the API route handler lives. Igniter.js itself is framework-agnostic, but it needs a single entry point.
*   **`src/features`**: The heart of your application. Each subdirectory within `features` represents a distinct business capability.
*   **`src/services`**: A dedicated place to initialize and export instances of external services, such as a database client (`Prisma`), a Redis client, or a logger.
*   **`src/igniter.ts`**: Where you create and configure the core `Igniter` instance, enabling plugins and global middleware.
*   **`src/igniter.context.ts`**: Defines the shape of the global `Context` object that is available in all your actions and procedures.
*   **`src/igniter.router.ts`**: Where you import all your feature controllers and assemble them into the final `AppRouter`.
*   **`src/igniter.client.ts`**: Defines the type-safe client used by your frontend application to interact with the API.

---

## Inside a Feature Directory

Let's look at the structure of a single feature, for example, `src/features/user`:

```
features/
└── user/
    ├── controllers/
    │   └── user.controller.ts      # Defines API endpoints (/users, /users/:id)
    ├── procedures/
    │   └── auth.procedure.ts       # Reusable middleware (e.g., for checking authentication)
    ├── user.interfaces.ts          # Zod schemas and TypeScript types for the User feature
    └── index.ts                    # Exports the feature's public modules (e.g., userController)
```

*   **`controllers/`**: Contains one or more controller files that define the API routes for the feature using `igniter.controller`.
*   **`procedures/`**: Contains reusable middleware created with `igniter.procedure`. For example, an `auth` procedure here could be used to protect user-related routes.
*   **`[feature].interfaces.ts`**: A central file for all TypeScript `interface` or `type` definitions and `zod` schemas related to this feature. This keeps your data shapes explicit and organized.
*   **`index.ts`**: The public entry point for the feature. It typically exports the controllers so they can be easily imported into the main router.

By following this structure, you create a codebase that is organized, scalable, and a pleasure to work on.

---

## Next Steps

Now that you understand the structure, let's dive into the core concepts of Igniter.js:

*   **[The Igniter Builder](/docs/core-concepts/the-igniter-builder)** - Learn about the foundation of every Igniter.js application
*   **[Context](/docs/core-concepts/context)** - Understand dependency injection and shared state
*   **[Controllers & Actions](/docs/core-concepts/controllers-and-actions)** - Build your API endpoints

---

### Context: The Heart of Your Application's State

**Category**: core-concepts
**URL**: /docs/core-concepts/context

# Context: The Heart of Your Application's State

In Igniter.js, the **Context** is an object that is available in every API action and procedure. Its primary purpose is to act as a powerful, type-safe **Dependency Injection (DI)** mechanism. It holds all the services, data, and helpers your application needs to process a request, such as a database connection, the current user's session, or a logging instance.

Unlike the context in some other frameworks which is often a simple, static object, the context in Igniter.js is **dynamic and composable**. It starts with a base shape and is progressively enriched by middleware (Procedures), creating a tailored, fully-typed context for each specific action.

## 1. The Base Application Context (`AppContext`)

Everything starts with the base context. This is the global state that should be available to your entire application. You define its shape and creation logic in `src/igniter.context.ts`.

**Why it's important:** This file establishes a single source of truth for your application's core dependencies.

**Example: Defining a Context with a Database Connection**

Let's create a base context that provides a Prisma database client.

```typescript
// src/services/database.ts
import { PrismaClient } from '@prisma/client';

// Initialize the client once and export it
export const database = new PrismaClient();

// src/igniter.context.ts
import { database } from '@/services/database';

/**
 * A function that returns the base context object.
 * This function will be called for every incoming request.
 */
export const createIgniterAppContext = () => {
  return {
    database, // Provide the database client to the context
  };
};

/**
 * The TypeScript type of our base context.
 * We infer it directly from the creation function to ensure they are always in sync.
 */
export type IgniterAppContext = ReturnType<typeof createIgniterAppContext>;
```

This `IgniterAppContext` type is then passed to the Igniter Builder in `src/igniter.ts` to set the foundation for your application's type system:

```typescript
// src/igniter.ts
import { Igniter } from '@igniter-js/core';
import type { IgniterAppContext } from './igniter.context';

export const igniter = Igniter
  .context<IgniterAppContext>() // Setting the base context type
  // ... other configurations
  .create();
```

## 2. Accessing Context in an Action

Once defined, the base context is available in the `handler` of every action via the `ctx` (context) argument.

```typescript
// src/features/user/controllers/user.controller.ts
import { igniter } from '@/igniter';

export const userController = igniter.controller({
  path: '/users',
  actions: {
    list: igniter.query({
      path: '/',
      handler: async ({ context, response }) => {
        // The `context` object is fully typed!
        // TypeScript knows `context.database` exists and what methods it has.
        const users = await context.database.user.findMany();

        return response.success({ users });
      },
    }),
  },
});
```

Because we defined `database` in our `IgniterAppContext`, TypeScript provides full autocompletion and type-checking for `context.database`.

## 3. The Magic: A Dynamic, Extendable Context

Here is where Igniter.js truly shines. The context passed to your action handler is not just the base context; it's a **merged object** composed of the base context **plus** any data returned by the procedures (middleware) used in that action.

### Extending Context with Procedures

A **Procedure** can return an object from its handler. This return value is then deeply merged into the context of the next procedure in the chain, and ultimately, into the context of the final action handler.

**Use Case: An Authentication Procedure**

Let's create a procedure that verifies a user's token and adds the `user` object to the context.

```typescript
// src/features/auth/procedures/auth.procedure.ts
import { igniter } from '@/igniter';
import { verifyToken } from '@/services/auth'; // Your token verification logic

export const auth = igniter.procedure({
  handler: async ({ request, response }) => {
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return response.unauthorized({ message: 'No token provided' });
    }

    const userPayload = await verifyToken(token);
    if (!userPayload) {
      return response.unauthorized({ message: 'Invalid token' });
    }

    // This is the magic!
    // We return an object that will be merged into the context.
    return {
      // The key 'user' will be added to the final context object.
      user: {
        id: userPayload.id,
        email: userPayload.email,
      },
    };
  },
});
```

### Using the Extended Context

Now, let's use this `auth` procedure in a protected route.

```typescript
// src/features/user/controllers/user.controller.ts
import { igniter } from '@/igniter';
import { auth } from '@/features/auth/procedures/auth.procedure'; // 1. Import the procedure

export const userController = igniter.controller({
  path: '/users',
  actions: {
    getProfile: igniter.query({
      path: '/me',
      // 2. Apply the procedure to this action
      use: [auth],
      handler: async ({ context, response }) => {
        // 3. Access the extended context!
        // TypeScript knows `context.user` exists because the `auth` procedure provides it.
        // It also still knows about `context.database` from the base context.
        const currentUser = context.user;
        const userDetails = await context.database.user.findUnique({
          where: { id: currentUser.id },
        });

        return response.success({ profile: userDetails });
      },
    }),
  },
});
```

Notice that we didn't have to manually tell TypeScript that `context.user` exists. Igniter.js infers this automatically from the `use: [auth]` array. The final context for the `getProfile` handler is a merged type of `IgniterAppContext & { user: { id: string; email: string; } }`.

## The Final Context Object

For any given request, the context is built layer by layer, ensuring perfect type safety and data isolation at each step.

1. **Base Context:** The request starts with the global `IgniterAppContext` (e.g., `{ database }`).
2. **Procedure 1:** A procedure runs, returns `{ a: 1 }`. The context becomes `{ database, a: 1 }`.
3. **Procedure 2:** Another procedure runs, returns `{ b: 2 }`. The context becomes `{ database, a: 1, b: 2 }`.
4. **Action Handler:** The final handler receives the fully merged and typed context: `{ database, a: 1, b: 2 }`.

This powerful, composable pattern allows you to build clean, decoupled, and highly testable business logic.

---

**Next Steps**

Now that you understand how to manage state and dependencies with Context, let's see how to structure your API endpoints:

- **[Controllers & Actions](/docs/core-concepts/controllers-and-actions)** - Learn about API endpoint structure
- **[Procedures](/docs/core-concepts/procedures)** - Deep dive into middleware
- **[Validation](/docs/core-concepts/validation)** - Type-safe input validation

---

### Controllers & Actions: Building Your API Logic

**Category**: core-concepts
**URL**: /docs/core-concepts/controllers-and-actions

# Controllers & Actions: Building Your API Logic

At the core of every Igniter.js application are **Controllers** and **Actions**. This is where you define your API's endpoints, implement your business logic, and handle interactions with your data and services.

<Callout type="info" title="Core Concepts">
  **Controllers** organize related API endpoints, while **Actions** define individual endpoints with their business logic. Together, they provide a clean, maintainable, and scalable way to build your API.
</Callout>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <Card title="Controllers">
    Organizational units that group related Actions together with a shared base path and configuration.
  </Card>
  <Card title="Actions">
    Individual API endpoints that handle specific requests like fetching data or creating resources.
  </Card>
</div>

## 1. Controllers: Organizing Your Endpoints

A Controller is created using the `igniter.controller()` factory function. Its primary role is to define a base `path` that acts as a prefix for all the Actions it contains.

### Controller Anatomy

Every controller follows the `IgniterControllerConfig` interface:

| Property | Type | Required | Description |
|:---------|:-----|:---------|:------------|
| `name` | `string` | ❌ | Optional controller name for documentation and API introspection |
| `path` | `string` | ✅ | Base URL path prefix for all actions in this controller |
| `description` | `string` | ❌ | Optional description for documentation generation and OpenAPI spec |
| `actions` | `Record<string, Action>` | ✅ | Collection of actions where keys are action names and values are action definitions |

<Callout type="tip" title="Type Safety">
  Controllers are fully type-safe. The `actions` object is validated at compile-time to ensure all actions conform to the proper structure.
</Callout>

### Complete Controller Example

```typescript
// src/features/user/controllers/user.controller.ts
import { igniter } from '@/igniter';
import { z } from 'zod';

export const userController = igniter.controller({
  /**
   * Optional name for the controller
   * Useful for documentation generation and MCP Server tool conversion
   */
  name: 'UserController',

  /**
   * The base path for all actions in this controller.
   * All action paths will be prefixed with `/users`.
   */
  path: '/users',

  /**
   * Optional description for documentation generation
   * Essential for OpenAPI spec generation and MCP Server AI agent integration
   */
  description: 'Handles all user-related operations including CRUD and authentication',

  /**
   * A collection of all API endpoints related to users.
   * Each key becomes an action name, each value defines the endpoint.
   */
  actions: {
    list: igniter.query({ /* ... */ }),
    getById: igniter.query({ /* ... */ }),
    create: igniter.mutation({ /* ... */ }),
    update: igniter.mutation({ /* ... */ }),
    delete: igniter.mutation({ /* ... */ }),
  },
});
```

### Controller Properties

| Property | Type | Required | Description |
|:---------|:-----|:---------|:------------|
| `name` | `string` | ❌ | Optional controller name for documentation and API introspection |
| `path` | `string` | ✅ | Base URL path that prefixes all action paths |
| `description` | `string` | ❌ | Optional description for documentation, OpenAPI spec, and MCP Server integration |
| `actions` | `Record<string, Action>` | ✅ | Object containing all actions, where keys are action names |

<Callout type="note" title="Path Composition">
  The final URL for any action is: `{controller.path}{action.path}`. For example, if a controller has `path: '/users'` and an action has `path: '/:id'`, the final URL will be `/users/:id`.
</Callout>

## 2. Actions: The Heart of Your Business Logic

Actions are where the actual work happens. Each Action represents a single API endpoint and is created using either `igniter.query()` for read operations or `igniter.mutation()` for write operations.

### Action Types

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <Card title="Query Actions">
    Use `igniter.query()` for **read operations** that don't modify data. Typically GET requests.
  </Card>
  <Card title="Mutation Actions">
    Use `igniter.mutation()` for **write operations** that modify data. POST, PUT, PATCH, DELETE requests.
  </Card>
</div>

### Action Anatomy

Every action follows the `IgniterAction` interface with these core properties:

| Property | Type | Required | Query | Mutation | Description |
|:---------|:-----|:---------|:------|:---------|:------------|
| `name` | `string` | ❌ | ✅ | ✅ | Optional action name for documentation and MCP Server tool conversion |
| `type` | `'query' \| 'mutation'` | ✅ | ✅ | ✅ | Action type (automatically inferred from creation method) |
| `path` | `string` | ✅ | ✅ | ✅ | URL path relative to controller, supports parameters like `/:id` |
| `method` | `HTTPMethod` | ❌ | ❌ | ✅ | HTTP method (defaults to GET for queries, required for mutations) |
| `handler` | `Function` | ✅ | ✅ | ✅ | Async function containing your business logic |
| `query` | `StandardSchemaV1` | ❌ | ✅ | ✅ | Schema for validating URL query parameters |
| `body` | `StandardSchemaV1` | ❌ | ❌ | ✅ | Schema for validating request body data |
| `use` | `IgniterProcedure[]` | ❌ | ✅ | ✅ | Array of procedure middleware to run before handler |
| `description` | `string` | ❌ | ✅ | ✅ | Documentation description for OpenAPI docs and MCP Server |
| `tags` | `string[]` | ❌ | ✅ | ✅ | Tags for categorization and documentation |
| `$Infer` | `TActionInfer` | ✅ | ✅ | ✅ | Internal type inference helper (automatically managed) |

### Complete Action Examples

#### Query Action with Full Configuration

```typescript
const getUserById = igniter.query({
  /**
   * Optional action name for documentation and MCP Server integration
   */
  name: 'getUserById',
  
  /**
   * URL path - will be combined with controller path
   * Final URL: /users/:id (if controller path is '/users')
   */
  path: '/:id',
  
  /**
   * HTTP method for this endpoint
   */
  method: 'GET',
  
  /**
   * Query parameters validation using Zod
   */
  query: z.object({
    include: z.array(z.enum(['posts', 'profile'])).optional(),
    fields: z.string().optional(),
  }),
  
  /**
   * Optional description for API documentation
   */
  description: 'Retrieve a specific user by their ID with optional related data',
  
  /**
   * Tags for categorization and documentation
   */
  tags: ['users', 'read'],
  
  /**
   * Middleware stack - runs before the handler
   */
  use: [authMiddleware, rateLimitMiddleware],
  
  /**
   * The main business logic handler
   */
  handler: async (ctx) => {
    const { id } = ctx.params;              // URL parameters
    const { include, fields } = ctx.query; // Validated query params
    
    const user = await getUserFromDatabase(id, {
      include,
      fields: fields?.split(','),
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return { user };
  },
});
```

#### Mutation Action with Body Validation

```typescript
const createUser = igniter.mutation({
  /**
   * Optional action name for documentation and MCP Server tool conversion
   */
  name: 'createUser',
  
  /**
   * URL path for creating users
   */
  path: '/',
  
  /**
   * HTTP method for creation
   */
  method: 'POST',
  
  /**
   * Request body validation schema
   */
  body: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    age: z.number().int().min(18).optional(),
    preferences: z.object({
      newsletter: z.boolean().default(false),
      theme: z.enum(['light', 'dark']).default('light'),
    }).optional(),
  }),
  
  /**
   * Documentation and metadata
   */
  description: 'Create a new user account with validated data',
  tags: ['users', 'create'],
  
  /**
   * Middleware for authentication and validation
   */
  use: [authMiddleware, validatePermissions('user:create')],
  
  /**
   * Handler with full type safety
   */
  handler: async (ctx) => {
    // ctx.body is fully typed based on the schema above
    const userData = ctx.body;
    
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Create the user
    const newUser = await createUserInDatabase({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Return the created user (excluding sensitive data)
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      message: 'User created successfully',
    };
  },
});
 ```

### Action Properties Reference

<Callout type="info" title="Complete API Reference">
  Here's a comprehensive breakdown of all available properties for Actions:
</Callout>

| Property | Type | Required | Query | Mutation | Description |
|:---------|:-----|:---------|:------|:---------|:------------|
| `path` | `string` | ✅ | ✅ | ✅ | URL path relative to controller. Supports parameters like `/:id` |
| `method` | `HTTPMethod` | ❌ | ❌ | ✅ | HTTP method. Defaults to `GET` for queries, required for mutations |
| `handler` | `Function` | ✅ | ✅ | ✅ | Async function containing your business logic |
| `query` | `StandardSchemaV1` | ❌ | ✅ | ✅ | Schema for validating URL query parameters |
| `body` | `StandardSchemaV1` | ❌ | ❌ | ✅ | Schema for validating request body data |
| `use` | `IgniterProcedure[]` | ❌ | ✅ | ✅ | Array of procedure middleware to run before handler |
| `name` | `string` | ❌ | ✅ | ✅ | Optional name for the action |
| `description` | `string` | ❌ | ✅ | ✅ | Documentation description for API docs |

### HTTP Methods Support

```typescript
type HTTPMethod = 
  | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' 
  | 'HEAD' | 'OPTIONS' | 'TRACE';

type QueryMethod = 'GET';  // Queries are typically GET requests
type MutationMethod = Exclude<HTTPMethod, 'GET'>;  // Mutations use other methods
```

## 3. The Context Object (ctx)

Every action handler receives a `ctx` (context) object that provides access to all request data and utilities:

### Context Anatomy

The context object (`ctx`) passed to every action handler contains the following properties:

| Property | Type | Description |
|:---------|:-----|:------------|
| `request` | `Object` | Contains all request-related data |
| `request.method` | `HTTPMethod` | HTTP method used for the request |
| `request.path` | `string` | Action path that was matched |
| `request.params` | `Object` | URL parameters inferred from path (e.g., `/:id` → `{ id: string }`) |
| `request.headers` | `IgniterHeaders` | Request headers with helper methods |
| `request.cookies` | `IgniterCookies` | Request cookies with helper methods |
| `request.body` | `T \| undefined` | Validated request body (typed from schema) |
| `request.query` | `T \| undefined` | Validated query parameters (typed from schema) |
| `context` | `Object` | Enhanced application context with global services |
| `response` | `IgniterResponseProcessor` | Response processor for building HTTP responses |
| `realtime` | `IgniterRealtimeService` | Service for real-time communication |
| `plugins` | `Object` | Type-safe access to registered plugins |

### Context Usage Examples

```typescript
// Complete example with all context features
const getUserById = igniter.query({
  path: '/users/:id',
  query: z.object({
    include: z.array(z.string()).optional(),
  }),
  handler: async (ctx) => {
    // URL Parameters (typed from path)
    const userId = ctx.request.params.id;
    
    // Query Parameters (validated)
    const includes = ctx.request.query?.include;
    
    // Headers
    const authToken = ctx.request.headers.get('authorization');
    
    // Cookies
    const sessionId = ctx.request.cookies.get('session-id');
    
    // Set response cookies
    ctx.response.setCookie('last-visited', new Date().toISOString(), {
      httpOnly: true,
      secure: true,
      maxAge: 86400
    });
    
    // Access application context
    const database = ctx.context.database;
    
    // Business logic
    const user = await database.user.findById(userId);
    
    // Return response using response processor
    return ctx.response.success({ user });
  },
});
```

<Callout type="tip" title="Type Safety">
  The `ctx.query` and `ctx.body` objects are fully typed based on your Zod schemas, providing excellent IntelliSense and compile-time safety.
</Callout>

## 4. Deep Dive: Creating a Query Action

Let's create a `query` action to fetch a list of users, with support for pagination through query parameters.

```typescript
// In src/features/user/controllers/user.controller.ts

import { igniter } from '@/igniter';
import { z } from 'zod';

export const userController = igniter.controller({
  path: '/users',
  actions: {
    /**
     * An action to list users.
     * Final Path: GET /users/
     */
    list: igniter.query({
      path: '/',

      // 1. Define and validate query parameters using Zod.
      // These are optional and have default values.
      query: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce.number().int().positive().optional().default(10),
      }),

      // 2. The main handler function.
      handler: async ({ request, context, response }) => {
        // `request.query` is fully typed by TypeScript as { page: number; limit: number; }
        // based on the Zod schema above. No manual parsing or validation needed.
        const { page, limit } = request.query;

        const skip = (page - 1) * limit;

        // Use the database client from the global context.
        const users = await context.database.user.findMany({
          take: limit,
          skip: skip,
        });

        const totalUsers = await context.database.user.count();

        // Use the response processor to return a structured, successful response.
        return response.success({
          users,
          pagination: {
            page,
            limit,
            total: totalUsers,
          },
        });
      },
    }),
  },
});
```

In this example, Igniter.js automatically validates that `page` and `limit` are positive integers. If validation fails, it will return a `400 Bad Request` response with a descriptive error message *before* your handler code is ever executed.

## 4. Deep Dive: Creating a Mutation Action

Now, let's create a `mutation` to add a new user to the database. This action will require authentication, which we'll enforce with a procedure.

```typescript
// In src/features/user/controllers/user.controller.ts

import { igniter } from '@/igniter';
import { z } from 'zod';
import { auth } from '@/features/auth/procedures/auth.procedure'; // Assuming an auth procedure exists

export const userController = igniter.controller({
  path: '/users',
  actions: {
    // ... (list action from above)

    /**
     * An action to create a new user.
     * Final Path: POST /users/
     */
    create: igniter.mutation({
      path: '/',
      method: 'POST',

      // 1. Apply the 'auth' procedure to protect this route.
      // This will run before the handler and can extend the context.
      use: [auth],

      // 2. Define and validate the request body using a Zod schema.
      body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
      }),

      // 3. The main handler function.
      handler: async ({ request, context, response }) => {
        // `request.body` is fully typed as { name: string; email: string; }
        const { name, email } = request.body;

        // `context.user` is available and typed here because the `auth`
        // procedure added it to the context.
        const createdBy = context.user;
        context.logger.info(`User creation initiated by ${createdBy.email}`);

        const newUser = await context.database.user.create({
          data: { name, email },
        });

        // Use the `created` helper for a 201 Created status code.
        return response.created(newUser);
      },
    }),
  },
});
```


This mutation demonstrates the composability of Igniter.js. The validation, authentication, and business logic are all declared in a clean, readable, and type-safe way.

## The Power of the `ctx` Object

The `ctx` object passed to every `handler` is your unified gateway to everything you need for a request. It's an instance of `IgniterActionContext` and contains:

- `ctx.request`: Fully-typed request data, including `params`, `query`, `body`, `headers`, and `cookies`.
- `ctx.context`: The dynamic application context, containing your global services (like `database`) and any data added by procedures (like `user`).
- `ctx.response`: The response processor for building type-safe HTTP responses (`.success()`, `.created()`, `.unauthorized()`, etc.).
- `ctx.plugins`: A type-safe entry point for interacting with any registered plugins.

By centralizing these concerns, Igniter.js allows you to focus purely on the business logic inside your handler.

---

**Next Steps**

Now you know how to build the core logic of your API. The next step is to understand the powerful middleware system that makes your code reusable and clean:

- **[Procedures (Middleware)](/docs/core-concepts/procedures)** - Learn about middleware
- **[Routing](/docs/core-concepts/routing)** - Understand URL routing
- **[Validation](/docs/core-concepts/validation)** - Type-safe input validation

---

### Procedures in Igniter.js

**Category**: core-concepts
**URL**: /docs/core-concepts/procedures

# Procedures in Igniter.js

Procedures are one of the most powerful and flexible features in Igniter.js, providing a sophisticated middleware system that enables you to create reusable, composable, and type-safe request processing logic. This comprehensive guide will take you through everything you need to know about procedures, from basic concepts to advanced patterns.

## What Are Procedures?

In Igniter.js, a **procedure** is a reusable piece of middleware that can be applied to actions or at the builder level. Think of procedures as building blocks that encapsulate common functionality like authentication, logging, rate limiting, input validation, or any custom business logic you need to run before your main handler executes.

<Accordion title="Procedures vs Traditional Middleware">
  <Field name="Type Safety" type="advantage">
    Unlike traditional middleware that often lacks type safety and composability, Igniter.js procedures are fully type-safe, composable, and provide rich context manipulation capabilities.
  </Field>
  <Field name="Context Manipulation" type="advantage">
    They can modify the request context, perform early returns, and maintain complete type inference throughout the chain.
  </Field>
</Accordion>

Procedures operate within the **request lifecycle**, executing before your action handlers and having the ability to:

- **Validate and transform input data**
- **Authenticate and authorize requests**
- **Log request information**
- **Implement rate limiting**
- **Add custom context data**
- **Perform early returns** (like redirects or error responses)
- **Access the global application context** (database connections, services, etc.)
- **Chain with other procedures** for complex workflows

## Core Concepts

### Procedure Context

Every procedure receives an `IgniterProcedureContext` object that contains all the information about the current request:

### Understanding the Procedure Context: A Properties Breakdown

To understand the `IgniterProcedureContext` object that every procedure receives, you can expand the section below to see a detailed breakdown of its properties.

<Accordion title="IgniterProcedureContext Properties">
  <Field name="request" type="object" required>
    The incoming request object containing headers, query parameters, body, cookies, and more.
  </Field>
  <Field name="context" type="object" required>
    The global application context containing database connections, services, configuration, and other shared resources.
  </Field>
  <Field name="response" type="object" required>
    The response builder object with methods to create successful or error responses.
  </Field>
  <Field name="next" type="function" required>
    Function to continue to the next middleware or call the final handler.
  </Field>
</Accordion>

The context is the primary way procedures interact with the request lifecycle, providing a clean and type-safe interface for middleware operations.

## Creating Your First Procedure

Let's start with a simple example using the `igniter.procedure` function. We'll create a request logging procedure:

```typescript
import { igniter } from '@/igniter';

// Create a simple logging procedure
export const requestLogger = igniter.procedure({
  name: 'RequestLogger',
  handler: async ({ request, context, response, next }) => {
    const startTime = Date.now();
    
    // Use logger from global context if available
    const logger = context.logger || console;
    logger.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
    
    // Continue to the next middleware or handler
    const result = await next();
    
    const duration = Date.now() - startTime;
    logger.log(`Request completed in ${duration}ms`);
    
    return result;
  },
});
```

This procedure:
1. **Logs the incoming request** with timestamp, method, and URL
2. **Calls `next()`** to continue the middleware chain
3. **Logs the completion time** after the request is processed
4. **Returns the result** from the next middleware or handler

### Using the Procedure

Once created, you can use this procedure in your controllers:

### Action-Level Procedures

```typescript
export const userController = igniter.controller({
  name: 'UserController',
  path: '/users',
  actions: {
    getUser: igniter.query({
      path: '/:id',
      // Apply the procedure only to this action
      use: [requestLogger],
      handler: ({ request, response }) => {
        return response.success({ user: { id: request.params.id } });
      },
    }),
  },
});
```

<Accordion title="Future Enhancements">
  <Field name="Router and Controller Level Procedures" type="roadmap">
    Currently, procedures can only be used at the action level or builder level. Support for router and controller level procedures is planned for future releases. You can track this feature request and vote for it on [GitHub Issue #13](https://github.com/felipebarcelospro/igniter-js/issues/13).
  </Field>
</Accordion>



## Best Practices

Following established best practices when creating procedures ensures your code remains maintainable, reusable, and type-safe. These guidelines will help you build robust middleware that integrates seamlessly with the Igniter.js ecosystem.

Proper procedure design not only improves code quality but also enhances developer experience by making your APIs more predictable and easier to debug. Each practice below addresses common challenges developers face when building production applications.

<Accordion title="Keep Procedures Focused">
  Each procedure should have a single, well-defined responsibility. This follows the Single Responsibility Principle and makes your code more maintainable and testable.

  ```typescript
  // Good: Focused on authentication only
  export const authProcedure = igniter.procedure({
    name: 'Authentication',
    handler: async ({ request, response, next }) => {
      // Only handle authentication logic
    },
  });

  // Good: Focused on logging only
  export const loggingProcedure = igniter.procedure({
    name: 'Logging',
    handler: async ({ request, response, next }) => {
      // Only handle logging logic
    },
  });

  // Avoid: Mixing multiple concerns
  export const authAndLoggingProcedure = igniter.procedure({
    name: 'AuthAndLogging',
    handler: async ({ request, response, next }) => {
      // Don't mix authentication and logging in one procedure
    },
  });
  ```
</Accordion>

<Accordion title="Use Descriptive Names">
  Give your procedures clear, descriptive names that indicate their purpose. This makes your code self-documenting and easier to understand.

  ```typescript
  // Good - Clear and descriptive
  export const jwtAuthenticationProcedure = igniter.procedure({
    name: 'JWTAuthentication',
    handler: async ({ next }) => next(),
  });
  
  export const requestRateLimitProcedure = igniter.procedure({
    name: 'RequestRateLimit',
    handler: async ({ next }) => next(),
  });
  
  export const inputValidationProcedure = igniter.procedure({
    name: 'InputValidation',
    handler: async ({ next }) => next(),
  });

  // Avoid - Vague and unclear
  export const authProc = igniter.procedure({
    name: 'Auth',
    handler: async ({ next }) => next(),
  });
  
  export const middleware1 = igniter.procedure({
    name: 'Middleware1',
    handler: async ({ next }) => next(),
  });
  ```
</Accordion>

<Accordion title="Handle Errors Gracefully">
  Always handle potential errors in your procedures to prevent unhandled exceptions from crashing your application.

  ```typescript
  export const safeProcedure = igniter.procedure({
    name: 'SafeProcedure',
    handler: async ({ request, response, next }) => {
      try {
        // Your procedure logic
        const result = await someAsyncOperation();
        return next();
      } catch (error) {
        console.error('Procedure error:', error);
        return response.error({
          message: 'Procedure failed',
          statusCode: 500,
        });
      }
    },
  });
  ```
</Accordion>

<Accordion title="Use Schema Validation for Configuration">
  When creating configurable procedures, always use schema validation to ensure type safety and runtime validation.

  ```typescript
  const optionsSchema = z.object({
    timeout: z.number().min(1000).max(30000).default(5000),
    retries: z.number().min(0).max(5).default(3),
  });

  export const configurableProcedure = igniter.procedure({
    name: 'ConfigurableProcedure',
    schema: optionsSchema,
    handler: async ({ options, next }) => {
      // options are now type-safe and validated
    },
  });
  ```

  <Field name="Schema Type Safety" type="feature">
    Schema validation ensures type safety for all configuration options.
  </Field>
  <Field name="Runtime Validation" type="feature">
    Invalid configurations are caught at runtime with clear error messages.
  </Field>
  <Field name="Configuration Default Values" type="feature">
    Schema provides sensible defaults for optional configuration parameters.
  </Field>
</Accordion>

<Accordion title="Document Your Procedures">
  Provide clear documentation for your procedures, especially their configuration options, to help other developers understand and use them effectively.

  ```typescript
  /**
   * Rate limiting procedure that restricts the number of requests per time window.
   * 
   * @example
   * ```typescript
   * use: [
   *   rateLimitProcedure({
   *     maxRequests: 100,
   *     windowMs: 60000, // 1 minute
   *     message: 'Too many requests'
   *   })
   * ]
   * ```
   */
  export const rateLimitProcedure = igniter.procedure({
    name: 'RateLimit',
    schema: z.object({
      /** Maximum number of requests allowed in the time window */
      maxRequests: z.number().min(1).default(100),
      /** Time window in milliseconds */
      windowMs: z.number().min(1000).default(60000),
      /** Error message to return when rate limit is exceeded */
      message: z.string().default('Too many requests'),
    }),
    handler: async ({ options, request, response, next }) => {
      // Implementation
    },
  });
  ```

  <Field name="JSDoc Comments" type="practice">
    Use JSDoc comments to describe the procedure's purpose and usage.
  </Field>
  <Field name="Usage Examples" type="practice">
    Provide clear examples showing how to configure and use the procedure.
  </Field>
  <Field name="Parameter Documentation" type="practice">
    Document each configuration parameter with inline comments.
  </Field>
</Accordion>





## Conclusion

Procedures are a fundamental building block of Igniter.js applications, providing a powerful and flexible way to implement cross-cutting concerns in your API using the `igniter.procedure` function. By understanding how to create, compose, and use procedures effectively, you can build more maintainable, reusable, and type-safe applications.

### Key Takeaways

<Accordion title="Essential Procedure Concepts">
  <Field name="Cross-Cutting Concerns" type="concept">
    Use procedures for authentication, logging, validation, and other shared functionality across your application.
  </Field>
  <Field name="Type-Safe Context" type="concept">
    Leverage the type-safe context system for secure data sharing between procedures and handlers.
  </Field>
  <Field name="Composition" type="concept">
    Compose procedures to build complex middleware chains with predictable execution order.
  </Field>
  <Field name="Single Responsibility" type="concept">
    Follow the single responsibility principle to create maintainable and testable code.
  </Field>
  <Field name="Best Practices" type="concept">
    Keep procedures focused, use descriptive names, and implement proper error handling.
  </Field>
</Accordion>

<Accordion title="Next Steps">
  <Field name="Ready to Build" type="next-step">
    With this comprehensive understanding of procedures, you're ready to build sophisticated, production-ready APIs with Igniter.js. Explore [Controllers and Actions](/docs/core-concepts/controllers) and [Request and Response Handling](/docs/core-concepts/request-response) to complete your knowledge.
  </Field>
</Accordion>

---

### Routing: Assembling Your API

**Category**: core-concepts
**URL**: /docs/core-concepts/routing

# Routing: Assembling Your API

The **Igniter.js Router** is the final and most crucial step in the backend configuration process. Its purpose is to take all the individual `Controllers` you've built and assemble them into a single, unified, and fully-routable API.

The `AppRouter`, which you create in `src/igniter.router.ts`, becomes the single source of truth for your entire API's structure. It's not just a request handler; it's a complete, type-safe definition of every endpoint, which is later used to power the end-to-end type safety of the client.

## 1. Creating the Application Router

You create your application's router using the `igniter.router()` factory function. This is typically done once in `src/igniter.router.ts`.

**Example: A typical `igniter.router.ts` file**

```typescript
// src/igniter.router.ts
import { igniter } from '@/igniter';

// 1. Import all the controllers you've created
import { userController } from '@/features/user/controllers/user.controller';
import { postController } from '@/features/post/controllers/post.controller';

/**
 * The main application router.
 * It combines all controllers into a single API definition.
 */
export const AppRouter = igniter.router({
  /**
   * The collection of all controllers registered with this router.
   */
  controllers: {
    // 2. Register your controllers here
    users: userController,
    posts: postController,
  },
});

/**
 * We export the *type* of the AppRouter.
 * This is crucial for providing type safety to the client without
 * bundling any server-side code.
 */
export type AppRouter = typeof AppRouter;
```

## 2. Router Configuration Explained

Let's break down the configuration options for `igniter.router()`:

### `controllers`

This is the most important property. It's an object where you register all the feature controllers that make up your API.

- **The `key` is important:** The key you assign to each controller (e.g., `users`, `posts`) directly maps to the namespace used on the type-safe client. Registering `users: userController` is what enables you to later call `api.users.list.useQuery()` on the frontend.
- **The `value` is the controller instance** created with `igniter.controller()`.

## 3. Integrating the Router with a Web Framework

The `AppRouter` object exposes a `handler` function that is framework-agnostic. It's designed to work with the standard Web `Request` and `Response` objects, making it compatible with any modern Node.js web framework.

### Integration with Next.js (Recommended)

Igniter.js provides a dedicated adapter for Next.js App Router to make integration seamless.

Create a catch-all route handler at `src/app/api/v1/[[...all]]/route.ts`:

```typescript
// src/app/api/v1/[[...all]]/route.ts
import { AppRouter } from '@/igniter.router';
import { nextRouteHandlerAdapter } from '@igniter-js/core/adapters';

/**
 * The adapter takes your AppRouter and returns an object containing
 * handlers for each HTTP method (GET, POST, etc.).
 * Next.js will automatically call the correct handler based on the
 * incoming request's method.
 */
export const { GET, POST, PUT, DELETE, PATCH } = nextRouteHandlerAdapter(AppRouter);
```

This single file is all you need to connect your entire Igniter.js API to your Next.js application.

### Integration with Other Frameworks (e.g., Express)

You can easily create your own adapter for other frameworks like Express or Hono.

```typescript
// Example for an Express server
import express from 'express';
import { AppRouter } from '@/igniter.router';
import { createExpressAdapter } from './my-express-adapter'; // A simple custom adapter

const app = express();

// Use the handler for all routes matching the base path
app.use('/api/v1/*', createExpressAdapter(AppRouter.handler));

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

## 4. The Router's Role in End-to-End Type Safety

The `AppRouter` object is more than just a request handler. It is a deeply-typed representation of your entire API. This static object contains all the information about every controller, action, path, input schema, and output type.

When you create your **Type-Safe Client**, you will import the *type* of `AppRouter` (`type AppRouter = typeof AppRouter`). The client uses this type to generate a fully-typed SDK for your frontend, ensuring that your backend and frontend are always perfectly in sync.

---

**Next Steps**

Congratulations! You have now learned how to build a complete, fully-functional backend with Igniter.js. You can define the application's core with the Builder, manage dependencies with Context, write business logic in Controllers and Actions, create reusable middleware with Procedures, and finally, assemble everything with the Router.

The next logical step is to learn how to consume this powerful, type-safe API from a frontend application:

- **[Validation](/docs/core-concepts/validation)** - Type-safe input validation
- **[Client-Side Integration](/docs/client-side)** - Connect your frontend
- **[Advanced Features](/docs/advanced-features)** - Explore queues, store, and more

---

### The Igniter Builder: Your Application's Foundation

**Category**: core-concepts
**URL**: /docs/core-concepts/igniter-builder

# The Igniter Builder: Your Application's Foundation

Every Igniter.js application begins with the **Igniter Builder**. It is a fluent, chainable API designed to guide you through the process of composing and configuring your application's core components in a structured and fully type-safe manner.

Think of the builder as the master blueprint for your entire backend. It's where you define the application's context, integrate services like logging and caching, enable advanced features like background jobs, and extend functionality with plugins.

## Philosophy

The Igniter Builder is designed around five core principles:

1. **Guided Configuration**: Each method guides you through the setup process with clear, type-safe APIs.
2. **Compile-time Safety**: All configurations are validated at compile time, catching errors before they reach production.
3. **Explicitness**: Every configuration is explicit and intentional, making your application's behavior predictable.
4. **Modularity**: Each adapter and service can be configured independently, allowing for flexible architectures.
5. **Testability**: The builder pattern makes it easy to create different configurations for testing, development, and production.

## How It Works

The Igniter Builder uses a fluent interface pattern where each method returns a new builder instance with updated type information. This ensures that TypeScript can provide accurate autocompletion and type checking throughout your configuration process.

```typescript
const igniter = Igniter
  .context<AppContext>()
  .middleware([authMiddleware, loggingMiddleware])
  .store(redisAdapter)
  .logger(consoleLogger)
  .telemetry(openTelemetryProvider)
  .create();
```

## Configuration Methods

<Accordion title=".context<T>() - Define application context type">
  <Field name="contextFn" type="TContext extends object | ContextCallback" required description="The context type or callback function that defines the application context." />

  ```typescript
  type AppContext = {
    user: User | null;
    db: Database;
    config: AppConfig;
  };

  const igniter = Igniter.context<AppContext>();
  ```

  **Key Points:**
  - The context type is used for type inference across all actions and procedures
  - Context can be populated by middleware or provided directly in actions
  - Must be defined before other configuration methods for proper type inference
  - Supports both static types and dynamic context callbacks
</Accordion>

<Accordion title=".middleware(middlewares) - Configure global middleware">
  <Field name="middlewares" type="readonly IgniterProcedure<any, any, any>[]" required description="An array of middleware procedures to apply globally." />

  ```typescript
  import { authMiddleware, loggingMiddleware } from './middleware';

  const igniter = Igniter
    .context<AppContext>()
    .middleware([authMiddleware, loggingMiddleware]);
  ```

  **Key Points:**
  - Middleware is executed in the order specified in the array
  - Global middleware applies to all controllers and actions
  - Each middleware can modify the context or handle errors
  - Type-safe middleware composition with full TypeScript inference
</Accordion>

<Accordion title=".config(routerConfig) - Set base URL and path">
  <Field name="routerConfig" type="TConfig extends IgniterBaseConfig" required description="Configuration object containing base URL and path settings." />

  ```typescript
  const igniter = Igniter
    .context<AppContext>()
    .config({
      baseURL: 'https://api.example.com',
      basePATH: '/v1'
    });
  ```

  **Available Options:**
  - `baseURL` - The base URL for your API
  - `basePATH` - The base path prefix for all routes
</Accordion>

<Accordion title=".store(storeAdapter) - Configure caching and storage">
  <Field name="storeAdapter" type="IgniterStoreAdapter" required description="A store adapter implementing the IgniterStoreAdapter interface." />

  ```typescript
  import { RedisAdapter } from '@igniter-js/adapter-redis';

  const store = new RedisAdapter({
    host: 'localhost',
    port: 6379,
    db: 0
  });

  const igniter = Igniter
    .context<AppContext>()
    .store(store);
  ```

  **Supported Adapters:**
  - `@igniter-js/adapter-redis` - Redis-based storage with pub/sub support
  - Custom adapters implementing `IgniterStoreAdapter` interface

  **Store Features:**
  - Key-value storage with TTL support
  - Pub/Sub messaging for real-time features
  - Automatic serialization/deserialization
  - Type-safe operations
</Accordion>

<Accordion title=".logger(loggerAdapter) - Set up application logging">
  <Field name="loggerAdapter" type="IgniterLogger" required description="A logger adapter implementing the IgniterLogger interface." />

  ```typescript
  import { ConsoleLogger } from '@igniter-js/logger-console';

  const logger = new ConsoleLogger({
    level: 'info',
    format: 'json'
  });

  const igniter = Igniter
    .context<AppContext>()
    .logger(logger);
  ```

  **Logger Interface:**
  - `info(message, meta?)` - Log informational messages
  - `warn(message, meta?)` - Log warning messages
  - `error(message, meta?)` - Log error messages
  - `debug(message, meta?)` - Log debug messages

  **Custom Loggers:**
  Implement the `IgniterLogger` interface to create custom logging solutions.
</Accordion>

<Accordion title=".jobs(jobsAdapter) - Enable background job processing">
  <Field name="jobsAdapter" type="MergedJobsExecutor<any>" required description="A jobs adapter that provides background job processing capabilities." />

  ```typescript
  import { BullMQAdapter } from '@igniter-js/adapter-bullmq';

  const jobs = new BullMQAdapter({
    connection: {
      host: 'localhost',
      port: 6379
    },
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5
    }
  });

  const igniter = Igniter
    .context<AppContext>()
    .jobs(jobs);
  ```

  **Supported Adapters:**
  - `@igniter-js/adapter-bullmq` - BullMQ integration with Redis

  **Job Features:**
  - Type-safe job definitions and handlers
  - Delayed and scheduled job execution
  - Job retry mechanisms and error handling
  - Queue monitoring and management
</Accordion>

<Accordion title=".telemetry(telemetryProvider) - Add observability and monitoring">
  <Field name="telemetryProvider" type="IgniterTelemetryProvider" required description="A telemetry provider implementing distributed tracing and metrics collection." />

  ```typescript
  import { OpenTelemetryProvider } from '@igniter-js/adapter-opentelemetry';

  const telemetry = new OpenTelemetryProvider({
    serviceName: 'my-api',
    serviceVersion: '1.0.0',
    exporters: {
      traces: 'jaeger',
      metrics: 'prometheus'
    }
  });

  const igniter = Igniter
    .context<AppContext>()
    .telemetry(telemetry);
  ```

  **Supported Providers:**
  - `@igniter-js/adapter-opentelemetry` - OpenTelemetry integration

  **Telemetry Features:**
  - Distributed tracing across requests
  - Custom metrics and counters
  - Performance monitoring
  - Error tracking and alerting
  - Integration with popular observability platforms
</Accordion>

<Accordion title=".plugins(pluginsRecord) - Extend framework functionality">
  <Field name="pluginsRecord" type="Record<string, IgniterPlugin>" required description="An object containing plugin instances keyed by their names." />

  ```typescript
  import { AuthPlugin } from '@igniter-js/plugin-auth';
  import { CachePlugin } from '@igniter-js/plugin-cache';

  const igniter = Igniter
    .context<AppContext>()
    .plugins({
      auth: new AuthPlugin({
        secret: process.env.JWT_SECRET,
        expiresIn: '7d'
      }),
      cache: new CachePlugin({
        ttl: 3600
      })
    });
  ```

  **Plugin System:**
  - Plugins can extend context, add middleware, and provide utilities
  - Type-safe plugin configuration and usage
  - Plugins are accessible throughout your application via the context
  - Support for plugin lifecycle hooks and resource management
</Accordion>

<Accordion title=".docs(docsConfig) - Generate API documentation">
  <Field name="docsConfig" type="DocsConfig" required description="Configuration object for OpenAPI documentation and interactive playground." />

  ```typescript
  const igniter = Igniter
    .context<AppContext>()
    .docs({
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0.0',
        description: 'A comprehensive API built with Igniter.js'
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server'
        },
        {
          url: 'http://localhost:3000/v1',
          description: 'Development server'
        }
      ],
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      playground: {
        enabled: true,
        route: '/docs',
        security: (request) => {
          // Custom security check for playground access
          return process.env.NODE_ENV === 'development';
        }
      }
    });
  ```

  **Documentation Features:**
  - Automatic OpenAPI specification generation
  - Interactive API playground (Scalar)
  - Multiple server configurations
  - Security scheme definitions
  - Custom playground access control
</Accordion>

<Accordion title=".create() - Build the final Igniter instance">
  Creates the final Igniter instance with all configured adapters and services.

  ```typescript
  const igniter = Igniter
    .context<AppContext>()
    .middleware([authMiddleware])
    .store(redisAdapter)
    .logger(consoleLogger)
    .jobs(bullmqAdapter)
    .telemetry(openTelemetryProvider)
    .create();
  ```

  **Returns an object with:**
  - `controller` - Function to create controllers
  - `query` - Function to create query actions (GET requests)
  - `mutation` - Function to create mutation actions (POST, PUT, DELETE, PATCH)
  - `procedure` - Function to create reusable procedures and middleware
  - `router` - Function to create nested routers
  - `logger` - Configured logger instance
  - `store` - Configured store instance
  - `jobs` - Configured jobs instance

  **Type Safety:**
  All returned functions are fully typed based on your configuration, providing complete TypeScript inference throughout your application.
</Accordion>

## What's Next?

Now that you have your Igniter instance configured, you can start building your application:

- **[Context](/docs/core-concepts/context)** - Learn how to work with application context
- **[Controllers & Actions](/docs/core-concepts/controllers-and-actions)** - Create your API endpoints
- **[Procedures](/docs/core-concepts/procedures)** - Build reusable middleware and logic

---

### Validation: Ensuring Data Integrity and Business Rules

**Category**: core-concepts
**URL**: /docs/core-concepts/validation

# Validation: Ensuring Data Integrity and Business Rules

In any robust API, validation is a critical, non-negotiable step. It protects your application from invalid data, prevents unexpected errors, and enforces your business rules. Igniter.js treats validation as a first-class citizen and provides a powerful, two-layer approach to handle it cleanly and efficiently.

1. **Schema Validation**: Validating the **shape and type** of incoming data (`body`, `query parameters`).
2. **Business Logic Validation**: Validating **runtime conditions and business rules** (e.g., "does this user have permission?").

## 1. Schema Validation with Zod

For validating the structure of incoming data, Igniter.js has built-in, first-class support for **Zod**. You define a Zod schema for your action's `body` or `query` properties, and Igniter.js handles the rest automatically.

**How it works:**
Before your action's `handler` is ever executed, Igniter.js intercepts the incoming request and validates its body and query parameters against the Zod schemas you provided.

- **On Success:** The data is guaranteed to be valid. TypeScript correctly infers the types, and the parsed, type-safe data is made available to you in `request.body` and `request.query`.
- **On Failure:** The validation fails. Igniter.js immediately halts the request and sends a detailed `400 Bad Request` response to the client, specifying which fields are invalid and why. Your handler is never called.

### Example: Validating a Mutation Body

Let's create a `mutation` to create a new product, with strict validation rules for the request body.

```typescript
import { igniter } from '@/igniter';
import { z } from 'zod';

export const productController = igniter.controller({
  path: '/products',
  actions: {
    create: igniter.mutation({
      path: '/',
      method: 'POST',

      // Define the validation schema for the request body
      body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters long."),
        price: z.number().positive("Price must be a positive number."),
        category: z.enum(['electronics', 'books', 'clothing']),
        stock: z.number().int().nonnegative().default(0),
      }),

      handler: async ({ request, response, context }) => {
        // If the code reaches here, the data is valid.
        // `request.body` is fully typed as:
        // { name: string; price: number; category: "electronics" | "books" | "clothing"; stock: number; }
        const { name, price, category, stock } = request.body;

        const product = await context.database.product.create({
          data: { name, price, category, stock }
        });

        return response.created(product);
      },
    }),
  },
});
```

With this setup, you never have to write `if (!body.name)` or `if (typeof body.price !== 'number')` inside your handler. The framework guarantees data integrity before your logic runs.

## 2. Business Logic Validation with `Ensure`

Schema validation is perfect for checking data shapes, but what about rules that depend on your application's state? For example:

- Does the user with this ID actually exist in the database?
- Does the current user have the 'admin' role?
- Is the product we're trying to add to the cart in stock?

This is where the **Igniter.js Ensure** service comes in. `Ensure` is a utility that provides a clean, declarative, and type-safe way to assert business rules, replacing messy `if/throw` blocks.

### The Problem: Repetitive `if/throw`

Without a utility like `Ensure`, your code can become cluttered with repetitive validation logic:

```typescript
// The "old" way with if/throw
handler: async ({ request, context, response }) => {
  const { productId } = request.body;

  const product = await context.database.product.findUnique({
    where: { id: productId },
  });

  // Repetitive check
  if (!product) {
    // Manually throwing an error
    return response.notFound({ message: `Product with ID ${productId} not found.` });
  }

  const currentUser = context.auth.user;

  // Another repetitive check
  if (currentUser.role !== 'admin') {
    return response.forbidden({ message: 'You do not have permission.' });
  }

  // Now, TypeScript still thinks `product` can be `null` here without extra work.
  // ... rest of the logic
}
```

### The Solution: Declarative Assertions with `Ensure`

The `Ensure` service replaces these blocks with single, readable lines. It also provides powerful type-narrowing.

```typescript
// The "new" way with Ensure
handler: async ({ request, context, response }) => {
  const { productId } = request.body;

  const product = await context.database.product.findUnique({
    where: { id: productId },
  });

  // 1. Assert that the product must exist.
  // If not, it throws a formatted Not Found error automatically.
  context.$plugins.ensure.toBeDefined(product, `Product with ID ${productId} not found.`);
  
  // After this line, TypeScript knows `product` CANNOT be null. Its type is narrowed.

  // 2. Assert a boolean condition is true.
  context.$plugins.ensure.toBeTrue(
    context.auth.user.role === 'admin',
    'You do not have permission to perform this action.' // This throws a Forbidden error.
  );

  // Your business logic is clean and only runs if all assertions pass.
  // ... rest of the logic
}
```

*Note: `Ensure` is typically added as a plugin to be available on the context.*

### Key `Ensure` Methods

| Method                        | Description                                                                                               |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `toBeDefined(value, msg)`     | Ensures a value is not `null` or `undefined`. Narrows the type.                                           |
| `toBeNotEmpty(value, msg)`    | Ensures a string is not empty, `null`, or `undefined`.                                                    |
| `toBeTrue(condition, msg)`    | Ensures a boolean condition is `true`.                                                                    |
| `toBeFalse(condition, msg)`   | Ensures a boolean condition is `false`.                                                                   |
| `toBeOneOf(value, array, msg)`| Checks if a value is present in a given array of options.                                                 |
| `toMatchPattern(val, regex, msg)`| Validates a string against a regular expression.                                                       |

### When to Use Which Validation

- **Use Zod Schemas for:** The **shape and type** of data sent by the client. This is your first line of defense at the entry point of your API.
- **Use `Ensure` for:** **Business rules and runtime conditions** that require access to your application's state (database, user session, etc.) inside your handlers.

By combining these two layers, you can build extremely robust, readable, and maintainable APIs with Igniter.js.

---

## Next Steps

Now that you understand validation in Igniter.js, you can explore:

- [Client-Side Integration](/docs/client-side) - Learn how to consume your validated APIs from the frontend
- [Advanced Features](/docs/advanced-features) - Discover more powerful features of Igniter.js
- [CLI & Tooling](/docs/cli-and-tooling) - Explore the development tools available

---

### Client-Side: Fetching Data with `useQuery`

**Category**: client-side
**URL**: /docs/client-side/use-query

# Client-Side: Fetching Data with `useQuery`

The `useQuery` hook is the primary tool for fetching data from your Igniter.js backend in a client-side React component. It is a **completely custom implementation** built from scratch specifically for Igniter.js, providing a familiar and powerful API with a crucial advantage: it's **end-to-end type-safe**.

This means the parameters you pass to the hook and the data it returns are all automatically typed based on your backend's `AppRouter` definition.

## 1. Basic Usage

To use the hook, you access it through the `api` client you created, following the path to your desired query action: `api.<controllerKey>.<actionKey>.useQuery()`.

**Example: Fetching a list of posts**

```tsx
// app/components/PostsList.tsx
'use client';

import { api } from '@/igniter.client';

function PostsList() {
  // 1. Call the useQuery hook
  const postsQuery = api.posts.list.useQuery();

  // 2. Handle the loading state
  if (postsQuery.isLoading) {
    return <div>Loading posts...</div>;
  }

  // 3. Handle the error state
  if (postsQuery.isError) {
    return <div>Error fetching posts: {postsQuery.error.message}</div>;
  }

  // 4. Render the success state
  // `postsQuery.data` is fully typed based on your backend action's return value.
  return (
    <ul>
      {postsQuery.data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## 2. Passing Parameters

Most queries require parameters to fetch specific data. The `useQuery` hook accepts a configuration object where you can provide `params` (for URL path parameters) and `query` (for URL query parameters).

### `query` Parameters (for filtering, pagination)

If your backend action defines a `query` schema, you can pass matching data here.

**Backend Action:**
```typescript
list: igniter.query({
  path: '/',
  query: z.object({ page: z.number() }),
  // ...
})
```

**Frontend `useQuery` call:**
```tsx
// Pass the page number as a query parameter.
const postsQuery = api.posts.list.useQuery({
  query: { page: 2 }, // This is type-checked!
});
```

### `params` (for dynamic routes)

If your backend action has a dynamic path, you provide the values in the `params` object.

**Backend Action:**
```typescript
getById: igniter.query({
  path: '/:postId', // Dynamic segment
  // ...
})
```

**Frontend `useQuery` call:**
```tsx
const postQuery = api.posts.getById.useQuery({
  // Provide the value for the ':postId' dynamic segment.
  params: { postId: '123' }, // Also type-checked!
});
```

## 3. Key Return Values

The `useQuery` hook returns an object with a rich set of properties to manage the entire lifecycle of a data-fetching request.

| Property      | Description                                                                                                     |
| :------------ | :-------------------------------------------------------------------------------------------------------------- |
| `data`        | The data returned from a successful query. It will be `undefined` until the fetch succeeds.                       |
| `variables`   | The parameters (`query`, `params`) that were used for the most recent query execution.                            |
| `isLoading`   | A boolean that is `true` only during the very first fetch for a query.                                          |
| `isFetching`  | A boolean that is `true` whenever a request is in-flight (including initial load and subsequent refetches).     |
| `isSuccess`   | A boolean that is `true` if the query has completed successfully.                                               |
| `isError`     | A boolean that is `true` if the query has failed.                                                               |
| `error`       | If `isError` is true, this property will contain the error object.                                              |
| `refetch`     | A function you can call to manually trigger a refetch of the query.                                             |
| `status`      | A string representing the query's state: `'loading'`, `'error'`, or `'success'`.                                  |

## 4. Configuration Options

You can customize the behavior of `useQuery` by passing an options object. Here are some of the most common options:

### `enabled`

A boolean to conditionally enable or disable a query. If `false`, the query will not run automatically. This is useful for dependent queries (e.g., fetching a user's profile only after you have their ID).

```tsx
const session = useUserSession();

const userProfileQuery = api.users.getProfile.useQuery({
  // Only run this query if we have a valid session and user ID.
  enabled: !!session.isAuthenticated && !!session.userId,
});
```

### `staleTime`

The time in milliseconds that query data is considered "fresh". As long as data is fresh, it will be served from the cache without a network request. After `staleTime` has passed, the data is considered "stale" and will be refetched in the background on the next render.

- **Type:** `number`
- **Default:** `0` (data is considered stale immediately)

```tsx
// Consider this data fresh for 5 minutes (300,000 ms)
const query = api.users.list.useQuery({
  staleTime: 1000 * 60 * 5,
});
```

### `refetchInterval`

If set to a number, the query will automatically refetch at that interval in milliseconds. This is useful for polling data that changes frequently.

- **Type:** `number | false`
- **Default:** `false`

```tsx
// Refetch this data every 30 seconds
const query = api.system.status.useQuery({
  refetchInterval: 30000,
});
```

### `refetchOnWindowFocus`

If `true`, the query will automatically refetch whenever the browser window regains focus. This is a great way to ensure data is up-to-date when a user returns to your application.

- **Type:** `boolean`
- **Default:** `true`

---

## 5. Lifecycle Callbacks

You can execute side effects based on the query's result using callback functions.

| Callback        | Description                                                               |
| :-------------- | :------------------------------------------------------------------------ |
| `onSuccess(data)` | A function that is called if the query succeeds. It receives the `data`.  |
| `onError(error)`  | A function that is called if the query fails. It receives the `error`.    |
| `onSettled(data, error)` | A function that is called when the query finishes, whether it succeeded or failed. |

**Example:**

```tsx
const userQuery = api.users.getById.useQuery({
  params: { id: userId },
  onSuccess: (data) => {
    // This runs only on success
    console.log(`Successfully fetched user: ${data.user.name}`);
    // You could trigger another action here, like sending an analytics event.
  },
  onError: (error) => {
    // This runs only on failure
    console.error(`Failed to fetch user: ${error.message}`);
    // You could show a toast notification here.
  }
});
```

By mastering these options, you can fine-tune your data-fetching logic to create a highly performant and responsive user experience.

---

## Next Steps

Now that you know how to fetch data, the next step is to learn how to modify it:

- [useMutation](/docs/client-side/use-mutation) - Learn how to modify data with mutations
- [useRealtime](/docs/client-side/use-realtime) - Explore real-time features and data streams
- [API Client](/docs/client-side/api-client) - Understand the type-safe client architecture

---

### Client-Side: Modifying Data with `useMutation`

**Category**: client-side
**URL**: /docs/client-side/use-mutation

# Client-Side: Modifying Data with `useMutation`

While `useQuery` is for fetching data, **`useMutation`** is the hook you'll use for any action that modifies data on the server. This includes creating, updating, and deleting resources, corresponding to backend actions that use `POST`, `PUT`, `PATCH`, or `DELETE` methods.

The `useMutation` hook, accessed via `api.<controllerKey>.<actionKey>.useMutation()`, provides a simple and declarative API to handle the entire lifecycle of a data modification, from optimistic updates to error handling and cache invalidation.

## 1. Basic Usage

A `useMutation` hook provides you with a `mutate` function (or `mutateAsync` for a promise-based version) that you can call to trigger the mutation.

**Example: A "Create Post" Form**

```tsx
// app/components/CreatePostForm.tsx
'use client';

import { api } from '@/igniter.client';
import { useState } from 'react';

function CreatePostForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 1. Initialize the mutation hook
  const createPostMutation = api.posts.create.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 2. Call the `mutate` function with the required input
    // The `body` object is fully type-safe based on your backend Zod schema.
    createPostMutation.mutate({
      body: { title, content },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form inputs for title and content ... */}

      {/* 3. Use the `isLoading` state for UI feedback */}
      <button type="submit" disabled={createPostMutation.isLoading}>
        {createPostMutation.isLoading ? 'Creating Post...' : 'Create Post'}
      </button>

      {createPostMutation.isError && (
        <p style={{ color: 'red' }}>
          Error: {createPostMutation.error.message}
        </p>
      )}
    </form>
  );
}
```

## 2. Key Return Values

The `useMutation` hook returns an object with properties to manage the mutation's state:

| Property    | Description                                                                                              |
| :---------- | :------------------------------------------------------------------------------------------------------- |
| `mutate`    | A function to trigger the mutation. It takes one argument: an object with `body`, `query`, or `params`.    |
| `data`      | The data returned from your backend action handler upon a successful mutation. It is `undefined` until the mutation succeeds. |
| `variables` | The variables (`body`, `query`, `params`) passed to the most recent `mutate` call. It is `undefined` until the mutation is called. |
| `isLoading` | A boolean that is `true` while the mutation is in flight.                                                |
| `isSuccess` | A boolean that is `true` if the mutation completed successfully.                                         |
| `isError`   | A boolean that is `true` if the mutation failed.                                                         |
| `error`     | If `isError` is true, this property will contain the error object.                                       |
| `retry`     | A function to re-run the last mutation with the same variables.                                          |
| `status`    | A string representing the mutation's state: `'loading'`, `'error'`, or `'success'`.                        |

---

## 3. Lifecycle Callbacks

To handle side effects like showing notifications or redirecting the user, `useMutation` accepts an options object with callback functions.

| Callback             | Description                                                                                             |
| :------------------- | :------------------------------------------------------------------------------------------------------ |
| `onSuccess(data)`    | Runs if the mutation is successful. Receives the `data` from the server.                                  |
| `onError(error)`     | Runs if the mutation fails. Receives the `error` object.                                                  |
| `onSettled(data, error)` | Runs when the mutation finishes, regardless of whether it succeeded or failed. Receives data and error. |

**Example: Showing Notifications on Success or Failure**

```tsx
const createPostMutation = api.posts.create.useMutation({
    onSuccess: (data) => {
      // `data` is the response from the backend action
      console.log(`Successfully created post with ID: ${data.post.id}`);
      // showSuccessToast('Post created!');
    },
    onError: (error) => {
      console.error(`Failed to create post: ${error.message}`);
      // showErrorToast(error.message);
    },
    onSettled: () => {
      // This runs after either onSuccess or onError
      console.log('Mutation has settled.');
    }
});
```

---

## 4. The Most Important Pattern: Cache Invalidation

After a mutation successfully modifies data on the server, your client-side cache is now out-of-date. For example, after creating a new post, your list of posts is incomplete.

The best practice is to **invalidate** the relevant queries in the `onSuccess` callback. This tells Igniter.js to automatically refetch that data, ensuring your UI always reflects the latest state.

To do this, you use the `useQueryClient` hook.

**Example: Refetching the Post List After Creation**

```tsx
'use client';

import { api, useQueryClient } from '@/igniter.client';

function CreatePostForm() {
  // 1. Get an instance of the query client
  const queryClient = useQueryClient();

  const createPostMutation = api.posts.create.useMutation({
    onSuccess: () => {
      console.log('Post created, invalidating post list...');
      // 2. Invalidate the 'posts.list' query.
      // This will cause any component using `api.posts.list.useQuery()` to refetch.
      queryClient.invalidate(['posts.list']);
    },
    // ... onError handling
  });

  const handleSubmit = (e) => {
    // ...
    createPostMutation.mutate({ body: { ... } });
  };
  
  // ... rest of the form
}
```

This pattern is fundamental to building modern, reactive web applications. It ensures that the user's actions are immediately reflected in the UI without needing complex manual state management.

If you are using **Igniter.js Realtime**, you can often skip manual invalidation and use server-side `.revalidate()` for a more powerful, automated approach.

---

## Next Steps

- [useRealtime](/docs/client-side/use-realtime) - Learn about real-time features and automatic cache invalidation
- [useQuery](/docs/client-side/use-query) - Understand how to fetch data with type safety
- [API Client](/docs/client-side/api-client) - Explore the type-safe client architecture

---

### Client-Side: Subscribing with `useRealtime`

**Category**: client-side
**URL**: /docs/client-side/use-realtime

# Client-Side: Subscribing with `useRealtime`

For features that require a persistent, real-time flow of data from the server—like live notifications, chat applications, or activity feeds—Igniter.js provides the **`useRealtime`** hook.

Unlike `useQuery`, which fetches data once and then caches it, `useRealtime` establishes a continuous subscription to a specific backend channel. It listens for messages pushed by the server and provides callbacks to react to them as they arrive.

## Backend Prerequisite

The `useRealtime` hook can only be used with backend `query` actions that have been explicitly marked as streamable by setting the `stream: true` option.

```typescript
// In your backend controller
export const notificationController = igniter.controller({
  path: '/notifications',
  actions: {
    stream: igniter.query({
      path: '/stream',
      // This property is required for useRealtime to work.
      stream: true,
      handler: async ({ response }) => {
        // This handler runs once when the client first connects.
        return response.success({ status: 'Connected' });
      }
    })
  }
});
```
This creates a dedicated real-time channel named `notifications.stream`.

---

## 1. Basic Usage

To subscribe to a stream, you access the hook via your `api` client and provide an `onMessage` callback to handle incoming data.

**Example: A Live Notification Feed**

```tsx
'use client';

import { api } from '@/igniter.client';
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  text: string;
}

function NotificationFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 1. Subscribe to the stream
  api.notifications.stream.useRealtime({
    // 2. This callback runs for every message sent by the server
    onMessage: (newNotification: Notification) => {
      console.log('New notification received:', newNotification);
      setNotifications((currentNotifications) => [
        newNotification,
        ...currentNotifications,
      ]);
    },
  });

  return (
    <div>
      <h3>Live Notifications</h3>
      <ul>
        {notifications.map((notif) => (
          <li key={notif.id}>{notif.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 2. Configuration Options (`RealtimeActionCallerOptions`)

You can customize the behavior of the stream by passing an options object to the `useRealtime` hook.

| Option                 | Description                                                                                       |
| :--------------------- | :------------------------------------------------------------------------------------------------ |
| `onMessage`            | **(Required)** A callback function that runs every time a new message is received from the server.      |
| `onConnect`            | A callback that runs once when the stream successfully connects to the server.                    |
| `onDisconnect`         | A callback that runs if the stream connection is lost.                                            |
| `onError`              | A callback that runs if an error occurs with the connection.                                      |
| `initialData`          | Provides an initial value for the `data` state before the first message arrives.                  |
| `initialParams`        | An object with `query` or `params` to initialize the stream connection.                           |
| `autoReconnect`        | If `true`, the client will automatically attempt to reconnect if the connection drops. (Default: `true`) |
| `maxReconnectAttempts` | The maximum number of times to try reconnecting.                                                  |
| `reconnectDelay`       | The delay in milliseconds between reconnection attempts.                                          |

**Example with more options:**

```tsx
api.activity.feed.useRealtime({
  initialParams: { query: { filter: 'all' } },
  onConnect: () => {
    showToast('Connected to activity feed!');
  },
  onMessage: (activity) => {
    addActivityToList(activity);
  },
  onError: (error) => {
    console.error('Stream connection error:', error);
    showErrorToast('Could not connect to live feed.');
  }
});
```

---

## 3. Return Values (`RealtimeActionCallerResult`)

The `useRealtime` hook returns an object with properties and functions to interact with the stream's state.

| Property         | Description                                                                     |
| :--------------- | :------------------------------------------------------------------------------ |
| `data`           | The most recent message received from the stream.                               |
| `isConnected`    | A boolean indicating if the stream is currently connected.                      |
| `isReconnecting` | A boolean indicating if the client is currently attempting to reconnect.        |
| `error`          | The last error object, if any.                                                  |
| `disconnect()`   | A function to manually close the stream connection.                             |
| `reconnect()`    | A function to manually attempt to reconnect a disconnected stream.              |

**Example: Displaying connection status and manual controls**

```tsx
function StreamControls() {
  const { isConnected, isReconnecting, disconnect, reconnect } = api.logs.stream.useRealtime({
    onMessage: (log) => console.log(log),
  });

  if (isReconnecting) {
    return <p>Connection lost. Reconnecting...</p>;
  }

  return (
    <div>
      <p>Stream Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </button>
      <button onClick={reconnect} disabled={isConnected}>
        Reconnect
      </button>
    </div>
  );
}
```

By combining these options and return values, `useRealtime` provides a complete and robust solution for building rich, real-time user experiences with Igniter.js.

---

## Next Steps

- [API Client](/docs/client-side/api-client) - Understand the type-safe client architecture
- [IgniterProvider](/docs/client-side/igniter-provider) - Learn about the provider setup for real-time features
- [Realtime](/docs/advanced-features/realtime) - Explore advanced real-time features on the backend

---

### Client-Side: The `<IgniterProvider>`

**Category**: client-side
**URL**: /docs/client-side/igniter-provider

# Client-Side: The `<IgniterProvider>`

The `<IgniterProvider>` is the root component that powers the entire Igniter.js client-side experience. It is a mandatory wrapper that must be placed at the root of your React application tree.

Its primary responsibilities are:

1. **Query Cache Management:** It initializes and provides the cache for all API queries. The client-side implementation is a **completely custom solution** built from scratch specifically for Igniter.js. This enables automatic caching, re-fetching, and state management for hooks like `useQuery` and `useMutation`.
2. **Realtime Connection:** It manages the persistent Server-Sent Events (SSE) connection to your backend, which is essential for `Igniter.js Realtime` features like automatic revalidation and custom data streams.
3. **Client Context:** It holds the client-side context, such as the current user's session, making it available for features like scoped real-time updates.

> **Important:** None of the client-side hooks (`useQuery`, `useMutation`, `useStream`) will work unless they are descendants of an `<IgniterProvider>`.

## 1. Basic Setup

The provider should be placed as high up in your component tree as possible, typically in your root layout file. In a Next.js App Router application, this is often done in a dedicated `app/providers.tsx` file.

**Example: Setting up the provider**

```tsx
// app/providers.tsx
'use client';

import { IgniterProvider } from '@igniter-js/core/client';
import type { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IgniterProvider>
      {children}
    </IgniterProvider>
  );
}
```

Then, use this `Providers` component in your root `layout.tsx`:

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 2. Configuration Props

The `<IgniterProvider>` accepts several optional props to configure its behavior, especially for real-time features.

### `enableRealtime`

Controls whether the real-time SSE client is enabled. It defaults to `true`.

- **Type:** `boolean`
- **Default:** `true`

```tsx
<IgniterProvider enableRealtime={false}>
  {/* Realtime features like .revalidate() and useStream will be disabled. */}
</IgniterProvider>
```

### `autoReconnect`

If the SSE connection is lost, this prop determines whether the client will automatically try to reconnect.

- **Type:** `boolean`
- **Default:** `true`

```tsx
<IgniterProvider autoReconnect={false}>
  {/* The client will not attempt to reconnect if the connection drops. */}
</IgniterProvider>
```

---

## 3. Scoped Realtime with `getContext` and `getScopes`

For **scoped revalidation** to work, you must configure the `getContext` and `getScopes` props. This tells the provider which "channels" or "topics" the current client is interested in.

### `getContext`

A function that returns an object representing the client-side context. This is typically where you provide information about the currently logged-in user.

- **Type:** `() => TContext`
- **Purpose:** To provide data that can be used by other provider props, like `getScopes`.

### `getScopes`

A function that receives the client context (from `getContext`) and returns an array of string identifiers. These strings are the "scopes" that this client will subscribe to for real-time updates.

- **Type:** `(context: TContext) => string[]`
- **Purpose:** To subscribe the client to specific real-time channels.

**Example: A complete setup for a logged-in user**

```tsx
// app/providers.tsx
import { IgniterProvider } from '@igniter-js/core/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IgniterProvider
      // 2. Use the context to determine which scopes to subscribe to.
      getScopes={() => {
        'use server'
        const session = await getSession()

        if (!session) {
          // If no user is logged in, subscribe to no specific scopes.
          return [];
        }

        // Subscribe the client to a scope for their user ID and for each of their roles.
        return [
          `user:${session.user.id}`,
          ...session.user.roles.map(role => `role:${role}`)
        ];
      }}
    >
      {children}
    </IgniterProvider>
  );
}
```

With this configuration, the client is now set up to receive targeted real-time updates. When a backend mutation calls `.revalidate(['some-key'], (ctx) => ['user:123'])`, only the client whose user ID is `123` will receive the revalidation event.

---

## Next Steps

Now that your application is wrapped in the provider, you're ready to start fetching and modifying data:

- [useQuery](/docs/client-side/use-query) - Learn how to fetch data with type safety
- [useMutation](/docs/client-side/use-mutation) - Discover how to perform mutations safely
- [useRealtime](/docs/client-side/use-realtime) - Explore real-time features and data streams

---

### Client-Side: The Type-Safe API Client

**Category**: client-side
**URL**: /docs/client-side/api-client

# Client-Side: The Type-Safe API Client

The **Igniter.js API Client** is a fully type-safe SDK that is automatically generated from your backend's `AppRouter` definition. It's the bridge that connects your frontend application to your backend API, providing an exceptional developer experience with end-to-end type safety.

This means no more manual type definitions for your API responses, no more guesswork about what parameters an endpoint expects, and no more out-of-sync frontend and backend code. If your backend API changes, TypeScript will immediately notify you of any errors in your frontend code that consumes it.

## 1. Creating the API Client

The client is typically defined once in `src/igniter.client.ts`. It uses the `createIgniterClient` factory function from `@igniter-js/core/client`.

```typescript
// src/igniter.client.ts
import { createIgniterClient, useIgniterQueryClient } from '@igniter-js/core/client';
// This is a TYPE-ONLY import. No server code is bundled.
import type { AppRouter } from './igniter.router';

/**
 * Type-safe API client generated from your Igniter router.
 * This is the main object you will use to interact with your API.
 */
export const api = createIgniterClient<AppRouter>({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  basePath: process.env.NEXT_PUBLIC_APP_BASE_PATH || '/api/v1',

  /**
   * This function dynamically provides the router definition.
   * - On the server (e.g., in Server Components), it returns the full router instance.
   * - On the client (browser), it returns only the router's schema,
   *   which contains the API structure without any server-side logic.
   */
  router: () => {
    if (typeof window === 'undefined') {
      // Server-side: Use the full router for direct function calls.
      return require('./igniter.router').AppRouter;
    }

    // Client-side: Use the lightweight schema for fetching.
    return require('./igniter.schema').AppRouterSchema;
  },
});

/**
 * A utility type to infer the type of the API client.
 * Useful for passing the client as props.
 */
export type ApiClient = typeof api;

/**
 * A type-safe hook to get the query client instance.
 * Used for advanced cache manipulation, like manual invalidation.
 */
export const useQueryClient = useIgniterQueryClient<AppRouter>();
```

---

## 2. Understanding the Client's Anatomy

### `createIgniterClient<AppRouter>()`

This is the factory function that builds your client. The crucial part is passing your `AppRouter` type as a generic argument: `createIgniterClient<AppRouter>()`. This is what gives the client its "knowledge" of your API's structure, including all controllers, actions, input schemas, and output types.

### The `import type` Statement

```typescript
import type { AppRouter } from './igniter.router';
```

This is one of the most important lines. By using `import type`, we are telling TypeScript to only import the *type definition* of `AppRouter`, not the actual implementation code. This ensures that none of your backend server code (database connections, private logic, etc.) is ever accidentally bundled and sent to the client's browser.

### The Dynamic `router` Function

The `router` property in the configuration is designed for **universal applications** (like Next.js) where code can run on both the server and the client.

- `if (typeof window === 'undefined')`: This checks if the code is running in a Node.js environment (the server). If so, it `require`s the full `igniter.router`, allowing for direct, high-performance function calls without an HTTP round-trip. This is perfect for React Server Components (RSC) or server-side rendering (SSR).
- `else`: If the code is running in a browser (`window` exists), it `require`s the `igniter.schema`. This is a lightweight JSON object containing only the API structure, which is used by the client to make actual HTTP requests.

---

## 3. How to Use the `api` Client

The exported `api` object is your gateway to all backend operations. It mirrors the structure of your `AppRouter`.

### In Client Components (React)

In client-side components, you use the React hooks attached to each action.

```tsx
'use client';
import { api } from '@/igniter.client';

function UserProfile({ userId }: { userId: string }) {
  // Access the query via `api.controllerKey.actionKey.useQuery()`
  const userQuery = api.users.getById.useQuery({
    params: { id: userId }, // Type-safe parameters
  });

  if (userQuery.isLoading) return <p>Loading...</p>;

  // `userQuery.data` is fully typed based on your backend action's return type.
  return <h1>{userQuery.data?.user.name}</h1>;
}
```

### In Server Components or Server Actions

On the server, you can call the action's `.query()` or `.mutate()` method directly. This bypasses the HTTP layer for maximum performance.

```tsx
// app/users/[id]/page.tsx (React Server Component)
import { api } from '@/igniter.client';

export default async function UserPage({ params }: { params: { id: string } }) {
  // Call the action directly. No hook is needed.
  // The call is type-safe.
  const response = await api.users.getById.query({
    params: { id: params.id },
  });

  // The `response` object is also fully typed.
  const user = response.user;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

This unified API client allows you to write data-fetching logic in a consistent way, whether you are on the server or the client, all with the guarantee of end-to-end type safety.

---

## Next Steps

Now that you have a type-safe client, the next step is to provide it to your React application so the hooks can work:

- [IgniterProvider](/docs/client-side/igniter-provider) - Learn how to set up the provider for React hooks
- [useQuery](/docs/client-side/use-query) - Discover how to fetch data with type safety
- [useMutation](/docs/client-side/use-mutation) - Learn how to perform mutations safely

---

### Full-Stack Guide: Building a High-Performance SPA with Bun, React, and Igniter.js

**Category**: starter-guides
**URL**: /docs/starter-guides/bun-react-starter-guide

# Full-Stack Guide: Building a High-Performance SPA with Bun, React, and Igniter.js

Welcome to the comprehensive guide for the Igniter.js Bun + React Starter. This document will take you on a journey to build an ultra-fast, modern, and fully type-safe Single Page Application (SPA). We'll harness the incredible speed of Bun as our server, runtime, and bundler, and pair it with the robust, type-safe API capabilities of Igniter.js.

This starter is for developers who want to build a classic client-rendered React SPA but with a next-generation toolchain that offers unparalleled performance and a simplified, all-in-one developer experience.

---

## 1. Core Philosophy: Speed, Simplicity, and Safety

This starter is built on three core principles, each enabled by its key technologies.

### 1.1. Speed and Simplicity with Bun
Bun is the star of the show in this starter. It's a new, incredibly fast JavaScript runtime designed from the ground up for performance. In this project, Bun serves multiple roles, simplifying the toolchain significantly:
-   **Runtime**: It executes your server-side TypeScript code.
-   **Server**: We use Bun's native, high-performance `Bun.serve` API to handle HTTP requests.
-   **Bundler**: Bun's built-in bundler is used to package our React frontend for the browser.
-   **Package Manager**: Bun can be used as a drop-in replacement for `npm`, offering much faster dependency installation.

This all-in-one approach reduces configuration overhead and provides a cohesive, lightning-fast development experience.

### 1.2. A Robust SPA Architecture
This starter implements a classic, robust Single Page Application architecture.
-   The **Bun server** has two jobs: serve the static `index.html` file (the shell for our React app) for any non-API routes, and handle all API requests under the `/api/v1/*` path.
-   The **React frontend** is a pure client-side application. Once loaded, it takes over routing and rendering in the browser, communicating with the backend via type-safe API calls.
-   **Igniter.js** provides the entire backend API layer, bringing structure, scalability, and its signature end-to-end type safety to the project.

### 1.3. End-to-End Type Safety
Just like in other Igniter.js starters, this is a non-negotiable feature. Igniter.js generates a type-safe client based on your API controllers. Your React application imports this client, giving you full IntelliSense and compile-time guarantees that your frontend and backend are always in sync.

---

## 2. Getting Started: From Zero to Running App

Let's get the project installed and take a tour.

### Prerequisites
-   Bun (v1.0 or higher)
-   Docker and Docker Compose (for the database and Redis)

### Installation and Setup
1.  **Initialize the Project**: Use the Igniter.js CLI to scaffold a new project.
    ```bash
    npx @igniter-js/cli init my-bun-app
    ```
    When prompted, select **Bun + React** as your framework. Make sure to enable the **Store (Redis)** and **Queues (BullMQ)** features to get the full experience.

2.  **Configure Environment**: `cd my-bun-app`. Rename `.env.example` to `.env`. The default URLs should work correctly with the Docker setup.

3.  **Start Services**: Launch the PostgreSQL database and Redis instance.
    ```bash
    docker-compose up -d
    ```

4.  **Install & Sync DB**: Use Bun to install dependencies (it's much faster!) and then apply the Prisma schema.
    ```bash
    bun install
    bunx prisma db push
    ```

5.  **Run the Dev Server**:
    ```bash
    bun run dev
    ```
    This command starts the `igniter dev` process, which in turn runs the Bun server with file-watching and hot-reloading enabled for both the backend and the React frontend.

### Project Structure Deep Dive
The project structure is clean and organized for a full-stack SPA.

```
my-bun-app/
├── public/
│   └── index.html              # << The HTML shell for the React SPA
├── src/
│   ├── app/                      # React page components
│   ├── components/               # Shared React components
│   ├── features/                 # << Your application's business logic
│   ├── services/                 # Service initializations
│   ├── index.tsx                 # << Unified Server & Client Entry Point
│   ├── igniter.ts                # Core Igniter.js initialization
│   ├── igniter.client.ts         # << Auto-generated Type-Safe Client
│   └── igniter.router.ts         # Main application router
└── prisma/
    └── schema.prisma
```

-   **`src/index.tsx`**: This is the most unique file in this starter. It acts as the **unified entry point for both the server and the client**.
    -   When run by Bun (on the server), it executes the `Bun.serve` block, which starts the HTTP server. This server inspects incoming request URLs. If the URL starts with `/api/v1/`, it passes the request to the Igniter.js router. Otherwise, it serves the `public/index.html` file.
    -   When this file is processed by the bundler for the client, it ignores the server block and instead executes the React rendering logic (`ReactDOM.createRoot...`), mounting the main React component into the DOM.
-   **`public/index.html`**: The static HTML file that serves as the foundation for your React application. The bundled JavaScript will be injected into this file.
-   **`src/app/`**: Contains the top-level React components that act as "pages" in your SPA.
-   **`igniter.ts`, `igniter.router.ts`, `features/`**: These form the core of your backend, responsible for configuring Igniter.js, defining the API's shape, and housing all your business logic.
-   **`igniter.client.ts`**: The auto-generated, type-safe client that provides the React hooks (`.useQuery()`, `.useMutation()`) your SPA will use to communicate with the backend.

---

## 3. Building Our First Feature: A "Journal" API

Let's build a simple daily journal application.

### Step 1: Define the Schema
Open `prisma/schema.prisma` and add a `JournalEntry` model.

```prisma
// prisma/schema.prisma
model JournalEntry {
  id        String   @id @default(cuid())
  content   String
  mood      String   // e.g., "Happy", "Sad", "Productive"
  createdAt DateTime @default(now())
}
```

### Step 2: Apply Database Changes
Run `bunx prisma db push` to create the `JournalEntry` table.
```bash
bunx prisma db push
```

### Step 3: Scaffold the Feature with the CLI
Use the `igniter generate` command to create the backend files automatically.
```bash
bunx @igniter-js/cli generate feature journalEntries --schema prisma:JournalEntry
```
This command generates the controller, procedures, and Zod interfaces for your `JournalEntry` feature inside `src/features/journalEntries/`.

### Step 4: Register the Controller
Open `src/igniter.router.ts` and register the new `journalEntriesController`.

```typescript
// src/igniter.router.ts
import { igniter } from '@/igniter';
import { exampleController } from '@/features/example';
// 1. Import the new controller
import { journalEntriesController } from '@/features/journalEntries';

export const AppRouter = igniter.router({
  controllers: {
    example: exampleController,
    // 2. Register it
    journalEntries: journalEntriesController,
  },
});

export type AppRouter = typeof AppRouter;
```
When you save this, the dev server will regenerate `igniter.client.ts`. The `api.journalEntries` client is now ready to be used by your React app.

---

## 4. Building the Frontend React SPA

Now, let's build the UI for our journal.

### Displaying Journal Entries
We'll create a component to fetch and display all entries.

Create a new file at `src/features/journalEntries/presentation/components/JournalFeed.tsx`:

```tsx
// src/features/journalEntries/presentation/components/JournalFeed.tsx
import { api } from '@/igniter.client';

export function JournalFeed() {
  // Use the auto-generated hook to fetch data.
  const { data, isLoading, error } = api.journalEntries.list.useQuery();

  if (isLoading) return <p>Loading journal...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="space-y-4">
      {data?.journalEntries.map((entry) => (
        <div key={entry.id} className="p-4 border rounded-lg bg-white shadow">
          <p>{entry.content}</p>
          <div className="text-sm text-gray-500 mt-2">
            <span>Mood: {entry.mood}</span> | <span>{new Date(entry.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Creating an Entry Form
Now for the form to add new entries.

Create a new file at `src/features/journalEntries/presentation/components/CreateEntryForm.tsx`:

```tsx
// src/features/journalEntries/presentation/components/CreateEntryForm.tsx
import { api } from '@/igniter.client';
import { useState } from 'react';

export function CreateEntryForm() {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Productive');
  const createEntryMutation = api.journalEntries.create.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createEntryMutation.mutate({ body: { content, mood } }, {
      onSuccess: () => {
        setContent('');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-100 mb-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-2 border rounded"
        rows={3}
        disabled={createEntryMutation.isPending}
      />
      <div className="flex items-center justify-between mt-2">
        <select value={mood} onChange={(e) => setMood(e.target.value)} className="p-2 border rounded">
          <option>Productive</option>
          <option>Happy</option>
          <option>Neutral</option>
          <option>Sad</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400" disabled={createEntryMutation.isPending}>
          {createEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}
```

### Assembling the Main Page
Finally, let's put these components together on our main application page. Open `src/app/Home.tsx` and replace its content:

```tsx
// src/app/Home.tsx
import { CreateEntryForm } from '@/features/journalEntries/presentation/components/CreateEntryForm';
import { JournalFeed } from '@/features/journalEntries/presentation/components/JournalFeed';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 sm:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">My Daily Journal</h1>
          <p className="text-lg text-gray-600">A simple journal built with Bun, React, and Igniter.js</p>
        </header>
        <CreateEntryForm />
        <JournalFeed />
      </main>
    </div>
  );
}
```

Your app is now functional! You can add journal entries, but you have to refresh the page to see them in the feed. Let's enable real-time updates.

---

## 5. Automatic Real-Time Updates

Igniter.js makes real-time functionality incredibly simple.

### Step 1: Make the `list` Query "Live"
In your backend controller at `src/features/journalEntries/controllers/journalEntries.controller.ts`, add the `stream: true` flag to the `list` action.

```typescript
// ... inside journalEntriesController
list: igniter.query({
  path: '/',
  stream: true, // This enables real-time updates for the feed
  handler: async ({ context, response }) => {
    const journalEntries = await context.database.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return response.success({ journalEntries });
  },
}),
```

### Step 2: Trigger the Update from the `create` Mutation
In the same file, chain `.revalidate()` to the `create` mutation's response. This tells Igniter.js which live query to update.

```typescript
// ... inside journalEntriesController
create: igniter.mutation({
  path: '/',
  method: 'POST',
  body: CreateJournalEntryInputSchema,
  handler: async ({ context, response, body }) => {
    const entry = await context.database.journalEntry.create({ data: body });
    // This response returns the new entry AND tells all clients
    // to update their 'journalEntries.list' query.
    return response.created({ journalEntry: entry }).revalidate('journalEntries.list');
  },
}),
```

### Step 3: Witness the Magic
**No frontend changes are needed.** Go back to your application. Open it in two browser windows. When you create a new entry in one window, the feed in **both** windows will update instantly. This powerful, reactive experience is achieved with just two small changes to your backend code.

---

## 6. Conclusion

You have now built a high-performance, full-stack, type-safe Single Page Application using a truly modern toolchain. The combination of Bun's speed, React's component model, and Igniter.js's structured, safe API layer creates a development experience that is both productive and enjoyable.

In this guide, we covered:
-   The philosophy of using Bun as an all-in-one tool to simplify development.
-   The structure of a unified Bun server that handles both API requests and serves a React SPA.
-   Using the Igniter.js CLI to rapidly scaffold a complete backend feature from a database schema.
-   Building a client-side React application that consumes the API via fully-typed hooks.
-   Implementing seamless, automatic real-time UI updates with `stream: true` and `.revalidate()`.

The Bun + React starter is a testament to how modern tools can create applications that are not only fast for the user but also fast to develop and easy to maintain. Happy coding!

---

### Full-Stack Guide: Building with the Igniter.js Next.js Starter

**Category**: starter-guides
**URL**: /docs/starter-guides/nextjs-starter-guide

# Full-Stack Guide: Building with the Igniter.js Next.js Starter

Welcome to the comprehensive guide for the Igniter.js Next.js starter. This document provides a deep dive into building a modern, feature-complete, and end-to-end type-safe full-stack application. We will go from project initialization to deploying advanced features like real-time data synchronization and background job processing.

This guide is designed for developers who have some familiarity with React and Next.js. Our goal is not just to show you *what* to do, but to explain *why* this stack provides a superior developer experience and results in more robust, maintainable applications.

By the end of this tutorial, you will have built a functional "Posts" feature, complete with a database, a type-safe API, a React frontend, and real-time capabilities.

---

## 1. The Core Philosophy: Why This Stack?

Before we write a single line of code, it's crucial to understand the philosophy behind combining Next.js with Igniter.js. This isn't just about using two popular technologies; it's about leveraging their synergy to solve common full-stack development challenges.

### End-to-End Type Safety

This is the cornerstone of the Igniter.js philosophy. In a typical full-stack setup, the frontend and backend are often loosely connected. A change in an API endpoint on the backend can silently break the frontend, and you might not notice until runtime.

Igniter.js solves this by creating a **single source of truth**: your API router (`src/igniter.router.ts`). By introspecting this router, Igniter.js automatically generates a type-safe client (`src/igniter.client.ts`). This client exports fully-typed functions and React hooks that your Next.js components can import.

The result?
- If you change a backend endpoint's input, output, or path, TypeScript will immediately throw an error in any frontend component that uses it incorrectly.
- You get full IntelliSense and autocompletion for API calls on the frontend.
- You eliminate an entire class of common bugs related to API contract mismatches.

### A Simplified Backend-for-Frontend (BFF) Pattern

The Next.js App Router paradigm encourages co-locating data-fetching logic with the components that use it. While powerful, this can sometimes lead to scattered business logic and database queries throughout your UI code.

Igniter.js provides a clean, structured API layer that acts as a Backend-for-Frontend (BFF). It lives inside your Next.js project but maintains a clear separation of concerns. Your API logic (controllers, procedures, database interactions) is neatly organized within the `src/features` directory, completely decoupled from your React components. This makes your application easier to reason about, test, and scale.

### Harmony with Server and Client Components

The generated Igniter.js client is **isomorphic**, meaning it works seamlessly in any Next.js rendering environment:

- **In React Server Components (RSCs)**: You can directly `await` API calls. The data is fetched on the server during the rendering process, resulting in zero client-side JavaScript for data fetching and a faster initial page load.
- **In Client Components (`'use client'`)**: You use the provided React hooks (`.useQuery()`, `.useMutation()`). These hooks are a custom implementation that manages all the complexities of client-side data fetching, caching, revalidation, and loading/error states.

This flexibility allows you to choose the best rendering strategy for each part of your application without changing your API interaction patterns.

---

## 2. Getting Started: Setup and Project Tour

Let's get the project up and running.

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose (for running the database and Redis)

### Installation and Setup

1. **Initialize the Project**: Open your terminal and use the Igniter.js CLI to scaffold a new Next.js project.
   ```bash
   npx @igniter-js/cli init my-next-app
   ```
   The CLI will guide you through the setup, asking you to select Next.js as your framework and which features (like Store and Queues) you'd like to include. For this guide, enable both.

2. **Configure Environment Variables**: Navigate into your new project directory (`cd my-next-app`). You'll find a `.env.example` file. Rename it to `.env` and review the contents. The default values are typically configured to work with the provided Docker setup.
   ```env
   # .env
   DATABASE_URL="postgresql://user:password@localhost:5432/igniter-db?schema=public"
   REDIS_URL="redis://localhost:6379"
   # ... other variables
   ```

3. **Start Background Services**: Run the following command to start the PostgreSQL database and Redis server in the background.
   ```bash
   docker-compose up -d
   ```

4. **Install Dependencies and Sync Database**:
   ```bash
   # Install all required npm packages
   npm install

   # Push the Prisma schema to the newly created database
   npx prisma db push
   ```
   The `prisma db push` command reads your `prisma/schema.prisma` file and configures your database tables accordingly.

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   This command starts the `igniter dev --interactive` process. This is a powerful, terminal-based dashboard that manages multiple processes for you: the Next.js development server and the Igniter.js file watcher that handles auto-regeneration of the type-safe client. You get a unified view of your entire stack's logs and status.

### Project Structure Deep Dive

Let's take a tour of the key files and directories:

- `src/app/api/[[...all]]/route.ts`: This is the **single entry point** for your entire Igniter.js API. It's a Next.js catch-all route handler. It uses the `nextRouteHandlerAdapter` to translate incoming Next.js requests into a format Igniter.js understands, and vice-versa for responses. You will likely never need to touch this file.

- `src/igniter.ts`: The heart of your backend. Here, you create the main `igniter` instance using the builder pattern. This is where you register global plugins and adapters, like the Redis Store for caching (`adapter-redis`) and the BullMQ adapter for background jobs (`adapter-bullmq`).

- `src/igniter.router.ts`: This is your API's table of contents. It imports all your feature controllers and combines them into a single `AppRouter`. The structure of this router is what the CLI reads to generate the type-safe client.

- `src/igniter.client.ts`: The auto-generated, type-safe client. **You must never edit this file manually.** It is automatically updated whenever you save a change in a controller or the main router. It exports the `api` object that your frontend will use.

- `src/features/`: This is where your application's business logic lives. The starter encourages a **Feature-Based Architecture**. Each feature (e.g., "users", "posts", "products") gets its own directory containing its controllers, procedures, database logic, and even its related frontend components.

- `src/services/`: This directory contains initialization logic for external services like the Prisma client (`database.ts`) or the Redis client (`store.ts`).

- `prisma/schema.prisma`: The single source of truth for your database schema. Prisma uses this file to generate the Prisma Client and to manage database migrations.

---

## 3. Building Our First Feature: A "Posts" API

Now for the fun part. We will build a complete CRUD API for blog posts.

### Step 1: Define the Schema
Open `prisma/schema.prisma` and add a new model for `Post`.

```prisma
// prisma/schema.prisma

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Also, add a relation to your User model if you have one.
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  // posts Post[] // Uncomment if you want to link users to posts
}
```

### Step 2: Apply Database Changes
Run `prisma db push` again to create the `Post` table in your database.
```bash
npx prisma db push
```

### Step 3: Scaffold the Feature with the CLI
Instead of manually creating all the boilerplate files for our new feature, we'll use the Igniter.js CLI to do the heavy lifting.
```bash
npx @igniter-js/cli generate feature posts --schema prisma:Post
```
This is an incredibly powerful command. It inspects the `Post` model in your Prisma schema and generates a complete, production-ready feature slice for you inside `src/features/posts/`. This includes:
- `controllers/posts.controller.ts`: An API controller with pre-built CRUD actions (`list`, `getById`, `create`, `update`, `delete`).
- `procedures/posts.procedure.ts`: A reusable procedure that centralizes all database logic (a repository pattern), keeping your controller clean.
- `interfaces/posts.interfaces.ts`: Zod schemas for input validation (`CreatePostInputSchema`, `UpdatePostInputSchema`) inferred directly from your Prisma model. It also exports the inferred TypeScript types.
- `index.ts`: An entry file that exports all the necessary modules.

### Step 4: Register the Controller
The CLI creates the files but doesn't automatically register the feature. You need to do this one final manual step. Open `src/igniter.router.ts` and add the new `postsController`.

```typescript
// src/igniter.router.ts
import { igniter } from '@/igniter';
import { exampleController } from '@/features/example';
// 1. Import the new controller
import { postsController } from '@/features/posts';

export const AppRouter = igniter.router({
  controllers: {
    example: exampleController,
    // 2. Register it in the router
    posts: postsController,
  },
});

export type AppRouter = typeof AppRouter;
```
As soon as you save this file, the `igniter dev` process will regenerate `src/igniter.client.ts`, and `api.posts` will now be available on your frontend client with full type-safety.

### Step 5: Test the API
Your CRUD API for posts is now live. You can test it with a tool like `curl`.
```bash
# Get all posts (will be an empty array for now)
curl http://localhost:3000/api/posts

# Create a new post
curl -X POST http://localhost:3000/api/posts \
-H "Content-Type: application/json" \
-d '{"title": "My First Post", "content": "Hello, World!"}'
```

---

## 4. Building the Frontend

Now let's build the UI to interact with our new API.

### Displaying Data with a Server Component
We'll create a page to display all our posts. Using a Server Component is perfect for this, as the data can be fetched on the server and rendered as static HTML.

Create a new file at `src/app/posts/page.tsx`:
```tsx
// src/app/posts/page.tsx
import { api } from '@/igniter.client';
import Link from 'next/link';

// This is a React Server Component
export default async function PostsPage() {
  // We can directly await the API call. This happens on the server.
  // The 'api' client is fully typed, so TypeScript knows 'data' has a 'posts' property.
  const { data } = await api.posts.list.query({});

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>
      <div className="space-y-4">
        {data.posts.map((post) => (
          <div key={post.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">{post.title}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}
```
Navigate to `http://localhost:3000/posts`, and you should see the post you created earlier.

### Creating Data with a Client Component

For interactive elements like forms, we need a Client Component. Let's create a form to add new posts.

Create a new file at `src/features/posts/presentation/components/CreatePostForm.tsx`:

```tsx
// src/features/posts/presentation/components/CreatePostForm.tsx
'use client';

import { api } from '@/igniter.client';
import { useState } from 'react';

export function CreatePostForm() {
  const [title, setTitle] = useState('');

  // The useMutation hook handles the API call and manages state for us.
  const createPostMutation = api.posts.create.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 'mutate' is the function to trigger the mutation.
    // The input is fully typed based on our Zod schema.
    createPostMutation.mutate(
      { body: { title } },
      {
        onSuccess: () => {
          setTitle(''); // Clear the form on success
          alert('Post created!');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 mb-8">
      <h2 className="text-lg font-semibold mb-2">Create a New Post</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post Title"
        className="w-full p-2 border rounded"
        disabled={createPostMutation.isPending}
      />
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        disabled={createPostMutation.isPending}
      >
        {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
      </button>
      {createPostMutation.isError && (
        <p className="text-red-500 mt-2">{createPostMutation.error.message}</p>
      )}
    </form>
  );
}
```
Now, add this form component to your `PostsPage` at `src/app/posts/page.tsx`:
```tsx
// src/app/posts/page.tsx
import { api } from '@/igniter.client';
import { CreatePostForm } from '@/features/posts/presentation/components/CreatePostForm'; // Import the form

export default async function PostsPage() {
  const { data } = await api.posts.list.query({});

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>
      {/* Add the form here */}
      <CreatePostForm />
      <div className="space-y-4">
        {data.posts.map((post) => (
          // ... rest of the component
        ))}
      </div>
    </main>
  );
}
```
Now you have a functional form. When you create a new post, you'll see the "Post created!" alert. However, you'll have to manually refresh the page to see the new post in the list. Let's fix that with some real-time magic.

---

## 5. Unleashing Real-Time Magic

This is where the power of Igniter.js truly shines. We will make our posts list update automatically across all connected clients the instant a new post is created.

### Step 1: Make the `list` Query "Live"
Go to your backend controller at `src/features/posts/controllers/posts.controller.ts`. Find the `list` action and add one line: `stream: true`.

```typescript
// src/features/posts/controllers/posts.controller.ts
// ... inside the postsController actions object
list: igniter.query({
  path: '/',
  stream: true, // <-- This is the magic!
  handler: async ({ context, response }) => {
    // ... handler logic remains the same
    const posts = await context.database.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return response.success({ posts });
  },
}),
// ...
```
By adding `stream: true`, you are telling Igniter.js that any client using `api.posts.list.useQuery()` should be subscribed to a real-time Server-Sent Event (SSE) stream for updates.

### Step 2: Trigger the Update from the Mutation
Now, in the same file, find the `create` mutation. We need to tell it to notify the `list` query's stream that its data is now stale. You do this by chaining `.revalidate()` to the response.

```typescript
// src/features/posts/controllers/posts.controller.ts
// ... inside the postsController actions object
create: igniter.mutation({
  path: '/',
  method: 'POST',
  body: CreatePostInputSchema, // Our Zod schema
  handler: async ({ context, response, body }) => {
    const post = await context.database.post.create({
      data: { title: body.title, content: body.content },
    });

    // This response does two things:
    // 1. Returns the created post with a 201 status.
    // 2. Broadcasts a message to revalidate the 'posts.list' query.
    return response.created({ post }).revalidate('posts.list');
  },
}),
// ...
```

### Step 3: Witness the Magic (No Frontend Changes Needed!)
That's it. **You don't need to change a single line of frontend code.**

Open two browser windows side-by-side, both pointing to `http://localhost:3000/posts`. In one window, create a new post using the form. The moment you click "Create Post", you will see the post list in **both** windows update instantly to include the new post.

This happens because:
1. The `useQuery` hook subscribed to the SSE stream because of `stream: true`.
2. The `create` mutation's `.revalidate('posts.list')` call sent a message over that stream.
3. The hook received the message and automatically refetched the query, triggering a re-render with the new data.

This powerful pattern provides a snappy, real-time user experience with minimal developer effort.

---

## 6. Advanced Concepts

Let's briefly touch on other powerful features of the starter.

### Background Jobs with Igniter Queues
What if you wanted to send an email notification when a post is created, but you don't want to make the user wait for the email to be sent? This is a perfect use case for background jobs.

1. **Define a Job**: In `src/services/jobs.ts`, you can register a new job.
   ```typescript
   // src/services/jobs.ts
   // ... inside REGISTERED_JOBS.system.jobs
   notifyOnNewPost: jobs.register({
     name: 'notifyOnNewPost',
     input: z.object({ postId: z.string(), title: z.string() }),
     handler: async ({ input, log }) => {
       log.info(`Sending notification for new post: "${input.title}"`);
       // Fake sending an email
       await new Promise(res => setTimeout(res, 2000));
       log.info('Notification sent!');
     }
   }),
   ```

2. **Enqueue the Job**: In your `create` mutation, you can enqueue this job.
   ```typescript
   // In the create mutation handler
   const post = await context.database.post.create({ data: body });
   // Enqueue job without waiting for it to complete
   await igniter.jobs.system.enqueue({
     task: 'notifyOnNewPost',
     input: { postId: post.id, title: post.title },
   });
   return response.created({ post }).revalidate('posts.list');
   ```
The API response is sent back to the user immediately, and the job runs in the background.

### Caching with the Igniter Store
To reduce database load, you can cache frequently accessed data in Redis.
```typescript
// In a getById action handler
const { id } = params;
const cacheKey = `post:${id}`;

// 1. Check the cache first
let post = await igniter.store.get<Post>(cacheKey);

if (!post) {
  // 2. If not in cache, fetch from DB
  post = await context.database.post.findUnique({ where: { id } });
  if (post) {
    // 3. Store it in the cache for 1 hour
    await igniter.store.set(cacheKey, post, { ttl: 3600 });
  }
}

if (!post) {
  return response.notFound({ message: 'Post not found' });
}
return response.success({ post });
```

---

## Conclusion

Congratulations! You have successfully built a full-stack, type-safe application with a sophisticated feature set.

We have covered:
- The core principles of combining Igniter.js and Next.js for maximum type safety and developer experience.
- Scaffolding a project and understanding its structure.
- Using the CLI to rapidly generate a complete API feature from a database schema.
- Building both Server and Client Components that interact with the API in a type-safe way.
- Implementing a seamless, automatic real-time data synchronization with just two lines of code.
- An overview of advanced features like background jobs and caching.

This starter provides a robust and scalable foundation for your next project. By adhering to its patterns, you can build complex applications faster and with more confidence.

---

## Next Steps

Continue exploring the Igniter.js ecosystem:

- [TanStack Start Starter Guide](/docs/starter-guides/tanstack-start-starter-guide) - Learn about the TanStack Start integration
- [Bun React Starter Guide](/docs/starter-guides/bun-react-starter-guide) - Explore the Bun React starter
- [REST API Starter Guide](/docs/starter-guides/rest-api-starter-guide) - Build REST APIs with Igniter.js
- [Feature-Based Architecture](/docs/core-concepts/feature-based-architecture) - Deep dive into the architectural patterns
- [Igniter.js Realtime](/docs/advanced-features/realtime) - Master real-time features
- [Igniter.js Queues](/docs/advanced-features/queues) - Learn about background job processing

---

### Full-Stack Guide: Building with the Igniter.js TanStack Start Starter

**Category**: starter-guides
**URL**: /docs/starter-guides/tanstack-start-starter-guide

# Full-Stack Guide: Building with the Igniter.js TanStack Start Starter

Welcome to the definitive guide for the Igniter.js TanStack Start starter. This document will walk you through building a bleeding-edge, full-stack, end-to-end type-safe application. We will explore the project's architecture, which combines the Vite-powered speed of TanStack Start with the structured, type-safe API layer of Igniter.js.

This starter is for developers who crave a modern, fast, and highly integrated development experience. If you love Vite's instant feedback loop and TanStack's powerful, type-safe tools (like Router and Query), this guide is for you.

---

## 1. Core Philosophy: The Vite-Powered Full-Stack

Understanding the "why" behind this starter is key to unlocking its full potential. It's built on a philosophy of speed, type safety, and seamless integration.

### 1.1. TanStack Start: A Modern Foundation
TanStack Start is not a framework in the traditional sense; it's a "meta-framework" starter kit that expertly assembles the best tools from the TanStack ecosystem and beyond:

-   **Vite**: The build tool. Provides near-instant Hot Module Replacement (HMR) and a lightning-fast development server.
-   **TanStack Router**: A fully type-safe, file-based router that manages your application's routes and state with powerful features like search parameter schemas and route-level data loading.
-   **TanStack Query**: The gold standard for data fetching in React. It handles caching, revalidation, and server-state management, and it's what powers the Igniter.js client hooks.

### 1.2. Igniter.js: The Structured, Type-Safe API Layer
Igniter.js integrates into this ecosystem as the dedicated API layer. It provides a clean, feature-based architecture for your backend logic, which lives right inside your TanStack Start project.

The synergy is powerful:
-   **End-to-End Type Safety**: Igniter.js introspects your API controllers and auto-generates a client. TanStack Router is also fully type-safe. This means you have a continuous chain of type safety from your database schema, through your API layer, through your router, and into your React components.
-   **Separation of Concerns**: Your frontend logic (components, routes) and backend logic (controllers, database interactions) are clearly separated but live in the same project, sharing the same type system.
-   **Ultimate Developer Experience**: You get Vite's speed, TanStack's powerful tools, and Igniter.js's structured, safe, and feature-rich backend capabilities (like built-in Redis caching, background jobs, and real-time updates).

---

## 2. Getting Started: From Zero to Running App

Let's get the project set up and explore its structure.

### Prerequisites
-   Node.js (v18 or higher)
-   Docker and Docker Compose (for the database and Redis)

### Installation and Setup

1.  **Initialize the Project**: Use the Igniter.js CLI to scaffold a new TanStack Start project.
    ```bash
    npx @igniter-js/cli init my-tanstack-app
    ```
    During the interactive setup, select **TanStack Start** as your framework. Also, be sure to enable the **Store (Redis)** and **Queues (BullMQ)** features to follow along with the entire guide.

2.  **Configure Environment**: `cd my-tanstack-app`. Rename `.env.example` to `.env`. The default values are configured to work with the provided Docker setup.

3.  **Start Background Services**: From the root of your project, start the PostgreSQL and Redis containers.
    ```bash
    docker-compose up -d
    ```

4.  **Install & Sync Database**: Install dependencies and apply the Prisma schema to your new database.
    ```bash
    npm install
    npx prisma db push
    ```

5.  **Run the Dev Server**:
    ```bash
    npm run dev
    ```
    This single command starts the Vite development server. Vite is responsible for both serving your frontend and handling the API requests, which it delegates to Igniter.js. You will see Vite's familiar, speedy output in your terminal.

### Project Structure Deep Dive

The TanStack Start project structure is organized around its file-based router.

```
my-tanstack-app/
├── src/
│   ├── routes/
│   │   ├── __root.tsx              # << Root Layout & Providers
│   │   ├── index.tsx               # Main page (/)
│   │   └── api/
│   │       └── v1/
│   │           └── $.ts            # << API Catch-All Route
│   ├── features/                   # << Your application's business logic
│   ├── services/                   # Service initializations (Prisma, etc.)
│   ├── igniter.ts                  # << Core Igniter.js initialization
│   ├── igniter.client.ts           # << Auto-generated Type-Safe Client
│   ├── igniter.router.ts           # << Main application router
│   └── routeTree.gen.ts            # Auto-generated route tree
├── vite.config.ts                  # Vite build configuration
└── package.json
```

-   `src/routes/`: This is the heart of TanStack Router. Every `.tsx` file here becomes a route in your application.
-   `src/routes/__root.tsx`: This is the root layout component for your entire application. It's where you'll find the main `<html>` and `<body>` tags, and it's where the **`IgniterProvider`** is set up. This provider is essential for the client-side hooks (`useQuery`, `useMutation`) to work correctly.
-   `src/routes/api/v1/$.ts`: This is the critical bridge between TanStack Start and Igniter.js. It's a **catch-all API route**. The `$` in the filename tells TanStack Router to match any path under `/api/v1/`.
    -   Inside this file, `createFileRoute` is used to define handlers. A `loader` function handles `GET` requests, and an `action` function handles `POST`, `PUT`, `PATCH`, and `DELETE` requests. Both of these functions simply pass the request to `AppRouter.handler()`, which takes care of the translation.
-   `vite.config.ts`: The configuration file for Vite, which manages the build process, development server, and plugins.
-   The `igniter.*.ts` and `features/` directories serve the exact same purpose as in the Next.js starter: they define your backend API's structure and logic.

---

## 3. Building Our First Feature: A "Tasks" API

Let's build a simple to-do list application.

### Step 1: Define the Schema
Open `prisma/schema.prisma` and add a `Task` model.

```prisma
// prisma/schema.prisma
model Task {
  id        String   @id @default(cuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Step 2: Apply Database Changes
Run `prisma db push` to create the `Task` table.
```bash
npx prisma db push
```

### Step 3: Scaffold the Feature with the CLI
Use the `igniter generate` command to create all the necessary backend files.
```bash
npx @igniter-js/cli generate feature tasks --schema prisma:Task
```
This command creates the controller, procedures, and Zod interfaces for your `Task` feature inside `src/features/tasks/`.

### Step 4: Register the Controller
Open `src/igniter.router.ts` and register the new `tasksController`.

```typescript
// src/igniter.router.ts
import { igniter } from '@/igniter';
import { exampleController } from '@/features/example';
// 1. Import the new controller
import { tasksController } from '@/features/tasks';

export const AppRouter = igniter.router({
  controllers: {
    example: exampleController,
    // 2. Register it
    tasks: tasksController,
  },
});

export type AppRouter = typeof AppRouter;
```
When you save this file, Vite's dev server will automatically detect the change, and Igniter.js will regenerate `igniter.client.ts` in the background. `api.tasks` is now available on your client.

---

## 4. Building the Frontend with TanStack Router

Now, let's create the UI for our tasks application.

### Displaying Tasks on a New Page

With TanStack Router, creating a new page is as simple as creating a new file.

Create a new file at `src/routes/tasks.tsx`:

```tsx
// src/routes/tasks.tsx
import { createFileRoute } from '@tanstack/react-router';
import { api } from '@/igniter.client';

// This line defines our new route at the path '/tasks'
export const Route = createFileRoute('/tasks')({
  component: TasksComponent,
});

// This is our route's component
function TasksComponent() {
  // We use the auto-generated hook to fetch data.
  // TanStack Query handles caching, loading, and error states for us.
  const { data, isLoading, error } = api.tasks.list.useQuery();

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      <ul className="space-y-2">
        {data?.tasks.map((task) => (
          <li key={task.id} className="p-2 border rounded">
            {task.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```
After you save this file, TanStack Router's generator will update `src/routeTree.gen.ts`. You can now navigate to `http://localhost:5173/tasks` to see your new page.

### Creating New Tasks with a Form

Let's create an interactive form component.

Create a new file at `src/features/tasks/presentation/components/CreateTaskForm.tsx`:

```tsx
// src/features/tasks/presentation/components/CreateTaskForm.tsx
import { api } from '@/igniter.client';
import { useState } from 'react';

export function CreateTaskForm() {
  const [text, setText] = useState('');
  const createTaskMutation = api.tasks.create.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    createTaskMutation.mutate(
      { body: { text } },
      {
        onSuccess: () => {
          setText('');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full p-2 border rounded"
        disabled={createTaskMutation.isPending}
      />
      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
        disabled={createTaskMutation.isPending}
      >
        {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  );
}
```

Now, add this form to your `TasksComponent` in `src/routes/tasks.tsx`:

```tsx
// src/routes/tasks.tsx
import { createFileRoute } from '@tanstack/react-router';
import { api } from '@/igniter.client';
// 1. Import the form component
import { CreateTaskForm } from '@/features/tasks/presentation/components/CreateTaskForm';

export const Route = createFileRoute('/tasks')({
  component: TasksComponent,
});

function TasksComponent() {
  const { data, isLoading, error } = api.tasks.list.useQuery();

  // ...
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      {/* 2. Add the form here */}
      <CreateTaskForm />
      <ul className="space-y-2">
        {/* ... */}
      </ul>
    </div>
  );
}
```
You now have a working form, but you have to refresh the page to see newly added tasks. Let's fix that.

---

## 5. Automatic Real-Time Updates

We'll now enable Igniter.js's automatic real-time feature to make our task list update instantly.

### Step 1: Make the `list` Query "Live"
In your backend controller at `src/features/tasks/controllers/tasks.controller.ts`, add `stream: true` to the `list` action.

```typescript
// src/features/tasks/controllers/tasks.controller.ts
// ... inside tasksController
list: igniter.query({
  path: '/',
  stream: true, // This enables real-time updates
  handler: async ({ context, response }) => {
    const tasks = await context.database.task.findMany({ orderBy: { createdAt: 'asc' } });
    return response.success({ tasks });
  },
}),
// ...
```

### Step 2: Trigger the Update from the `create` Mutation
In the same file, find the `create` mutation and chain the `.revalidate()` method to its response.

```typescript
// src/features/tasks/controllers/tasks.controller.ts
// ... inside tasksController
create: igniter.mutation({
  path: '/',
  method: 'POST',
  body: CreateTaskInputSchema,
  handler: async ({ context, response, body }) => {
    const task = await context.database.task.create({ data: { text: body.text } });
    // This response returns the created task AND
    // broadcasts a message to refetch the 'tasks.list' query.
    return response.created({ task }).revalidate('tasks.list');
  },
}),
// ...
```

### Step 3: Witness the Magic
That's all. Go back to your browser (you might need to open two windows to see it clearly). When you add a new task in one window, the list updates in **both** windows instantly. The `useQuery` hook handles the underlying SSE connection and data synchronization automatically.

---

## 6. Advanced Feature: Toggling Task Completion

Let's add one more piece of functionality: marking a task as complete.

### Step 1: Add an `update` Mutation
The CLI already generated an `update` mutation for us. We just need to ensure it also revalidates our list.

```typescript
// src/features/tasks/controllers/tasks.controller.ts
// ... inside tasksController
update: igniter.mutation({
  path: '/:id',
  method: 'PUT',
  body: UpdateTaskInputSchema,
  handler: async ({ context, response, body, params }) => {
    const task = await context.database.task.update({
      where: { id: params.id },
      data: { completed: body.completed },
    });
    // Revalidate the list after updating a task
    return response.success({ task }).revalidate('tasks.list');
  },
}),
// ...
```

### Step 2: Update the Frontend Component
Now, let's modify our `TasksComponent` to handle toggling the `completed` status.

```tsx
// src/routes/tasks.tsx

// ... inside TasksComponent
function TasksComponent() {
  const { data, isLoading, error } = api.tasks.list.useQuery();
  // Add a mutation for updating tasks
  const updateTaskMutation = api.tasks.update.useMutation();

  const handleToggle = (id: string, completed: boolean) => {
    updateTaskMutation.mutate({
      params: { id },
      body: { completed: !completed },
    });
  };

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      <CreateTaskForm />
      <ul className="space-y-2">
        {data?.tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-4 p-2 border rounded cursor-pointer"
            onClick={() => handleToggle(task.id, task.completed)}
          >
            <input
              type="checkbox"
              checked={task.completed}
              readOnly
              className="h-5 w-5"
            />
            <span className={task.completed ? 'line-through text-gray-500' : ''}>
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Now, when you click on a task, the `update` mutation is called. It updates the database and then calls `.revalidate('tasks.list')`, which instantly pushes the updated list to all clients. Your UI reflects the change immediately.

---

## Conclusion

You have successfully built a fast, modern, and fully type-safe full-stack application using TanStack Start and Igniter.js.

We've covered:
-   The core principles of combining Vite, TanStack tools, and Igniter.js.
-   Scaffolding a project and understanding its file-based routing structure.
-   Using the CLI to rapidly generate a complete backend feature.
-   Building a reactive frontend with TanStack Router and the auto-generated Igniter.js client hooks.
-   Implementing seamless, automatic real-time data synchronization with `stream: true` and `.revalidate()`.

This starter provides an incredibly productive and enjoyable developer experience, allowing you to build complex features with confidence and speed. Happy coding!

---

## Next Steps

Continue exploring the Igniter.js ecosystem:

- [Next.js Starter Guide](/docs/starter-guides/nextjs-starter-guide) - Learn about the Next.js integration
- [Bun React Starter Guide](/docs/starter-guides/bun-react-starter-guide) - Explore the Bun React starter
- [REST API Starter Guide](/docs/starter-guides/rest-api-starter-guide) - Build REST APIs with Igniter.js
- [Feature-Based Architecture](/docs/core-concepts/feature-based-architecture) - Deep dive into the architectural patterns
- [Igniter.js Realtime](/docs/advanced-features/realtime) - Master real-time features
- [TanStack Router Integration](/docs/integrations/tanstack-router) - Advanced TanStack Router patterns

---

### Guide: Building High-Performance, Type-Safe REST APIs with Igniter.js

**Category**: starter-guides
**URL**: /docs/starter-guides/rest-api-starter-guide

# Guide: Building High-Performance, Type-Safe REST APIs with Igniter.js

Welcome to the definitive guide for building backend services with the Igniter.js REST API starters. This document provides a comprehensive walkthrough for creating high-performance, scalable, and fully type-safe REST APIs.

Igniter.js offers several starter templates for building headless backend services, allowing you to choose the runtime and ecosystem that best fits your needs without compromising on architecture or developer experience. This guide covers the three primary REST API starters:

1.  **Node.js + Express**: For developers who want a battle-tested, robust foundation with the world's most popular Node.js web framework.
2.  **Bun REST API**: For those who want to leverage Bun's incredible speed and all-in-one toolkit for a next-generation backend.
3.  **Deno REST API**: For developers who prioritize security and modern, web-standard APIs in a TypeScript-first runtime.

While each starter uses a different underlying runtime, their core architecture and development workflow within Igniter.js are **nearly identical**. This guide will walk you through the common patterns and highlight the specific differences where they matter.

---

## 1. Core Philosophy: The Headless, Type-Safe Backend

These starters are designed to build **headless services**. This means they are pure API servers, focused exclusively on processing requests and returning data (typically as JSON). They do not serve any HTML, CSS, or frontend assets.

### 1.1. A Structured, Scalable Architecture
The core philosophy is to provide a clean, structured, and scalable architecture for your business logic. Instead of placing all your logic in a single file or a flat directory of route handlers, Igniter.js promotes a **feature-based architecture**. Each distinct part of your application (e.g., "users," "invoices," "products") lives in its own self-contained feature directory. This makes the codebase easy to navigate, maintain, and scale.

The runtime (Express, Bun, or Deno) acts as a **thin HTTP layer**. Its only job is to receive an incoming HTTP request and pass it along to the Igniter.js engine for processing. All the complex work—routing, validation, middleware, and business logic—is handled by Igniter.js.

### 1.2. Type Safety for Your Consumers
The most powerful feature of a headless Igniter.js API is the type safety it provides to its **consumers**. An API is useless without clients (a web app, a mobile app, another microservice). Igniter.js ensures that the contract between your API and its clients is never broken.

It achieves this by automatically generating two critical artifacts:
-   `src/igniter.schema.ts`: A JSON schema representation of your entire API router.
-   `src/igniter.client.ts`: A fully-typed TypeScript client that can be used to call your API.

These files can be packaged and published (e.g., as a private NPM package), giving your client developers a fully-typed SDK for interacting with your backend. If you change an endpoint, the client's TypeScript compiler will immediately flag the error, preventing runtime bugs.

---

## 2. Getting Started: From Zero to a Running API Server

Let's walk through the initial setup process.

### Prerequisites
-   Your chosen runtime:
    -   Node.js (v18+) for the Express starter.
    -   Bun (v1.0+) for the Bun starter.
    -   Deno (v1.x+) for the Deno starter.
-   Docker and Docker Compose (for the database and Redis).

### Installation and Setup
1.  **Initialize the Project**: Use the Igniter.js CLI to scaffold your new API project.
    ```bash
    npx @igniter-js/cli init my-awesome-api
    ```
    During the interactive setup, you'll be asked to choose a framework. Select your desired REST API starter (e.g., `Express REST API`). Also, enable the **Store (Redis)** and **Queues (BullMQ)** features to follow along with this guide.

2.  **Configure Environment**: `cd my-awesome-api`. Rename `.env.example` to `.env`. The default `DATABASE_URL` and `REDIS_URL` are pre-configured to work with the provided Docker setup.

3.  **Start Background Services**: Launch the PostgreSQL and Redis containers.
    ```bash
    docker-compose up -d
    ```

4.  **Install Dependencies & Sync DB**: This step varies slightly depending on your chosen starter.
    -   **For Express/Node.js**:
        ```bash
        npm install
        npx prisma db push
        ```
    -   **For Bun**:
        ```bash
        bun install
        bunx prisma db push
        ```
    -   **For Deno**: Deno manages dependencies via `deno.json`, so there's no install step.
        ```bash
        deno task prisma:db:push
        ```

5.  **Run the Development Server**:
    -   **For Express/Node.js**: `npm run dev`
    -   **For Bun**: `bun run dev`
    -   **For Deno**: `deno task dev`

Each of these commands will start the development server with file-watching enabled. When you make changes to your backend controllers, the server will restart, and the type-safe client will be regenerated automatically.

---

## 3. Architecture Deep Dive: Same Core, Different Engines

The beauty of these starters is their shared core architecture. However, their entry points differ slightly to match the conventions of their respective runtimes.

### 3.1. The Entry Point (`src/index.ts`): The Key Difference

This file is where the underlying runtime is configured to hand off requests to Igniter.js.

**Express REST API Starter (`src/index.ts`)**
The Express starter uses the `expressAdapter`. It creates a standard Express app and mounts the Igniter.js router as a middleware. This is a classic and highly robust pattern.

```typescript
import express from 'express';
import { AppRouter } from './igniter.router';
import { expressAdapter } from '@igniter-js/core/adapters';

const app = express();
const port = process.env.PORT || 3000;

// All requests to /api/v1/* are handled by Igniter.js
app.use('/api/v1', expressAdapter(AppRouter));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

**Bun REST API Starter (`src/index.ts`)**
The Bun starter uses the high-performance native `Bun.serve` API. It inspects the request URL and forwards API traffic to the Igniter.js handler.

```typescript
import { AppRouter } from './igniter.router';

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/v1')) {
      // Let Igniter.js handle the request
      return AppRouter.handler(request);
    }
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
```

**Deno REST API Starter (`src/index.ts`)**
The Deno starter is very similar to Bun's, using Deno's native `Deno.serve`. It leverages the import map in `deno.json` for dependency management.

```typescript
import { serve } from 'std/http/server.ts';
import { AppRouter } from '@/igniter.router.ts'; // Note the .ts extension

serve(async (request: Request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/v1/')) {
    // Let Igniter.js handle the request
    return AppRouter.handler(request);
  }
  return new Response('Not Found', { status: 404 });
});
```

### 3.2. The Common Core
**Beyond the entry point, the rest of your application is identical across all three starters.** All business logic, database interactions, and feature definitions reside in the same set of files:
-   `src/igniter.ts`: Where the core `igniter` instance is built and configured.
-   `src/igniter.router.ts`: Where all feature controllers are imported and assembled into the main `AppRouter`.
-   `src/features/`: The home for all your business logic, organized by feature.

This consistency means you can learn the Igniter.js patterns once and apply them anywhere, regardless of your preferred JavaScript runtime.

---

## 4. Building Our First Feature: A "Snippets" API

Let's build an API for storing and retrieving code snippets.

### Step 1: Define the Schema
Open `prisma/schema.prisma` and add a `Snippet` model.

```prisma
// prisma/schema.prisma
model Snippet {
  id          String   @id @default(cuid())
  title       String
  language    String   // e.g., "typescript", "python"
  code        String
  createdAt   DateTime @default(now())
}
```

### Step 2: Apply Database Changes
Run the `prisma db push` command appropriate for your starter.

### Step 3: Scaffold the Feature with the CLI
This command is the same for all starters.
```bash
npx @igniter-js/cli generate feature snippets --schema prisma:Snippet
```
This generates a full CRUD API for snippets inside `src/features/snippets/`.

### Step 4: Register the Controller
Open `src/igniter.router.ts` and register the new controller.

```typescript
// src/igniter.router.ts
import { igniter } from '@/igniter';
import { snippetsController } from '@/features/snippets'; // 1. Import

export const AppRouter = igniter.router({
  controllers: {
    snippets: snippetsController, // 2. Register
  },
});
```

### Step 5: Test the API with `curl`
Your API is now live. Let's test it from the command line.

```bash
# Create a new snippet
curl -X POST http://localhost:3000/api/v1/snippets \
     -H "Content-Type: application/json" \
     -d '{"title": "Hello World", "language": "typescript", "code": "console.log(\"Hello, World!\");"}'

# Retrieve all snippets
curl http://localhost:3000/api/v1/snippets
```

---

## 5. Advanced Features in a Headless Context

### 5.1. Background Jobs with Igniter Queues
Imagine you want to perform syntax highlighting on a snippet after it's saved, which might be a slow process. This is a perfect use case for a background job.

**1. Define the Job**
In `src/services/jobs.ts`:
```typescript
// src/services/jobs.ts
// ... inside REGISTERED_JOBS.system.jobs
syntaxHighlight: jobs.register({
  name: 'syntaxHighlight',
  input: z.object({ snippetId: z.string() }),
  handler: async ({ input, log }) => {
    log.info(`Performing syntax highlighting for snippet ${input.snippetId}...`);
    // ... slow processing logic here ...
    await new Promise(res => setTimeout(res, 3000));
    log.info(`Highlighting complete for ${input.snippetId}.`);
  }
}),
```

**2. Enqueue the Job from the `create` Mutation**
In `src/features/snippets/controllers/snippets.controller.ts`:
```typescript
// ... inside the create mutation handler
const snippet = await context.database.snippet.create({ data: body });

// Enqueue the job without waiting for it to finish
await igniter.jobs.system.enqueue({
  task: 'syntaxHighlight',
  input: { snippetId: snippet.id },
});

return response.created({ snippet });
```
The API responds instantly, and the slow task runs in the background.

### 5.2. Caching with the Igniter Store (Redis)
To improve performance for frequently accessed snippets, you can cache them in Redis.

```typescript
// In the getById action handler in the snippets controller
const { id } = params;
const cacheKey = `snippet:${id}`;

// 1. Try to fetch from cache first
let snippet = await igniter.store.get<Snippet>(cacheKey);

if (!snippet) {
  // 2. If not found, get from database
  snippet = await context.database.snippet.findUnique({ where: { id } });
  if (snippet) {
    // 3. Save it to the cache for an hour
    await igniter.store.set(cacheKey, snippet, { ttl: 3600 });
  }
}

if (!snippet) {
  return response.notFound({ message: 'Snippet not found' });
}
return response.success({ snippet });
```

---

## 6. Consuming Your Type-Safe API

The primary output of your API project for other developers is the set of generated client files.

-   `dist/igniter.client.mjs`
-   `dist/igniter.schema.json`
-   `dist/igniter.client.d.ts` (the type definitions)

You have two main strategies for sharing these with your client applications:

**Strategy 1: Publish a Private NPM Package**
This is the most robust approach for larger teams. You can configure your `package.json` to only include the `dist` directory and publish it to a private registry like GitHub Packages or npm Pro.

Your frontend team can then install it like any other package:
```bash
npm install @my-org/my-awesome-api-client
```
They get a fully typed, ready-to-use client for interacting with your API.

**Strategy 2: Monorepo Integration**
If your frontend and backend live in the same monorepo, you can often configure your build tools (like Turborepo or Nx) to allow the frontend project to directly import from the backend project's `dist` directory. This provides the tightest integration loop.

---

## Conclusion

The Igniter.js REST API starters provide a powerful, flexible, and type-safe foundation for any backend service. By decoupling the core application logic from the underlying runtime, you gain the freedom to choose the best engine for your needs (the stability of Express, the speed of Bun, or the security of Deno) while benefiting from a consistent, scalable, and highly productive development workflow.

You have learned to:
-   Set up a headless API server in your preferred runtime.
-   Understand the shared architecture and the specific role of the entry point file.
-   Use the CLI to rapidly generate full CRUD APIs from a database schema.
-   Implement advanced backend features like background jobs and caching.
-   Understand how to package and distribute the type-safe client for your API consumers.

You are now well-equipped to build robust backend services that are a pleasure to maintain and a joy for other developers to consume. Happy coding!

---

### `igniter generate`: Scaffolding & Schema Generation

**Category**: cli-and-tooling
**URL**: /docs/cli-and-tooling/igniter-generate

# `igniter generate`: Scaffolding & Schema Generation

The `igniter generate` command is a powerful, multi-purpose tool designed to accelerate your development workflow. It serves three primary functions:

1.  **Scaffolding**: Automatically create boilerplate files for new features, either from a database schema or from scratch. This ensures consistency and lets you focus on business logic.
2.  **Schema Generation**: Analyze your `AppRouter` to generate a type-safe client, keeping your frontend and backend perfectly in sync.
3.  **Documentation Generation**: Create comprehensive OpenAPI documentation from your API routes and controllers.

---

## 1. Schema-First Scaffolding (Recommended)

This is the fastest way to build a feature. With a single command, you can generate a complete, production-ready CRUD API directly from your existing database models.

### `generate feature <name> --schema <provider:Model>`

This command reads your database schema, understands your model's structure, and generates all the necessary files for a full CRUD implementation.

**Command:**

```bash
# Example: Generate a 'user' feature from the 'User' model in your Prisma schema
npx @igniter-js/cli generate feature user --schema prisma:User
```

**What it Creates:**

This command creates a new directory at `src/features/user/` and populates it with the following:

*   **`user.interfaces.ts`**:
    *   Generates a Zod schema (`UserSchema`) based on your Prisma model's fields.
    *   Creates schemas for create (`CreateUserInputSchema`) and update (`UpdateUserInputSchema`) operations, automatically omitting fields like `id` and `createdAt`.
    *   Exports inferred TypeScript types (`User`, `CreateUserInput`, etc.).

*   **`procedures/user.procedure.ts`**:
    *   Creates a reusable procedure that acts as a **repository** for your feature.
    *   This procedure centralizes all your database logic (`findAll`, `findById`, `create`, `update`, `delete`) and makes it available in the `context`.

*   **`controllers/user.controller.ts`**:
    *   Generates a controller with all standard CRUD actions (`list`, `getById`, `create`, `update`, `delete`).
    *   Each action is pre-wired to use the `userProcedure` and its repository methods, completely separating the HTTP layer from the data layer.

*   **`index.ts`**:
    *   Exports all the necessary modules from the feature, making it easy to register in your main router.

This approach provides a robust, clean, and scalable foundation for your feature in seconds.

---

## 2. Manual Scaffolding

If you don't have a database model or need to build a feature with custom logic that doesn't fit a CRUD pattern, you can generate an empty feature structure.

### `generate feature <name>`

**Command:**
```bash
# Example: Generate a new, empty feature called 'dashboard'
npx @igniter-js/cli generate feature dashboard
```

**What it Creates:**
This command scaffolds a basic feature directory with placeholder files, allowing you to build your logic from the ground up while still maintaining a consistent project structure.

---

## 3. Client Schema Generation

The `igniter generate schema` command is responsible for the end-to-end type safety of your application. It reads your backend's `AppRouter` and creates a type-safe client that your frontend can use.

### `igniter generate schema`

This command performs a **one-time generation** of the client schema. It's perfect for integrating into build scripts or CI/CD pipelines.

**Usage:**
```bash
# Manually generate the client
npx @igniter-js/cli generate schema
```
```json
// Example in package.json
{
  "scripts": {
    "build": "igniter generate schema && next build"
  }
}
```

### `igniter generate schema --watch`

This command starts a persistent watcher that monitors your controller files. Whenever you save a change, it automatically and instantly regenerates the client schema.

This is used internally by the main `igniter dev` command to provide a seamless, real-time development experience. You typically won't need to run this command manually.

---

## 4. OpenAPI Documentation Generation

The `igniter generate docs` command creates comprehensive OpenAPI 3.0 documentation from your existing API controllers and routes. This ensures your documentation stays in sync with your actual implementation.

### `igniter generate docs`

Generate OpenAPI documentation for your entire API:

```bash
# Generate OpenAPI spec to default location (./openapi.json)
npx @igniter-js/cli generate docs

# Generate to custom location
npx @igniter-js/cli generate docs --output ./docs/api-spec.json
```

### `igniter generate docs --serve`

Generate documentation and immediately serve it with a web UI:

```bash
# Generate and serve documentation at http://localhost:3001
npx @igniter-js/cli generate docs --serve

# Serve on custom port
npx @igniter-js/cli generate docs --serve --port 8080
```

**Key Features:**
- **Automatic Route Discovery**: Scans your controllers and automatically detects all API endpoints
- **Type-Safe Schemas**: Generates accurate request/response schemas from your Zod validators
- **Rich Metadata**: Includes descriptions, examples, and parameter details from your controller implementations
- **Multiple Output Formats**: Supports JSON and YAML OpenAPI specifications

For detailed configuration options, advanced customization, and integration examples, see [igniter generate docs](/docs/cli-and-tooling/igniter-generate-docs).

---

## Next Steps

- [igniter generate docs](/docs/cli-and-tooling/igniter-generate-docs) - Deep dive into OpenAPI documentation generation
- [igniter init](/docs/cli-and-tooling/igniter-init) - Learn about project scaffolding
- [igniter dev](/docs/cli-and-tooling/igniter-dev) - Discover the interactive development server
- [Feature-Based Architecture](/docs/backend/feature-based-architecture) - Understand the project structure

---

### CLI: Scaffolding with `igniter init`

**Category**: cli-and-tooling
**URL**: /docs/cli-and-tooling/igniter-init

# CLI: Scaffolding with `igniter init`

The Igniter.js Command-Line Interface (CLI) includes a powerful scaffolding tool, `igniter init`, designed to get you up and running with a new, production-ready project in minutes.

It handles all the boilerplate setup, including directory structure, package installation, and initial configuration files, allowing you to focus immediately on building your application's features.

## 1. How to Use

To create a new Igniter.js project, open your terminal and run the following command:

```bash
npx @igniter-js/cli init my-awesome-api
```

This will create a new directory named `my-awesome-api`, and the CLI will guide you through an interactive setup process.

---

## 2. The Interactive Setup

The `init` command asks a series of questions to tailor the project to your specific needs.

### Project Name
It will first confirm the name of the project based on what you provided in the command.

### Framework Selection
It will then detect if you are inside an existing project (like a Next.js monorepo) or ask you to choose a framework. This step is crucial as it sets up the correct adapters and entry points.

```
? Which framework are you using?
❯ Next.js
  Express
  Hono
  Standalone
```

### Feature Selection
Next, it will prompt you to enable optional, first-class Igniter.js features. You can select them using the spacebar.

```
? Which Igniter.js features would you like to enable?
❯ ◯ Igniter.js Store (for Caching, Sessions, Pub/Sub via Redis)
  ◯ Igniter.js Queues (for Background Jobs via BullMQ)
```

Enabling these features will automatically install the necessary dependencies (like `ioredis` or `bullmq`) and create the corresponding service files (e.g., `src/services/store.ts`, `src/services/jobs.ts`).

### Database and Docker
Finally, it can set up a `docker-compose.yml` file with services like PostgreSQL and Redis, giving you a complete, isolated development environment with a single command.

---

## 3. What It Generates

After the setup is complete, `igniter init` produces a well-organized project based on the **Feature-Based Architecture**.

A typical project structure looks like this:

```
my-awesome-api/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           └── [[...all]]/
│   │               └── route.ts        # Next.js API route handler
│   ├── features/                       # Your application features live here
│   ├── services/                       # Service initializations (Prisma, Redis, etc.)
│   ├── igniter.ts                      # Core Igniter.js initialization
│   ├── igniter.client.ts               # Type-safe client for the frontend
│   ├── igniter.context.ts              # Global application context
│   └── igniter.router.ts               # Main application router
├── prisma/
│   └── schema.prisma                   # Prisma schema if a database is chosen
├── .env.example                        # Example environment variables
├── docker-compose.yml                  # Docker services (DB, Redis)
└── package.json
```

This structured approach ensures your project is scalable, maintainable, and easy for new developers to understand.

---

## Next Steps

Now that you've scaffolded your project, the next step is to run it:

- [igniter dev](/docs/cli-and-tooling/igniter-dev) - Learn about the interactive development server
- [igniter generate](/docs/cli-and-tooling/igniter-generate) - Discover code generation tools
- [Getting Started](/docs/getting-started) - Follow the complete setup guide

---

### CLI: The Interactive Dev Server `igniter dev`

**Category**: cli-and-tooling
**URL**: /docs/cli-and-tooling/igniter-dev

# CLI: The Interactive Dev Server `igniter dev`

The `igniter dev` command is your primary tool for running your application during development. It starts a powerful, file-watching development server that automatically reloads your application when you make changes to the code.

While it can be run standalone, its most powerful feature is the **interactive mode**.

## The Interactive Dashboard (`--interactive`)

Running the dev server with the `--interactive` flag launches a terminal-based dashboard that gives you a real-time, comprehensive view of your entire application stack.

**Key Features of the Dashboard:**

-   **Multi-Process View:** It manages and displays the output of multiple processes in a single, non-scrolling interface. This typically includes the core Igniter.js watcher and the dev server for your chosen frontend framework (e.g., Next.js).
-   **API Request Monitor:** A dedicated panel logs every incoming API request to your Igniter.js backend in real-time. It shows the HTTP method, path, status code, and response time, making debugging incredibly fast.
-   **Clear Status Indicators:** Each process has a clear status indicator (e.g., `● Running`, `○ Stopped`), so you always know the state of your application at a glance.

## How to Use

To start the interactive development server, run the following command from the root of your project:

```bash
igniter dev --interactive
```

### Integrating with a Frontend Framework

If your Igniter.js backend is part of a full-stack application (like with Next.js), you can tell the Igniter dev server to manage the frontend dev server process for you.

```bash
igniter dev --interactive --framework nextjs
```

This command will start both the Igniter.js process and the `next dev` process, displaying both in the interactive dashboard.

## Dashboard Interface Example

The interactive dashboard provides a clean, static view that does not scroll away, making it easy to monitor activity.

```text
Igniter.js Interactive Dashboard
Uptime: 2m 45s | Press h for help

● 1. Igniter  ○ 2. Next.js  ● 3. API Requests

Status: Running | PID: 12345 | Last: 14:30:25
────────────────────────────────────────────────────────
14:30:23 GET  /api/v1/users           200 45ms
14:30:24 POST /api/v1/auth/login      201 120ms
14:30:25 GET  /api/v1/health          200 12ms

1-5: Switch process | Tab: Next | c: Clear logs | r: Refresh | h: Help | q: Quit
```

### Navigating the Dashboard

-   **`1-5` keys:** Switch between the logs of different processes.
-   **`Tab`:** Cycle to the next process view.
-   **`c`:** Clear the logs for the currently selected process.
-   **`r`:** Restart the currently selected process.
-   **`h`:** Show a help menu with available commands.
-   **`q`:** Quit the interactive dashboard and stop all processes.

Using the `igniter dev` interactive mode streamlines the development workflow by consolidating all necessary information into a single, easy-to-read terminal window.

## Automatic OpenAPI Generation

The `igniter dev` command can automatically generate OpenAPI documentation for your API while you develop. This feature analyzes your controllers and creates comprehensive API documentation in real-time.

### Basic OpenAPI Generation (`--docs`)

To enable automatic OpenAPI generation during development:

```bash
igniter dev --docs
```

This command will:
- Analyze your API routes and generate OpenAPI 3.0 specification
- Serve the documentation UI at `http://localhost:3000/docs` (if your core server is running)
- Automatically update the documentation when you modify your controllers

### Custom Output Location (`--docs-output`)

You can specify where to save the generated OpenAPI specification file:

```bash
igniter dev --docs --docs-output ./api-docs/openapi.json
```

This is useful for:
- Integrating with external documentation tools
- Version controlling your API specification
- Sharing documentation with frontend teams

### Standalone Documentation UI (`--ui`)

If you want to serve the documentation UI separately from your main application:

```bash
igniter dev --docs --ui
```

This starts a dedicated documentation server, typically at `http://localhost:3001/docs`, allowing you to:
- Keep documentation separate from your main application
- Share documentation without exposing your development server
- Customize the documentation server port and configuration

### Combined with Interactive Mode

You can combine OpenAPI generation with the interactive dashboard:

```bash
igniter dev --interactive --docs --framework nextjs
```

This provides the full development experience with real-time API documentation generation alongside your application processes.

**Note:** For detailed configuration options and advanced OpenAPI customization, see [igniter generate docs](/docs/cli-and-tooling/igniter-generate-docs).

## Next Steps

- [igniter generate](/docs/cli-and-tooling/igniter-generate) - Discover code generation tools
- [igniter init](/docs/cli-and-tooling/igniter-init) - Learn about project scaffolding
- [Getting Started](/docs/getting-started) - Follow the complete setup guide

---

### Igniter Studio (API Playground)

**Category**: advanced-features
**URL**: /docs/advanced-features/igniter-studio

# Igniter Studio (API Playground)

Igniter Studio is an interactive UI based on Scalar API Reference that allows you to explore and test your API directly from the browser. It consumes your `openapi.json` and offers features like sending authenticated requests, viewing schemas, and executing examples.

<div style={{
  position: 'relative',
  paddingBottom: '56.25%',
  height: 0,
  overflow: 'hidden',
  maxWidth: '100%',
  borderRadius: '8px'
}}>
  <iframe
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    }}
    src="https://www.youtube.com/embed/v0BOPH02RBU"
    title="Igniter Studio Demo"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

## Enable in development

Run your app with the flag:

```bash
npx @igniter-js/cli dev --docs
```

- By default, the UI will be available at `/docs`.
- You can customize the output directory with `--docs-output`.

## Enable in production

Configure the documentation using the `.docs()` method in your Igniter builder:

```ts
import { Igniter } from '@igniter-js/core'
import openapi from './docs/openapi.json'

export const igniter = Igniter
  .context(createIgniterAppContext())
  .store(store)
  .logger(logger)
  .config({
    baseURL: process.env.NEXT_PUBLIC_IGNITER_API_URL || 'http://localhost:3000',
    basePATH: process.env.NEXT_PUBLIC_IGNITER_API_BASE_PATH || '/api/v1',
  })
  .docs({
    openapi,
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API description',
      contact: {
        name: 'Your Team',
        email: 'team@example.com',
        url: 'https://github.com/your-org/your-repo'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    playground: {
      enabled: true,
      route: "/docs",
      security: ({ request }) => {
        // Return false to block
        // Or return an object with headers/query/cookies for requests made via UI
        const token = request.headers.get("authorization")
        if (!token) return false
        return { headers: { Authorization: token } }
      },
    },
  })
  .create()
```

- In production, if `security` is not provided, Studio is automatically disabled to avoid exposure.
- The `security` function is called on each Studio request and should decide whether to allow and which credentials to attach.

## Customizing the UI

Igniter Studio uses Scalar API Reference under the hood. You can customize displayed metadata (title, description, version) through the `info` field in your `.docs()` configuration, as well as configure `servers` and `securitySchemes` to reflect your environment and authentication mechanisms.

## Best practices

- Protect the `/docs` route behind authentication when publicly exposed.
- Don't expose secrets in the client; use the `security` function to inject only what's necessary.
- Generate and publish `openapi.json` alongside your deploy to keep the UI synchronized.

## Common issues

<Accordion title="404 Not Found Error: Studio Documentation Page Unavailable">
  When encountering a 404 error at the `/docs` route, verify that the `playground.route` configuration is correct in your settings and double-check that your application was properly built with Studio functionality enabled.
</Accordion>

<Accordion title="CORS Policy Error: Unable to Load OpenAPI Documentation">
  If you're experiencing CORS errors while trying to fetch the `openapi.json` file, you'll need to either update your server's CORS configuration to allow the request or modify the `security` function to include the proper credentials and headers.
</Accordion>

<Accordion title="Missing API Routes in Documentation">
  When API routes are not appearing in your documentation, execute `igniter generate docs` in your local environment to verify that the `router` component is properly detecting and introspecting all your API endpoints.
</Accordion>

---

### Igniter.js Queues: Reliable Background Processing

**Category**: advanced-features
**URL**: /docs/advanced-features/queues

# Igniter.js Queues: Reliable Background Processing

Many web applications need to perform tasks that are slow or resource-intensive, such as sending emails, processing images, generating reports, or calling third-party APIs. Performing these tasks during a web request leads to long loading times and a poor user experience.

**Igniter.js Queues** is a first-class, integrated system for solving this problem by enabling reliable background job processing. It allows you to offload long-running tasks from the main request thread to a separate worker process, ensuring your API remains fast and responsive.

## The Driver-Based Architecture

The Queues system is built on a modular, driver-based architecture. The core of Igniter.js provides the structure and type-safety, while a driver provides the implementation. The officially recommended driver is for **BullMQ**, which uses Redis for a robust, high-performance job queue.

---

## 1. Setup and Configuration

Setting up Igniter.js Queues involves three steps: installing the necessary peer dependencies, creating the job adapter, and registering it with the Igniter Builder.

### Step A: Install Peer Dependencies

First, you need to install `bullmq` and the Redis client `ioredis`.

```bash
# npm
npm install bullmq ioredis

# yarn
yarn add bullmq ioredis
```

### Step B: Create the Jobs Adapter

Next, create a file at `src/services/jobs.ts` to initialize the BullMQ adapter. This adapter will manage the connection to Redis and provide the tools for defining and processing jobs.

```typescript
// src/services/jobs.ts
import { createBullMQAdapter } from '@igniter-js/core/adapters';
import { store } from '@/services/store'; // Assuming you have an ioredis instance exported from here

/**
 * Job queue adapter for background processing using BullMQ.
 * It connects to your Redis instance to manage job queues.
 */
export const jobs = createBullMQAdapter({
  // The ioredis client instance
  store: store,

  // Optional: BullMQ worker settings
  // In development, it's convenient to autostart the worker.
  // In production, you'll likely run the worker as a separate process.
  autoStartWorker: {
    concurrency: 10, // Process up to 10 jobs concurrently
    debug: process.env.NODE_ENV === 'development',
  },

  // Optional: Default options for all jobs created
  defaultJobOptions: {
    attempts: 3, // Retry a failed job up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Wait 1s before the first retry, 2s for the second, etc.
    },
  },
});
```

### Step C: Register with the Igniter Builder

Finally, enable the Queues system in your main `igniter.ts` file by passing your `jobs` adapter to the `.jobs()` method on the builder.

```typescript
// src/igniter.ts
import { Igniter } from '@igniter-js/core';
import { jobs } from '@/services/jobs'; // 1. Import the jobs adapter
// ... other imports

export const igniter = Igniter
  .context<AppContext>()
  // ... other builder methods
  .jobs(jobs) // 2. Enable the Queues feature
  .create();
```

---

## 2. Defining Jobs with Routers

In Igniter.js, jobs are organized into **Job Routers**. A router is a collection of related jobs grouped under a unique `namespace`.

### Step A: Create a Job Router

Let's define a router for all email-related background tasks.

```typescript
// features/emails/jobs/email.jobs.ts
import { z } from 'zod';
import { jobs } from '@/services/jobs'; // Your BullMQ adapter instance
import { sendEmail } from '@/services/email'; // Your actual email sending logic

export const emailJobRouter = jobs.router({
  /**
   * A unique namespace for this group of jobs.
   * This will be used to invoke jobs (e.g., igniter.jobs.emails.schedule(...))
   */
  namespace: 'emails',

  /**
   * An object containing all jobs for this router.
   */
  jobs: {
    /**
     * Defines a job named 'sendWelcomeEmail'.
     */
    sendWelcomeEmail: jobs.register({
      /**
       * A Zod schema for the job's payload. This ensures that any data
       * sent to this job is type-safe and automatically validated.
       */
      input: z.object({
        userId: z.string(),
        email: z.string().email(),
        name: z.string(),
      }),

      /**
       * The handler function containing the job's logic.
       * This is what the worker process will execute.
       */
      handler: async ({ payload, context }) => {
        // `payload` is fully typed from the Zod schema.
        // `context` is the same global context available in your API actions.
        igniter.logger.info(`Sending welcome email to ${payload.name}`);
        await sendEmail({ to: payload.email, subject: 'Welcome!' });
        return { sentAt: new Date() };
      },
    }),

    // You could define another job here, like 'sendPasswordReset'
  },

  /**
   * Optional: Global lifecycle hooks for all jobs in this router.
   */
  onSuccess: (job) => {
    console.log(`Email job '${job.name}' completed successfully.`);
  },
  onFailure: (job, error) => {
    console.error(`Email job '${job.name}' failed:`, error);
  },
});
```

### Step B: Merge and Register Job Routers

If you have multiple job routers (e.g., for emails, reports, etc.), you can combine them into a single configuration object using `jobs.merge()`.

```typescript
// src/services/jobs.ts (or a central jobs file)
import { emailJobRouter } from '@/features/emails/jobs/email.jobs';
import { reportJobRouter } from '@/features/reports/jobs/report.jobs';
import { jobs } from '@/services/jobs';

export const REGISTERED_JOBS = jobs.merge({
  emails: emailJobRouter,
  reports: reportJobRouter,
});
```

This `REGISTERED_JOBS` object is what you would pass to the builder: `igniter.jobs(REGISTERED_JOBS)`.

---

## 3. Invoking Jobs from Your Application

Jobs are typically invoked from a `mutation` handler after a state change occurs. You use the `igniter.jobs.<namespace>.schedule()` method to enqueue a job.

**Example: Invoking the job after user creation**

```typescript
// src/features/users/controllers/user.controller.ts
import { igniter } from '@/igniter';
import { z } from 'zod';

export const userController = igniter.controller({
  path: '/users',
  actions: {
    create: igniter.mutation({
      path: '/',
      method: 'POST',
      body: z.object({ name: z.string(), email: z.string().email() }),
      handler: async ({ request, context, response }) => {
        const { name, email } = request.body;
        const user = await context.database.user.create({ data: { name, email } });

        // Invoke the background job via its namespace and task name.
        // The request is NOT blocked by this call.
        await igniter.jobs.emails.schedule({
          // The name of the task to run, matching the key in the router.
          task: 'sendWelcomeEmail',

          // The payload is type-checked against the job's Zod schema.
          input: {
            userId: user.id,
            email: user.email,
            name: user.name,
          },

          // Optional: Job-specific options.
          options: {
            delay: 5000, // Delay this job by 5 seconds (5000ms).
          },
        });

        // The handler returns a response to the client immediately.
        return response.created(user);
      },
    }),
  },
});
```

When `schedule()` is called, it adds the job to the Redis queue and returns a promise that resolves immediately. A separate worker process will pick up the job, validate its payload, and execute its handler, ensuring your API endpoint remains fast and responsive.

---

## Next Steps

Now that you understand background job processing with Queues, explore other advanced features:

- [Store](/docs/advanced-features/store) - Learn about caching and pub/sub messaging
- [Realtime](/docs/advanced-features/realtime) - Discover WebSocket and real-time features
- [Plugins](/docs/advanced-features/plugins) - Understand how to extend Igniter.js functionality

---

### Igniter.js Realtime: Live Data, Effortlessly

**Category**: advanced-features
**URL**: /docs/advanced-features/realtime

# Igniter.js Realtime: Live Data, Effortlessly

**Igniter.js Realtime** is the framework's integrated solution for pushing live data from the server to connected clients. Built on top of the robust and simple **Server-Sent Events (SSE)** web standard, it allows you to build real-time features like live UI updates, notifications, and activity feeds with minimal effort and maximum type safety.

The Realtime system is designed around two primary use cases:

1.  **Automatic UI Revalidation:** The most powerful feature. Automatically refetch data on your clients after a mutation on the server, ensuring your UI is always in sync with your backend state.
2.  **Custom Data Streams:** Create dedicated, real-time channels for features like notifications, chat messages, or live data dashboards.

## How It Works: The SSE Connection

Under the hood, when you enable realtime features on the client, the `IgniterProvider` establishes a single, persistent SSE connection to a dedicated endpoint on your Igniter.js server.

-   **Client-Side:** The client subscribes to specific "channels" over this single connection. These channels can be for revalidation events or for custom data streams.
-   **Server-Side:** When an event occurs (e.g., a database record is updated), the server publishes a message to the relevant channel. All clients subscribed to that channel will receive the message instantly.

This approach is highly efficient as it uses a single long-lived connection per client, avoiding the overhead of WebSockets for scenarios where only server-to-client communication is needed.

---

## 1. Automatic UI Updates with `.revalidate()`

This is the "magic" of Igniter.js Realtime. You can trigger a client-side data refetch directly from your backend mutation, ensuring that any user viewing that data sees the update instantly.

### Step 1: The Mutation (Backend)

In your `mutation` handler, after you've successfully modified data, chain the `.revalidate()` method to your response.

`.revalidate()` takes one argument: an array of **query keys** to invalidate. The query key is typically the path to the query action on your client-side `api` object (e.g., `api.users.list` becomes `'users.list'`).

```typescript
// src/features/posts/controllers/post.controller.ts
import { igniter } from '@/igniter';
import { z } from 'zod';

export const postController = igniter.controller({
  path: '/posts',
  actions: {
    // A query to list all posts
    list: igniter.query({
      path: '/',
      handler: async ({ context, response }) => {
        const posts = await context.database.post.findMany();
        return response.success({ posts });
      },
    }),

    // A mutation to create a new post
    create: igniter.mutation({
      path: '/',
      method: 'POST',
      body: z.object({ title: z.string(), content: z.string() }),
      handler: async ({ request, context, response }) => {
        const newPost = await context.database.post.create({ data: request.body });

        // This is the key part!
        // We return a successful response AND tell the client
        // to revalidate any queries associated with the 'posts.list' key.
        return response.created(newPost).revalidate(['posts.list']);
      },
    }),
  },
});
```

### Step 2: The UI Component (Frontend)

On the frontend, you simply use the `useQuery` hook as you normally would. No extra code is needed. The hook automatically listens for revalidation events.

```tsx
// app/components/PostsList.tsx
'use client';

import { api } from '@/igniter.client';

function PostsList() {
  const listPostsQuery = api.posts.list.useQuery();

  if (listPostsQuery.isLoading) {
    return <div>Loading posts...</div>;
  }

  return (
    <ul>
      {listPostsQuery.data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

**What Happens?**
1.  A user is viewing the `PostsList` component.
2.  Another user (or the same user in a different tab) creates a new post, triggering the `create` mutation.
3.  The backend responds with `201 Created` and publishes a `revalidate` event for the `posts.list` key to the central SSE channel.
4.  The `IgniterProvider` on the client receives this event.
5.  It notifies the `api.posts.list.useQuery()` hook that its data is now stale.
6.  The hook automatically refetches the data from the `/posts` endpoint.
7.  The `PostsList` component re-renders with the new post, all in real-time.

---

### Scoped Revalidation: Targeting Specific Clients

Broadcasting a revalidation event to every single client is not always desirable, especially for user-specific data (e.g., updating a user's own profile). Igniter.js allows you to target specific clients by using **scopes**.

A scope is simply a string identifier that you associate with a client connection. Common scopes include a user's ID (`user:123`), their roles (`role:admin`), or a tenant ID (`tenant:abc-corp`).

**Step 1: Define Scopes on the Client**

In your `IgniterProvider`, you must define the scopes for the current client using the `getScopes` prop. This function receives the client context and should return an array of scope strings.

```tsx
// app/providers.tsx
import { IgniterProvider } from '@igniter-js/core/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IgniterProvider
      // ... other props
      // Define the scopes for this connection
      getScopesIds={() => {
        'use server'
        // ctx is the client context (e.g., from useSession())
        const session = getSession()

        return [
          `user:${session.user.id}`, // Scope for this specific user
          ...session.user.roles.map(role => `role:${role}`) // Scopes for each of the user's roles
        ];
      }}
    >
      {children}
    </IgniterProvider>
  );
}
```

**Step 2: Publish to Scopes on the Backend**

Now, in your mutation, you can pass a function as the second argument to `.revalidate()`. This function receives the action's `context` and must return an array of scope strings to target. The revalidation event will **only** be sent to clients whose scopes match.

```typescript
// In a user profile update mutation
updateProfile: igniter.mutation({
  path: '/profile',
  method: 'PATCH',
  body: z.object({ name: z.string() }),
  use: [auth], // Auth procedure adds `user` to context
  handler: async ({ request, context, response }) => {
    const updatedUser = await context.database.user.update({
      where: { id: context.auth.user.id },
      data: { name: request.body.name },
    });

    // This revalidation will only be sent to the user whose ID matches.
    return response.success(updatedUser).revalidate(
      ['users.getProfile'], // The query key to invalidate
      (ctx) => [`user:${ctx.auth.user.id}`] // The target scopes
    );
  }
}),
```

This ensures that when a user updates their profile, only their own client sessions will refetch the profile data, making your real-time updates efficient and secure.

---

## 2. Custom Data Streams

For features like a live notification feed or a chat, you need to push arbitrary data to clients. This is done by creating a dedicated streamable query.

### Step 1: Create a Streamable Query (Backend)

Define a `query` action and set the `stream` property to `true`. This tells Igniter.js that this endpoint is not for fetching data via a single request, but for opening a persistent subscription channel.

The channel name will be automatically created from the query key (e.g., `api.notifications.stream` -> `'notifications.stream'`).

```typescript
// src/features/notifications/controllers/notification.controller.ts
import { igniter } from '@/igniter';

export const notificationController = igniter.controller({
  path: '/notifications',
  actions: {
    // This action establishes a subscription channel.
    stream: igniter.query({
      path: '/stream',
      stream: true, // Mark this action as a stream
      // The handler can be used for authentication or to send an initial confirmation message.
      handler: ({ response }) => {
        return response.success({ status: 'Connected to notifications stream' });
      },
    }),
  },
});
```

### Step 2: Subscribe to the Stream (Frontend)

In your React component, use the `useStream` hook to subscribe to the channel defined in the backend.

```tsx
// app/components/NotificationsBell.tsx
'use client';
import { useState } from 'react';
import { api } from '@/igniter.client';

function NotificationsBell() {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Subscribe to the stream
  api.notifications.stream.useStream({
    onConnect: () => {
      console.log('Successfully connected to notifications stream!');
      setIsConnected(true);
    },
    // This callback runs every time the server sends a message
    onMessage: (newMessage) => {
      console.log('New notification received:', newMessage);
      setNotifications((prev) => [...prev, newMessage.text]);
    },
    onError: (error) => {
      console.error('Stream error:', error);
      setIsConnected(false);
    }
  });

  return (
    <div>
      <span>{isConnected ? '🟢' : '🔴'}</span>
      <span>{notifications.length}</span>
      {/* ... render notifications */}
    </div>
  );
}
```

### Step 3: Publish to the Stream (Backend)

From anywhere in your backend application, you can now publish messages to this stream using the `igniter.realtime.publish()` method.

```typescript
// For example, in another action that triggers a notification
someOtherAction: igniter.mutation({
  handler: async ({ context, response }) => {
    // ... do some work ...

    // Now, publish a message to the 'notifications.stream' channel.
    // All clients subscribed via `useStream` will receive this data.
    igniter.realtime.publish('notifications.stream', {
      text: 'Your report is ready for download!',
      link: '/reports/123',
    });

    return response.success({ status: 'ok' });
  },
}),
```

This completes the loop, allowing you to push any data you want to your clients in real-time.

---

## Next Steps

- [useRealtime](/docs/client-side/use-realtime) - Learn about the client-side realtime hook
- [IgniterProvider](/docs/client-side/igniter-provider) - Configure the realtime provider
- [Igniter.js Store](/docs/advanced-features/store) - Explore caching and messaging

---

### Igniter.js Store: High-Performance Caching and Messaging

**Category**: advanced-features
**URL**: /docs/advanced-features/store

# Igniter.js Store: High-Performance Caching and Messaging

Modern applications often need to perform the same expensive operations repeatedly, such as complex database queries. They also benefit from having different parts of the system communicate with each other without being tightly coupled.

**Igniter.js Store** is a powerful, integrated service that addresses both of these needs. It provides a unified, driver-based API for:

1.  **Key-Value Caching**: A high-performance cache to store and retrieve frequently accessed data, dramatically reducing database load and improving response times.
2.  **Pub/Sub Messaging**: A publisher/subscriber system that allows different parts of your application (or even different microservices) to communicate asynchronously by broadcasting and listening to messages on named channels.

Like other Igniter.js systems, the Store is built on a modular architecture. The officially recommended driver is the **Redis Store Adapter**, which leverages the speed and power of Redis.

---

## 1. Setup and Configuration

To use the Store, you first need to install the necessary dependencies, create the adapter instance, and register it with the Igniter Builder.

### Step A: Install Peer Dependencies

The Redis adapter requires the `ioredis` package.

```bash
# npm
npm install ioredis
npm install @types/ioredis --save-dev

# yarn
yarn add ioredis
yarn add @types/ioredis --dev
```

### Step B: Create the Redis Store Adapter

Create a file at `src/services/store.ts` to initialize the Redis adapter. You'll need a running Redis instance for it to connect to.

```typescript
// src/services/store.ts
import { createRedisStoreAdapter } from '@igniter-js/core/adapters';
import { redis } from './redis'; // Assuming you have your ioredis client instance here

/**
 * Store adapter for data persistence and messaging.
 * Provides a unified interface for caching and pub/sub operations via Redis.
 */
export const store = createRedisStoreAdapter({
  client: redis,
  // Optional: A global prefix for all keys stored by this adapter.
  // Useful for preventing key collisions in a shared Redis instance.
  keyPrefix: 'igniter-app:',
});
```

### Step C: Register with the Igniter Builder

Finally, enable the Store feature in `src/igniter.ts` by passing your adapter to the `.store()` method.

```typescript
// src/igniter.ts
import { Igniter } from '@igniter-js/core';
import { store } from '@/services/store'; // 1. Import the store adapter
// ... other imports

export const igniter = Igniter
  .context<AppContext>()
  // ... other builder methods
  .store(store) // 2. Enable the Store feature
  .create();
```
With this configuration, the `igniter.store` object becomes available throughout your application for direct use, and a `store` property is added to the `context` within your actions and procedures.

---

## 2. Using the Store as a Cache

Caching is one of the most effective ways to boost your API's performance. The cache-aside pattern is a common strategy:

1.  Your application requests data.
2.  It first checks the cache for this data.
3.  **Cache Hit:** If the data is in the cache, it's returned immediately, avoiding a slow database call.
4.  **Cache Miss:** If the data is not in the cache, the application fetches it from the database, stores it in the cache for future requests, and then returns it.

### Key Cache Methods

*   `store.set(key, value, options)`: Stores a value in the cache. The `value` is automatically serialized. The `options` object can include a `ttl` (time-to-live) in seconds.
*   `store.get<T>(key)`: Retrieves a value from the cache. The value is automatically deserialized. You can provide a type `T` for type safety.
*   `store.del(key)`: Deletes a key from the cache.
*   `store.has(key)`: Checks if a key exists in the cache.
*   `store.increment(key)` / `store.decrement(key)`: Atomically increases or decreases a numeric value, perfect for counters.

### Example: Caching a User Profile

Let's implement the cache-aside pattern for an endpoint that fetches a user's profile.

```typescript
// In a controller
getProfile: igniter.query({
  path: '/users/:id',
  handler: async ({ request, context, response }) => {
    const { id } = request.params;
    const cacheKey = `user-profile:${id}`;

    // 1. First, try to get the user from the cache
    const cachedUser = await igniter.store.get<User>(cacheKey);

    if (cachedUser) {
      igniter.logger.info(`Cache HIT for key: ${cacheKey}`);
      return response.success(cachedUser);
    }

    igniter.logger.info(`Cache MISS for key: ${cacheKey}`);

    // 2. If not in cache, fetch from the database
    const user = await context.database.user.findUnique({ where: { id } });

    if (!user) {
      return response.notFound({ message: 'User not found' });
    }

    // 3. Store the result in the cache for next time.
    // Set a TTL of 1 hour (3600 seconds).
    await igniter.store.set(cacheKey, user, { ttl: 3600 });

    return response.success(user);
  },
}),
```

---

## 3. Using the Store for Pub/Sub Messaging

The Publish/Subscribe (Pub/Sub) pattern is a powerful messaging model that allows you to decouple the components of your application.

*   **Publishers** send messages to named "channels" without needing to know who, if anyone, is listening.
*   **Subscribers** listen to specific channels and react when they receive a message.

This is ideal for event-driven architectures, real-time notifications, or broadcasting state changes.

### Key Pub/Sub Methods

*   `store.publish(channel, message)`: Publishes a `message` to a specific `channel`. The message can be any JSON-serializable object.
*   `store.subscribe(channel, handler)`: Subscribes to a `channel` and executes the `handler` function every time a message is received on that channel.

### Example: Invalidating Cache on Role Change

Imagine you have a complex permissions system where user roles are cached. When an admin changes a user's role, you need to invalidate that user's cache everywhere. Pub/Sub is perfect for this.

**Step 1: The Publisher (in a mutation)**
The `mutation` for updating a role publishes an event after a successful database update.

```typescript
// In an admin controller
updateUserRole: igniter.mutation({
  path: '/users/:id/role',
  method: 'PATCH',
  body: z.object({ role: z.string() }),
  handler: async ({ request, context, response }) => {
    const { id } = request.params;
    const { role } = request.body;

    await context.database.user.update({ where: { id }, data: { role } });

    // 1. Publish an event to the 'user-events' channel
    await igniter.store.publish('user-events', {
      type: 'ROLE_UPDATED',
      payload: { userId: id },
    });

    return response.success({ message: 'User role updated.' });
  },
}),
```

**Step 2: The Subscriber (in a service or startup file)**
A listener, initialized when the application starts, subscribes to the `user-events` channel.

```typescript
// src/services/event-listeners.ts
import { igniter } from '@/igniter';

export function initializeEventListeners() {
  // 2. Subscribe to the channel
  igniter.store.subscribe('user-events', (message) => {
    // This handler will run for every message published to 'user-events'
    console.log('Received user event:', message);

    if (message.type === 'ROLE_UPDATED') {
      const { userId } = message.payload;
      const cacheKey = `user-profile:${userId}`;
      console.log(`Role updated for user ${userId}, clearing cache key: ${cacheKey}`);

      // 3. React to the event
      store.del(cacheKey);
    }
  });

  console.log("User event listeners initialized.");
}

// Call initializeEventListeners() when your application starts up.
```
With this pattern, the `updateUserRole` action doesn't need to know anything about the caching logic. It just fires an event, and the decoupled listener handles the side effects, leading to cleaner, more maintainable code.

---

## Next Steps

- [Igniter.js Queues](/docs/advanced-features/queues) - Learn about background job processing
- [Igniter.js Realtime](/docs/advanced-features/realtime) - Discover real-time features
- [Igniter.js Plugins](/docs/advanced-features/plugins) - Explore the plugin system

---

### OpenAPI Documentation

**Category**: advanced-features
**URL**: /docs/advanced-features/openapi-documentation

# OpenAPI Documentation

Igniter.js provides automatic OpenAPI spec generation and an optional interactive UI to explore your API. This page explains how to configure, generate, and serve documentation, and how to customize metadata and security.

## Overview

- Generate `openapi.json` via CLI: `igniter generate docs`.
- Serve Igniter Studio (Scalar API Reference) in development with `igniter dev --docs`, or in production via the Core `playground` config.
- Customize metadata via the `.docs()` method in your Igniter builder (`info`, `servers`, `securitySchemes`, and `playground`).

## Generate the OpenAPI spec

You can generate the OpenAPI specification for your app using the CLI:

```bash
npx @igniter-js/cli generate docs --output ./docs/openapi.json
```

- Use the `--ui` flag to also generate an HTML page with Scalar API Reference UI:

```bash
npx @igniter-js/cli generate docs --output ./docs --ui
```

This will create `./docs/openapi.json` and `./docs/index.html`.

## Serve documentation with Igniter Studio

During development, you can enable Igniter Studio on your local server with:

```bash
npx @igniter-js/cli dev --docs --docs-output ./docs
```

- `--docs` enables OpenAPI generation and the interactive UI.
- `--docs-output` controls where to save/serve files. By default, Studio is exposed at `/docs`.

In production, you can enable it via the Core configuration (see below) to serve `openapi.json` and Scalar UI directly from your app.

## Configure via Igniter Builder

You can configure documentation metadata and security using the `.docs()` method in your Igniter builder:

```ts
import { Igniter } from '@igniter-js/core'
import openapi from './docs/openapi.json'

export const igniter = Igniter
  .context(createIgniterAppContext())
  .store(store)
  .logger(logger)
  .config({
    baseURL: process.env.NEXT_PUBLIC_IGNITER_API_URL || 'http://localhost:3000',
    basePATH: process.env.NEXT_PUBLIC_IGNITER_API_BASE_PATH || '/api/v1',
  })
  .docs({
    openapi,
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API description",
      contact: {
        name: 'Your Team',
        email: 'team@example.com',
        url: 'https://github.com/your-org/your-repo'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [{ url: "https://api.example.com", description: "Prod" }],
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    playground: {
      enabled: true,
      route: "/docs",
      security: ({ request }) => {
        // Return false to block or an object with headers to allow
        return { headers: { Authorization: request.headers.get("authorization") ?? "" } }
      },
    },
  })
  .create()
```

- The `openapi` field should reference your generated OpenAPI specification file.
- `info`, `servers`, and `securitySchemes` feed into the OpenAPI document and override any existing metadata.
- `playground.enabled` and `playground.route` control where the UI is served.
- The `playground.security` function lets you block access or inject headers (such as a token) for calls made by the UI.

## Production security

If no `security` function is provided, Igniter Studio is automatically disabled in production to avoid unintended exposure. To enable it safely, provide the `security` function and implement your authorization logic (e.g., validate session/cookies or headers). In development, the Studio remains accessible by default.

## Best practices

- Define `servers` to reflect your environments (dev/stage/prod).
- Use `securitySchemes` to standardize authentication (Bearer, API Key, etc.).
- In production, always implement `playground.security` and consider protecting the `/docs` route behind authentication.
- Generate `openapi.json` in CI to keep documentation up-to-date.

## Common Issues

<Accordion title="Router Not Found Error">
  When using `igniter generate docs`, ensure your router is properly exported from your application entry point.
</Accordion>

<Accordion title="Documentation UI Loading Issues">
  If the UI fails to load, verify that the `openapi.json` file path is correct and your CORS/security settings allow the documentation to be fetched.
</Accordion>

<Accordion title="Studio Disabled in Production Environment">
  To enable Igniter Studio in production, configure the `playground.security` option in your `DocsConfig` to implement proper access controls.
</Accordion>

---

### Guiding LLMs with llms.txt

**Category**: code-agents
**URL**: /docs/code-agents/llms-txt

# Guiding LLMs with llms.txt

The `llms.txt` file is an emerging industry standard designed to help Large Language Models (LLMs) and AI agents efficiently understand and index the content of a website. For Igniter.js, we provide a comprehensive, supercharged `llms.txt` file directly on our official documentation site.

This file is a powerful training resource for any Code Agent, designed to give it a deep and immediate understanding of the entire Igniter.js framework. This is a cornerstone of our "AI-Friendly" philosophy.

The file is available at: **https://igniterjs.com/llms.txt**

## More Than Just a Sitemap

Unlike a typical `llms.txt` which might only contain a list of links, the Igniter.js `llms.txt` is a **complete, single-file representation of our entire documentation**.

It is structured in two main parts:

1.  **Project Information & Navigation:** The top of the file provides a structured list of all documentation pages, organized by category, similar to a sitemap. This gives an AI a quick overview of the framework's structure and key concepts.
2.  **Full Documentation Content:** Following the navigation section, the file contains the complete, raw Markdown content of every single documentation page, concatenated together.

### Why is this so powerful?

By providing the full content in one file, you can give an AI Agent a "brain dump" of everything there is to know about Igniter.js in a single pass. This allows the agent to:

-   Gain deep contextual understanding without needing to crawl multiple pages.
-   Answer questions about the framework with high accuracy by referencing the embedded content.
-   Generate code that is consistent with the examples and best practices found in the documentation.

## How to Use It

To train your Code Agent, simply provide it with the URL `https://igniterjs.com/llms.txt` as a primary source of context. Whether you are using a tool like Claude, Cursor, or an API, this single URL can serve as the foundation for its knowledge about Igniter.js.

**Example Prompt for an AI Chat:**

> "Please act as an expert developer for the Igniter.js framework. Use this URL as your primary source of knowledge: https://igniterjs.com/llms.txt. Now, based on that context, explain the difference between a `Controller` and a `Procedure`."

By leveraging this resource, you can ensure your Code Agent is a true Igniter.js expert, ready to assist you with high-quality, context-aware code and advice.

---

### Igniter.js MCP Server

**Category**: code-agents
**URL**: /docs/code-agents/mcp-server

# Igniter.js MCP Server

## Overview

The **Igniter.js MCP Server** transforms your project into an AI-native development platform. Unlike traditional frameworks that were built for humans, Igniter.js was designed from the ground up to be understood and utilized by AI agents through the Model Context Protocol (MCP).

Think of it as giving your AI coding assistant X-ray vision into your entire project. Instead of making educated guesses about your code, AI agents can actually *ask* your codebase questions and get real, accurate answers.

## What Makes This Revolutionary?

Most AI coding tools today are sophisticated autocomplete systems. They pattern-match against billions of lines of code to predict what you probably want to write next. But with Igniter.js MCP Server, your AI agent develops actual understanding of your project architecture, data flow, business logic, and the relationships between features.

This isn't just about code completion—it's about having an intelligent conversation with your codebase.

## Tools

The Igniter.js MCP Server exposes a comprehensive set of tools that give AI agents deep insight into your project:

### Development Lifecycle
- `start_dev_server`: Start the development server with live reloading and client generation
- `build_project`: Compile your project for production deployment  
- `run_tests`: Execute your test suite with filtering and watch options
- `generate_schema`: Generate type-safe client from your API router
- `generate_docs`: Create OpenAPI documentation with interactive UI

### Code Intelligence
- `analyze_file`: Deep analysis of file structure, imports, exports, and TypeScript errors
- `analyze_feature`: Comprehensive feature analysis with statistics and health metrics
- `find_implementation`: Locate where symbols, functions, and classes are implemented
- `explore_source`: Detailed exploration of code with context and dependencies
- `trace_dependency_chain`: Map complete dependency chains from usage to implementation

### Scaffolding Tools
- `generate_feature`: Scaffold complete feature modules with controllers and procedures
- `generate_controller`: Create new controllers within existing features
- `generate_procedure`: Generate middleware procedures for reusable logic

### Project Management
- `create_task`: Create development tasks with priorities and assignments
- `list_tasks`: View and filter tasks by status, priority, or assignee
- `update_task_status`: Track progress and completion
- `get_task_statistics`: Analyze workload and performance metrics

### AI Agent Collaboration  
- `delegate_to_agent`: Delegate tasks to specialized agents (Claude, Gemini, GPT)
- `check_delegation_status`: Monitor progress of delegated work
- `monitor_agent_tasks`: Real-time monitoring with logs and analytics
- `find_delegation_candidates`: Identify tasks suitable for agent delegation

### Memory and Knowledge
- `store_memory`: Persist insights, patterns, and architectural decisions
- `search_memories`: Query stored knowledge with filters and tags
- `relate_memories`: Create relationships between different knowledge types
- `visualize_memory_graph`: Generate diagrams showing knowledge connections

### GitHub Integration
- `create_github_issue`: Create issues with templates and labels
- `search_github_issues`: Find and filter issues across repositories
- `get_pull_request`: Analyze PR details, changes, and status
- `search_code`: Search code across GitHub repositories



## Sample Prompts

Once connected to your MCP-compatible AI agent, you can have natural conversations about your project:

### Project Analysis
- "Analyze the user authentication feature and show me any potential issues"
- "What are all the API endpoints and their current health status?"
- "Show me the dependency chain for the user management system"

### Development Tasks
- "Generate a new user management feature with authentication"
- "Create a controller for handling payment processing in the billing feature"
- "Build the project for production and show me any errors"

### Code Understanding
- "Explain how the payment processing flow works in this codebase"
- "What would break if I refactor the User model to use a different ID type?"
- "Show me all the places where authentication might fail"

### Collaborative Development
- "Delegate the API testing task to a Claude agent and monitor progress"
- "What patterns has the team learned about error handling in this project?"
- "Store this architectural decision about why we chose this database structure"

## Integrating with AI Tools

AI tools have different ways of integrating MCP servers. The configuration contains a command for starting the server that'll be executed by the respective tool.

### Cursor

#### Add via Cursor Settings UI
- Open **Cursor Settings**
- Select **MCP** in the settings sidenav  
- Click **+ Add new global MCP server**
- Add the Igniter.js configuration:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

#### Project Configuration
For project-specific configuration, create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx", 
      "args": ["@igniter-js/mcp-server"],
      "env": {
        "IGNITER_PROJECT_ROOT": "."
      }
    }
  }
}
```

### VS Code Copilot

Create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

### Windsurf

Add via **Windsurf Settings** > **Cascade** > **Add Server**:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]  
    }
  }
}
```

### Claude Desktop

Create the configuration file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

### Claude Code (Terminal)

```bash
claude mcp add igniter npx @igniter-js/mcp-server
```

## Environment Variables

Configure these environment variables for enhanced functionality:

```bash
# For agent delegation capabilities
ANTHROPIC_API_KEY=your_claude_key
GOOGLE_API_KEY=your_gemini_key  
OPENAI_API_KEY=your_gpt_key

# For GitHub integration
GITHUB_TOKEN=your_github_token

# For memory and task persistence
DATABASE_URL=your_database_connection
```

## The AI-Native Advantage

### Beyond Code Completion

Traditional AI coding assistants are pattern-matching systems. Igniter.js MCP Server enables true understanding:

- **Architectural Awareness**: Your AI agent understands your project's structure and design decisions
- **Business Logic Context**: It knows your domain rules and can apply them to new features
- **Impact Analysis**: It can predict what breaks when you change something
- **Memory Persistence**: It remembers your conversations and architectural decisions

### Multi-Agent Collaboration

Why stop at one AI agent? With Igniter.js MCP Server, you can orchestrate teams of specialized agents:

- **Research Agents** that excel at understanding requirements
- **Implementation Agents** that write clean, maintainable code  
- **Testing Agents** that focus on quality assurance
- **Documentation Agents** that keep everything up to date

Each agent has access to the same rich context about your project but can focus on what they do best.

### The Network Effect

As more developers use Igniter.js with MCP, the entire ecosystem becomes smarter. Successful patterns get reinforced, common problems get solved once and shared, and the framework evolves based on real usage from thousands of AI-assisted development sessions.

## Getting Started Today

The future of AI-native development isn't some distant vision—it's available right now. Every Igniter.js starter comes with MCP Server pre-configured and ready to use with your favorite AI coding assistant.

Create your first AI-native project:

```bash
npx create-igniter@latest my-app
cd my-app
npm run dev
```

Then connect your preferred AI agent and start having real conversations with your codebase.

## Real-World Impact

**Week 1**: Instead of spending hours understanding authentication patterns, ask your AI agent. It analyzes your codebase and explains the architectural decisions and security considerations.

**Month 1**: Need to refactor a critical component? Your AI agent predicts exactly what will break, suggests migration strategies, and helps write the migration scripts.

**Month 3**: New team member joins? Your AI agent gives them a personalized tour of the codebase, explaining business logic and architectural decisions specific to your project.

**Month 6**: Planning a major feature? Your AI agent analyzes the entire codebase, identifies potential conflicts, suggests improvements, and helps break work into manageable tasks.

This isn't about replacing developers—it's about giving developers superpowers. It's about turning every development session into a collaborative conversation with intelligent agents who understand your code as well as you do.

---

The age of AI-native development has begun. Start your journey with Igniter.js today and experience the future of collaborative coding.



---

### Initialize a Project with Lia

**Category**: code-agents
**URL**: /docs/code-agents/initialize-project

# Initialize a Project with Lia

One of the most powerful features of the Igniter.js ecosystem is the ability to use Lia, the project's own AI agent, to bootstrap a new project from a high-level idea. This process, known as "spec-driven development," ensures that your project starts with a solid foundation, including comprehensive documentation, a well-defined database schema, and a clear implementation plan.

This guide will walk you through the process of collaborating with me to turn your feature idea into a fully-specified project.

## The Spec-Driven Workflow

The initialization process follows a structured, three-step workflow designed to refine your idea and produce a detailed plan. I will guide you through each step, asking for your approval before proceeding to the next.

1.  **Requirements Gathering (`requirements.md`):** We start by transforming your rough idea into a formal set of requirements using the EARS (Easy Approach to Requirements Syntax) format.
2.  **Design Document (`design.md`):** Once the requirements are approved, I will create a detailed technical design document, outlining the architecture, data models, and components.
3.  **Task List (`tasks.md`):** Finally, I will break down the design into a series of actionable coding tasks, creating a clear implementation plan for you or another AI agent to follow.

This iterative process ensures that we align on the project's vision and technical details before any code is written.

## How to Start a New Project

To begin, you simply need to describe your project idea to me in a clear and concise way. I will handle the rest.

### Step 1: Provide Your Initial Idea

Start a conversation with a prompt that outlines the core concept of your application.

**Example Prompt:**

> "Lia, I want to build a simple blog application. It should allow users to create, read, update, and delete posts. Only authenticated users should be able to create posts. The posts should have a title, content, and an author."

### Step 2: Review and Refine the Requirements

Based on your prompt, I will create the first draft of the `requirements.md` file. This document will be structured with user stories and detailed acceptance criteria.

I will then ask for your feedback. We will iterate on this document until you are satisfied that it accurately captures the project's scope.

**My response will be:**

> "I've created the initial requirements document for the blog application. Please review it. Do the requirements look good? If so, we can move on to the design."

### Step 3: Approve the Design and Task List

After you approve the requirements, I will proceed to create the `design.md` and, subsequently, the `tasks.md` files, asking for your approval at each stage.

By the end of this process, you will have a `.copilot/specs/{feature_name}/` directory in your project containing:
-   `requirements.md`: What the system should do.
-   `design.md`: How the system will be built.
-   `tasks.md`: A step-by-step plan for implementation.

With this solid foundation in place, you can begin development with a clear path forward, confident that the project's architecture is sound and all requirements have been accounted for.

---

### Introduction to Code Agents

**Category**: code-agents
**URL**: /docs/code-agents/introduction

# Introduction to Code Agents

Welcome to the Code Agents section of the Igniter.js documentation. This section is dedicated to exploring how you can leverage the power of Artificial Intelligence and Large Language Models (LLMs) to accelerate your development workflow with Igniter.js.

Code Agents are AI-powered tools, editors, and workflows designed to assist you in writing, understanding, and debugging code. They can range from simple code completion helpers to sophisticated systems capable of understanding your project's architecture and generating complex features from a high-level description.

Igniter.js was designed with an "AI-Friendly" philosophy. Its explicit, type-safe, and modular architecture makes it particularly well-suited for AI tools to understand and interact with. This means you can get more accurate and helpful responses from your chosen Code Agent.

## Supported Code Agents

Below are guides for integrating Igniter.js with popular AI-native editors and tools. A key aspect of this integration is providing the agent with our official `llms.txt`, a comprehensive training document that makes the AI an expert on the Igniter.js framework.

Furthermore, our official project templates come pre-configured with specific instructions for these agents. When you create a new project from a template, it already includes the necessary `AGENT.md` files, so the AI is ready to work on your project out-of-the-box with no additional setup.

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/docs/code-agents/cursor" className="block p-4 rounded-lg border hover:primary/10 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/cursor_light.svg" alt="Cursor Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Cursor</h3>
          <p className="text-sm text-muted-foreground">Learn how to configure Cursor with project-specific rules.</p>
        </div>
      </div>
    </a>
    <a href="/docs/code-agents/windsurf" className="block p-4 rounded-lg border hover:primary/10 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/windsurf-logo.svg" alt="Windsurf Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Windsurf</h3>
          <p className="text-sm text-muted-foreground">Configure Windsurf's Cascade AI with workspace rules to understand your project's.</p>
        </div>
      </div>
    </a>
    <a href="/docs/code-agents/claude-code" className="block p-4 rounded-lg border hover:primary/10 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/claude-ai-icon.svg" alt="Claude AI Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Claude</h3>
          <p className="text-sm text-muted-foreground">Use Anthropic's Claude models via its CLI to assist in code generation and project maintenance.</p>
        </div>
      </div>
    </a>
    <a href="/docs/code-agents/zed-editor" className="block p-4 rounded-lg border hover:primary/10 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/zed-logo.svg" alt="Zed Editor Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Zed Editor</h3>
          <p className="text-sm text-muted-foreground">Leverage the high-performance Zed editor and its integrated AI features for a fast development loop.</p>
        </div>
      </div>
    </a>
    <a href="/docs/code-agents/gemini-cli" className="block p-4 rounded-lg border hover:primary/10 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/gemini.svg" alt="Gemini Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Gemini CLI</h3>
          <p className="text-sm text-muted-foreground">Interact with Google's Gemini models directly from your terminal.</p>
        </div>
      </div>
    </a>
    <a href="/docs/code-agents/vscode-copilot" className="block p-4 rounded-lg border hover:primary/10 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/copilot.svg" alt="GitHub Copilot Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">VSCode Copilot</h3>
          <p className="text-sm text-muted-foreground">Get the most out of GitHub Copilot in VSCode.</p>
        </div>
      </div>
    </a>
</div>


---

### Next.js Starter Rules for Code Agents

**Category**: code-agents
**URL**: /docs/code-agents/nextjs-starter-rules

# Next.js Starter Rules for Code Agents

The **Igniter.js Starter for Next.js** comes pre-configured with specific rules for each Code Agent, allowing them to fully understand your project and utilize the integrated MCP Server. This page provides the necessary configurations for each agent.

## Download Rules

### Complete Next.js Starter

<div className="my-6">
  <a href="/templates/starter-nextjs" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
    Create Next.js Project with MCP Server
  </a>
</div>

The starter automatically includes:
- MCP Server configured
- Rules for all Code Agents
- Integrated memory system
- Task management
- Agent delegation

## Rules for Each Code Agent

### Cursor

**File**: `.cursor/rules/igniter-nextjs.mdc`

```markdown
---
alwaysApply: true
---
# Igniter.js Next.js Expert

You are an expert in development with Igniter.js and Next.js. This project uses the Igniter.js MCP Server to provide complete access to code and functionalities.

## Project Architecture

- **Framework**: Next.js 15+ with App Router
- **API Layer**: Igniter.js with end-to-end type-safety
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis via @igniter-js/adapter-redis
- **Background Jobs**: BullMQ via @igniter-js/adapter-bullmq
- **AI Integration**: Complete MCP Server

## Directory Structure

```
src/
├── features/           # Feature-based architecture
│   ├── [feature]/
│   │   ├── controllers/  # API actions (query, mutation, stream)
│   │   ├── components/   # React components
│   │   └── types.ts      # TypeScript types
├── igniter.ts          # Main Igniter.js configuration
├── igniter.router.ts   # API router assembly
├── igniter.client.ts   # Auto-generated type-safe client
└── app/                # Next.js App Router
    ├── api/            # API routes (handled by Igniter.js)
    └── [routes]/       # Page routes
```

## Available MCP Tools

Use these tools to interact with the project:

### Development
- `dev` - Start development server
- `build` - Compile the project
- `test` - Run tests

### Code Analysis
- `analyze_file` - Analyze specific file
- `analyze_feature` - Complete feature analysis
- `find_implementation` - Find implementations
- `explore_source` - Explore source code

### Task Management
- `create_task` - Create new task
- `list_tasks` - List existing tasks
- `update_task_status` - Update status
- `delegate_to_agent` - Delegate to specialized agent

### Memory and Knowledge
- `store_memory` - Store knowledge
- `search_memories` - Search memories
- `relate_memories` - Relate memories

## Development Patterns

1. **Feature-First**: Always organize code by features
2. **Type Safety**: Use TypeScript strict mode
3. **API Actions**: Use query/mutation/stream from Igniter.js
4. **Server Components**: Prefer RSC over client components
5. **Validation**: Use Zod for input validation

## Usage Examples

### Create New Feature
```typescript
// 1. Create directory structure
// 2. Implement controller with actions
// 3. Register in main router
// 4. Use type-safe client
```

### Code Analysis
```typescript
// Use analyze_feature to understand structure
analyze_feature({
  featurePath: "src/features/user-management",
  includeStats: true
})
```

### Task Management
```typescript
// Create tasks for development
create_task({
  title: "Implement user validation",
  content: "Add Zod validation for required fields",
  priority: "high",
  assignee: "agent"
})
```

## Additional Resources

- **Documentation**: https://igniterjs.com/docs
- **MCP Server**: Use integrated tools
- **Type Safety**: Auto-generated client in igniter.client.ts
- **Hot Reload**: Development server with turbopack

Always use the available MCP tools to interact with the project intelligently and efficiently.
```

### Claude Code

**File**: `.cursorrules`

```markdown
# Igniter.js Next.js Expert

You are an expert in development with Igniter.js and Next.js. This project uses the Igniter.js MCP Server to provide complete access to code and functionalities.

## Project Architecture

- **Framework**: Next.js 15+ with App Router
- **API Layer**: Igniter.js with end-to-end type-safety
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis via @igniter-js/adapter-redis
- **Background Jobs**: BullMQ via @igniter-js/adapter-bullmq
- **AI Integration**: Complete MCP Server

## Directory Structure

```
src/
├── features/           # Feature-based architecture
│   ├── [feature]/
│   │   ├── controllers/  # API actions (query, mutation, stream)
│   │   ├── components/   # React components
│   │   └── types.ts      # TypeScript types
├── igniter.ts          # Main Igniter.js configuration
├── igniter.router.ts   # API router assembly
├── igniter.client.ts   # Auto-generated type-safe client
└── app/                # Next.js App Router
    ├── api/            # API routes (handled by Igniter.js)
    └── [routes]/       # Page routes
```

## Available MCP Tools

Use these tools to interact with the project:

### Development
- `dev` - Start development server
- `build` - Compile the project
- `test` - Run tests

### Code Analysis
- `analyze_file` - Analyze specific file
- `analyze_feature` - Complete feature analysis
- `find_implementation` - Find implementations
- `explore_source` - Explore source code

### Task Management
- `create_task` - Create new task
- `list_tasks` - List existing tasks
- `update_task_status` - Update status
- `delegate_to_agent` - Delegate to specialized agent

### Memory and Knowledge
- `store_memory` - Store knowledge
- `search_memories` - Search memories
- `relate_memories` - Relate memories

## Development Patterns

1. **Feature-First**: Always organize code by features
2. **Type Safety**: Use TypeScript strict mode
3. **API Actions**: Use query/mutation/stream from Igniter.js
4. **Server Components**: Prefer RSC over client components
5. **Validation**: Use Zod for input validation

## Usage Examples

### Create New Feature
```typescript
// 1. Create directory structure
// 2. Implement controller with actions
// 3. Register in main router
// 4. Use type-safe client
```

### Code Analysis
```typescript
// Use analyze_feature to understand structure
analyze_feature({
  featurePath: "src/features/user-management",
  includeStats: true
})
```

### Task Management
```typescript
// Create tasks for development
create_task({
  title: "Implement user validation",
  content: "Add Zod validation for required fields",
  priority: "high",
  assignee: "agent"
})
```

## Additional Resources

- **Documentation**: https://igniterjs.com/docs
- **MCP Server**: Use integrated tools
- **Type Safety**: Auto-generated client in igniter.client.ts
- **Hot Reload**: Development server with turbopack

Always use the available MCP tools to interact with the project intelligently and efficiently.
```

### VS Code Copilot

**File**: `.github/copilot/README.md`

```markdown
# Igniter.js Next.js Project

This project uses the Igniter.js framework with Next.js and includes a complete MCP Server for AI Agent integration.

## Architecture

- **Frontend**: Next.js 15+ with App Router
- **Backend**: Igniter.js with type-safe API
- **Database**: Prisma + PostgreSQL
- **Caching**: Redis
- **Background Jobs**: BullMQ
- **AI Integration**: MCP Server

## Structure

```
src/
├── features/           # Feature-based architecture
├── igniter.ts          # Igniter.js configuration
├── igniter.router.ts   # API router
└── igniter.client.ts   # Auto-generated client
```

## MCP Tools

The project includes an MCP Server with tools for:
- Code analysis
- Task management
- CLI command execution
- Dependency investigation
- Memory system

## Patterns

1. **Feature-First**: Organize by features
2. **Type Safety**: Use TypeScript strict
3. **API Actions**: query/mutation/stream
4. **Server Components**: Prefer RSC
5. **Validation**: Zod for input

## Resources

- Documentation: https://igniterjs.com/docs
- MCP Server: Integrated tools
- Type Safety: Auto-generated client
- Hot Reload: Turbopack
```

### Windsurf

**File**: `.windsurf/README.md`

```markdown
# Igniter.js Next.js Project

This project uses the Igniter.js framework with Next.js and includes a complete MCP Server for AI Agent integration.

## Architecture

- **Frontend**: Next.js 15+ with App Router
- **Backend**: Igniter.js with type-safe API
- **Database**: Prisma + PostgreSQL
- **Caching**: Redis
- **Background Jobs**: BullMQ
- **AI Integration**: MCP Server

## Structure

```
src/
├── features/           # Feature-based architecture
├── igniter.ts          # Igniter.js configuration
├── igniter.router.ts   # API router
└── igniter.client.ts   # Auto-generated client
```

## MCP Tools

The project includes an MCP Server with tools for:
- Code analysis
- Task management
- CLI command execution
- Dependency investigation
- Memory system

## Patterns

1. **Feature-First**: Organize by features
2. **Type Safety**: Use TypeScript strict
3. **API Actions**: query/mutation/stream
4. **Server Components**: Prefer RSC
5. **Validation**: Zod for input

## Resources

- Documentation: https://igniterjs.com/docs
- MCP Server: Integrated tools
- Type Safety: Auto-generated client
- Hot Reload: Turbopack
```

### Zed Editor

**File**: `.zed/settings.json`

```json
{
  "ai": {
    "rules": [
      "You are an expert in Igniter.js and Next.js",
      "This project uses MCP Server for AI integration",
      "Architecture: Next.js 15+ + Igniter.js + Prisma + Redis",
      "Structure: Feature-based with controllers and actions",
      "Patterns: Type safety, RSC, Zod validation",
      "Use available MCP tools for analysis",
      "Organize code by features, not by type",
      "Prefer Server Components over Client Components"
    ]
  }
}
```

### Gemini CLI

**File**: `.gemini/config.md`

```markdown
# Igniter.js Next.js Project

## Architecture
- **Framework**: Next.js 15+ with App Router
- **API Layer**: Igniter.js with type-safety
- **Database**: Prisma ORM + PostgreSQL
- **Caching**: Redis via adapter
- **Background Jobs**: BullMQ via adapter
- **AI Integration**: Complete MCP Server

## Structure
```
src/
├── features/           # Feature-based architecture
├── igniter.ts          # Igniter.js configuration
├── igniter.router.ts   # API router assembly
└── igniter.client.ts   # Auto-generated client
```

## MCP Tools
- Code and feature analysis
- Task management
- CLI command execution
- Integrated memory system
- Agent delegation

## Patterns
1. **Feature-First**: Organize by features
2. **Type Safety**: TypeScript strict mode
3. **API Actions**: query/mutation/stream
4. **Server Components**: Prefer RSC
5. **Validation**: Zod for input

## Resources
- Documentation: https://igniterjs.com/docs
- MCP Server: Integrated tools
- Type Safety: Auto-generated client
- Hot Reload: Turbopack
```

## Automatic Download

### 1. Create Project with Starter

```bash
# Use the official starter (recommended)
npx create-igniter@latest starter-nextjs

# Or clone directly
git clone https://github.com/felipebarcelospro/igniter-js.git
cd igniter-js/apps/starter-nextjs
npm install
```

### 2. Rules Already Included

The starter automatically includes:
- `.cursor/rules/` - For Cursor
- `.cursorrules` - For Claude Code
- `.github/copilot/` - For VS Code Copilot
- `.windsurf/` - For Windsurf
- `.zed/` - For Zed Editor
- `.gemini/` - For Gemini CLI

### 3. Automatic Configuration

```bash
# The starter automatically configures:
npm run dev          # Development server
npm run build        # Compilation
npm run test         # Tests
npm run lint         # Linting
```

## Manual Configuration (Existing Projects)

### 1. Install MCP Server

```bash
npm install @igniter-js/mcp-server
```

### 2. Configure Igniter.js

```typescript
// src/igniter.ts
import { createMcpServer } from '@igniter-js/mcp-server';

export const igniter = Igniter
  .context<IgniterAppContext>()
  .mcp(createMcpServer({
    enableMemoryManager: true,
    enableTaskManager: true,
    enableAgentDelegation: true
  }))
  .build();
```

### 3. Create Rules

Copy the appropriate rules for your favorite Code Agent from the examples above.

## Next Steps

1. **Choose the Starter**: Use the official Next.js starter
2. **Configure the Code Agent**: Add the appropriate rules
3. **Explore the MCP Server**: Use the integrated tools
4. **Develop with AI**: Take advantage of the complete integration

---

The Igniter.js Starter for Next.js provides a complete AI-native development experience, with all the necessary rules for your favorite Code Agent and a fully integrated MCP Server. Start by creating a new project and discover how AI can accelerate your development!



---

### Using Claude with Igniter.js

**Category**: code-agents
**URL**: /docs/code-agents/claude-code

# Using Claude with Igniter.js

Claude, by Anthropic, is a powerful family of large language models that can be used as an effective code agent for developing Igniter.js applications. Its strong reasoning and code generation capabilities make it a great assistant for writing, reviewing, and maintaining your projects.

You can interact with Claude through its official command-line tool, `@anthropic-ai/claude-code`, or via its web interface and API.

## Method 1: Training Claude on the Igniter.js Framework

This method gives Claude a deep, foundational understanding of the entire Igniter.js framework by pointing it to our official, comprehensive documentation file. This is ideal when working on an existing project that wasn't created from one of our templates.

### Step 1: Create a Context File
In the root of your project, create a new file named `AGENT.md`. The Claude Code CLI automatically looks for this file to use as context.

### Step 2: Add the Context Content
Open `AGENT.md` and paste the following content. This rule instructs Claude's AI to use our `llms.txt` as its primary source of knowledge.

<div className="my-4">
    <a href="https://igniterjs.com/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      Open llms.txt in New Tab
    </a>
</div>

```markdown
# Igniter.js Framework Expert

You are an expert developer specializing in Igniter.js. Your primary source of knowledge for all framework-related questions and code generation is the official documentation, which can be found in its entirety at: https://igniterjs.com/llms.txt.

Always adhere to the patterns and best practices described in that document.
```

### Step 3: Start the Agent
Once your `AGENT.md` is set up, you can start the interactive session.

```bash
# Install the CLI if you haven't already
npm install -g @anthropic-ai/claude-code

# Start the agent in your project root
claude
```

## Method 2: Use an Official Igniter.js Template (The Easy Way)

The easiest way to work with Claude is by starting your project with one of our official templates. These templates come pre-configured with detailed `AGENT.md` files that the Claude Code CLI automatically detects and uses for context.

### 🚀 Enhanced with MCP Server

Our official templates now include a **MCP Server** that provides Claude with direct access to your project through standardized tools. This means Claude can:

- **Analyze your codebase** with deep understanding of your project structure
- **Execute development commands** like starting the dev server or running tests
- **Generate code scaffolding** for features, controllers, and procedures
- **Manage tasks and projects** with built-in project management tools
- **Access your project's memory** to remember architectural decisions and patterns

### Adding MCP Server to Claude Code

To enable the MCP Server integration with Claude Code:

```bash
# Add the Igniter.js MCP Server to Claude Code
claude mcp add igniter npx @igniter-js/mcp-server

# Verify it's installed
claude mcp list
```

This gives Claude direct access to powerful development tools that understand your Igniter.js project deeply.
- **Manage tasks** through integrated task management
- **Execute commands** directly in your project
- **Access project memory** for context-aware development
- **Delegate work** to specialized AI agents

Learn more about our [MCP Server](/docs/code-agents/mcp-server) and [Next.js Starter Rules](/docs/code-agents/nextjs-starter-rules).

### Recommended Project Templates

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/templates/starter-nextjs" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Next.js Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-featured application with end-to-end type safety.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-tanstack-start" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/tanstack.svg" alt="TanStack Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">TanStack Start App</h3>
          <p className="text-sm text-muted-foreground">A modern full-stack application with type-safe routing.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-bun-react-app" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/bun.svg" alt="Bun Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Bun + React Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-stack, type-safe application with Bun and React.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-express-rest-api" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/expressjs_dark.svg" alt="Express Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Express REST API</h3>
          <p className="text-sm text-muted-foreground">A robust REST API built with Express.js.</p>
        </div>
      </div>
    </a>
</div>

---

### Using Cursor with Igniter.js

**Category**: code-agents
**URL**: /docs/code-agents/cursor

# Using Cursor with Igniter.js

Cursor is an AI-first code editor designed for pair-programming with a powerful AI. To make Cursor an expert on your Igniter.js project, you can configure it with "Rules" that provide persistent context.

## Method 1: Training Cursor on the Igniter.js Framework

This method gives Cursor a deep, foundational understanding of the entire Igniter.js framework by pointing it to our official, comprehensive documentation file. This is ideal when working on an existing project that wasn't created from one of our templates.

### Step 1: Create a Rules Directory
In the root of your project, create a new directory: `.cursor/rules/`.

### Step 2: Create a Rule File
Inside that directory, create a new file named `igniter-framework.mdc`.

### Step 3: Add the Rule Content
Open `igniter-framework.mdc` and paste the following content. This rule instructs Cursor's AI to use our `llms.txt` as its primary source of knowledge.

<div className="my-4">
    <a href="https://igniterjs.com/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      Open llms.txt in New Tab
    </a>
</div>

```markdown
---
alwaysApply: true
---
# Igniter.js Framework Expert

You are an expert developer specializing in Igniter.js. Your primary source of knowledge for all framework-related questions and code generation is the official documentation, which can be found in its entirety at: https://igniterjs.com/llms.txt.

Always adhere to the patterns and best practices described in that document.
```

## Method 2: Use an Official Igniter.js Template (The Easy Way)

The easiest way to work with Cursor is by starting your project with one of our official templates. These templates come pre-configured with detailed `AGENT.md` files that Cursor automatically detects and uses as a project-specific rule.

### 🚀 Enhanced with MCP Server

Our official templates now include a **MCP Server** that provides Cursor with direct access to your project through standardized tools. This means Cursor can:

- **Analyze your codebase** with deep understanding of your project structure
- **Execute development commands** like starting the dev server or running tests
- **Generate code scaffolding** for features, controllers, and procedures
- **Manage tasks and projects** with built-in project management tools
- **Access your project's memory** to remember architectural decisions and patterns
- **Delegate work** to specialized AI agents for complex tasks

### Adding MCP Server to Cursor

To enable the MCP Server integration with Cursor:

#### Option 1: Global Configuration
- Open **Cursor Settings**
- Select **MCP** in the settings sidenav  
- Click **+ Add new global MCP server**
- Add the Igniter.js configuration:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

#### Option 2: Project-Specific Configuration
Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx", 
      "args": ["@igniter-js/mcp-server"],
      "env": {
        "IGNITER_PROJECT_ROOT": "."
      }
    }
  }
}
```

This gives Cursor direct access to powerful development tools that understand your Igniter.js project deeply.

Learn more about our [MCP Server](/docs/code-agents/mcp-server) and [Next.js Starter Rules](/docs/code-agents/nextjs-starter-rules).

### Recommended Project Templates

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/templates/starter-nextjs" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Next.js Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-featured application with end-to-end type safety.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-tanstack-start" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/tanstack.svg" alt="TanStack Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">TanStack Start App</h3>
          <p className="text-sm text-muted-foreground">A modern full-stack application with type-safe routing.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-bun-react-app" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/bun.svg" alt="Bun Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Bun + React Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-stack, type-safe application with Bun and React.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-express-rest-api" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/expressjs_dark.svg" alt="Express Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Express REST API</h3>
          <p className="text-sm text-muted-foreground">A robust REST API built with Express.js.</p>
        </div>
      </div>
    </a>
</div>


---

### Using Google's Gemini CLI with Igniter.js for AI-Powered Development

**Category**: code-agents
**URL**: /docs/code-agents/gemini-cli

# Using Google's Gemini CLI with Igniter.js for AI-Powered Development

Google's Gemini models can be powerful allies in your development workflow, especially when accessed through a command-line interface (CLI). By integrating a Gemini CLI with an AI-friendly framework like Igniter.js, you can automate tasks, generate code, and query your codebase directly from the terminal. This guide shows you how to provide the best context to the Gemini CLI for maximum accuracy and efficiency.

## Training Gemini to be an Igniter.js Expert

To get high-quality, accurate results from the Gemini CLI, you need to provide it with the right context. Igniter.js is designed to make this easy. The most effective way to do this is by "piping" your context directly into the CLI prompt.

### Method 1: Use an Official Igniter.js Template (The Easy Way)

The easiest and most effective way to use the Gemini CLI is with a project started from an official Igniter.js template. These templates are pre-configured with a detailed `AGENT.md` file that acts as a perfect, project-specific instruction manual for the AI.

You can use a simple terminal command to feed this local context directly to Gemini.

#### 🚀 Enhanced with MCP Server

Our official templates now include a **MCP Server** that provides Gemini CLI with direct access to your project through standardized tools. This means Gemini can:

- **Analyze code** using built-in analysis tools
- **Manage tasks** through integrated task management
- **Execute commands** directly in your project
- **Access project memory** for context-aware development
- **Delegate work** to specialized AI agents

Learn more about our [MCP Server](/docs/code-agents/mcp-server) and [Next.js Starter Rules](/docs/code-agents/nextjs-starter-rules).

**Example Prompt for a Templated Project:**

```bash
# Use `cat` to pipe the project-specific AGENT.md file as context
cat AGENT.md | gemini "Based on the provided project instructions, generate a new Vitest test file for the `igniter.router.ts` file, ensuring it covers the basic functionality."
```

### Recommended Project Templates

Our templates come ready with everything you need to start building, including the `AGENT.md` file you can pipe into the Gemini CLI.

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/templates/starter-nextjs" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Next.js Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-featured application with end-to-end type safety.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-tanstack-start" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/tanstack.svg" alt="TanStack Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">TanStack Start App</h3>
          <p className="text-sm text-muted-foreground">A modern full-stack application with type-safe routing.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-bun-react-app" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/bun.svg" alt="Bun Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Bun + React Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-stack, type-safe application with Bun and React.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-express-rest-api" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/expressjs_dark.svg" alt="Express Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Express REST API</h3>
          <p className="text-sm text-muted-foreground">A robust REST API built with Express.js.</p>
        </div>
      </div>
    </a>
</div>

### Method 2: Training on the Global Igniter.js Framework

For existing projects that don't have an `AGENT.md` file, you can train the Gemini CLI on the entire Igniter.js framework by providing it with our official `llms.txt` file. This single file contains all our documentation and is the perfect source of truth.

You can use `curl` to fetch the `llms.txt` content and pipe it directly to the Gemini CLI as context.

<div className="my-4">
    <a href="https://igniterjs.com/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      Open llms.txt in New Tab
    </a>
</div>

**Example Initial Prompt:**

```bash
# Fetch the llms.txt content and pipe it to the Gemini CLI as context
curl -s https://igniterjs.com/llms.txt | gemini "You are an expert developer specializing in Igniter.js. Use the text I've provided as your primary source of knowledge. All your future responses must be based on the best practices and patterns found in that document. Now, help me create a new feature."
```


---

### Using VS Code Copilot with Igniter.js

**Category**: code-agents
**URL**: /docs/code-agents/vscode-copilot

# Using VS Code Copilot with Igniter.js

GitHub Copilot is one of the most popular AI code assistants, deeply integrated into Visual Studio Code. To make it an expert on your Igniter.js project, you can provide it with persistent context through custom instructions.

## Method 1: Training Copilot on the Igniter.js Framework

This method gives Copilot a deep, foundational understanding of the entire Igniter.js framework by pointing it to our official, comprehensive documentation file. This is the recommended approach for any Igniter.js project.

### Step 1: Create a Copilot Directory
In the root of your project, create a new directory for Copilot's instructions:

```bash
mkdir -p .github/copilot
```

### Step 2: Create the Instructions File
Inside the new directory, create a Markdown file named `instructions.md`.

### Step 3: Add the Instruction Content
Open `.github/copilot/instructions.md` and paste the following content. This rule instructs Copilot to use our `llms.txt`—a single file containing our entire documentation—as its primary source of knowledge for all chat interactions.

<div className="my-4">
    <a href="https://igniterjs.com/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      Open llms.txt in New Tab
    </a>
</div>

```markdown
# Igniter.js Framework Expert

You are an expert developer specializing in the Igniter.js framework. Your primary source of knowledge for all framework-related questions and code generation is the official documentation, which can be found in its entirety at: https://igniterjs.com/llms.txt.

Always adhere to the patterns and best practices described in that document. Before answering any question, consult this source to ensure accuracy.
```

With this file in place, Copilot Chat will automatically use this context in every conversation, leading to highly accurate and relevant assistance.

## Method 2: Use an Official Igniter.js Template (The Easy Way)

The easiest way to work with Copilot is by starting your project with one of our official templates. These templates come pre-configured with detailed `AGENT.md` files that are compatible with Copilot's context mechanisms.

When you open an Igniter.js template project in VS Code, Copilot can use the provided `AGENT.md` file as a project-specific instruction set with **no additional setup required**.

### 🚀 Enhanced with MCP Server

Our official templates now include a **MCP Server** that provides Copilot with direct access to your project through standardized tools. This means Copilot can:

- **Analyze your codebase** with deep understanding of your project structure
- **Execute development commands** like starting the dev server or running tests
- **Generate code scaffolding** for features, controllers, and procedures
- **Manage tasks and projects** with built-in project management tools
- **Access your project's memory** to remember architectural decisions and patterns
- **Delegate work** to specialized AI agents for complex tasks

### Adding MCP Server to VS Code

To enable the MCP Server integration with VS Code:

Create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

This gives VS Code Copilot direct access to powerful development tools that understand your Igniter.js project deeply.
- **Access project memory** for context-aware development
- **Delegate work** to specialized AI agents

Learn more about our [MCP Server](/docs/code-agents/mcp-server) and [Next.js Starter Rules](/docs/code-agents/nextjs-starter-rules).

### Recommended Project Templates

Our templates come ready with everything you need to start building, including the AI instructions that Copilot will automatically use.

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/templates/starter-nextjs" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Next.js Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-featured application with end-to-end type safety.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-tanstack-start" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/tanstack.svg" alt="TanStack Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">TanStack Start App</h3>
          <p className="text-sm text-muted-foreground">A modern full-stack application with type-safe routing.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-bun-react-app" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/bun.svg" alt="Bun Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Bun + React Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-stack, type-safe application with Bun and React.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-express-rest-api" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/expressjs_dark.svg" alt="Express Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Express REST API</h3>
          <p className="text-sm text-muted-foreground">A robust REST API built with Express.js.</p>
        </div>
      </div>
    </a>
</div>

---

### Using Windsurf with Igniter.js for AI-Powered Development

**Category**: code-agents
**URL**: /docs/code-agents/windsurf

# Using Windsurf with Igniter.js for AI-Powered Development

Windsurf, the AI-native code editor from Codeium, can dramatically accelerate your TypeScript and Node.js development. To unlock its full potential, you need to provide it with the right context. This guide shows you how to train Windsurf to be an Igniter.js expert, leading to more accurate code generation, better suggestions, and a streamlined AI-powered workflow.

## Method 1: Train Windsurf on the Igniter.js Core

This method gives Windsurf's AI a deep, foundational understanding of the entire Igniter.js ecosystem by pointing it to our official, comprehensive documentation file. This is the recommended approach for any existing project that was not created from an official template.

### Step 1: Create a Workspace Rules Directory

In the root of your project, create a new directory for Windsurf's rules. This specific folder is where Windsurf looks for context files.

```bash
mkdir -p .windsurf/rules
```

### Step 2: Create a Rule File

Inside that directory, create a new Markdown file. You can name it `igniter-core.md`.

### Step 3: Add the Rule Content

Open `.windsurf/rules/igniter-core.md` and paste the following content. This rule instructs Windsurf's AI to use our `llms.txt`—a single file containing our entire documentation—as its primary source of knowledge.

<div className="my-4">
    <a href="https://igniterjs.com/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      Open llms.txt in New Tab
    </a>
</div>

```markdown
# Igniter.js Expert

You are an expert developer specializing in Igniter.js. Your primary source of knowledge for all framework-related questions and code generation is the official documentation, which can be found in its entirety at: https://igniterjs.com/llms.txt.

Always adhere to the patterns and best practices described in that document. Before answering any question, consult this source to ensure accuracy.
```

With this rule in place, every interaction you have with Windsurf's AI will be informed by the complete Igniter.js documentation, leading to highly accurate and relevant assistance.

## Method 2: Use an Official Igniter.js Template (The Easy Way)

The easiest way to work with Windsurf is by starting your project with one of our official templates. These starters are pre-configured to be "AI-Friendly" and work seamlessly with AI-native editors.

When you create a project from a template, it automatically includes a detailed `AGENT.md` file in the root directory. Windsurf is designed to detect and use files like `AGENT.md` as a project-specific instruction set. This means that when you open an Igniter.js template project in Windsurf, the AI is **already trained** on your specific codebase's architecture and conventions with **no additional setup required**.

### 🚀 Enhanced with MCP Server

Our official templates now include a **MCP Server** that provides Windsurf with direct access to your project through standardized tools. This means Windsurf can:

- **Analyze your codebase** with deep understanding of your project structure
- **Execute development commands** like starting the dev server or running tests
- **Generate code scaffolding** for features, controllers, and procedures
- **Manage tasks and projects** with built-in project management tools
- **Access your project's memory** to remember architectural decisions and patterns
- **Delegate work** to specialized AI agents for complex tasks

### Adding MCP Server to Windsurf

To enable the MCP Server integration with Windsurf:

#### Option 1: Via Windsurf MCP Plugin Store (Recommended)
Use the Igniter.js MCP plugin from the Windsurf MCP Plugin Store for the simplest setup.

#### Option 2: Via Windsurf Settings UI
- Open **Windsurf Settings** (via **Windsurf - Settings** > **Advanced Settings** or **Command Palette** > **Open Windsurf Settings Page**)
- Select **Cascade** in the settings sidenav
- Click **Add Server**
- Add the Igniter.js configuration:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

#### Option 3: Global Configuration
Manually add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "Igniter": {
      "command": "npx",
      "args": ["@igniter-js/mcp-server"]
    }
  }
}
```

This gives Windsurf direct access to powerful development tools that understand your Igniter.js project deeply.

Learn more about our [MCP Server](/docs/code-agents/mcp-server) and [Next.js Starter Rules](/docs/code-agents/nextjs-starter-rules).

### Recommended Project Templates

Our templates come ready with everything you need to start building, including the AI instructions that Windsurf will automatically use.

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/templates/starter-nextjs" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Next.js Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-featured application with end-to-end type safety.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-tanstack-start" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/tanstack.svg" alt="TanStack Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">TanStack Start App</h3>
          <p className="text-sm text-muted-foreground">A modern full-stack application with type-safe routing.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-bun-react-app" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/bun.svg" alt="Bun Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Bun + React Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-stack, type-safe application with Bun and React.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-express-rest-api" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/expressjs_dark.svg" alt="Express Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Express REST API</h3>
          <p className="text-sm text-muted-foreground">A robust REST API built with Express.js.</p>
        </div>
      </div>
    </a>
</div>

---

### Using Zed Editor with Igniter.js for AI-Powered Development

**Category**: code-agents
**URL**: /docs/code-agents/zed-editor

# Using Zed Editor with Igniter.js for AI-Powered Development

[Zed](https://zed.dev) is a high-performance, multiplayer code editor built for speed and efficiency. Its integrated AI features and first-class TypeScript support make it a powerful choice for developing Igniter.js applications. This guide explains how to provide Zed's AI with the right context to improve its accuracy and turn it into an Igniter.js expert.

What makes Zed particularly effective for Igniter.js is its **automatic detection of context files**, which simplifies the process of training its AI.

## Method 1: Manual Context Setup for Existing Projects

If you're working on an existing project that wasn't created from an Igniter.js template, you can still train Zed's AI. This method teaches the AI about the core Igniter.js concepts and APIs by using our comprehensive documentation file.

### Step 1: Get the Igniter.js Core Context

Our official `llms.txt` file contains the entire Igniter.js documentation, making it the perfect training document for any AI code assistant.

<div className="my-4">
    <a href="https://igniterjs.com/llms.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      Open llms.txt in New Tab
    </a>
</div>

### Step 2: Provide Context to Zed's AI Chat

Copy the entire content from the `llms.txt` file and paste it into Zed's AI chat panel at the beginning of your session. This gives the AI a strong foundation for understanding the Igniter.js.

**Example Initial Prompt:**

> "You are an expert developer specializing in Igniter.js. Use the following text, which contains the entire framework documentation, as your primary source of knowledge: [PASTE THE COPIED CONTENT HERE]. All your future responses must be based on the best practices and patterns found in that document. Now, help me create a new controller."

## Method 2: Use an Official Igniter.js Template (The Easy Way)

This is the highly recommended approach. All official Igniter.js project templates are designed to be "AI-Friendly" and work seamlessly with modern tools like the Zed editor.

When you create a project from one of our templates, it automatically includes a detailed `AGENT.md` file in the root directory. Zed is intelligent enough to **automatically detect and use `AGENT.md`** as a project-level instruction set for its AI.

This means that when you open an Igniter.js template project in Zed, the AI is **already trained** on your specific codebase's architecture and conventions with **no additional setup required**.

### 🚀 Enhanced with MCP Server

Our official templates now include a **MCP Server** that provides Zed with direct access to your project through standardized tools. This means Zed can:

- **Analyze code** using built-in analysis tools
- **Manage tasks** through integrated task management
- **Execute commands** directly in your project
- **Access project memory** for context-aware development
- **Delegate work** to specialized AI agents

Learn more about our [MCP Server](/docs/code-agents/mcp-server) and [Next.js Starter Rules](/docs/code-agents/nextjs-starter-rules).

### Recommended Project Templates

Our templates come ready with everything you need to start building, including the AI instructions that Zed will automatically use for code generation and analysis.

<div className="grid grid-cols-1 gap-4 my-8">
    <a href="/templates/starter-nextjs" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/nextjs_icon_dark.svg" alt="Next.js Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Next.js Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-featured application with end-to-end type safety.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-tanstack-start" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/tanstack.svg" alt="TanStack Logo" className="h-6 flex-shrink-0 grayscale" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">TanStack Start App</h3>
          <p className="text-sm text-muted-foreground">A modern full-stack application with type-safe routing.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-bun-react-app" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/bun.svg" alt="Bun Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Bun + React Full-Stack App</h3>
          <p className="text-sm text-muted-foreground">A full-stack, type-safe application with Bun and React.</p>
        </div>
      </div>
    </a>
    <a href="/templates/starter-express-rest-api" className="block p-4 rounded-lg border hover:bg-accent/50 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <span className="size-12 border bg-secondary dark:bg-transparent border-border rounded-md p-1 flex items-center justify-center">
          <img src="https://svgl.app/library/expressjs_dark.svg" alt="Express Logo" className="h-6 flex-shrink-0 grayscale invert-0 dark:invert" />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Express REST API</h3>
          <p className="text-sm text-muted-foreground">A robust REST API built with Express.js.</p>
        </div>
      </div>
    </a>
</div>

---

## Optional

Additional blog content and tutorials:

- [Announcing Igniter.js MCP Server: Native AI Integration for Modern Development](/blog/announcements/announcing-igniter-mcp-server): Blog post
- [Introducing Igniter Studio: The Interactive API Playground with an AI-Powered Future](/blog/announcements/introducing-igniter-studio): Blog post
- [Introducing Igniter.js Templates: Kickstart Your Next Project in Minutes](/blog/announcements/introducing-igniter-templates): Blog post
- [Introducing Igniter.js: The Type-Safe Full-Stack Framework for Modern Web Development](/blog/tutorials/introducing-igniter-js): Blog post
- [Build a Production-Ready, Real-Time Chat App with Igniter.js, Next.js, and Prisma](/blog/tutorials/real-time-chat-with-igniterjs): Blog post