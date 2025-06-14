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
import { getFolders } from "@/lib/actions/folder.actions";
import FolderCard from "@/components/FolderCard";
import { convertFileSize, getUsageSummary } from "@/lib/utils";

const Dashboard = async () => {
  // Parallel requests
  const [folders, files, totalSpace] = await Promise.all([
    getFolders(),
    getFiles({ types: [] }),
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

      {/* Recent items uploaded */}
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent items</h2>
        {folders.total > 0 || files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {[
              ...folders.documents.map((folder: Models.Document) => ({
                item: folder,
                type: 'folder',
                date: new Date(folder.$createdAt)
              })),
              ...files.documents.map((file: Models.Document, i: number) => ({
                item: file,
                type: 'file',
                index: i,
                date: new Date(file.$createdAt)
              }))
            ]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 8)
              .map((entry) => (
                <li key={entry.item.$id}>
                  {entry.type === 'folder' ? (
                    <FolderCard folder={entry.item} />
                  ) : (
                    <RecentFileRow file={entry.item} index={entry.index!} />
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p className="empty-list">No items uploaded</p>
        )}
      </section>
    </div>
    </FileViewerProvider>
  );
};

export default Dashboard;
