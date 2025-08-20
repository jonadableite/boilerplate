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