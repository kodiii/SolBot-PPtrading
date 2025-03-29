'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportTrades } from '@/lib/export-utils'
import type { Trade } from '@/lib/types'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  trades: Trade[]
}

export function ExportButton({ trades }: ExportButtonProps): React.ReactElement {
  const handleExport = async (format: 'csv' | 'json' | 'excel'): Promise<void> => {
    const timestamp = new Date().toISOString().split('T')[0]
    await exportTrades(trades, format, `trades_${timestamp}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
