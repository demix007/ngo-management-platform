import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { ReactNode } from 'react'
import { exportToCSV, exportToJSON } from '../utils/export'

interface DrillDownModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  data?: Array<Record<string, unknown>>
  exportFilename?: string
}

export function DrillDownModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  data,
  exportFilename,
}: DrillDownModalProps) {
  const handleExportCSV = () => {
    if (data && exportFilename) {
      exportToCSV(data, exportFilename)
    }
  }

  const handleExportJSON = () => {
    if (data && exportFilename) {
      exportToJSON(data, exportFilename)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
            {data && exportFilename && (
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="default" size="sm" onClick={handleExportJSON}>
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

