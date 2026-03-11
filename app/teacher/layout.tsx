import { TeacherSidebar, TeacherMobileHeader } from "@/app/components/layout";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex overflow-hidden bg-background-light dark:bg-background-dark text-neutral-text dark:text-white">
      <TeacherSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TeacherMobileHeader />
        {children}
      </div>
    </div>
  );
}
