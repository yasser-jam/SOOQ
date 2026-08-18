"use client";

import React from "react";
import Link from "next/link";
import { isExternalOrSpecialHref } from "../../config/lib/store-base-path";

export type SmartLinkProps = React.ComponentProps<"a"> & {
  href: string;
};

/**
 * Renders internal hrefs as a Next.js `<Link>` (client-side transition) and
 * external/mailto/tel/anchor hrefs as a plain `<a>`.
 */
export const SmartLink = React.forwardRef<HTMLAnchorElement, SmartLinkProps>(
  ({ href, children, ...props }, ref) => {
    if (isExternalOrSpecialHref(href)) {
      return (
        <a ref={ref} href={href} {...props}>
          {children}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} {...props}>
        {children}
      </Link>
    );
  }
);

SmartLink.displayName = "SmartLink";
