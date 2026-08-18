import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-mut dark:text-gray-400">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-x-1.5">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-reef-700 hover:underline dark:hover:text-reef-300"
              >
                {item.label}
              </Link>
            ) : (
              <span className="line-clamp-1 max-w-[42ch] font-medium text-ink dark:text-gray-200">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
