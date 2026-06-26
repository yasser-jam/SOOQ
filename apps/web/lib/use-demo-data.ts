import { useEffect, useState } from "react";

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

export const useDemoData = ({
	path,
	isEdit,
	metadata = {},
}: {
	path: string;
	isEdit: boolean;
	metadata?: Metadata;
}) => {
	const siteKey = getSiteStorageKey();

	const [data] = useState<Partial<UserData>>(() => {
		const site = readSiteData();
		return composePuckData(site, path);
	});

	const [resolvedData, setResolvedData] = useState<Partial<UserData>>(data);

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

	const savePageData = (puckData: UserData) => {
		if (!isBrowser) return;

		const site = readSiteData();
		const nextSite = applyPuckSave(site, path, puckData);
		writeSiteData(nextSite);
	};

	return { data, resolvedData, key: siteKey, savePageData, readSiteData };
};
