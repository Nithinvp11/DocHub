import RecentDocumentsWidget from '@/components/RecentDocumentsWidget';

export default function RecentPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <RecentDocumentsWidget limit={50} showHeader={true} compact={false} />
    </div>
  );
}
