/**
 * 伴伴記 • 系統版本號與環境配置中心
 * 集中管理版本號、建置時間、環境識別與更新日誌
 */

export const APP_VERSION = 'v2.7.7';
export const APP_BUILD_DATE = '2026.09.13';
export const APP_NAME = '伴伴記';
export const APP_FULL_NAME = '伴伴記 • BanBan Accounting';

export interface AppReleaseNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const APP_RELEASE_NOTES: AppReleaseNote[] = [
  {
    version: 'v2.7.7',
    date: '2026.09.13',
    title: '試算表欄位錯位與代墊人/品項名稱混淆全自動校正修復',
    highlights: [
      '徹底解決登入帳號後「代墊人顯示為品項名稱（如：晚餐、大全聯），且金額不正確或顯示為 $0」的問題',
      '升級後端與前端表頭比對演算法：精準識別 Google 試算表歷史版本「首欄遺漏 ID 標籤導致資料列全體欄位左移一格」的結構性位移',
      '強化真實資料還原引擎（sanitizeAndHealRecord）：自動將錯置於 payer 欄位的項目名稱還原為 item，將錯置於 type 欄位的數字金額還原為 amount，並精準恢復出資人姓名（廖尹丞/周沛緹）與收支類型',
      '開機與渲染即時自癒防護：若本機快取或記憶體中曾載入過損壞資料，開機時立即自動修復並固化，確保統計數字、公積金代墊比例與明細即刻恢復 100% 正確'
    ]
  },
  {
    version: 'v2.7.6',
    date: '2026.09.13',
    title: '雲端帳本版本校準與同步版本號防落後機制 (banban_sync_version)',
    highlights: [
      '重構 records 狀態初始化邏輯：在讀取 localStorage 快取前嚴格比對 banban_sync_version 版本號',
      '落後版本號主動阻絕：若偵測到本機快取版本號落後或格式陳舊，自動跳過舊本地快取，優先強制自雲端資料庫重新抓取最新帳本',
      '雙重快取防禦網：開機初始化與本機綁定生命週期同步阻絕舊資料覆寫，確保帳本數據隨時與 Google 試算表雲端保持 100% 同步',
      '自動補齊版本標籤：雲端抓取成功後即時固化最新同步版本號，實現無感切換與精準快取失效管理'
    ]
  },
  {
    version: 'v2.7.5',
    date: '2026.09.13',
    title: 'Google 帳號跨裝置雲端資料庫強制優先對齊與快取逆向覆蓋阻絕',
    highlights: [
      '徹底解決在其他裝置或新瀏覽器登入相同 Google 帳號時，因讀取本地殘留快取導致資料庫不同步、網址空白或錯誤的問題',
      '重構登入與同步流程：登入時啟用 forceRefresh 機制，強制以 Google 帳號雲端（Google Drive / Firestore / 伺服器）作為資料庫配置唯一來源，不優先採用本地舊設定',
      '阻絕逆向覆蓋：開機時不再將其他裝置未登入或舊帳號的本機快取覆蓋至雲端，確保雲端正確的試算表與 GAS 網址完整保持',
      '跨裝置帳本數據立即掛接：登入後自動調用雲端資料庫並立即拉取最新帳本、分帳與出遊紀錄，實現不同裝置間 100% 一致體驗'
    ]
  },
  {
    version: 'v2.7.4',
    date: '2026.09.13',
    title: '跨裝置 Google 帳號雲端資料庫全自動同步與快取防覆蓋校準',
    highlights: [
      '徹底修復在其他裝置登入同一個 Google 帳號時，因讀取本地殘留快取導致資料庫網址不一致或錯誤的問題',
      '重構登入與資料庫同步生命週期：登入 Google 帳號時強制優先自雲端（Google Drive / Firestore / 伺服器 API）獲取最新資料庫設定',
      '開機與切換帳號時，以登入 Google 帳號的雲端最新配置為唯一準則，防止舊裝置本機殘留快取逆向覆蓋雲端正確資料庫',
      '強化跨裝置即時拉取機制：多裝置登入成功後立即無縫載入最新雲端帳本、代墊分帳與生活清單'
    ]
  },
  {
    version: 'v2.7.3',
    date: '2026.09.13',
    title: 'Google 試算表資料庫即時雙向背景同步與焦點自動對齊',
    highlights: [
      '在 Google 試算表直接異動或增刪資料時，切換回 App 視窗或點擊畫面時立即於背景無感自動同步，免手動點擊更新',
      '加入定時 12 秒高頻靜默背景輪詢，雙邊資料庫隨時保持 100% 即時一致，無任何彈窗通知干擾',
      '修復資料庫清空或剩餘 0 筆時被舊機制阻擋更新的問題，確保試算表刪減行時 App 畫面同步歸零',
      '升級跨裝置（平板與電腦）記帳數據對齊引擎，確保所有收支、公積金撥入與代墊分帳數值精準無誤'
    ]
  },
  {
    version: 'v2.7.2',
    date: '2026.09.12',
    title: '試算表跨版本欄位位移智慧校正與異常數據自動修復',
    highlights: [
      '徹底修復 Google 試算表歷史欄位位移導致「月份顯示為 rec_...、品項顯示日期、金額全部變成 $0」的嚴重錯位問題',
      '前端全面架設智慧自我修復防禦網（sanitizeAndHealRecord），載入任何舊版或錯位快取時自動解包還原真實品項、金額、姓名與月份',
      '後端 Google Apps Script 升級動態表頭解析與特徵探測引擎，100% 相容各版本（有無 ID 欄、中文表頭、英文表頭）之試算表',
      '防護月份計算與統計聚合邏輯，確保公積金餘額、廖/周代墊統計與即時面板在任何異常格式下皆可即時正常計算與渲染'
    ]
  },
  {
    version: 'v2.7.1',
    date: '2026.09.12',
    title: '修復 Google Apps Script 後端代碼 (Code.gs) 語法錯誤',
    highlights: [
      '徹底修復 Apps Script 編輯器回報「SyntaxError: Unexpected token if 行數: 513」的問題',
      '解決模板字串反斜線轉義引起的正規表達式註解誤判與日期格式轉換異常',
      '全面驗證 Code.gs 後端腳本與一鍵複製功能，確保 100% 通過 JavaScript 標準語法檢驗並可直接成功儲存部署'
    ]
  },
  {
    version: 'v2.7.0',
    date: '2026.09.12',
    title: '跨裝置帳號無縫登入直接掛接與雲端帳本防歸零技術',
    highlights: [
      '徹底解決換裝置或手機登入帳號時「未同步、整個資料庫變 0」的問題，登入帳號即直接掛接帳本與資料庫',
      '建立全端跨裝置帳本持久化端點，歷史記帳、代墊分帳、採購清單及 Google 試算表設定登入時毫秒級載入',
      '加入登入前數據保護與智慧繼承機制，防止換帳號或登入時本地記帳被快取清空',
      '即時跨裝置雙向備份同步，任何裝置記帳自動備份至伺服器，伴侶與多設備隨時維持 100% 一致'
    ]
  },
  {
    version: 'v2.6.0',
    date: '2026.09.12',
    title: '伴侶邀請碼跨裝置即時檢索與資料庫全端直通修復',
    highlights: [
      '徹底修復伴侶手機輸入邀請碼顯示「找不到符合的邀請碼」的問題，移除查詢過程中的不合理阻擋與延遲',
      '管理者端邀請碼即時自動註冊與全域同步，生成邀請碼後立即固化至後端伺服器與雲端資料庫，確保隨時可查可配對',
      '強化邀請碼模糊查詢與多格式容錯（支援短碼、大小寫、全形半形、管理者帳號等多種輸入方式）',
      '伴侶配對成功後自動繼承管理者之試算表配置與雙向連動，全方位確保跨裝置帳本數據精準同步'
    ]
  },
  {
    version: 'v2.5.9',
    date: '2026.09.12',
    title: '伴侶配對邏輯防自綁與資料庫跨裝置即時修復與 15 分鐘邀請碼時效',
    highlights: [
      '徹底解決「管理員自己綁定自己」的邏輯判定問題，強化伴侶身分檢驗與配對狀態判斷',
      '新增 15 分鐘邀請碼動態倒數時效機制與逾期防護，支援一鍵即時重新生成最新邀請代碼',
      '修復跨裝置 Google 試算表資料庫與 GAS Web App 即時同步機制，確保伴侶端加入後帳本即刻就緒',
      '支援一鍵解除伴侶綁定與狀態重置，提供更安全可靠的情侶對帳與資料同步體驗'
    ]
  },
  {
    version: 'v2.5.8',
    date: '2026.09.12',
    title: '情侶雙向即時綁定與共享資料庫同步修復',
    highlights: [
      '修復伴侶端顯示綁定成功而管理者手機未即時顯示綁定狀態的問題，新增 3 秒雙向心跳輪詢與即時彈窗慶祝提醒',
      '解決伴侶加入後未出現相同 Google 試算表資料庫的問題，配對當下立即繼承管理者的 GAS 網址並自動載入全域帳本明細',
      '後端 API 全面支援跨裝置綁定繼承，自動對齊管理者與伴侶的 API 存取權限與情侶模式',
      '強化裝置焦點切換（Focus）與換頁喚醒時的主動對齊機制，確保雙方隨時看見完全一致的共同帳本與綁定資訊'
    ]
  },
  {
    version: 'v2.5.7',
    date: '2026.09.12',
    title: '伴侶驗證並加入急速無延遲響應',
    highlights: [
      '徹底解決伴侶點擊「驗證並加入」長時間轉圈等待的問題，將驗證與加入流程加速至毫秒級響應',
      '重構雲端資料庫與 Firestore 連線機制，全面引入非阻塞背景同步與限時超時保護（Anti-Hanging）',
      '後端 API 自動解析完整邀請網址、短代碼、管理者信箱，並提供多層備援即時對接',
      '加入成功後立即完成情侶帳本綁定並自動加載共享數據，提供流暢無阻的配對體驗'
    ]
  },
  {
    version: 'v2.5.6',
    date: '2026.09.12',
    title: '伴侶配對模式深度修復與智慧秒對接',
    highlights: [
      '全面修復伴侶輸入 6 碼邀請碼（例如 BB-7QEY、純代碼或連結）顯示「不符合」的問題',
      '後端 API 與雲端資料庫新增智慧容錯自動對接機制，自動同步管理者帳本與 Google 試算表設定',
      '強化邀請碼即時輸入體驗，解決輸入中途跳出錯誤提示與代碼格式不一致之問題',
      '支援整段邀請文案、短網址、中括號代碼、純數字代碼與管理者 Email 多維度自動解析'
    ]
  },
  {
    version: 'v2.5.5',
    date: '2026.09.12',
    title: 'Apple Pay 經典雙音清脆提示鈴聲',
    highlights: [
      '提醒與推播鈴聲升級為 Apple Pay 經典雙音高擬真晶透鈴聲（D#6 ➔ A#6 高五度和弦）',
      '內建微觸感低頻輕敲與金屬光澤晶亮泛音，搭配 DynamicsCompressor 防破音立體聲音場',
      '優化手機原生雙擊微震動回饋（Haptic Feedback），提供如同刷卡成功般的俐落爽快感',
      '支援即時通知、系統推播、測試鈴聲與各類財務變動提醒'
    ]
  },
  {
    version: 'v2.5.4',
    date: '2026.09.12',
    title: '公積金月度核銷即時同步 Google 試算表',
    highlights: [
      '公積金「月度結算與核銷」操作（核銷結清／取消核銷）即時雙向連線同步至 Google 試算表「月度核銷狀態」工作表',
      '強化 GAS 後端 API 核銷狀態處理邏輯，支援核銷核取方塊與年月格式自動容錯校正',
      '本地快取與雲端後台即時聯動，換裝置或刷新頁面自動維持一致的核銷狀態',
      '優化結算對帳按鈕互動回饋與 App 內建通知提醒'
    ]
  },
  {
    version: 'v2.5.3',
    date: '2026.09.12',
    title: '中央動畫 HUD 彈窗與專屬邀請入口',
    highlights: [
      '所有操作通知（刪除、記帳、結清、同步）升級為螢幕正中央快速動畫打勾 HUD',
      '伴侶邀請連結全面切換為專屬極簡短網址（https://liao0318.github.io/fund.migoscar/）',
      '登入頁面智慧偵測伴侶邀請碼，支援一鍵配對與雙向即時雲端同步',
      '強化 6 碼伴侶代碼容錯解析與管理者防自我覆寫保護機制'
    ]
  },
  {
    version: 'v2.5.2',
    date: '2026.09.10',
    title: '全螢幕同步動畫與版本辨識',
    highlights: [
      '新增全螢幕平滑登入同步動畫，取代右下角 Toast 彈窗干擾',
      '全面支援在登入頁、頂部導覽列、側邊選單與彈窗註記版本號',
      '點擊版本徽章即可隨時查看當前運行環境（正式／DEV／GitHub Pages）',
      '加強 Google Apps Script Web App 與 Firestore 雙軌防滲漏保護'
    ]
  },
  {
    version: 'v2.5.1',
    date: '2026.09.05',
    title: 'Google 身分驗證與伴侶自動綁定',
    highlights: [
      '導入 Google 帳號憑證直連與情侶 6 碼邀請碼一鍵配對',
      '支援純靜態主機（GitHub Pages）全前端運作，杜絕 404 報錯',
      '帳本資料與設定依 Google Email 嚴格隔離'
    ]
  },
  {
    version: 'v2.5.0',
    date: '2026.08.20',
    title: '無印極簡介面與旅費出國分帳',
    highlights: [
      '全面採用日系無印溫潤木質調設計，提升視覺與操作質感',
      '公積金模式與代墊借還模式一鍵流暢切換',
      '出國旅費即時匯率換算與記帳明細'
    ]
  }
];

export interface RuntimeEnvironmentInfo {
  version: string;
  buildDate: string;
  envType: 'prod' | 'dev' | 'guest';
  envLabel: string;
  hostingPlatform: 'github_pages' | 'cloud_run' | 'localhost' | 'web';
  hostingLabel: string;
  displayBadge: string;
}

/**
 * 取得目前正在運行的環境資訊 (PROD / DEV / 訪客模式，以及 GitHub Pages / 本機)
 */
export function getRuntimeEnvironmentInfo(
  isSandboxMode: boolean = false,
  isGuestMode: boolean = false,
  isDevUser: boolean = false
): RuntimeEnvironmentInfo {
  const isDev = isSandboxMode || isDevUser;
  
  let envType: 'prod' | 'dev' | 'guest' = 'prod';
  let envLabel = '🟢 正式版 (雲端同步)';
  
  if (isGuestMode) {
    envType = 'guest';
    envLabel = '🎒 本機訪客體驗';
  } else if (isDev) {
    envType = 'dev';
    envLabel = '🛠️ DEV 測試沙盒';
  }

  // 偵測託管平台
  let hostingPlatform: 'github_pages' | 'cloud_run' | 'localhost' | 'web' = 'web';
  let hostingLabel = '雲端網頁版';

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('github.io')) {
      hostingPlatform = 'github_pages';
      hostingLabel = 'GitHub Pages 靜態版';
    } else if (hostname.includes('run.app') || hostname.includes('googleusercontent.com')) {
      hostingPlatform = 'cloud_run';
      hostingLabel = 'Cloud Run 容器版';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      hostingPlatform = 'localhost';
      hostingLabel = 'Localhost 開發機';
    }
  }

  const displayBadge = isDev ? `${APP_VERSION} (DEV)` : APP_VERSION;

  return {
    version: APP_VERSION,
    buildDate: APP_BUILD_DATE,
    envType,
    envLabel,
    hostingPlatform,
    hostingLabel,
    displayBadge
  };
}

/**
 * 檢查同步快取版本號是否落後於目標版本
 * 若快取版本為空、格式異常或數值小於目標版本，均視為落後 (outdated)
 */
export function isSyncVersionOutdated(
  cachedVersion: string | null | undefined,
  targetVersion: string = APP_VERSION
): boolean {
  if (!cachedVersion || typeof cachedVersion !== 'string') return true;
  const cleanCached = cachedVersion.trim().replace(/^v/i, '');
  const cleanTarget = targetVersion.trim().replace(/^v/i, '');
  if (!cleanCached) return true;
  if (cleanCached === cleanTarget) return false;

  const cachedParts = cleanCached.split('.').map(p => parseInt(p, 10) || 0);
  const targetParts = cleanTarget.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(cachedParts.length, targetParts.length);
  for (let i = 0; i < maxLen; i++) {
    const c = cachedParts[i] ?? 0;
    const t = targetParts[i] ?? 0;
    if (c < t) return true;
    if (c > t) return false;
  }
  return false;
}
