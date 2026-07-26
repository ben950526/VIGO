import { LegalDocument, LegalSection } from "@/components/legal/LegalDocument";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "隱私權政策",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="隱私權政策">
      <LegalSection title="1. 適用範圍">
        <p>
          本政策說明 {SITE_NAME}（以下稱「本平台」）如何收集、使用、保存及保護您的個人資料。本政策與
          <a href="/terms" className="text-[var(--accent)] hover:underline">
            使用條款
          </a>
          一同適用於您對本平台之使用。
        </p>
      </LegalSection>

      <LegalSection title="2. 資料控制者">
        <p>
          個人資料之控制者為本平台營運團隊。您可透過網站「意見回饋」功能行使本政策所載之權利或提出詢問。
        </p>
      </LegalSection>

      <LegalSection title="3. 我們收集的資料">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>帳號資料：</strong>Email、密碼（由 Supabase Auth 加密保存）、真實姓名、角色
          </li>
          <li>
            <strong>工作室資料：</strong>工作室名稱、簡介、地區、服務類型、風格標籤、價目、聯絡方式（Email、LINE ID、電話等，依您填寫與公開設定）
          </li>
          <li>
            <strong>作品資料：</strong>作品標題、描述、外部嵌入連結、縮圖 URL、風格標籤
          </li>
          <li>
            <strong>回饋資料：</strong>您於意見回饋或 BUG 回報所提交之內容及選填聯絡方式
          </li>
          <li>
            <strong>技術紀錄：</strong>為維運與安全所需之 IP、瀏覽器類型、存取時間等（由託管服務 Vercel、Supabase 等可能自動記錄）
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 收集目的與法律依據">
        <p>我們基於下列目的處理個人資料：</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>提供註冊、登入、工作室管理與媒合展示服務</li>
          <li>審核創作者與作品、維護平台秩序與安全</li>
          <li>回覆您的意見、BUG 回報或客服詢問</li>
          <li>遵守法律義務、主張或抗辯法律上請求</li>
          <li>在取得同意或法律允許範圍內改善平台功能</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 公開與分享">
        <p>
          您選擇公開之工作室頁面、已審核通過之作品及您開啟顯示的聯絡方式，<strong>任何造訪本平台之人均可能看見</strong>。請勿公開您不願被陌生人知悉的資訊。
        </p>
        <p>
          我們可能將資料提供給以下類型之受託者，且僅於提供服務所需範圍內：Supabase（資料庫與驗證）、Vercel（網站託管）。我們不出售您的個人資料。
        </p>
      </LegalSection>

      <LegalSection title="6. 保存期間">
        <p>
          帳號存續期間內，我們會保存相關資料以提供服務。您得申請刪除帳號；法律要求保留之紀錄（例如爭議處理）不在此限。回饋與日誌資料原則上保存至處理完成或合理之營運必要期間。
        </p>
      </LegalSection>

      <LegalSection title="7. 您的權利">
        <p>依個人資料保護法，您得行使下列權利（須提供足以確認身分之資訊）：</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>查詢或請求閱覽、製給複製本</li>
          <li>請求補充或更正</li>
          <li>請求停止收集、處理或利用</li>
          <li>請求刪除（依法得拒絕或延期者除外）</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. 安全措施">
        <p>
          我們採取合理之技術與組織措施保護資料，包含 HTTPS 傳輸、存取控管及 Supabase 之列層級安全設定。然網際網路傳輸無法保證絕對安全，請妥善保管密碼。
        </p>
      </LegalSection>

      <LegalSection title="9. Cookie 與類似技術">
        <p>
          本平台主要使用維持登入狀態所需之必要 Cookie（由 Supabase Auth 管理）。目前 MVP 階段未使用廣告或跨站追蹤分析工具。若未來新增，我們將更新本政策。
        </p>
      </LegalSection>

      <LegalSection title="10. 政策修訂">
        <p>我們可能修訂本政策並於網站公布。重大變更時，將以適當方式提醒您。繼續使用即視為接受修訂後之政策。</p>
      </LegalSection>
    </LegalDocument>
  );
}
