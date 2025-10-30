import FileViewer from "@/components/FileViewer";
import { getFileByShareToken } from "@/lib/actions/file.actions";
import { constructDownloadUrl } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SharePage = async ({ params }: { params: { token: string } }) => {
  const file = await getFileByShareToken(params.token);

  if (!file) {
    notFound();
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-6 p-6">
      <div className="w-full max-w-5xl space-y-6">
        <h1 className="text-center text-2xl font-semibold text-light-100">
          {file.name}
        </h1>

        <div className="rounded-2xl bg-dark-400/40 p-4 shadow-lg">
          <FileViewer file={file} shareToken={params.token} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild className="modal-submit-button">
            <Link href={constructDownloadUrl(file.bucketField, params.token)}>
              Download file
            </Link>
          </Button>
          <Link
            href="/"
            className="text-sm text-light-300 underline-offset-4 hover:underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
