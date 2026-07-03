import { redirect } from "next/navigation";

export default function MemberIndex() {
  redirect("/dashboard/member/overview");
}
