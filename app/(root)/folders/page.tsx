import FolderCard from "@/components/FolderCard";
import { getFolders } from "@/lib/actions/folder.actions";
import { Models } from "node-appwrite";

const Page = async () => {
  const folders = await getFolders();
  return (
    <div className="page-container">
      <h1 className="h1">Folders</h1>
      {folders.total > 0 ? (
        <section className="file-list mt-5">
          {folders.documents.map((folder: Models.Document) => (
            <FolderCard key={folder.$id} folder={folder} />
          ))}
        </section>
      ) : (
        <p className="empty-list">No folders created</p>
      )}
    </div>
  );
};

export default Page;
