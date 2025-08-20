import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SITE_FAQ_ITEMS } from '@/content/site/site-faq-items'
import { cn } from '@/utils/cn'
import { HelpCircleIcon } from 'lucide-react'

export const SiteFaqSection = ({ className }: { className?: string }) => (
  <div className={cn('w-full space-y-16 py-16', className)}>
    <div className="container max-w-screen-md mx-auto flex gap-4 flex-col items-center text-center">
      <HelpCircleIcon
        className="size-10 mb-4 stroke-2 mx-auto text-primary"
        fill="currentColor"
        fillOpacity={0.15}
      />

      <h4 className="mx-auto w-full max-w-xl text-balance text-center text-2xl font-semibold !leading-[1.2] tracking-tight sm:text-3xl md:text-4xl">
        Frequently Asked <br /> Questions
      </h4>
    </div>

    <div className="container mx-auto max-w-screen-md">
      <Accordion type="single" collapsible className="w-full bg-secondary/60">
        {SITE_FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={index}
            value={'index-' + index}
            className="bg-transparent"
          >
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </div>
)
