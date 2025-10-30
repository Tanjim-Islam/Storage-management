import Link from "next/link";
import { getFolderById } from "@/lib/actions/folder.actions";
import { getFiles } from "@/lib/actions/file.actions";
import Card from "@/components/Card";
import { Models } from "node-appwrite";
import { FileViewerProvider } from "@/components/FileViewerProvider";
import Image from "next/image";

const Page = async ({ params }: { params: { folderId: string } }) => {
  const { folderId } = await params;
  const folder = await getFolderById(folderId);
  const files = await getFiles({ types: [], folderId });

  if (!folder) {
    return (
      <div className="page-container">
        <Link
          href="/folders"
          className="back-button mb-4 inline-flex items-center justify-center p-2 rounded-full transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.6)]"
        >
          <Image src="/assets/icons/back.svg" alt="Back" width={24} height={24} />
        </Link>
        <p className="empty-list">
          We couldn&apos;t load this folder right now. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <FileViewerProvider files={files.documents}>
      <div className="page-container">
        <Link href="/folders" className="back-button mb-4 inline-flex items-center justify-center p-2 rounded-full transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.6)]">
          <Image src="/assets/icons/back.svg" alt="Back" width={24} height={24} />
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
    </FileViewerProvider>
  );
};

export default Page;
