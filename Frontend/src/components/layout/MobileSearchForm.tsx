import React from "react";
import { Search } from "lucide-react";

/** Search-first block at the top of the mobile navigation drawer. */
export const MobileSearchForm: React.FC<{
  defaultValue?: string;
  onSubmit: (query: string) => void;
}> = ({ defaultValue, onSubmit }) => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      const value = new FormData(event.currentTarget).get("q");
      onSubmit(typeof value === "string" ? value : "");
    }}
    className="mb-4"
    role="search"
  >
    <label htmlFor="drawer-search" className="sr-only">
      Search experiences
    </label>
    <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-sunken px-3 focus-within:border-primary focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/20">
      <Search size={16} className="shrink-0 text-faint" aria-hidden="true" />
      <input
        id="drawer-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search experiences…"
        className="h-full w-full min-w-0 bg-transparent text-sm text-heading outline-none placeholder:text-faint"
      />
    </div>
  </form>
);
