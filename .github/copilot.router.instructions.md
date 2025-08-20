# Custom Instructions Routing

This document defines the process and guidelines for creating and using instruction files for the AI agent in the SaaS Boilerplate project. It functions as a router that helps determine which instruction file to use based on the context of the request.

## Available Instructions Map

Use the mapping below to determine which instruction file applies to each case:

| Context | Instruction File | Description |
|---------|-----------------|-------------|
| **SaaS Boilerplate (General)** | `.github/copilot.saas-boilerplate.instructions.md` | Project overview, architecture, and directory structure |
| **Next.js and React** | `.github/copilot.next.instructions.md` | Standards and practices for development with Next.js 15 App Router |
| **Igniter and Core API** | `.github/copilot.igniter.instructions.md` | API implementation, controllers, and procedures |
| **Data Table Components** | `.github/copilot.data-table.instructions.md` | Implementation of data tables with sorting, filtering, and pagination |
| **Page Components** | `.github/copilot.page.instructions.md` | Page component system for dashboards |
| **Feature Development** | `.github/copilot.feature.instructions.md` | Complete feature creation process |
| **Form Building** | `.github/copilot.form.instructions.md` | Creation of robust and validated forms |
| **Email Templates** | `.github/copilot.email.instructions.md` | Creation and registration of email templates |
| **Testing** | `.github/copilot.test.instructions.md` | Testing strategies and patterns |
| **Code Review** | `.github/copilot.review.instructions.md` | Code review process and feedback |

## Process for Creating New Instructions

Follow these steps when creating a new instruction file for the AI agent:

### 1. Context Analysis

- **Examine existing instructions** to understand the style and structure used in the project.
- **Identify the specific purpose** of the new instruction, ensuring it doesn't duplicate existing instructions.
- **Verify the project's principles** (SOLID, Clean Code, TypeScript, etc.) to maintain consistency.

### 2. Objective Definition

- **Clearly define the scope** of the instruction (e.g., "How to implement webhooks in SaaS Boilerplate").
- **Identify the target audience** (frontend developers, backend developers, etc.).
- **List the expected outcomes** that the instruction should provide.

### 3. Content Structuring

- **Start with a clear and descriptive title**:
  ```markdown
  # Guide for Implementing Webhooks in SaaS Boilerplate
  ```

- **Add a brief contextualized introduction**:
  ```markdown
  This guide explains how to implement secure and scalable webhooks in SaaS Boilerplate,
  following the Igniter.js architecture patterns and project best practices.
  ```

- **Structure the content clearly** with numbered sections:
  ```markdown
  ## 1. Webhooks Overview
  
  ## 2. Data Model and Prisma Schema
  
  ## 3. Controller Implementation
  
  ## 4. Security and Validation
  
  ## 5. User Interface for Management
  
  ## 6. Testing and Debugging
  ```

- **Include concrete code examples**:
  ```markdown
  ### Example Prisma Schema for Webhook
  
  ```typescript
  model Webhook {
    id          String   @id @default(cuid())
    name        String
    url         String
    secret      String
    events      String[]
    isActive    Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
    organizationId String
  }
  ```
  ```

### 4. Prompt Engineering Strategies

- **Use concise technical language** in English for code and comments.
- **Employ clear language** for explanations and instructions.
- **Use lists and numbering** for sequential steps.
- **Include code blocks** with typing and comments.
- **Provide complete implementation examples** that can be copied and adapted.

### 5. Review and Finalization

- **Verify technical accuracy** of the content.
- **Confirm adherence to project conventions** (naming, file structure, etc.).
- **Ensure the instruction is self-contained** and doesn't require external knowledge.
- **Include references to other instruction files** when relevant.

## Complete Example of a New Instruction

Here's a simplified example of the structure for a new instruction on webhook implementation:

```markdown
# Guide for Implementing Webhooks in SaaS Boilerplate

## Overview
This guide provides detailed instructions for implementing a complete webhook system
in SaaS Boilerplate using the Igniter.js architecture.

## 1. Data Model
### 1.1 Prisma Schema
```typescript
model Webhook {
  id          String   @id @default(cuid())
  // ...fields
}
```

### 1.2 Interfaces and Types
```typescript
export interface WebhookEvent {
  // ...properties
}
```

## 2. API Implementation
### 2.1 Controller
```typescript
export const webhookController = igniter.controller({
  // ...configuration
})
```

## 3. User Interface
### 3.1 Webhook Form
```tsx
export function WebhookForm() {
  // ...implementation
}
```

## 4. Testing and Debugging
...
```

## Instruction Maintenance

- **Periodic review**: Update existing instructions when there are changes to the architecture or project standards.
- **Consistency**: Maintain consistent style and format across instruction files.
- **Backlinking**: Add cross-references between related instructions to facilitate navigation.

By following these guidelines, you'll contribute to a cohesive and useful set of instructions that will allow the AI agent to provide more accurate and contextualized assistance.
