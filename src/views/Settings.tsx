import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const auth = useAuth();

  console.log(auth.email);

  return (
    <div>
      <h1>Settings Page Component</h1>
    </div>
  );
}
