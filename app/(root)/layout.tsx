import React from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import PageDropzone from "@/components/PageDropzone";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/UserContext";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) return redirect("/sign-in");

  return (
    <UserProvider initialUser={currentUser}>
      <PageDropzone ownerId={currentUser.$id} accountId={currentUser.accountId}>
        <main className="flex h-screen">
          <Sidebar />

          <section className="flex h-full flex-1 flex-col">
            <MobileNavigation {...currentUser} />
            <Header
              userId={currentUser.$id}
              accountId={currentUser.accountId}
            />
            <div className="main-content">{children}</div>
          </section>

          <Toaster />
        </main>
      </PageDropzone>
    </UserProvider>
  );
};
export default Layout;
