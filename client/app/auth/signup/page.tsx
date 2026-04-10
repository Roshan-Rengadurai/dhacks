import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign up | EnergyIQ",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
