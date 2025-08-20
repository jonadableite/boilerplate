import { SiteMainFooter } from './(components)/site-main-footer'
import { SiteMainHeader } from './(components)/site-main-header'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <SiteMainHeader />
      <div>{children}</div>
      <SiteMainFooter />
    </div>
  )
}
