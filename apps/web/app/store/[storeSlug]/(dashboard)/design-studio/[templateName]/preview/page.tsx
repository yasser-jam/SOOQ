import Client from "../../[...puckPath]/client";

type PageProps = {
  params: Promise<{ templateName: string }>;
};

const normalizeTemplatePath = (templateName: string) => {
  const normalized = decodeURIComponent(templateName).trim();

  if (!normalized || normalized === "home" || normalized === "index") {
    return "/";
  }

  return `/${normalized}`;
};

export default async function TemplatePreviewPage(props: PageProps) {
  const params = await props.params;
  const path = normalizeTemplatePath(params.templateName);

  return <Client isEdit={false} isPreview path={path} />;
}
