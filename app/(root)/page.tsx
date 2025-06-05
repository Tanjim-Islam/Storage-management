import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";

import RecentFileRow from "@/components/RecentFileRow";
import { FileViewerProvider } from "@/components/FileViewerProvider";
import { Chart } from "@/components/Chart";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import { Thumbnail } from "@/components/Thumbnail";
import { Separator } from "@/components/ui/separator";
import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";

const Dashboard = async () => {
  // Parallel requests
  const [files, totalSpace] = await Promise.all([
    getFiles({ types: [], limit: 10 }),
    getTotalSpaceUsed(),
  ]);

  // Get usage summary
  const usageSummary = getUsageSummary(totalSpace);

  return (
    <FileViewerProvider files={files.documents}>
    <div className="dashboard-container">
      <section>
        <Chart used={totalSpace.used} />

        {/* Uploaded file type summaries */}
        <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <li key={summary.title} className="dashboard-summary-card">
              <Link
                href={summary.url}
                className="dashboard-summary-link"
              >
                <div className="space-y-4">
                  <div className="flex justify-between gap-3">
                    <Image
                      src={summary.icon}
                      width={100}
                      height={100}
                      alt="uploaded image"
                      className="summary-type-icon"
                    />
                    <h4 className="summary-type-size">
                      {convertFileSize(summary.size) || 0}
                    </h4>
                  </div>

                  <h5 className="summary-type-title">{summary.title}</h5>
                  <Separator className="bg-light-400" />
                  <FormattedDateTime
                    date={summary.latestDate}
                    className="text-center"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent files uploaded */}
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
        {files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {files.documents.map((file: Models.Document, i: number) => (
              <li key={file.$id}>
                <RecentFileRow file={file} index={i} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No files uploaded</p>
        )}
      </section>
    </div>
    </FileViewerProvider>
  );
};

export default Dashboard;
