import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Minus, ExternalLink } from "lucide-react";
import { Slider } from "@/components/ui/slider";

/* ------------------------------------------------------------------ */
/*  Filter data                                                        */
/* ------------------------------------------------------------------ */

const checkboxFilters = [
  {
    name: "CATEGORY",
    /** First 10 are always visible; rest behind "More" */
    primaryOptions: [
      "Bathroom Vanity Lights",
      "Chandeliers",
      "Floor Lamps",
      "Flush Mount",
      "Indoor Ceiling Fans",
      "Island & Linear Lights",
      "Outdoor Lights",
      "Pendants",
      "Semi-Flush Mount",
      "Table Lamps",
    ],
    moreOptions: [
      "Desk / Task Lamps",
      "Hanging Lanterns",
      "Indoor Lanterns",
      "Landscape Lighting",
      "Outdoor Ceiling Fans",
      "Outdoor Ceiling Mount",
      "Picture Lights",
      "Portable Lamps",
      "Post & Pier",
      "Wall Fans",
      "Wall Sconces",
    ],
    options: [], // kept for type compat, built at render time
  },
  {
    name: "FINISH",
    options: [
      "Black",
      "Brass",
      "Bronze",
      "Chrome",
      "Copper",
      "Gold",
      "Nickel",
      "Pewter",
      "White",
      "Wood",
    ],
  },
  {
    name: "STYLE",
    options: [
      "Coastal",
      "Farmhouse",
      "Industrial",
      "Mid-Century",
      "Modern",
      "Rustic",
      "Traditional",
      "Transitional",
    ],
  },
];

const rangeFilters = [
  { name: "HEIGHT", unit: '"', min: 4, max: 60, step: 1 },
  { name: "WIDTH", unit: '"', min: 4, max: 60, step: 1 },
  { name: "PRICE", unit: "$", min: 0, max: 5000, step: 50, prefix: true },
];

/* ------------------------------------------------------------------ */
/*  Range Slider Filter                                                */
/* ------------------------------------------------------------------ */

const RangeFilter = ({
  label,
  unit,
  min,
  max,
  step,
  prefix,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  prefix?: boolean;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) => {
  const fmt = (v: number) => (prefix ? `${unit}${v.toLocaleString()}` : `${v}${unit}`);

  return (
    <div className="pt-3 pb-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{fmt(value[0])}</span>
        <span className="text-xs text-muted-foreground">{fmt(value[1])}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main FilterSidebar                                                 */
/* ------------------------------------------------------------------ */

export interface FilterState {
  checked: Record<string, Set<string>>;
  ranges: Record<string, [number, number]>;
}

interface FilterSidebarProps {
  openFilters: Set<string>;
  toggleFilter: (name: string) => void;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose?: () => void;
}

const FilterSidebar = ({
  openFilters,
  toggleFilter,
  filterState,
  setFilterState,
  onClose,
}: FilterSidebarProps) => {
  const toggleCheck = (group: string, option: string) => {
    setFilterState((prev) => {
      const next = new Set(prev.checked[group] || []);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return { ...prev, checked: { ...prev.checked, [group]: next } };
    });
  };

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const setRange = (name: string, value: [number, number]) => {
    setFilterState((prev) => ({
      ...prev,
      ranges: { ...prev.ranges, [name]: value },
    }));
  };

  return (
    <div className="space-y-0">
      {onClose && (
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <span className="text-xs font-sans font-semibold tracking-[0.1em] uppercase text-foreground">
            Filters
          </span>
          <button onClick={onClose} className="text-foreground">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Checkbox filters */}
      {checkboxFilters.map((filter) => {
        const isOpen = openFilters.has(filter.name);
        const checked = filterState.checked[filter.name] || new Set();

        return (
          <div key={filter.name} className="border-t border-border py-4">
            <button
              onClick={() => toggleFilter(filter.name)}
              className="flex w-full items-center justify-between text-xs font-sans font-semibold tracking-[0.1em] uppercase text-foreground"
            >
              <span className="flex items-center gap-2">
                {filter.name}
                {checked.size > 0 && (
                  <span className="text-[10px] font-normal text-accent">({checked.size})</span>
                )}
              </span>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {isOpen && (
              <div className="mt-3 space-y-2">
                {(() => {
                  const hasPrimary = 'primaryOptions' in filter && (filter as any).primaryOptions;
                  const primary: string[] = hasPrimary ? (filter as any).primaryOptions : filter.options;
                  const more: string[] = hasPrimary ? (filter as any).moreOptions || [] : [];
                  const isExpanded = expandedCategories.has(filter.name);
                  const visibleOptions = isExpanded ? [...primary, ...more] : primary;

                  return (
                    <>
                      {visibleOptions.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer group"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center border transition-colors ${
                              checked.has(opt)
                                ? "bg-foreground border-foreground"
                                : "border-muted-foreground/40 group-hover:border-foreground"
                            }`}
                          >
                            {checked.has(opt) && (
                              <svg className="h-3 w-3 text-background" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </span>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked.has(opt)}
                            onChange={() => toggleCheck(filter.name, opt)}
                          />
                          <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                            {opt}
                          </span>
                        </label>
                      ))}
                      {more.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedCategories((prev) => {
                              const next = new Set(prev);
                              if (next.has(filter.name)) next.delete(filter.name);
                              else next.add(filter.name);
                              return next;
                            })
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pt-1"
                        >
                          {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {isExpanded ? "Less" : `More (${more.length})`}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      {/* Range slider filters */}
      {rangeFilters.map((filter) => {
        const isOpen = openFilters.has(filter.name);
        const value = filterState.ranges[filter.name] || [filter.min, filter.max];

        return (
          <div key={filter.name} className="border-t border-border py-4">
            <button
              onClick={() => toggleFilter(filter.name)}
              className="flex w-full items-center justify-between text-xs font-sans font-semibold tracking-[0.1em] uppercase text-foreground"
            >
              {filter.name}
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {isOpen && (
              <RangeFilter
                label={filter.name}
                unit={filter.unit}
                min={filter.min}
                max={filter.max}
                step={filter.step}
                prefix={filter.prefix}
                value={value}
                onChange={(v) => setRange(filter.name, v)}
              />
            )}
          </div>
        );
      })}

      {/* Advanced Search */}
      <div className="border-t border-border py-4">
        <a
          href="/coming-soon"
          className="flex items-center gap-2 text-xs font-sans font-semibold tracking-[0.1em] uppercase text-foreground hover:text-accent transition-colors"
        >
          Advanced Search
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

      </div>
    </div>
  );
};

export default FilterSidebar;
export { checkboxFilters, rangeFilters };
