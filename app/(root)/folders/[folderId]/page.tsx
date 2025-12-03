import Link from "next/link";
import { getFolderById } from "@/lib/actions/folder.actions";
import { getFiles } from "@/lib/actions/file.actions";
import Card from "@/components/Card";
import { Models } from "node-appwrite";
import { FileViewerProvider } from "@/components/FileViewerProvider";
import Image from "next/image";
import { convertFileSize } from "@/lib/utils";

const Page = async ({ params }: { params: { folderId: string } }) => {
  const { folderId } = await params;
  const folder = await getFolderById(folderId);
  const files = await getFiles({ types: [], folderId });
  const totalSize =
    files?.documents?.reduce((sum: number, file: Models.Document) => {
      const size =
        typeof file.size === "number"
          ? file.size
          : Number(file.size || 0);
      return sum + size;
    }, 0) || 0;

  return (
    <FileViewerProvider files={files?.documents || []}>
      <div className="page-container">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/folders"
            className="back-button inline-flex items-center justify-center p-2 rounded-full transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.6)]"
          >
            <Image
              src="/assets/icons/back.svg"
              alt="Back"
              width={24}
              height={24}
            />
          </Link>
          <div className="flex flex-col">
            <p className="caption text-light-200 uppercase tracking-wide">
              Folders
            </p>
            <h1 className="h1">Folders / {folder.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 text-light-200">
          <p className="body-1">
            Items: <span className="h5 text-primary">{files?.total || 0}</span>
          </p>
          <p className="body-1">
            Size:{" "}
            <span className="h5 text-primary">
              {convertFileSize(totalSize)}
            </span>
          </p>
        </div>

        {files && files.total > 0 ? (
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
