import { getFolders } from "@/lib/actions/folder.actions";
import FolderPageClient from "@/components/FolderPageClient";

const Page = async ({ searchParams }: { searchParams: Promise<{ sort?: string }> }) => {
  const resolvedParams = await searchParams;
  const sort = resolvedParams?.sort || "$createdAt-desc";
  const folders = await getFolders(sort);
  
  return (
    <FolderPageClient folders={folders.documents} />
  );
};

export default Page;
