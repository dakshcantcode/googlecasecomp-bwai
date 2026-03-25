import { redirect } from "next/navigation";

// /study with no session → drop straight into the demo session
export default function StudyIndexPage() {
  redirect("/study/mock-session");
}
