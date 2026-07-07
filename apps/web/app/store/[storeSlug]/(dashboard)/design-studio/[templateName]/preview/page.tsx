import Client from "../../[...puckPath]/client";

type PageProps = {
  params: Promise<{ templateName: string }>;
};

export default async function TemplatePreviewPage(props: PageProps) {
  const params = await props.params;

  return (
    <Client
      isEdit={false}
      isPreview
      themeSlug={decodeURIComponent(params.templateName).trim()}
    />
  );
}
