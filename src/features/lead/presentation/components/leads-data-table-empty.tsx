import { Link } from 'next-view-transitions'

import { AnimatedEmptyState } from '@/components/ui/animated-empty-state'
import { PlusIcon, Users2Icon } from 'lucide-react'
import { LeadUpsertSheet } from './lead-upsert-sheet'

export function LeadDataTableEmpty() {
  return (
    <AnimatedEmptyState className="border-none h-full flex-grow">
      <AnimatedEmptyState.Carousel>
        <Users2Icon className="size-6" />
        <span className="bg-secondary h-3 w-[16rem] rounded-full"></span>
      </AnimatedEmptyState.Carousel>

      <AnimatedEmptyState.Content>
        <AnimatedEmptyState.Title>Nenhum lead encontrado</AnimatedEmptyState.Title>
        <AnimatedEmptyState.Description>
          Parece que ninguém interagiu com seu bot ainda. Volte mais tarde!
        </AnimatedEmptyState.Description>
      </AnimatedEmptyState.Content>

      <AnimatedEmptyState.Actions>
        <LeadUpsertSheet
          triggerButton={
            <AnimatedEmptyState.Action variant="default" className="gap-2">
              <PlusIcon className="size-4" />
              Adicionar seu primeiro lead
            </AnimatedEmptyState.Action>
          }
        />
        <AnimatedEmptyState.Action variant="outline" asChild>
          <Link href="/help/getting-started/">Saiba mais</Link>
        </AnimatedEmptyState.Action>
      </AnimatedEmptyState.Actions>
    </AnimatedEmptyState>
  )
}
