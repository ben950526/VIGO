export function emailCta(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 0 8px 8px 0;">${label}</a>`;
}

export function emailAutoFooter(): string {
  return `<p style="margin-top: 32px; font-size: 13px; color: #64748b;">有問題的話，到網站的「意見回饋」跟我們說就好。這封信是自動寄的，直接回覆可能收不到喔。</p>`;
}
