import { useEffect, useState } from "react"
import { ExternalLink, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"

import { Button } from "@/components/ui/button"

interface DocumentViewerProps {
  url: string
  name: string
  isPdf: boolean
}

const MIN_ZOOM = 50
const MAX_ZOOM = 250
const ZOOM_STEP = 25

const DocumentViewer = ({ url, name, isPdf }: DocumentViewerProps) => {
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    setZoom(100)
  }, [url])

  const updateZoom = (nextZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)))
  }

  return (
    <div className="flex min-h-0 h-full flex-col gap-2">
      {!isPdf && (
        <div className="flex shrink-0 items-center justify-center gap-1" role="toolbar" aria-label="Controles de zoom">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateZoom(zoom - ZOOM_STEP)}
            disabled={zoom === MIN_ZOOM}
            title="Diminuir zoom"
          >
            <ZoomOut className="h-4 w-4" />
            <span className="sr-only">Diminuir zoom</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-w-16 gap-1 px-2 tabular-nums"
            onClick={() => setZoom(100)}
            title="Restaurar zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {zoom}%
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateZoom(zoom + ZOOM_STEP)}
            disabled={zoom === MAX_ZOOM}
            title="Aumentar zoom"
          >
            <ZoomIn className="h-4 w-4" />
            <span className="sr-only">Aumentar zoom</span>
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30">
        {isPdf ? (
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            className="h-full min-h-[320px] w-full border-0"
            title={name}
          />
        ) : (
          <div className="flex min-h-full min-w-full items-start justify-center p-2">
            <img
              src={url}
              alt={name}
              className="select-none object-contain"
              style={zoom === 100
                ? { maxWidth: "100%", maxHeight: "100%" }
                : { width: `${zoom}%`, maxWidth: "none", maxHeight: "none" }}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>
        )}
      </div>

      <Button asChild variant="ghost" size="sm" className="h-8 w-full justify-center gap-2 sm:w-auto sm:self-start">
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" />
          Abrir {isPdf ? "PDF" : "imagem"} em nova aba
        </a>
      </Button>
    </div>
  )
}

export default DocumentViewer
