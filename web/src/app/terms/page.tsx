import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "使用條款",
};

export default function TermsPage() {
  return (
    <LegalDocument title="使用條款">
      <LegalSection title="1. 同意條款">
        <p>
          歡迎使用 {SITE_NAME}（以下稱「本平台」）。您註冊、登入或使用本平台，即表示您已閱讀、理解並同意受本使用條款（以下稱「本條款」）及
          <a href="/privacy" className="text-[var(--accent)] hover:underline">
            隱私權政策
          </a>
          之拘束。若您不同意，請勿使用本平台。
        </p>
        <p>
          您聲明已年滿 18 歲，或已取得法定代理人同意，且具備完全行為能力以同意本條款。
        </p>
      </LegalSection>

      <LegalSection title="2. 平台性質與媒合服務">
        <p>
          本平台為<strong>短影音創作者與發案者之資訊媒合平台</strong>，提供工作室展示、作品集瀏覽及聯絡資訊揭露等功能。
        </p>
        <p>
          本平台<strong>並非</strong>發案者與接案者間任何交易、合約、僱傭或委任關係之當事人，<strong>不參與</strong>雙方報價、簽約、付款、交付或爭議處理。所有合作條件、金流與履約，均由使用者自行於站外協商與負責。
        </p>
      </LegalSection>

      <LegalSection title="3. 帳號與創作者義務">
        <p>接案者註冊時應提供真實、正確之資料，並自行保管帳號密碼。因帳號遭他人使用所致之損害，除可歸責於本平台者外，由使用者自行承擔。</p>
        <p>
          創作者對其上架之工作室資料、作品集連結、報價資訊及聯絡方式負完全責任，並保證不侵害第三人著作權、商標、肖像、個資或其他權利。
        </p>
        <p>本平台得依審核機制決定是否公開、下架或移除任何工作室或作品，無須事先通知。</p>
      </LegalSection>

      <LegalSection title="4. 禁止行為">
        <p>使用者不得利用本平台從事下列行為：</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>詐欺、虛偽宣傳、冒用他人身分或工作室</li>
          <li>刊登非法、色情、暴力、仇恨、歧視或侵害他人權益之內容</li>
          <li>散布惡意程式、垃圾訊息或干擾平台運作</li>
          <li>繞過審核、爬蟲大量抓取資料，或侵害平台系統安全</li>
          <li>其他違反中華民國法律或公序良俗之行為</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 示範帳號">
        <p>
          本平台可能提供標示為「示範帳號」之範例工作室，僅供介面與功能展示，<strong>非真實可委託之創作者</strong>。請勿對示範帳號匯款、簽約或提供個資。
        </p>
      </LegalSection>

      <LegalSection title="6. 第三方內容與連結">
        <p>
          作品集可能嵌入 YouTube、Vimeo、Instagram 等第三方平台內容；聯絡方式可能導向站外通訊軟體或 Email。該等第三方服務由其各自提供者負責，本平台不控制亦不保證其內容、可用性或安全性。
        </p>
      </LegalSection>

      <LegalSection title="7. 免責聲明">
        <p>
          本平台依「現狀」提供服務，對於媒合結果、交易品質、創作者履約能力、發案者付款意願或站外溝通內容，<strong>不提供任何明示或默示之保證</strong>。
        </p>
        <p>
          在法律允許之最大範圍內，本平台對於因使用或無法使用本平台所生之間接、附帶、衍生或懲罰性損害不負賠償責任；對於可歸責於本平台之直接損害，賠償上限以該使用者於爭議發生前 12 個月內曾支付予本平台之費用總額為限（目前 MVP 免費期間為新臺幣零元）。
        </p>
      </LegalSection>

      <LegalSection title="8. 條款變更與終止">
        <p>
          本平台得隨時修改本條款，並於網站公布後生效。若您於修改後繼續使用，視為同意新版條款。本平台亦得因違規、法律要求或營運需要，暫停或終止您的帳號或服務。
        </p>
      </LegalSection>

      <LegalSection title="9. 準據法與管轄">
        <p>本條款以中華民國法律為準據法。因本條款或本平台所生之爭議，以臺灣臺北地方法院為第一審管轄法院（若法律另有強制規定從其規定）。</p>
      </LegalSection>
    </LegalDocument>
  );
}
