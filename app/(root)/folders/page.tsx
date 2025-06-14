import FolderCard from "@/components/FolderCard";
import { getFolders } from "@/lib/actions/folder.actions";
import { Models } from "node-appwrite";
import Sort from "@/components/Sort";

const Page = async ({ searchParams }: { searchParams: Promise<{ sort?: string }> }) => {
  const resolvedParams = await searchParams;
  const sort = resolvedParams?.sort || "$createdAt-desc";
  const folders = await getFolders(sort);
  
  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Folders</h1>
        
        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">{folders.total}</span>
          </p>

          <div className="sort-container">
            <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>
            <Sort />
          </div>
        </div>
      </section>
      
      {folders.total > 0 ? (
        <section className="file-list">
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
