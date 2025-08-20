// import { AppConfig } from '@/boilerplate.config'
import { cn } from '@/utils/cn'
import { AudioWaveformIcon } from 'lucide-react'
// import { useTheme } from 'next-themes'

export function Logo({
  className,
  // size = 'icon',
}: {
  className?: string
  size?: 'icon' | 'full'
}) {
  // Tips: You can uncomment the following code to use an image logo.
  // const { resolvedTheme } = useTheme()

  // const modes = AppConfig.brand.logos
  // const currentMode = (resolvedTheme || AppConfig.theme) as 'dark' | 'light'
  // const logo = modes[size][currentMode]

  // return <img alt="Logo" className={cn('size-8', className)} src={logo} />

  return (
    <div className="text-primary text-xs space-x-2">
      <AudioWaveformIcon className={cn('size-5', className)} />
    </div>
  )
}
