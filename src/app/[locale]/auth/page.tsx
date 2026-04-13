import AuthSection from "@/components/auth/auth-section";
import AuthHeader from "@/components/auth/auth-header";
import AuthLeftPanel from "@/components/auth/auth-left-panel";

// Authenticated users are redirected to /dashboard by middleware before this page renders.
export default async function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f5]">
      <AuthHeader />

      <div className="flex-1 flex">
        {/* Left panel — branding (translated) */}
        <AuthLeftPanel />

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <AuthSection />
          </div>
        </div>
      </div>
    </div>
  );
}
