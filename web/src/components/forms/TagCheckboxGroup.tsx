"use client";

import { useState } from "react";
import { parseCustomTags, splitPresetAndCustomTags } from "@/lib/tags";

interface TagCheckboxGroupProps {
  legend: string;
  options: readonly string[];
  checkboxNamePrefix: string;
  customFieldName: string;
  selectedValues: string[];
}

export function TagCheckboxGroup({
  legend,
  options,
  checkboxNamePrefix,
  customFieldName,
  selectedValues,
}: TagCheckboxGroupProps) {
  const { preset, custom } = splitPresetAndCustomTags(selectedValues, options);
  const [customTags, setCustomTags] = useState<string[]>(custom);
  const [selectedCustom, setSelectedCustom] = useState<Set<string>>(() => new Set(custom));
  const [draft, setDraft] = useState("");

  function addTags() {
    const next = parseCustomTags(draft);
    if (next.length === 0) return;

    const added: string[] = [];
    setCustomTags((prev) => {
      const merged = [...prev];
      for (const tag of next) {
        if (merged.length >= 20) break;
        if (!merged.includes(tag) && !options.includes(tag as (typeof options)[number])) {
          merged.push(tag);
          added.push(tag);
        }
      }
      return merged;
    });

    if (added.length > 0) {
      setSelectedCustom((prev) => {
        const nextSelected = new Set(prev);
        for (const tag of added) nextSelected.add(tag);
        return nextSelected;
      });
    }

    setDraft("");
  }

  function toggleCustom(tag: string, checked: boolean) {
    setSelectedCustom((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tag);
      else next.delete(tag);
      return next;
    });
  }

  const checkedCustom = customTags.filter((tag) => selectedCustom.has(tag));

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>

      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label key={option} className="text-sm">
            <input
              type="checkbox"
              name={`${checkboxNamePrefix}${option}`}
              className="mr-1"
              defaultChecked={preset.includes(option)}
            />{" "}
            {option}
          </label>
        ))}

        {customTags.map((tag) => (
          <label key={tag} className="text-sm">
            <input
              type="checkbox"
              className="mr-1"
              checked={selectedCustom.has(tag)}
              onChange={(e) => toggleCustom(tag, e.target.checked)}
            />{" "}
            {tag}
          </label>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTags();
            }
          }}
          placeholder="新增自定義標籤"
        />
        <button
          type="button"
          onClick={addTags}
          className="btn-secondary shrink-0 px-4 text-sm"
        >
          新增
        </button>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        按「新增」後會出現在上方選項並自動勾選
      </p>

      <input type="hidden" name={customFieldName} value={checkedCustom.join("、")} />
    </fieldset>
  );
}
