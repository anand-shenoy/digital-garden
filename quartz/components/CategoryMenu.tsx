import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"

// Replaces the file/folder Explorer with a tag-derived category menu.
// Built 2026-08-09, entirely at build time (no client-side JS/localStorage,
// unlike the stock Explorer) — nested <details>/<summary> gives collapse/
// expand for free: outer = the hamburger toggle, inner = each category.
//
// Note: Quartz's Explorer component reads from a runtime-fetched content
// index that never includes tag pages, so patching Explorer's filter/map
// hooks to show tags (the first approach tried here) silently produced an
// empty menu — there was nothing to filter for. This component sidesteps
// that entirely by grouping allFiles by frontmatter.tags directly.

function toTitle(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, " ")
}

const CategoryMenu = ({ displayClass, fileData, allFiles }: QuartzComponentProps) => {
  const byTag = new Map<string, { slug: string; title: string }[]>()
  for (const file of allFiles) {
    if (file.slug === "index") continue
    const tags = (file.frontmatter?.tags as string[] | undefined) ?? []
    const title = (file.frontmatter?.title as string | undefined) ?? file.slug ?? ""
    for (const tag of tags) {
      if (!byTag.has(tag)) byTag.set(tag, [])
      byTag.get(tag)!.push({ slug: file.slug!, title })
    }
  }

  // Broadest categories (most articles) first.
  const categories = [...byTag.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, items]) => ({
      tag,
      items: [...items].sort((a, b) => a.title.localeCompare(b.title)),
    }))

  const allItems = allFiles
    .filter((f) => f.slug !== "index")
    .map((f) => ({
      slug: f.slug!,
      title: (f.frontmatter?.title as string | undefined) ?? f.slug!,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <details class={classNames(displayClass, "category-menu")}>
      <summary class="category-menu-toggle" aria-label="Open categories">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </summary>
      <div class="category-menu-content">
        {categories.map(({ tag, items }) => (
          <details class="category-group" key={tag}>
            <summary>
              {toTitle(tag)} <span class="category-count">{items.length}</span>
            </summary>
            <ul>
              {items.map((item) => (
                <li key={item.slug}>
                  <a href={resolveRelative(fileData.slug!, item.slug as FullSlug)}>{item.title}</a>
                </li>
              ))}
            </ul>
          </details>
        ))}
        <details class="category-group category-group-all">
          <summary>
            All <span class="category-count">{allItems.length}</span>
          </summary>
          <ul>
            {allItems.map((item) => (
              <li key={item.slug}>
                <a href={resolveRelative(fileData.slug!, item.slug as FullSlug)}>{item.title}</a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </details>
  )
}

CategoryMenu.css = `
.category-menu {
  position: relative;

  & > summary.category-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    cursor: pointer;
    color: var(--darkgray);
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
    &::marker {
      content: "";
    }
  }

  & > .category-menu-content {
    display: none;
  }

  &[open] > .category-menu-content {
    display: block;
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 20;
    margin-top: 0.5rem;
    min-width: 220px;
    max-width: 80vw;
    max-height: 60vh;
    overflow-y: auto;
    background-color: var(--light);
    border: 1px solid var(--lightgray);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 0.5rem;
  }
}

.category-group {
  & > summary {
    cursor: pointer;
    padding: 0.5rem 0.25rem;
    font-weight: 600;
    color: var(--dark);
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }
  }

  & .category-count {
    color: var(--gray);
    font-weight: 400;
    font-size: 0.85em;
  }

  & ul {
    margin: 0 0 0.5rem 0;
    padding: 0 0 0 1rem;
    list-style: none;
  }

  & li {
    margin: 0.25rem 0;
  }

  & a {
    color: var(--darkgray);
    font-weight: 400;
    text-decoration: none;
    &:hover {
      color: var(--secondary);
    }
  }
}

.category-group-all {
  border-top: 1px solid var(--lightgray);
  margin-top: 0.25rem;
  padding-top: 0.25rem;
}
`

export default (() => CategoryMenu) satisfies QuartzComponentConstructor
