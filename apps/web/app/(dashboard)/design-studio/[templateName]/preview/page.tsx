import RequireRole from "@/modules/auth/auth/components/RequireRole"
import Client from "../../[...puckPath]/client";

type PageProps = {
  params: Promise<{ templateName: string }>;
};

export default async function TemplatePreviewPage(props: PageProps) {
  const params = await props.params;

  return (
    <RequireRole roles={["OWNER", "MANAGER", "STAFF"]}>
      <Client
        isEdit={false}
        isPreview
        themeSlug={decodeURIComponent(params.templateName).trim()}
      />
    </RequireRole>
  );
}
