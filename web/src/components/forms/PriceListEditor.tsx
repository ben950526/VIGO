"use client";

import type { PriceListItem } from "@/types/database";

interface PriceListEditorProps {
  items: PriceListItem[];
  onChange: (items: PriceListItem[]) => void;
}

const PRICE_LIST_TIPS = [
  "項目名稱寫清楚：服務內容、影片長度、是否含腳本／拍攝／字幕",
  "價格填新台幣；若為起價或區間，請在備註說明",
  "備註可寫修改次數、加購項目、不適用範圍，讓發案者一眼看懂",
  "避免只用「30 秒以上」等模糊描述，改用自己的服務名稱說明",
];

export function PriceListEditor({ items, onChange }: PriceListEditorProps) {
  function updateItem(index: number, field: keyof PriceListItem, value: string) {
    const next = [...items];
    if (field === "price") {
      next[index] = { ...next[index], price: Number(value) || 0 };
    } else if (field === "label") {
      next[index] = { ...next[index], label: value };
    } else {
      next[index] = { ...next[index], note: value || null };
    }
    onChange(next);
  }

  function addItem() {
    onChange([...items, { label: "", price: 0, note: null }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        <p className="mb-2 font-medium text-[var(--text)]">填寫小提示</p>
        <ul className="list-inside list-disc space-y-1">
          {PRICE_LIST_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-sm text-[var(--text-muted)]">
          尚無價目，點下方按鈕新增你的服務項目
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 sm:grid-cols-[1fr_120px_1fr_auto]"
            >
              <input
                className="input"
                placeholder="服務項目，例如：Reels 剪輯（含字幕，30–60 秒）"
                value={item.label}
                onChange={(e) => updateItem(index, "label", e.target.value)}
              />
              <input
                className="input"
                type="number"
                min={0}
                placeholder="價格 TWD"
                value={item.price || ""}
                onChange={(e) => updateItem(index, "price", e.target.value)}
              />
              <input
                className="input"
                placeholder="備註，例如：含 2 次修改、不含拍攝"
                value={item.note ?? ""}
                onChange={(e) => updateItem(index, "note", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-sm text-red-600 hover:underline"
              >
                刪除
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={addItem} className="btn-secondary text-sm">
        + 新增價目項目
      </button>
    </div>
  );
}
