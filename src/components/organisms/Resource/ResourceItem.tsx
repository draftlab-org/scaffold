import Tag from '@components/atoms/Tag';
import IconExternalLink from '~icons/heroicons/arrow-top-right-on-square-20-solid';

interface ExternalLink {
  label: string;
  url: string;
}

export interface SerializedResource {
  id: string;
  title: string;
  description?: string;
  category: string;
  year: number;
  tags?: string[];
  externalLinks?: ExternalLink[];
  contributorNames: string;
}

interface ResourceItemProps {
  item: SerializedResource;
}

function formatCategory(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function ResourceItem({ item }: ResourceItemProps) {
  return (
    <div className="card-bordered flex h-full flex-col gap-6 rounded-lg p-8">
      {/* Category, Year, and Tags */}
      <div className="flex flex-wrap items-center gap-2">
        <Tag variant="primary">{formatCategory(item.category)}</Tag>
        <Tag variant="secondary">{String(item.year)}</Tag>

        {item.tags?.slice(0, 2).map((tag) => (
          <Tag key={tag} variant="gray">
            {tag}
          </Tag>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold md:text-2xl">
        <a
          href={`/resources/${item.id}`}
          className="text-inherit no-underline transition-colors hover:text-secondary-600"
        >
          {item.title}
        </a>
      </h3>

      {/* Description */}
      {item.description && (
        <p className="line-clamp-3 grow text-neutral-600">
          {item.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-neutral-300 pt-4">
        {/* Authors */}
        {item.contributorNames && (
          <p className="text-base text-neutral-700">
            <span className="font-medium">Authors:</span> {item.contributorNames}
          </p>
        )}

        {/* External Links */}
        {item.externalLinks && item.externalLinks.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {item.externalLinks.map((link, index) => (
              <a
                key={`${link.url}:${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-secondary-600 underline decoration-dotted underline-offset-4 transition-colors hover:text-secondary-700 hover:decoration-solid"
              >
                {link.label}
                <IconExternalLink class="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
