import resolvePuckPath from "@/lib/resolve-puck-path";
import { Metadata } from "next";
import RequireRole from "@/modules/auth/auth/components/RequireRole"
import Client from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ framework: string; uuid: string; puckPath: string[] }>;
}): Promise<Metadata> {
  const { puckPath } = await params;
  const { isEdit, isPreview, path } = resolvePuckPath(puckPath);

  if (isEdit) {
    return {
      title: "Editing: " + path,
    };
  }

  if (isPreview) {
    return {
      title: "Preview: " + path,
    };
  }

  return {
    title: "",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ framework: string; uuid: string; puckPath: string[] }>;
}) {
  const { puckPath } = await params;
  const { isEdit, path } = resolvePuckPath(puckPath);

  return (
    <RequireRole roles={["OWNER", "MANAGER", "STAFF"]}>
      <Client isEdit={isEdit} path={path} />
    </RequireRole>
  );
}

export const dynamic = "force-dynamic";
