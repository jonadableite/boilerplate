import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { MoveRight } from 'lucide-react'
import { Link } from 'next-view-transitions'

export const SiteCTA = ({ className }: { className?: string }) => (
  <div className={cn('w-full py-16', className)}>
    <div className="container max-w-screen-md mx-auto grid grid-cols-[1fr_auto] gap-8 items-center">
      <div className="space-y-2">
        <h3 className="text-balance text-xl md:text-2xl font-semibold !leading-[1.2] tracking-tight">
          Pronto para transformar
          <br />
          seu negócio com IA?
        </h3>
        <p className="text-muted-foreground text-sm md:text-base">
          Automatize processos, gerencie leads e impulsione suas vendas com nossa plataforma completa.
        </p>
      </div>
      <div className="flex items-end h-full">
        <Button className="gap-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
          <Link href="/auth">
            Começar Agora <MoveRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  </div>
)
