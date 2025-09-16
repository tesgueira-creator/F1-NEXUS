import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

type LinkProps = {
  href: string | { pathname?: string };
  children: React.ReactNode;
  [key: string]: unknown;
};

const MockLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, ...rest }, ref) =>
    React.createElement(
      'a',
      {
        ...rest,
        ref,
        href: typeof href === 'string' ? href : href?.pathname ?? '',
      },
      children,
    ),
);

vi.mock('next/link', () => ({
  __esModule: true,
  default: MockLink,
}));
