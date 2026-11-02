import { escapeHtml } from "@/lib/email/escapeHtml";
import { emailAutoFooter, emailCta } from "@/lib/email/emailVoice";

export type ClientNudgeDay = 1 | 3 | 7;

export type ClientNudgeStudio = {
  name: string;
  url: string;
  tags: string[];
  region: string | null;
};

export function clientNudgeSubject(day: ClientNudgeDay): string {
  if (day === 1) return "【Vigo】幫你挑了幾間可以先看看的短影音工作室";
  if (day === 3) return "【Vigo】找到喜歡的風格了嗎？敲門就能直接聯絡";
  return "【Vigo】這週可以逛的工作室，給還在找剪輯的你";
}

function intro(day: ClientNudgeDay): string {
  if (day === 1) {
    return "<p>嗨，謝謝你昨天來 Vigo 逛逛。</p><p>如果還沒想好要找哪一種，可以先從下面幾間開始看。點進去先看作品，對到風格再說。</p>";
  }
  if (day === 3) {
    return "<p>嗨，前幾天你來 Vigo 看過工作室。</p><p>看到喜歡的作品，按工作室頁面下方的「<strong>敲門</strong>」就會看到聯絡方式，可以直接私訊或寫信給對方，不經過我們、也不用付費。</p><p>第一次聯絡時，記得說是在 Vigo 看到的，對方會比較快回你。</p>";
  }
  return "<p>嗨，距離你來 Vigo 已經一週了。</p><p>還在找短影音剪輯的話，這幾間可以看看；找到了的話也恭喜你，這是最後一封提醒信。</p>";
}

function studioList(studios: ClientNudgeStudio[]): string {
  if (studios.length === 0) return "";
  const items = studios
    .map((s) => {
      const meta = [s.region, ...s.tags.slice(0, 3)].filter(Boolean).map((t) => escapeHtml(String(t)));
      return `<li style="margin-bottom: 10px;"><a href="${s.url}" style="color: #0f172a; font-weight: 600;">${escapeHtml(s.name)}</a>${
        meta.length ? `<br><span style="font-size: 13px; color: #64748b;">${meta.join("・")}</span>` : ""
      }</li>`;
    })
    .join("");
  return `<ul style="padding-left: 18px;">${items}</ul>`;
}

export function buildClientNudgeHtml(params: {
  day: ClientNudgeDay;
  studios: ClientNudgeStudio[];
  exploreUrl: string;
  unsubscribeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px; margin: 0 auto; padding: 24px;">
  ${intro(params.day)}
  ${params.day === 3 ? "" : studioList(params.studios)}
  <p style="margin: 24px 0 8px;">
    ${emailCta(params.exploreUrl, "去逛工作室")}
  </p>
  ${emailAutoFooter()}
  <p style="font-size: 12px; color: #94a3b8;">不想再收到這類提醒？<a href="${params.unsubscribeUrl}" style="color: #94a3b8;">一鍵取消</a></p>
</body>
</html>`;
}
