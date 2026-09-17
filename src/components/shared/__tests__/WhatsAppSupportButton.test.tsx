import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import WhatsAppSupportButton from "@/components/shared/WhatsAppSupportButton";

function renderButton(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <WhatsAppSupportButton />
    </MemoryRouter>,
  );
}

describe("WhatsAppSupportButton", () => {
  it("opens the institutional WhatsApp with a support message on public pages", () => {
    renderButton("/");

    const link = screen.getByRole("link", {
      name: "Tire suas dúvidas sobre a iCuide pelo WhatsApp",
    });
    const url = new URL(link.getAttribute("href")!);

    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/5512988527053");
    expect(url.searchParams.get("text")).toBe(
      "Olá! Conheci a iCuide pelo site e gostaria de entender como encontrar um cuidador de idosos.",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Tire suas dúvidas")).toBeInTheDocument();
  });

  it("is available on public blog articles", () => {
    renderButton("/blog/como-contratar-cuidador");

    expect(
      screen.getByRole("link", { name: "Tire suas dúvidas sobre a iCuide pelo WhatsApp" }),
    ).toBeInTheDocument();
  });

  it("does not appear inside authenticated dashboards", () => {
    renderButton("/family");

    expect(
      screen.queryByRole("link", { name: "Tire suas dúvidas sobre a iCuide pelo WhatsApp" }),
    ).not.toBeInTheDocument();
  });
});
