import { AuthForm } from '@/@saas-boilerplate/features/auth/presentation/components/auth-form.component'
import { AppConfig } from '@/boilerplate.config'

export const metadata = {
  title: `Login | ${AppConfig.name}`,
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'

export default function Page() {
  return <AuthForm />
}
