import FileViewer from "@/components/FileViewer";
import { getFiles } from "@/lib/actions/file.actions";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
  const files = await getFiles({ types: [] });
  const index = files.documents.findIndex((f: any) => f.$id === params.id);

  if (index === -1) redirect("/");

  const file = files.documents[index];
  const prevId = index > 0 ? files.documents[index - 1].$id : null;
  const nextId =
    index < files.documents.length - 1 ? files.documents[index + 1].$id : null;

  return (
    <div className="h-full w-full overflow-auto">
      <h2 className="p-4 text-center text-xl font-semibold">{file.name}</h2>
      <FileViewer file={file} prevId={prevId} nextId={nextId} />
    </div>
  );
};

export default Page;
