const CUSTOM_TAG_SEP = /[,，、]/;

export function parseCustomTags(raw: string): string[] {
  return raw
    .split(CUSTOM_TAG_SEP)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function mergeSelectedTags(
  predefined: readonly string[],
  customRaw: string,
): string[] {
  const selected = predefined.filter(Boolean);
  const custom = parseCustomTags(customRaw);
  return [...new Set([...selected, ...custom])];
}

export function splitPresetAndCustomTags(
  values: string[],
  presets: readonly string[],
): { preset: string[]; custom: string[] } {
  const presetSet = new Set(presets);
  const preset: string[] = [];
  const custom: string[] = [];

  for (const value of values) {
    if (presetSet.has(value)) preset.push(value);
    else custom.push(value);
  }

  return { preset, custom };
}

export function formatCustomTagsForInput(custom: string[]): string {
  return custom.join("、");
}

export function collectTagsFromForm(
  formData: FormData,
  presets: readonly string[],
  checkboxPrefix: string,
  customFieldName: string,
): string[] {
  const selected = presets.filter((item) => formData.get(`${checkboxPrefix}${item}`) === "on");
  const customRaw = String(formData.get(customFieldName) ?? "");
  return mergeSelectedTags(selected, customRaw);
}
