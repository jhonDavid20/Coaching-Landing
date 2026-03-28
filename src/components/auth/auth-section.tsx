"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, signupSchema, LoginFormData, SignupFormData } from "@/lib/auth-schemas";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/session-provider";
import { useLoading } from "@/components/providers/loading-provider";

const AuthSection: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const locale = useLocale();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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
        // First check if the API server is running
        const { checkServerHealth } = await import("@/actions/auth");
        const isServerHealthy = await checkServerHealth();
        
        if (!isServerHealthy) {
          toast.error("Cannot connect to authentication server. Please ensure your Express API is running on port 3001.");
          return;
        }

        const { loginUser } = await import("@/actions/auth");
        const response = await loginUser(data as LoginFormData);

        console.log("Login response in component:", response);

        if (response.success) {
          toast.success("Signed in successfully!");
          // Redirect to dashboard after successful login
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
    <section
      id="auth"
      className="py-16 px-4"
    >
      <div className="max-w-md mx-auto">
        <div className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white rounded-lg shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-base text-foreground dark:text-gray-300">
              {isLogin
                ? "Welcome back! Please sign in to your account."
                : "Join us today and start your fitness journey."}
            </p>
          </div>

          <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-6">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground dark:text-white">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    {...signupForm.register("firstName")}
                    className="bg-background dark:bg-[#1A202C] border-border dark:border-gray-600 text-foreground dark:text-white"
                    placeholder="Enter your first name"
                  />
                  {signupForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{signupForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground dark:text-white">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    {...signupForm.register("lastName")}
                    className="bg-background dark:bg-[#1A202C] border-border dark:border-gray-600 text-foreground dark:text-white"
                    placeholder="Enter your last name"
                  />
                  {signupForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{signupForm.formState.errors.lastName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground dark:text-white">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    {...signupForm.register("username")}
                    className="bg-background dark:bg-[#1A202C] border-border dark:border-gray-600 text-foreground dark:text-white"
                    placeholder="Choose a username"
                  />
                  {signupForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{signupForm.formState.errors.username.message}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground dark:text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...currentForm.register("email")}
                className="bg-background dark:bg-[#1A202C] border-border dark:border-gray-600 text-foreground dark:text-white"
                placeholder="Enter your email"
              />
              {currentForm.formState.errors.email && (
                <p className="text-sm text-red-500">{currentForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground dark:text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...currentForm.register("password")}
                className="bg-background dark:bg-[#1A202C] border-border dark:border-gray-600 text-foreground dark:text-white"
                placeholder="Enter your password"
              />
              {currentForm.formState.errors.password && (
                <p className="text-sm text-red-500">{currentForm.formState.errors.password.message}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground dark:text-white">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...signupForm.register("confirmPassword")}
                  className="bg-background dark:bg-[#1A202C] border-border dark:border-gray-600 text-foreground dark:text-white"
                  placeholder="Confirm your password"
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground dark:bg-white dark:text-[#2D3748] hover:bg-primary/90 dark:hover:bg-gray-200 py-3 text-base font-semibold disabled:opacity-50"
            >
              {isLoading ? (isLogin ? "Signing In..." : "Creating Account...") : (isLogin ? "Sign In" : "Create Account")}
            </Button>

          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground dark:text-gray-300">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-primary dark:text-white font-semibold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-sm text-primary dark:text-white hover:underline">
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthSection;