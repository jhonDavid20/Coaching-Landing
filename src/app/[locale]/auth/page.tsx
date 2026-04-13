import AuthSection from "@/components/auth/auth-section";
import AuthHeader from "@/components/auth/auth-header";
import { CheckCircle2 } from "lucide-react";

const FEATURES = [
  "Manage unlimited clients",
  "Assign personalized packages",
  "Track sessions & progress",
  "Send invite links",
];

// Authenticated users are redirected to /dashboard by middleware before this page renders.
export default async function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f5]">
      <AuthHeader />

      <div className="flex-1 flex">
        {/* Left panel — branding */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#162318] p-12">
          <div>
            <p className="text-[#c8dcc9] text-sm font-semibold uppercase tracking-widest mb-10">
              For fitness coaches
            </p>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
              Everything you need to run a professional coaching business
            </h1>
            <p className="text-[#c8dcc9] text-base leading-relaxed mb-10">
              Join 500+ coaches who replaced messy spreadsheets with a platform
              built for real coaching workflows.
            </p>
            <ul className="space-y-4">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#3a7d44] flex-shrink-0" />
                  <span className="text-[#c8dcc9] text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial */}
          <div className="bg-[#1e3320] rounded-xl p-5 border border-[#2d5a31]/40">
            <p className="text-[#c8dcc9] text-sm leading-relaxed italic mb-4">
              &quot;I used to track everything in a Google Sheet. Now my clients have
              a proper dashboard and I actually look professional.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ddf0df] flex items-center justify-center text-[#2d5a31] text-xs font-bold">
                CM
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Carlos M.</p>
                <p className="text-[#617061] text-xs">Online Fitness Coach</p>
              </div>
            </div>
          </div>
        </div>

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
