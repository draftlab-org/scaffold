import ResourceItem from './ResourceItem';
import type { SerializedResource } from './ResourceItem';

interface ResourceItemsProps {
  items: SerializedResource[];
}

export default function ResourceItems({ items }: ResourceItemsProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ResourceItem key={item.id} item={item} />
      ))}
    </div>
  );
}
