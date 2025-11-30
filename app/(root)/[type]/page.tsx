import React from "react";
import { getFiles } from "@/lib/actions/file.actions";
import { FileViewerProvider } from "@/components/FileViewerProvider";
import { getFileTypesParams } from "@/lib/utils";
import TypePageClient from "@/components/TypePageClient";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as string) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";

  const types = getFileTypesParams(type) as FileType[];

  const files = await getFiles({ types, searchText, sort });

  return (
    <FileViewerProvider files={files.documents}>
      <TypePageClient files={files.documents} type={type} />
    </FileViewerProvider>
  );
};

export default Page;
