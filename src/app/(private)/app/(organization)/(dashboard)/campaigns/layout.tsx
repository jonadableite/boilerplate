import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Campanhas - WhatsApp Disparos',
  description: 'Gerencie suas campanhas de disparo em massa no WhatsApp'
}

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {children}
    </div>
  )
}