import { useCallback, useEffect, useMemo, useState } from "react";

import { resolveAllData, type Metadata } from "@/core";
import config from "@/core/config";
import {
	applyPuckSave,
	composePuckData,
	getSiteStorageKey,
	readSiteData,
	writeSiteData,
} from "@/core/config/lib/site-data";
import type { UserData } from "@/core/config/types";
import type { RootProps } from "@/core/config/root";
import type { Components } from "@/core/config/types";

const isBrowser = typeof window !== "undefined";

// Stable default: `metadata = {}` inline would create a fresh object per
// render and re-trigger the resolveAllData effect below on every render.
const EMPTY_METADATA: Metadata = {};

export const useDemoData = ({
	path,
	isEdit,
	metadata = EMPTY_METADATA,
}: {
	path: string;
	isEdit: boolean;
	metadata?: Metadata;
}) => {
	const siteKey = getSiteStorageKey();

	const data = useMemo(() => {
		const site = readSiteData();
		return composePuckData(site, path);
	}, [path, siteKey]);

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
			const site = readSiteData();
			const page = site.pages.find(
				(entry) =>
					entry.link === path ||
					entry.slug === path ||
					entry.path === path ||
					entry.examplePath === path,
			);
			document.title = page?.title ?? page?.name ?? "";
		}
	}, [path, isEdit]);

	const savePageData = useCallback(
		(puckData: UserData) => {
			if (!isBrowser) return;

			const site = readSiteData();
			const nextSite = applyPuckSave(site, path, puckData);
			writeSiteData(nextSite);
		},
		[path],
	);

	return { data, resolvedData, key: siteKey, savePageData, readSiteData };
};
