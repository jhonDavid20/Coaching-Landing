"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, signupSchema, LoginFormData, SignupFormData } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/session-provider";
import { useLoading } from "@/components/providers/loading-provider";

const AuthSection: React.FC = () => {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("tab") !== "register");
  const [isLoading, setIsLoading] = useState(false);
  const { } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const locale = useLocale();
  const t = useTranslations("auth");

  // Keep in sync if URL param changes (e.g. browser back/forward)
  useEffect(() => {
    setIsLogin(searchParams.get("tab") !== "register");
  }, [searchParams]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const currentForm = isLogin ? loginForm : signupForm;

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    setIsLoading(true);
    startLoading();
    try {
      if (isLogin) {
        const { loginUser } = await import("@/actions/auth");
        const response = await loginUser(data as LoginFormData);
        if (response.success) {
          toast.success("Signed in successfully!");
          setTimeout(() => {
            window.location.href = `/${locale}/dashboard`;
          }, 100);
        } else {
          toast.error(response.message || "Invalid credentials");
        }
      } else {
        const { signupUser } = await import("@/actions/auth");
        const result = await signupUser(data as SignupFormData);
        if (result.success) {
          toast.success("Account created successfully! Please Log In.");
          setIsLogin(true);
          signupForm.reset();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
      stopLoading();
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-[#0f1f10] mb-1">
          {isLogin ? t("signInHeading") : t("createAccountHeading")}
        </h2>
        <p className="text-sm text-[#617061]">
          {isLogin ? t("signInSubtitle") : t("createAccountSubtitle")}
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-[#eff2ee] rounded-lg p-1 mb-8">
        <button
          type="button"
          onClick={() => { setIsLogin(true); loginForm.reset(); signupForm.reset(); }}
          className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${
            isLogin
              ? "bg-white text-[#162318] shadow-sm"
              : "text-[#617061] hover:text-[#0f1f10]"
          }`}
        >
          {t("signInButton")}
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); loginForm.reset(); signupForm.reset(); }}
          className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${
            !isLogin
              ? "bg-white text-[#162318] shadow-sm"
              : "text-[#617061] hover:text-[#0f1f10]"
          }`}
        >
          {t("createAccountButton")}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-4">
        {!isLogin && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-[#0f1f10]">
                  {t("firstNameLabel")}
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  {...signupForm.register("firstName")}
                  placeholder={t("firstNamePlaceholder")}
                  className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44] focus-visible:border-[#3a7d44]"
                />
                {signupForm.formState.errors.firstName && (
                  <p className="text-xs text-red-500">{signupForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-[#0f1f10]">
                  {t("lastNameLabel")}
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  {...signupForm.register("lastName")}
                  placeholder={t("lastNamePlaceholder")}
                  className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44] focus-visible:border-[#3a7d44]"
                />
                {signupForm.formState.errors.lastName && (
                  <p className="text-xs text-red-500">{signupForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-[#0f1f10]">
                {t("usernameLabel")}
              </Label>
              <Input
                id="username"
                type="text"
                {...signupForm.register("username")}
                placeholder={t("usernamePlaceholder")}
                className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44] focus-visible:border-[#3a7d44]"
              />
              {signupForm.formState.errors.username && (
                <p className="text-xs text-red-500">{signupForm.formState.errors.username.message}</p>
              )}
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-[#0f1f10]">
            {t("emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            {...(isLogin ? loginForm.register("email") : signupForm.register("email"))}
            placeholder={t("emailPlaceholder")}
            className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44] focus-visible:border-[#3a7d44]"
          />
          {(isLogin ? loginForm.formState.errors.email : signupForm.formState.errors.email) && (
            <p className="text-xs text-red-500">{(isLogin ? loginForm.formState.errors.email : signupForm.formState.errors.email)?.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-[#0f1f10]">
              {t("passwordLabel")}
            </Label>
            {isLogin && (
              <button
                type="button"
                className="text-xs text-[#3a7d44] hover:text-[#2d5a31] font-medium"
              >
                {t("forgotPassword")}
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            {...(isLogin ? loginForm.register("password") : signupForm.register("password"))}
            placeholder={t("passwordPlaceholder")}
            className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44] focus-visible:border-[#3a7d44]"
          />
          {(isLogin ? loginForm.formState.errors.password : signupForm.formState.errors.password) && (
            <p className="text-xs text-red-500">{(isLogin ? loginForm.formState.errors.password : signupForm.formState.errors.password)?.message}</p>
          )}
        </div>

        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#0f1f10]">
              {t("confirmPasswordLabel")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              {...signupForm.register("confirmPassword")}
              placeholder={t("confirmPasswordPlaceholder")}
              className="border-[#d8e0d8] bg-white text-[#0f1f10] placeholder:text-[#a0b0a0] focus-visible:ring-[#3a7d44] focus-visible:border-[#3a7d44]"
            />
            {signupForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#162318] text-[#eef6ee] font-semibold py-2.5 rounded-lg hover:bg-[#243d27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
        >
          {isLoading
            ? isLogin ? t("signingIn") : t("creatingAccount")
            : isLogin ? t("signInHeading") : t("createAccountHeading")}
        </button>
      </form>

      {/* Toggle mode link */}
      <p className="text-center text-sm text-[#617061] mt-6">
        {isLogin ? t("noAccount") : t("hasAccount")}{" "}
        <button
          type="button"
          onClick={toggleMode}
          className="text-[#3a7d44] font-semibold hover:text-[#2d5a31]"
        >
          {isLogin ? t("signUp") : t("signIn")}
        </button>
      </p>

      {/* Invite link */}
      {isLogin && (
        <div className="mt-6 pt-5 border-t border-[#d8e0d8] text-center">
          <p className="text-xs text-[#617061]">
            {t("invitePrompt")}{" "}
            <Link
              href={`/${locale}/invite`}
              className="text-[#3a7d44] font-medium hover:text-[#2d5a31]"
            >
              {t("enterInviteToken")}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthSection;
