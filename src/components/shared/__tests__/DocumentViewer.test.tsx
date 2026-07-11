import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import DocumentViewer from "../DocumentViewer"

describe("DocumentViewer", () => {
  it("zooms images and keeps an external fallback", () => {
    render(<DocumentViewer url="blob:image-preview" name="Certificado" isPdf={false} />)

    const image = screen.getByRole("img", { name: "Certificado" })
    expect(image).toHaveStyle({ maxWidth: "100%" })

    fireEvent.click(screen.getByRole("button", { name: "Aumentar zoom" }))

    expect(screen.getByText("125%")).toBeInTheDocument()
    expect(image).toHaveStyle({ width: "125%" })
    expect(screen.getByRole("link", { name: /abrir imagem em nova aba/i })).toHaveAttribute(
      "href",
      "blob:image-preview",
    )
  })

  it("shows PDFs inline with their native toolbar and an external fallback", () => {
    render(<DocumentViewer url="blob:pdf-preview" name="Curriculo.pdf" isPdf />)

    expect(screen.getByTitle("Curriculo.pdf")).toHaveAttribute(
      "src",
      "blob:pdf-preview#toolbar=1&navpanes=0&scrollbar=1&view=FitH",
    )
    expect(screen.queryByRole("toolbar", { name: "Controles de zoom" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /abrir pdf em nova aba/i })).toHaveAttribute(
      "href",
      "blob:pdf-preview",
    )
  })
})
