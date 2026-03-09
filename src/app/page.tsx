import { MainLayout } from "@/components/MainLayout";
import { FeedList } from "@/components/FeedList";

export const metadata = {
  title: "Feed | Social",
};

export default function HomePage() {
  return (
    <MainLayout>
      <FeedList showComposer />
    </MainLayout>
  );
}
