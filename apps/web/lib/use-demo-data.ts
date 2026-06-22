import { useEffect, useState } from "react";

import { resolveAllData, type Metadata } from "@/core";
import config, { componentKey } from "@/core/config";
import { initialData } from "@/core/config/initial-data";
import type { UserData } from "@/core/config/types";
import type { RootProps } from "@/core/config/root";
import type { Components } from "@/core/config/types";

const isBrowser = typeof window !== "undefined";

const getInitialData = (path: string): Partial<UserData> =>
	initialData[path] ?? {};

export const useDemoData = ({
	path,
	isEdit,
	metadata = {},
}: {
	path: string;
	isEdit: boolean;
	metadata?: Metadata;
}) => {
	const key = `puck-demo:${componentKey}:${path}`;

	const [data] = useState<Partial<UserData>>(() => {
		if (isBrowser) {
			const dataStr = localStorage.getItem(key);

			if (dataStr) {
				return JSON.parse(dataStr) as Partial<UserData>;
			}

			return getInitialData(path);
		}

		return getInitialData(path);
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
			const title =
				data?.root?.props?.title ??
				(data?.root as { title?: string } | undefined)?.title;
			document.title = title || "";
		}
	}, [data, isEdit]);

	return { data, resolvedData, key };
};
