import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

const ProfilePage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) return redirect("/sign-in");

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Profile Settings</h1>

        <div className="mt-8">
          <ProfileForm />
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
