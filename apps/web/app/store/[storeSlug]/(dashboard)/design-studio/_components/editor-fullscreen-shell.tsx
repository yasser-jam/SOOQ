"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type EditorFullscreenShellProps = {
	children: ReactNode;
};

export function EditorFullscreenShell({ children }: EditorFullscreenShellProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	if (!mounted) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-[200] flex h-dvh w-screen flex-col overflow-hidden bg-[var(--puck-color-grey-12,#f8fafc)]"
			role="dialog"
			aria-modal="true"
			aria-label="محرر الثيم"
			data-design-studio-editor
		>
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</div>,
		document.body,
	);
}
