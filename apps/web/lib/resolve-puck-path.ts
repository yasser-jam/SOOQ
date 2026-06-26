const resolvePuckPath = (puckPath: string[] = []) => {
	const hasPath = puckPath.length > 0;
	const last = hasPath ? puckPath[puckPath.length - 1] : "";
	const isEdit = last === "edit";
	const isPreview = last === "preview";
	const hasModeSuffix = isEdit || isPreview;

	let segments = hasModeSuffix ? puckPath.slice(0, -1) : [...puckPath];

	if (segments.length === 1 && segments[0] === "home") {
		segments = [];
	}

	const path = segments.length === 0 ? "/" : `/${segments.join("/")}`;

	return {
		isEdit,
		isPreview,
		path,
	};
};

export default resolvePuckPath;
