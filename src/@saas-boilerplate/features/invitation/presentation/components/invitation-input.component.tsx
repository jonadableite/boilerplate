'use client'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PlusSquareIcon, TrashIcon } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

type InvitationContextType = {
  form: UseFormReturn<any>
  invites: ReturnType<typeof useFieldArray>
  maxInvites: number
  validateInvite: (index: number) => boolean
  addInvite: () => void
}

const ItemInvitationSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member', 'owner']),
})

type Invitation = z.infer<typeof ItemInvitationSchema>

const InvitationContext = createContext<InvitationContextType | undefined>(
  undefined,
)

const useInvitationContext = () => {
  const context = useContext(InvitationContext)
  if (!context)
    throw new Error(
      'useInvitationContext must be used within InvitationProvider',
    )
  return context
}

// Validation Schema
export const invitationSchema = ItemInvitationSchema.extend({})
  .array()
  .min(1, 'Add at least one member')
  .max(5, 'Maximum of 5 members allowed')

// Hooks
const useValidateInviteEntry = (index: number) => {
  const [error, setError] = useState<string | null>(null)
  const { form } = useInvitationContext()

  const validate = useCallback(() => {
    const email = form.getValues(`invites.${index}.email`)
    const role = form.getValues(`invites.${index}.role`)

    const result = ItemInvitationSchema.safeParse({ email, role })

    if (!result.success) {
      setError(result.error.errors[0].message)
      return false
    }

    setError(null)
    return true
  }, [form, index])

  return { error, validate }
}

// Components
const InviteRow = ({ index }: { index: number }) => {
  const { invites } = useInvitationContext()
  const { error, validate } = useValidateInviteEntry(index)

  return (
    <div className="grid grid-cols-[1fr_200px_auto] gap-4 p-4 border-b border-border last:border-b-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <FormField
              name={`invites.${index}.email`}
              render={({ field }) => (
                <FormItem variant="unstyled">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter team member email"
                      {...field}
                      onBlur={() => validate()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </TooltipTrigger>
        {error && (
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        )}
      </Tooltip>

      <FormField
        name={`invites.${index}.role`}
        render={({ field }) => (
          <FormItem variant="unstyled">
            <Select
              onValueChange={(value) => {
                field.onChange(value)
                validate()
              }}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger variant="outline" className="rounded-full h-9">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <Button
        size="icon"
        variant="outline"
        onClick={() => invites.remove(index)}
      >
        <TrashIcon />
      </Button>
    </div>
  )
}

const InvitesList = () => {
  const { invites } = useInvitationContext()

  return (
    <main>
      {invites.fields.map((field, index) => (
        <InviteRow key={field.id} index={index} />
      ))}
    </main>
  )
}

const InvitesFooter = () => {
  const { invites, maxInvites, addInvite } = useInvitationContext()

  return (
    <footer className="flex border-t border-border p-4">
      {invites.fields.length < maxInvites && (
        <Button type="button" variant="link" onClick={addInvite}>
          <PlusSquareIcon />
          Add member
        </Button>
      )}
    </footer>
  )
}

interface InvitationInputProps {
  form: UseFormReturn<any>
  maxInvites?: number
  value?: Invitation[]
  defaultValue?: Invitation[]
  onChange?: (invites: Invitation[]) => void
}

/**
 * Component for managing invitations with email and role inputs
 * @param form - Form instance from react-hook-form
 * @param maxInvites - Maximum number of invites allowed
 * @param value - Controlled value for invites
 * @param defaultValue - Default invites to initialize with
 * @param onChange - Callback when invites change
 */
export function InvitationInput({
  form,
  maxInvites = 5,
  value,
  defaultValue,
  onChange,
}: InvitationInputProps) {
  const invites = useFieldArray({
    control: form.control,
    name: 'invites',
  })

  useEffect(() => {
    if (defaultValue && invites.fields.length === 0) {
      defaultValue.forEach((invite) => invites.append(invite))
    }
  }, [defaultValue, invites])

  useEffect(() => {
    if (value) {
      invites.replace(value)
    }
  }, [value, invites])

  useEffect(() => {
    if (onChange) {
      const invitesList = invites.fields.map((field) => ({
        email: form.getValues(`invites.${field.id}.email`),
        role: form.getValues(`invites.${field.id}.role`) as Invitation['role'],
      }))

      onChange(invitesList)
    }
  }, [invites.fields, onChange, form])

  const validateInvite = useCallback(
    (index: number) => {
      const email = form.getValues(`invites.${index}.email`)
      const role = form.getValues(`invites.${index}.role`)

      const result = ItemInvitationSchema.safeParse({ email, role })

      return result.success
    },
    [form],
  )

  const addInvite = useCallback(() => {
    const lastIndex = invites.fields.length - 1
    if (lastIndex >= 0 && !validateInvite(lastIndex)) return
    invites.append({
      email: '',
      role: 'member',
      status: 'pending',
      organizationId: '',
    })
  }, [invites, validateInvite])

  const contextValue = {
    form,
    invites,
    maxInvites,
    validateInvite,
    addInvite,
  }

  return (
    <InvitationContext.Provider value={contextValue}>
      <TooltipProvider>
        <section className="border border-border rounded-md">
          <InvitesList />
          <InvitesFooter />
        </section>
      </TooltipProvider>
    </InvitationContext.Provider>
  )
}
