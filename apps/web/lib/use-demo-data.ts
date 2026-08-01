import { useCallback, useEffect, useMemo, useState } from "react";

import { resolveAllData, type Metadata } from "@/core";
import config from "@/core/config";
import {
	applyPuckSave,
	composePuckData,
	getSiteStorageKey,
	readSiteData,
	resolveSitePageText,
	writeSiteData,
	type EditorMode,
} from "@/core/config/lib/site-data";
import type { UserData } from "@/core/config/types";
import type { RootProps } from "@/core/config/root";
import type { Components } from "@/core/config/types";

const isBrowser = typeof window !== "undefined";

const EMPTY_METADATA: Metadata = {};

export const useDemoData = ({
	path,
	isEdit,
	mode = "desktop",
	metadata = EMPTY_METADATA,
	revision = 0,
}: {
	path: string;
	isEdit: boolean;
	mode?: EditorMode;
	metadata?: Metadata;
	/** Bump after external site mutations (e.g. mobile sync) to re-read storage. */
	revision?: number;
}) => {
	const siteKey = getSiteStorageKey(mode);

	const data = useMemo(() => {
		const site = readSiteData(mode);
		return composePuckData(site, path);
	}, [path, siteKey, mode, revision]);

	const [resolvedData, setResolvedData] = useState<Partial<UserData>>(data);

	useEffect(() => {
		setResolvedData(data);
	}, [data]);

	useEffect(() => {
		if (data && !isEdit) {
			resolveAllData<Components, RootProps>(data, config, metadata).then(
				setResolvedData,
			);
		}
	}, [data, isEdit, metadata]);

	useEffect(() => {
		if (!isEdit) {
			const site = readSiteData(mode);
			const page = site.pages.find(
				(entry) =>
					entry.link === path ||
					entry.slug === path ||
					entry.path === path ||
					entry.examplePath === path,
			);
			const language =
				(site.root?.props as { language?: "ar" | "en" } | undefined)
					?.language === "en"
					? "en"
					: "ar";
			document.title =
				resolveSitePageText(page?.title, language) ||
				resolveSitePageText(page?.name, language);
		}
	}, [path, isEdit, mode]);

	const savePageData = useCallback(
		(puckData: UserData) => {
			if (!isBrowser) return;

			const site = readSiteData(mode);
			const nextSite = applyPuckSave(site, path, puckData);
			writeSiteData(nextSite, mode);
		},
		[path, mode],
	);

	return {
		data,
		resolvedData,
		key: siteKey,
		mode,
		savePageData,
		readSiteData: () => readSiteData(mode),
	};
};
