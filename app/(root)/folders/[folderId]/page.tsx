import Link from "next/link";
import { getFolderById } from "@/lib/actions/folder.actions";
import { getFiles } from "@/lib/actions/file.actions";
import Card from "@/components/Card";
import { Models } from "node-appwrite";

const Page = async ({ params }: { params: { folderId: string } }) => {
  const folder = await getFolderById(params.folderId);
  const files = await getFiles({ types: [], folderId: params.folderId });

  return (
    <div className="page-container">
      <Link href="/" className="mb-4 inline-block">
        Back
      </Link>
      <h1 className="h1 mb-4">{folder.name}</h1>
      {files.total > 0 ? (
        <section className="file-list">
          {files.documents.map((file: Models.Document, i: number) => (
            <Card key={file.$id} file={file} index={i} />
          ))}
        </section>
      ) : (
        <p className="empty-list">No files</p>
      )}
    </div>
  );
};

export default Page;
