// The Badge is the shared status / label pill. These pin that each variant maps to its brand token class
// (so a status chip never invents an off-brand colour) and that no raw hex leaks into the markup.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders the default (primary) variant on the brand token", () => {
    const { getByText } = render(<Badge>Active</Badge>);
    const badge = getByText("Active");
    expect(badge.className).toContain("bg-primary");
    expect(badge.className).toContain("text-primary-foreground");
  });

  it.each([
    ["secondary", "bg-secondary"],
    ["destructive", "bg-destructive"],
    ["success", "bg-success"],
    ["warning", "bg-warning"],
  ] as const)("maps the %s variant to its brand token class", (variant, token) => {
    const { getByText } = render(<Badge variant={variant}>Label</Badge>);
    expect(getByText("Label").className).toContain(token);
  });

  it("the outline variant uses the border token, not a fill", () => {
    const { getByText } = render(<Badge variant="outline">Outline</Badge>);
    const badge = getByText("Outline");
    expect(badge.className).toContain("border-border");
    expect(badge.className).toContain("text-foreground");
  });

  it("emits no hardcoded hex colour", () => {
    const { container } = render(
      <>
        <Badge variant="success">A</Badge>
        <Badge variant="warning">B</Badge>
        <Badge variant="destructive">C</Badge>
      </>,
    );
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
