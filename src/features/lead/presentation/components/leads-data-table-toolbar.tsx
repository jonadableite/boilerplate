'use client'

import {
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterMenu,
  DataTableExportMenu,
} from '@/components/ui/data-table/data-table-toolbar'
import { LeadBulkImportDialog } from './lead-bulk-import-dialog'

export function LeadDataTableToolbar() {
  return (
    <DataTableToolbar className="flex items-center justify-between">
      <DataTableSearch placeholder="Buscar leads por nome ou e-mail" />

      <div className="flex items-center gap-2">
        <DataTableFilterMenu />
        <LeadBulkImportDialog />
        <DataTableExportMenu />
      </div>
    </DataTableToolbar>
  )
}
