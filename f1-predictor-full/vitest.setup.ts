import { createElement, type AnchorHTMLAttributes, type DetailedHTMLProps, type PropsWithChildren } from "react";
import "@testing-library/jest-dom/vitest";

type AnchorProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { href: string };

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: PropsWithChildren<AnchorProps>) =>
    createElement("a", { ...props, href }, children),
}));
