import RequireRole from "@/modules/auth/auth/components/RequireRole"
import Client from "../../[...puckPath]/client";

type PageProps = {
  params: Promise<{ templateName: string }>;
};

export default async function TemplateEditorPage(props: PageProps) {
  const params = await props.params;

  return (
    <RequireRole roles={["OWNER", "MANAGER", "STAFF"]}>
      <Client
        isEdit
        themeSlug={decodeURIComponent(params.templateName).trim()}
        isPreview={false}
      />
    </RequireRole>
  );
}
