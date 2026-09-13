/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileCode, 
  Check, 
  User, 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  Copy, 
  FileText, 
  Sparkles,
  Info,
  ExternalLink,
  Settings,
  List,
  Home,
  X,
  Bell,
  Target,
  Search,
  ShoppingBag,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ReceiptText,
  Store,
  Clock,
  CheckSquare,
  Square,
  Tag,
  MessageSquare,
  Share2,
  Save,
  Edit3,
  Pencil,
  Globe,
  Coins,
  ArrowRightLeft,
  Calculator,
  Sliders,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Plane,
  Palmtree,
  Download,
  Database,
  Key,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportFundRecordsToCSV } from './utils/exportCsv';
import { formatAmPmTime, isTodayNotification, isIncomingFromPartner, getShoppingItemDisplayTime } from './utils/formatters';
import { sendNativeNotification } from './utils/nativeNotify';
import { resolveUserPersonas, isRecordOfUserA, isRecordOfUserB } from './utils/userPersona';
import { CODE_GS_TEMPLATE, INDEX_HTML_TEMPLATE, SPLIT_INDEX_HTML_TEMPLATE } from './data/gasTemplates';
import { SplitDebtView } from './components/SplitDebtView';
import { SplitHomeTab } from './components/split/SplitHomeTab';
import { SplitHistoryTab } from './components/split/SplitHistoryTab';
import { SplitTravelTab } from './components/split/SplitTravelTab';
import { SplitNotebookTab } from './components/split/SplitNotebookTab';
import { SplitSettlementTab } from './components/split/SplitSettlementTab';
import { SplitAddModal } from './components/split/SplitAddModal';
import { SplitSettleModal } from './components/split/SplitSettleModal';
import { Header } from './components/common/Header';
import { FloatingDock } from './components/common/FloatingDock';
import { CustomConfirmModal } from './components/common/CustomConfirmModal';
import { CenterToast, ToastData } from './components/common/CenterToast';
import { SmartAlertModal } from './components/modals/SmartAlertModal';
import { GoogleAuthPortal } from './components/auth/GoogleAuthPortal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { AddRecordModal } from './components/modals/AddRecordModal';
import { AddShoppingModal } from './components/modals/AddShoppingModal';
import { ManageStoresModal } from './components/modals/ManageStoresModal';
import { ClearDoneConfirmModal } from './components/modals/ClearDoneConfirmModal';
import { ShoppingDetailModal } from './components/modals/ShoppingDetailModal';
import { CurrencyCalculatorModal } from './components/modals/CurrencyCalculatorModal';
import { AppNotificationModal } from './components/modals/AppNotificationModal';
import { UnifiedDatabaseModal } from './components/modals/UnifiedDatabaseModal';
import { InitialEmptyEntryFrame } from './components/common/InitialEmptyEntryFrame';
import { FullScreenSyncOverlay } from './components/common/FullScreenSyncOverlay';
import { DataBackupModal } from './components/modals/DataBackupModal';
import { PwaInstallModal } from './components/modals/PwaInstallModal';
import { UnifiedSettingsModal } from './components/modals/UnifiedSettingsModal';
import { DeveloperSettingsModal } from './components/modals/DeveloperSettingsModal';
import { VersionInfoModal } from './components/modals/VersionInfoModal';
import { FloatingChatButton } from './components/chat/FloatingChatButton';
import { ChatAssistantDrawer } from './components/chat/ChatAssistantDrawer';
import { 
  PendingSyncItem, 
  getPendingQueue, 
  enqueueSyncItem, 
  processSyncQueue, 
  subscribeSyncStatus 
} from './services/syncQueue';
import { 
  SplitRecordItem, 
  SplitSummary, 
  AppNotifySettings, 
  AppNotification,
  SmartCommandResult, 
  AuthUser,
  PartnerInviteData,
  CoupleBindingInfo,
  NicknameLengthPreference
} from './types';
import { 
  generateRandomInviteCode,
  saveActiveInviteCode,
  getActiveInviteCode,
  getPartnerBindingInfo,
  savePartnerBindingInfo,
  fetchPartnerBindingInfoOnline,
  fetchInviteCodeOnline,
  removePartnerBinding,
  createShareableInviteCard,
  resolveInviteCodeOrToken,
  createFreshInvite,
  isInviteExpired,
  getInviteRemainingSeconds,
  formatRemainingTime
} from './utils/partnerInvite';
import { 
  saveUserCloudConfig, 
  getUserCloudConfig,
  saveUserNotifySettings,
  getUserNotifySettings,
  clearAllSessionLedgerCache,
  scanAndRecoverGasUrl
} from './utils/userConfigService';
import { doc, onSnapshot } from 'firebase/firestore';
import { syncGoogleUserProfile, signOutGoogle, db } from './utils/googleOAuthService';
import { hasBackendServer } from './utils/environment';
import { APP_VERSION, isSyncVersionOutdated } from './version';


// 定義購物記事資料型態
export interface ShoppingItem {
  id: string;
  category: '需要買' | '想要買';
  item: string;
  store: string;
  deadline: string;
  status: '待購買' | '已買到';
  creator: string;
  createdTime: string;
  note?: string;
}

const INITIAL_SHOPPING_ITEMS: ShoppingItem[] = [
  { id: 'shop-1', category: '需要買', item: '高麗菜', store: '菜市場', deadline: '8/13前', status: '待購買', creator: '廖尹丞', createdTime: '2026-08-10 上午 10:00', note: '挑選高麗菜葉片緊實、無蟲蛀者，打算炒培根！' },
  { id: 'shop-2', category: '需要買', item: '衛生紙 1 串', store: '全聯福利中心', deadline: '本週內', status: '待購買', creator: '周沛緹', createdTime: '2026-08-09 下午 06:30', note: '買三層柔柔牌，若有特價大包裝優先。' },
  { id: 'shop-3', category: '想要買', item: '雞塊', store: '日日加', deadline: '8/15前', status: '待購買', creator: '廖尹丞', createdTime: '2026-08-10 上午 11:15', note: '宵夜想用氣炸鍋炸來吃，買 1 斤裝。' },
  { id: 'shop-4', category: '需要買', item: '鮮乳 1 瓶', store: '家樂福', deadline: '8/11前', status: '已買到', creator: '周沛緹', createdTime: '2026-08-08 上午 09:20', note: '瑞穗或初鹿，保存期限選最久者。' }
];

// 🛠️ 開發沙盒展示專用之代墊數據（徹底杜絕真實用戶帳號資料滲漏）
const INITIAL_SPLIT_ITEMS: SplitRecordItem[] = [
  {
    id: 'split-dev-1',
    time: '上午 10:30',
    payer: '廖',
    splitMode: 'AA平分',
    itemName: '全聯生活補給與生鮮食材',
    totalAmount: 1200,
    splitResult: '周 應返還 廖 NT$ 600',
    debtor: '周',
    debtorAmount: 600,
    status: '未結清',
    note: '包含牛奶、雞蛋、蔬菜'
  },
  {
    id: 'split-dev-2',
    time: '下午 01:15',
    payer: '周',
    splitMode: 'AA平分',
    itemName: '週末早午餐咖啡',
    totalAmount: 680,
    splitResult: '廖 應返還 周 NT$ 340',
    debtor: '廖',
    debtorAmount: 340,
    status: '未結清',
    note: '義大利麵與冰拿鐵'
  },
  {
    id: 'split-dev-3',
    time: '昨天 下午 07:00',
    payer: '廖',
    splitMode: '全額代付',
    itemName: '電影票與爆米花雙人套餐',
    totalAmount: 850,
    splitResult: '周 應返還 廖 NT$ 850',
    debtor: '周',
    debtorAmount: 850,
    status: '已結清',
    settledTime: '昨天 21:00',
    note: 'IMAX 廳電影票'
  }
];

const INITIAL_STORES = ['菜市場', '全聯福利中心', '日日加', '家樂福', '好市多', '寶雅', '7-ELEVEN', '蝦皮購物'];

// 定義帳目資料型態

// ------------------- 幣別與國際即時匯率設定 -------------------
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  defaultRate: number; // 1 外幣 = X 台幣 (TWD)
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', flag: '🇹🇼', defaultRate: 1 },
  { code: 'JPY', name: '日圓', symbol: '¥', flag: '🇯🇵', defaultRate: 0.2024 },
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', defaultRate: 32.21 },
  { code: 'EUR', name: '歐元', symbol: '€', flag: '🇪🇺', defaultRate: 37.20 },
  { code: 'KRW', name: '韓元', symbol: '₩', flag: '🇰🇷', defaultRate: 0.0228 },
  { code: 'THB', name: '泰銖', symbol: '฿', flag: '🇹🇭', defaultRate: 0.973 },
  { code: 'HKD', name: '港幣', symbol: 'HK$', flag: '🇭🇰', defaultRate: 4.12 },
  { code: 'CNY', name: '人民幣', symbol: '¥', flag: '🇨🇳', defaultRate: 4.77 },
  { code: 'GBP', name: '英鎊', symbol: '£', flag: '🇬🇧', defaultRate: 43.20 },
  { code: 'AUD', name: '澳幣', symbol: 'A$', flag: '🇦🇺', defaultRate: 21.20 },
  { code: 'SGD', name: '新加坡幣', symbol: 'S$', flag: '🇸🇬', defaultRate: 24.50 },
  { code: 'VND', name: '越南盾', symbol: '₫', flag: '🇻🇳', defaultRate: 0.0013 },
  { code: 'MYR', name: '馬來西亞令吉', symbol: 'RM', flag: '🇲🇾', defaultRate: 7.45 },
  { code: 'PHP', name: '菲律賓披索', symbol: '₱', flag: '🇵🇭', defaultRate: 0.56 },
];

export const DEFAULT_RATES_MAP: Record<string, number> = CURRENCIES.reduce((acc, cur) => {
  acc[cur.code] = cur.defaultRate;
  return acc;
}, {} as Record<string, number>);

interface RecordItem {
  id: string | number;
  month: string;
  date: string;
  item: string;
  payer: string;
  amount: number; // 換算後的台幣總額 (作為系統對帳計價基準)
  type: '支出-日常代墊' | '收入-固定公積金';
  timestamp?: string;
  currency?: string;        // 幣別 (例如: JPY, USD, TWD)
  originalAmount?: number;  // 原幣金額 (例如: 10000 JPY)
  exchangeRate?: number;    // 當時換算匯率 (例如: 0.2024)
}

// 預設對帳明細數據
const INITIAL_RECORDS: RecordItem[] = [
  { id: 4, month: "2026-06", date: "2026-06-05", item: "全聯福利中心採購食材", payer: "廖尹丞", amount: 1250, type: "支出-日常代墊", timestamp: "2026-06-05 14:32:00" },
  { id: 3, month: "2026-06", date: "2026-06-03", item: "台灣自來水 5-6 月水費", payer: "周沛緹", amount: 480, type: "支出-日常代墊", timestamp: "2026-06-03 10:15:00" },
  { id: 2, month: "2026-06", date: "2026-06-01", item: "本月固定公積金撥入", payer: "共同帳戶", amount: 10000, type: "收入-固定公積金", timestamp: "2026-06-01 09:00:00" },
  { id: 1, month: "2026-05", date: "2026-05-15", item: "好市多採買公共清潔耗材", payer: "廖尹丞", amount: 3120, type: "支出-日常代墊", timestamp: "2026-05-15 16:45:00" },
  { id: 0, month: "2026-05", date: "2026-05-01", item: "固定公積金底池撥入", payer: "共同帳戶", amount: 10000, type: "收入-固定公積金", timestamp: "2026-05-01 09:00:00" }
];

// 預設對帳明細數據

const normalizeMonth = (m: string): string => {
  if (!m) return '';
  const cleaned = m.toString().replace(/['"]/g, '').trim();
  const match = cleaned.match(/^(\d{4})[-/](\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    return `${year}-${month}`;
  }
  return cleaned;
};

const isMonthReconciled = (month: string, list: string[]): boolean => {
  const normMonth = normalizeMonth(month);
  return list.some(item => normalizeMonth(item) === normMonth);
};

// 已知代墊人/出資人姓名關鍵字判定清單
export const KNOWN_PAYER_KEYWORDS = [
  '廖', '周', '廖尹丞', '周沛緹', '小廖', '小周', 
  '共同帳戶', '共同', '待確認伴侶', '待確認', '待', '伴侶'
];

export const isPayerNameRecognized = (p?: string): boolean => {
  if (!p || typeof p !== 'string') return false;
  const s = p.trim();
  if (!s) return false;
  return KNOWN_PAYER_KEYWORDS.some(k => s === k || s.includes(k));
};

// 🛡️ 智慧對帳紀錄修復防護網：自動校正 Google 試算表可能因欄位推移或表頭版本不一致造成的資料錯位
export const sanitizeAndHealRecord = (r: any): RecordItem => {
  if (!r || typeof r !== 'object') return r;
  let rec = { ...r };

  // 1. 智慧日期與月份解析與正規化
  let normalizedDate = '';
  let normalizedMonth = '';

  // 檢查 date 欄位
  if (rec.date) {
    if (rec.date instanceof Date) {
      try {
        const pad = (n: number) => String(n).padStart(2, '0');
        normalizedDate = `${rec.date.getFullYear()}-${pad(rec.date.getMonth() + 1)}-${pad(rec.date.getDate())}`;
      } catch (e) {}
    } else if (typeof rec.date === 'string') {
      const dMatch = rec.date.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (dMatch) {
        normalizedDate = `${dMatch[1]}-${dMatch[2].padStart(2, '0')}-${dMatch[3].padStart(2, '0')}`;
      } else {
        const mMatch = rec.date.match(/(\d{4})[-/](\d{1,2})/);
        if (mMatch) {
          normalizedDate = `${mMatch[1]}-${mMatch[2].padStart(2, '0')}-01`;
        }
      }
    }
  }

  // 檢查 month 欄位
  if (rec.month) {
    if (rec.month instanceof Date) {
      try {
        const pad = (n: number) => String(n).padStart(2, '0');
        normalizedMonth = `${rec.month.getFullYear()}-${pad(rec.month.getMonth() + 1)}`;
      } catch (e) {}
    } else if (typeof rec.month === 'string') {
      const mMatch = rec.month.match(/(\d{4})[-/](\d{1,2})/);
      if (mMatch) {
        normalizedMonth = `${mMatch[1]}-${mMatch[2].padStart(2, '0')}`;
      }
    }
  }

  // 互補推導
  if (!normalizedMonth && normalizedDate) {
    normalizedMonth = normalizedDate.substring(0, 7);
  }
  if (!normalizedDate && normalizedMonth) {
    normalizedDate = `${normalizedMonth}-01`;
  }
  if (!normalizedMonth) {
    normalizedMonth = new Date().toISOString().substring(0, 7);
  }
  if (!normalizedDate) {
    normalizedDate = `${normalizedMonth}-01`;
  }

  // 2. 欄位錯位真實偵測（支援因首欄未設 ID 造成之後移 1 欄或更深之位移）
  // 特徵 A：month 存放的是真實 ID（以 'rec_' 開頭）
  const monthLooksLikeId = typeof rec.month === 'string' && rec.month.trim().startsWith('rec_');
  // 特徵 B：item 存放的是完整日期時間物件字串或標準日期字串
  const itemLooksLikeDate = typeof rec.item === 'string' && (
    rec.item.includes('GMT') || 
    rec.item.includes('台北標準時間') || 
    /^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d{1,2}\s\d{4}/.test(rec.item) ||
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(rec.item.trim())
  );
  // 特徵 C：date 存放的只有 YYYY-MM（而非 YYYY-MM-DD）且 item 是日期格式
  const dateLooksLikeMonth = typeof rec.date === 'string' && /^\d{4}[-/]\d{1,2}$/.test(rec.date.trim());
  // 特徵 D：payer 與 item 完全相同（例如「晚餐」===「晚餐」或「大全聯」===「大全聯」），且非合法出資人人名
  const payerSameAsItem = typeof rec.payer === 'string' && typeof rec.item === 'string' && 
    rec.payer.trim().length > 0 && rec.payer.trim() === rec.item.trim() && !isPayerNameRecognized(rec.payer);

  const isShifted = monthLooksLikeId || itemLooksLikeDate || dateLooksLikeMonth || payerSameAsItem;

  if (isShifted) {
    // 發生欄位位移錯位！進行精準欄位解包還原：
    const trueId = (monthLooksLikeId ? rec.month : rec.id) || `rec_${Date.now()}`;

    // 還原日期與月份
    let trueDate = normalizedDate;
    if (itemLooksLikeDate) {
      try {
        const d = new Date(rec.item);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, '0');
          trueDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        } else {
          const m = String(rec.item).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (m) {
            trueDate = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
          }
        }
      } catch (e) {}
    }
    const trueMonth = trueDate ? trueDate.substring(0, 7) : normalizedMonth;

    // 還原項目描述 (trueItem)：
    // 在推移列中，原項目名稱通常被推至 payer 欄位（例如「晚餐」、「大全聯」）
    let trueItem = '';
    const rawPayer = String(rec.payer || '').trim();
    const rawItem = String(rec.item || '').trim();

    if (rawPayer && !isPayerNameRecognized(rawPayer)) {
      trueItem = rawPayer;
    } else if (rawItem && !itemLooksLikeDate) {
      trueItem = rawItem;
    } else {
      trueItem = '日常生活支出';
    }

    // 還原金額 (trueAmount)：
    // 在推移列中，原金額通常被推移至 type 欄位（例如 470、462、20000），
    // 而原 payer 欄位（例如「廖尹丞」）可能被推至 amount 欄位或被 GAS parseFloat 轉成 0
    let trueAmount = 0;
    const typeStr = String(rec.type || '').trim();
    const typeNum = parseFloat(typeStr.replace(/[^0-9.]/g, ''));
    const amtNum = parseFloat(String(rec.amount || '').replace(/[^0-9.]/g, ''));
    const origNum = parseFloat(String(rec.originalAmount || '').replace(/[^0-9.]/g, ''));

    // 若 type 欄位含有數字且非純文字標籤（例如不是「支出-日常代墊」），優先作為金額
    if (!isNaN(typeNum) && typeNum > 0 && !typeStr.includes('支出') && !typeStr.includes('代墊') && !typeStr.includes('收入')) {
      trueAmount = typeNum;
    } else if (!isNaN(amtNum) && amtNum > 0) {
      trueAmount = amtNum;
    } else if (!isNaN(typeNum) && typeNum > 0) {
      trueAmount = typeNum;
    } else if (!isNaN(origNum) && origNum > 0) {
      trueAmount = origNum;
    }

    // 還原收支類型 (trueType)：
    let trueType: '支出-日常代墊' | '收入-固定公積金' = '支出-日常代墊';
    const allContext = `${rec.type || ''} ${rec.timestamp || ''} ${trueItem} ${rec.item || ''} ${rec.payer || ''}`;
    if (
      allContext.includes('收入') || 
      allContext.includes('公積金') || 
      allContext.includes('撥入') || 
      allContext.includes('注資') || 
      allContext.includes('底池')
    ) {
      trueType = '收入-固定公積金';
    } else {
      trueType = '支出-日常代墊';
    }

    // 🎯 還原代墊人/付款人 (truePayer) —— 徹底解決代墊人變跟項目名稱一樣的問題！
    let truePayer = '';
    if (trueType === '收入-固定公積金') {
      truePayer = '共同帳戶';
    } else {
      // 支出項目：代墊人必須是真實人名，絕對不能等於項目名稱（例如絕對不能是「晚餐」或「大全聯」）
      if (rawPayer && rawPayer !== trueItem && isPayerNameRecognized(rawPayer)) {
        // rawPayer 本身就是合法出資人人名
        if (rawPayer.includes('周') || rawPayer.includes('沛緹') || rawPayer.includes('待')) {
          truePayer = '周沛緹';
        } else if (rawPayer.includes('共同')) {
          truePayer = '共同帳戶';
        } else {
          truePayer = '廖尹丞';
        }
      } else {
        // rawPayer 是品項名稱或被污染，必須自上下文或帳本規則還原出資人
        const ctx = `${rec.amount || ''} ${rec.type || ''} ${rec.timestamp || ''} ${rec.note || ''} ${rec.rawPayer || ''}`;
        if (ctx.includes('周沛緹') || ctx.includes('沛緹') || ctx.includes('周') || ctx.includes('待')) {
          truePayer = '周沛緹';
        } else if (ctx.includes('廖尹丞') || ctx.includes('尹丞') || ctx.includes('廖')) {
          truePayer = '廖尹丞';
        } else if (ctx.includes('共同')) {
          truePayer = '共同帳戶';
        } else {
          // 預設為主要日常代墊人廖尹丞
          truePayer = '廖尹丞';
        }
      }
    }

    rec = {
      ...rec,
      id: trueId,
      month: trueMonth,
      date: trueDate,
      item: trueItem,
      payer: truePayer,
      amount: trueAmount,
      type: trueType,
      timestamp: rec.timestamp && !rec.timestamp.includes('支出') && !rec.timestamp.includes('收入') ? rec.timestamp : `${trueDate} 12:00:00`
    };
  } else {
    // 無錯位正常情況：進行欄位內容標準化與防禦性校正
    rec.month = normalizedMonth;
    rec.date = normalizedDate;

    // 校正金額
    const numAmt = parseFloat(String(rec.amount || '').replace(/[^0-9.]/g, ''));
    if (!isNaN(numAmt) && numAmt > 0) {
      rec.amount = numAmt;
    } else {
      const typeNum = parseFloat(String(rec.type || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(typeNum) && typeNum > 0 && !String(rec.type).includes('支出') && !String(rec.type).includes('收入')) {
        rec.amount = typeNum;
      } else {
        rec.amount = Number(rec.amount) || 0;
      }
    }

    // 校正類型與付款人
    const rawType = String(rec.type || '').trim();
    const rawItem = String(rec.item || '').trim();
    const rawPayer = String(rec.payer || '').trim();

    if (
      rawType === '收入-固定公積金' || 
      rawType.includes('收入') || 
      rawType.includes('公積金') || 
      rawType.includes('注資') || 
      rawType.includes('撥入') ||
      rawItem.includes('公積金') || 
      rawItem.includes('注資') || 
      rawItem.includes('撥入') || 
      rawItem.includes('底池')
    ) {
      rec.type = '收入-固定公積金';
      rec.payer = '共同帳戶';
    } else {
      rec.type = '支出-日常代墊';

      // 關鍵防禦：若 rec.payer 等於 rec.item（例如「晚餐」或「大全聯」）或非合法出資人人名，強制矯正
      if (!rawPayer || rawPayer === rawItem || !isPayerNameRecognized(rawPayer)) {
        const ctx = `${rawItem} ${rec.timestamp || ''} ${rec.amount || ''} ${rec.note || ''}`;
        if (ctx.includes('周') || ctx.includes('沛緹') || ctx.includes('待')) {
          rec.payer = '周沛緹';
        } else {
          rec.payer = '廖尹丞';
        }
      } else {
        // 標準化人名格式
        if (rawPayer.includes('周') || rawPayer.includes('沛緹') || rawPayer.includes('待')) {
          rec.payer = '周沛緹';
        } else if (rawPayer.includes('共同')) {
          rec.payer = '共同帳戶';
        } else {
          rec.payer = '廖尹丞';
        }
      }
    }
  }

  // 確保 id 存在
  if (!rec.id) {
    rec.id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  return rec as RecordItem;
};

export const sanitizeAndHealRecords = (list: any[]): RecordItem[] => {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeAndHealRecord);
};

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>(() => {
    try {
      const isGuest = localStorage.getItem('banban_is_guest_mode') === 'true';
      const authUser = localStorage.getItem('banban_auth_user');
      const isSandbox = localStorage.getItem('banban_is_sandbox_mode') === 'true';
      
      // 訪客模式或未登入（非沙盒測試模式）：預設為空乾淨狀態，數值全部為 0
      if (isGuest || (!authUser && !isSandbox)) {
        return [];
      }

      // 🛠️ DEV 沙盒環境：嚴格只讀取沙盒專屬測試數據，絕不混入真實 Google 帳號資料
      if (isSandbox) {
        const sandboxSaved = localStorage.getItem('banban_dev_sandbox_records');
        if (sandboxSaved) {
          try {
            const parsed = JSON.parse(sandboxSaved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch (e) {}
        }
        return INITIAL_RECORDS;
      }

      // 🛡️ 檢查登入使用者的連線狀態，若為新使用者且尚未綁定資料庫，保證回傳空白初始資料
      if (authUser) {
        try {
          const parsedUser = JSON.parse(authUser);
          const cleanEmail = (parsedUser.email || '').trim().toLowerCase();
          const hasUserGas = cleanEmail ? localStorage.getItem(`muji_gas_web_url_${cleanEmail}`) : null;
          const isPartner = parsedUser.userRole === 'partner';
          // 若無資料庫連線，一律為全新乾淨空帳本
          if (!hasUserGas && !isPartner) {
            return [];
          }

          // 🚀 關鍵版本檢查：在讀取 localStorage 前先檢查 banban_sync_version 版本號
          const userSyncVersion = cleanEmail ? localStorage.getItem(`banban_sync_version_${cleanEmail}`) : null;
          const syncVersion = userSyncVersion || localStorage.getItem('banban_sync_version');
          const isOutdated = isSyncVersionOutdated(syncVersion, APP_VERSION);

          if (isOutdated) {
            // 偵測到版本號落後，優先標記需強制重新抓取最新雲端帳本，絕不採用過期的舊本地快取
            try {
              sessionStorage.setItem('banban_force_fresh_cloud_fetch', 'true');
              localStorage.setItem('banban_pending_cloud_refresh', 'true');
            } catch (e) {}
            // 觸發自雲端強制重新抓取的自訂事件（在下個微任務執行）
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('banban-force-cloud-sync'));
              }, 0);
            }
            return [];
          }

          const userSaved = cleanEmail ? localStorage.getItem(`muji_ledger_data_${cleanEmail}`) : null;
          const saved = userSaved || localStorage.getItem('muji_ledger_data');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return sanitizeAndHealRecords(parsed);
            }
          }
        } catch (e) {}
      }

      return [];
    } catch (e) {
      return [];
    }
  });
  // 模式狀態：'fund' (公積金模式) ｜ 'split' (代墊借還模式)
  const [appMode, setAppMode] = useState<'fund' | 'split'>(() => {
    try {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('split') || path.includes('/split')) return 'split';
      const saved = localStorage.getItem('banban_active_mode');
      if (saved === 'split' || saved === 'fund') return saved;
    } catch (e) {}
    return 'fund';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settlement' | 'notebook'>('home');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFloatingBarDismissed, setIsFloatingBarDismissed] = useState(false);
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);

  // 監聽網址 Hash 路由 (支援 #/split 或 #split 自動跳轉代墊分頁)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('split') || path.includes('/split')) {
        setAppMode('split');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // 🛡️ 即時資料防禦自癒：若記憶體中的 records 含有錯位資料（如代墊人等於品項名稱、欄位移位），立即自動修復
  useEffect(() => {
    if (records && records.length > 0) {
      const needsHeal = records.some(r => 
        (r.payer && r.item && r.payer === r.item && !isPayerNameRecognized(r.payer)) ||
        !isPayerNameRecognized(r.payer) ||
        (r.month && String(r.month).startsWith('rec_')) ||
        (typeof r.item === 'string' && (r.item.includes('GMT') || /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(r.item.trim())))
      );
      if (needsHeal) {
        const healed = sanitizeAndHealRecords(records);
        setRecords(healed);
        try {
          const auth = localStorage.getItem('banban_auth_user');
          const cleanEmail = auth ? (JSON.parse(auth).email || '').trim().toLowerCase() : '';
          localStorage.setItem('muji_ledger_data', JSON.stringify(healed));
          if (cleanEmail) {
            localStorage.setItem(`muji_ledger_data_${cleanEmail}`, JSON.stringify(healed));
          }
        } catch (e) {}
      }
    }
  }, [records]);

  // ------------------- 代墊借還 (Split Debt) 狀態與函式 -------------------
  const [splitItems, setSplitItems] = useState<SplitRecordItem[]>(() => {
    try {
      const isGuest = localStorage.getItem('banban_is_guest_mode') === 'true';
      const authUser = localStorage.getItem('banban_auth_user');
      const isSandbox = localStorage.getItem('banban_is_sandbox_mode') === 'true';
      if (isGuest || (!authUser && !isSandbox)) {
        return [];
      }
      if (isSandbox) {
        const sandboxSaved = localStorage.getItem('banban_dev_sandbox_split_records');
        if (sandboxSaved) {
          try {
            const parsed = JSON.parse(sandboxSaved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch (e) {}
        }
        return INITIAL_SPLIT_ITEMS;
      }
      const saved = localStorage.getItem('banban_split_records');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [splitSummary, setSplitSummary] = useState<SplitSummary>(() => {
    const emptySummary = {
      liaoOwesZhou: 0,
      zhouOwesLiao: 0,
      netDebtor: 'none' as const,
      netAmount: 0,
      summaryText: '目前雙方已結清 💖',
      unsettledCount: 0,
      settledCount: 0
    };
    try {
      const isGuest = localStorage.getItem('banban_is_guest_mode') === 'true';
      const authUser = localStorage.getItem('banban_auth_user');
      const isSandbox = localStorage.getItem('banban_is_sandbox_mode') === 'true';
      if (isGuest || (!authUser && !isSandbox)) {
        return emptySummary;
      }
      if (isSandbox) {
        const sandboxSaved = localStorage.getItem('banban_dev_sandbox_split_summary');
        if (sandboxSaved) {
          try {
            const parsed = JSON.parse(sandboxSaved);
            if (parsed) return parsed;
          } catch (e) {}
        }
        return {
          liaoOwesZhou: 600,
          zhouOwesLiao: 340,
          netDebtor: '廖',
          netAmount: 260,
          summaryText: '系統架構師 (廖) 應返還 測試伴侶 (周) NT$ 260',
          unsettledCount: 2,
          settledCount: 1
        };
      }
      const saved = localStorage.getItem('banban_split_summary');
      return saved ? JSON.parse(saved) : emptySummary;
    } catch (e) {
      return emptySummary;
    }
  });

  const [isSplitLoading, setIsSplitLoading] = useState(false);
  const [isSplitAddOpen, setIsSplitAddOpen] = useState(false);
  const [splitAddInitialData, setSplitAddInitialData] = useState<{
    payer?: string;
    itemName?: string;
    totalAmount?: number | string;
    note?: string;
  } | undefined>(undefined);
  const [isSplitSettleModalOpen, setIsSplitSettleModalOpen] = useState(false);

  // ------------------- 購物記事 (Notebook / Shopping List) 狀態 -------------------
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const isGuest = localStorage.getItem('banban_is_guest_mode') === 'true';
    const authUser = localStorage.getItem('banban_auth_user');
    const isSandbox = localStorage.getItem('banban_is_sandbox_mode') === 'true';
    if (isGuest || (!authUser && !isSandbox)) {
      return [];
    }
    if (isSandbox) {
      const sandboxSaved = localStorage.getItem('banban_dev_sandbox_shopping_items');
      if (sandboxSaved) {
        try {
          const parsed = JSON.parse(sandboxSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((it: any) => ({
              ...it,
              createdTime: getShoppingItemDisplayTime(it) || it.createdTime || formatAmPmTime(new Date())
            }));
          }
        } catch (e) {}
      }
      return INITIAL_SHOPPING_ITEMS;
    }
    const local = localStorage.getItem('muji_shopping_items');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((it: any) => ({
            ...it,
            createdTime: getShoppingItemDisplayTime(it) || it.createdTime || formatAmPmTime(new Date())
          }));
        }
      } catch (e) {}
    }
    return [];
  });
  const [shoppingStores, setShoppingStores] = useState<string[]>(INITIAL_STORES);
  const [shoppingFilter, setShoppingFilter] = useState<'all' | 'need' | 'want' | 'done'>('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [shoppingSearch, setShoppingSearch] = useState<string>('');
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'record' | 'shopping'>('record');
  const [isManageStoresOpen, setIsManageStoresOpen] = useState(false);
  const [isAddStoreInput, setIsAddStoreInput] = useState('');
  const [isClearDoneConfirmOpen, setIsClearDoneConfirmOpen] = useState(false);
  const [selectedShoppingDetail, setSelectedShoppingDetail] = useState<ShoppingItem | null>(null);

  // 新增/編輯採購項目表單狀態
  const [shoppingForm, setShoppingForm] = useState({
    id: '',
    category: '需要買' as '需要買' | '想要買',
    item: '',
    store: '菜市場',
    customStore: '',
    deadline: '儘快',
    customDeadline: '',
    creator: '' as string,
    status: '待購買' as '待購買' | '已買到',
    createdTime: '',
    note: ''
  });
  
  // 篩選與彈窗提醒狀態
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedPayer, setSelectedPayer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all'); // 新增：詳細日期篩選
  const [searchQuery, setSearchQuery] = useState<string>(''); // 新增：歷史明細關鍵字搜尋
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc'); // 新增：歷史帳目排序方式
  const [reconciledMonths, setReconciledMonths] = useState<string[]>([]); // 新增：已核銷月份
  const [settlementMonth, setSettlementMonth] = useState<string>(''); // 新增：結算頁面選擇的對帳月份
  
  // Google 帳戶登入與開發人員沙盒狀態
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('banban_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          parsed.id = parsed.email; // 統一使用 Gmail 帳號作為用戶識別 ID，不使用亂數
          const cleanEmail = parsed.email.trim().toLowerCase();
          const boundNickname = localStorage.getItem(`banban_user_nickname_${cleanEmail}`);
          if (boundNickname) {
            parsed.nickname = boundNickname;
          }
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banban_is_sandbox_mode') === 'true';
    } catch (e) {}
    return false;
  });

  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banban_is_guest_mode') === 'true';
    } catch (e) {}
    return false;
  });

  const isUserProfileModalOpen_deprecated = false;
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isUnifiedSettingsModalOpen, setIsUnifiedSettingsModalOpen] = useState(false);
  const [isVersionInfoModalOpen, setIsVersionInfoModalOpen] = useState(false);

  // 🚀 全屏同步中動畫狀態 (登入與雲端資料庫同步專用，取代右下角 Toast)
  const [isInitialSyncing, setIsInitialSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('正在同步雲端帳本資料...');
  const [syncProgressStep, setSyncProgressStep] = useState<number>(1);
  const [syncingUserEmail, setSyncingUserEmail] = useState<string>('');
  const [syncingUserName, setSyncingUserName] = useState<string>('');
  const [syncingUserAvatar, setSyncingUserAvatar] = useState<string>('');

  // 💌 伴侶邀請代碼與情侶雙向綁定狀態（預設 15 分鐘時效性動態更新）
  const [currentInviteCode, setCurrentInviteCode] = useState<string>(() => {
    const active = getActiveInviteCode();
    if (active && !isInviteExpired(active)) {
      return active.inviteCode;
    }
    return generateRandomInviteCode();
  });
  const [partnerBindingInfo, setPartnerBindingInfo] = useState<CoupleBindingInfo | null>(() => {
    const isGuest = localStorage.getItem('banban_is_guest_mode') === 'true';
    const authUser = localStorage.getItem('banban_auth_user');
    if (isGuest || !authUser) return null;
    return getPartnerBindingInfo();
  });

  const { userA, userB, currentUserPersona, partnerPersona } = useMemo(() => {
    return resolveUserPersonas(currentUser, partnerBindingInfo);
  }, [currentUser, partnerBindingInfo]);

  const isCurrentUserPartner = currentUserPersona?.roleKey === 'userB' || currentUser?.userRole === 'partner' || currentUser?.role === '周' || (currentUser?.name && userB.name && currentUser.name === userB.name);
  const isCurrentUserZhou = isCurrentUserPartner;
  const defaultPayerName = currentUserPersona?.name || (isCurrentUserPartner ? userB.name : userA.name);

  const isUserAPayer = useCallback((p?: string) => {
    if (!p) return false;
    const clean = p.trim();
    if (isRecordOfUserA(clean, userA, userB)) return true;
    return clean === userA.name || clean === userA.displayName || clean === userA.shortName || clean.includes(userA.shortName) || clean === '廖尹丞' || clean === '廖' || clean.includes('廖') || clean.includes('尹丞');
  }, [userA, userB]);

  const isUserBPayer = useCallback((p?: string) => {
    if (!p) return false;
    const clean = p.trim();
    if (isRecordOfUserB(clean, userA, userB)) return true;
    return clean === userB.name || clean === userB.displayName || clean === userB.shortName || clean.includes(userB.shortName) || clean === '周沛緹' || clean === '周' || clean.includes('周') || clean.includes('沛緹') || clean.includes('待') || clean.includes('伴侶');
  }, [userA, userB]);

  const calculateLocalSplitSummary = useCallback((currentItems: SplitRecordItem[]) => {
    let liaoOwesZhou = 0;
    let zhouOwesLiao = 0;
    let unsettledCount = 0;
    let settledCount = 0;

    currentItems.forEach((item) => {
      if (item.status === '未結清') {
        unsettledCount++;
        const debtorAmt = item.debtorAmount || (item.splitMode === 'AA平分' ? Math.round(item.totalAmount / 2) : item.totalAmount);
        if (isUserAPayer(item.payer)) {
          zhouOwesLiao += debtorAmt;
        } else {
          liaoOwesZhou += debtorAmt;
        }
      } else {
        settledCount++;
      }
    });

    let netDebtor: string = 'none';
    let netAmount = 0;
    let summaryText = '目前雙方已結清 💖';

    if (liaoOwesZhou > zhouOwesLiao) {
      netDebtor = userA.shortName || '廖';
      netAmount = liaoOwesZhou - zhouOwesLiao;
      summaryText = `${userA.displayName} 應返還 ${userB.displayName} NT$ ${(Number(netAmount) || 0).toLocaleString()}`;
    } else if (zhouOwesLiao > liaoOwesZhou) {
      netDebtor = userB.shortName || '周';
      netAmount = zhouOwesLiao - liaoOwesZhou;
      summaryText = `${userB.displayName} 應返還 ${userA.displayName} NT$ ${(Number(netAmount) || 0).toLocaleString()}`;
    }

    const newSummary: SplitSummary = {
      liaoOwesZhou,
      zhouOwesLiao,
      netDebtor,
      netAmount,
      summaryText,
      unsettledCount,
      settledCount
    };

    setSplitSummary(newSummary);
    try {
      localStorage.setItem('banban_split_summary', JSON.stringify(newSummary));
      localStorage.setItem('banban_split_records', JSON.stringify(currentItems));
    } catch (e) {}
  }, [userA, userB, isUserAPayer]);

  const [splitNotebookSubTab, setSplitNotebookSubTab] = useState<'travel' | 'wishlist'>('travel');

  const [isExchangeRatesCollapsed, setIsExchangeRatesCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banban_rates_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleGenerateNewInviteCode = () => {
    const cleanGas = (gasWebUrl || localStorage.getItem('muji_gas_web_url') || localStorage.getItem('banban_permanent_gas_url') || '').trim();
    const cleanSheet = (deploySheetUrl || localStorage.getItem('muji_sheet_url') || '').trim();
    const fresh = createFreshInvite(
      currentUser?.email || '',
      currentUser?.name || '主管理員',
      cleanGas,
      cleanSheet,
      15
    );
    setCurrentInviteCode(fresh.inviteCode);
    saveActiveInviteCode(fresh);
    if (currentUser?.email) {
      saveUserCloudConfig(currentUser.email, {
        inviteCode: fresh.inviteCode,
        gasWebUrl: cleanGas,
        deploySheetUrl: cleanSheet
      }).catch(() => {});
    }
    showToast(`✨ 已產生全新 15 分鐘時效邀請碼：${fresh.inviteCode}`, 'success');
  };

  const handleCopyInviteShare = () => {
    const cleanGas = (gasWebUrl || localStorage.getItem('muji_gas_web_url') || localStorage.getItem('banban_permanent_gas_url') || '').trim();
    const cleanSheet = (deploySheetUrl || localStorage.getItem('muji_sheet_url') || '').trim();
    let activeInvite = getActiveInviteCode();
    
    // 若邀請碼不存在或已過期，立即自動刷新為最新 15 分鐘有效邀請碼
    if (!activeInvite || isInviteExpired(activeInvite)) {
      activeInvite = createFreshInvite(
        currentUser?.email || '',
        currentUser?.name || '主管理員',
        cleanGas,
        cleanSheet,
        15
      );
      setCurrentInviteCode(activeInvite.inviteCode);
      saveActiveInviteCode(activeInvite);
    } else {
      activeInvite = {
        ...activeInvite,
        adminEmail: currentUser?.email || activeInvite.adminEmail,
        adminName: currentUser?.name || activeInvite.adminName,
        gasWebUrl: cleanGas || activeInvite.gasWebUrl,
        deploySheetUrl: cleanSheet || activeInvite.deploySheetUrl
      };
      saveActiveInviteCode(activeInvite);
    }

    if (currentUser?.email && cleanGas) {
      saveActiveInviteCode(activeInvite);
    }
    const cardText = createShareableInviteCard(activeInvite);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cardText);
      showToast('💌 已複製伴侶邀請函與專屬時效連結（有效時限 15 分鐘）！', 'success');
    }
  };

  const handleUnbindPartner = () => {
    removePartnerBinding(currentUser?.email);
    setPartnerBindingInfo(null);
    if (currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail)) {
      handleLogout();
      showToast('已解除伴侶帳本綁定，請重新輸入邀請碼登入', 'info');
    } else {
      showToast('已重設伴侶綁定紀錄，可重新派發邀請碼給伴侶', 'info');
    }
  };

  const handleGoogleLogin = async (
    user: AuthUser, 
    partnerInvite?: PartnerInviteData | null,
    initialCloudGasUrl?: string,
    initialCloudSheetUrl?: string
  ) => {
    // 🚀 啟動全屏同步中動畫，設定即時帳戶資訊
    setIsInitialSyncing(true);
    setSyncProgressStep(1);
    setSyncStatusText('正在驗證 Google 帳號身分與雲端配對...');
    setSyncingUserEmail(user.email || '');
    setSyncingUserName(user.name || '');
    setSyncingUserAvatar(user.avatar || user.picture || '');

    try {
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const previousEmail = (currentUser?.email || '').trim().toLowerCase();

      // 🛡️ 登入前保護：先擷取此裝置目前現存的所有可能資料庫設定與數據備援，避免被清除抹除
      const cachedDeviceGas = (localStorage.getItem('muji_gas_web_url') || '').trim();
      const cachedDeviceSheet = (localStorage.getItem('muji_sheet_url') || '').trim();
      const cachedPerUserGas = cleanEmail ? (localStorage.getItem(`muji_gas_web_url_${cleanEmail}`) || '').trim() : '';
      const cachedPerUserSheet = cleanEmail ? (localStorage.getItem(`muji_sheet_url_${cleanEmail}`) || '').trim() : '';

      // 備援當前記憶體與本地儲存的業務數據（若同帳號重新登入或首次連結 Google 帳號，可平滑繼承）
      const localRecordsBackup = (records && records.length > 0) ? records : (() => {
        try { const r = localStorage.getItem('muji_ledger_data'); return r ? JSON.parse(r) : []; } catch (e) { return []; }
      })();
      const localSplitBackup = (splitItems && splitItems.length > 0) ? splitItems : (() => {
        try { const s = localStorage.getItem('banban_split_records'); return s ? JSON.parse(s) : []; } catch (e) { return []; }
      })();
      const localShoppingBackup = (shoppingItems && shoppingItems.length > 0) ? shoppingItems : (() => {
        try { const sh = localStorage.getItem('banban_shopping_items'); return sh ? JSON.parse(sh) : []; } catch (e) { return []; }
      })();

      // 🛡️ 僅在確為不同帳號切換時才清理跨帳號暫存
      const isSwitchingDifferentAccount = Boolean(previousEmail && cleanEmail && previousEmail !== cleanEmail);
      if (isSwitchingDifferentAccount) {
        setRecords([]);
        setSplitItems([]);
        setShoppingItems([]);
        setGasWebUrl('');
        setDeploySheetUrl('');
        setPartnerBindingInfo(null);
        try {
          localStorage.removeItem('muji_ledger_data');
          localStorage.removeItem('banban_split_records');
          localStorage.removeItem('banban_shopping_items');
          localStorage.removeItem('banban_partner_binding');
          localStorage.removeItem('banban_sync_version');
          if (cleanEmail) localStorage.removeItem(`banban_sync_version_${cleanEmail}`);
          if (previousEmail) localStorage.removeItem(`banban_sync_version_${previousEmail}`);
          window.dispatchEvent(new CustomEvent('travel-data-updated', {
            detail: { trips: [], expenses: [], wishlist: [] }
          }));
        } catch (e) {}
      }

      let boundNickname = user.nickname || '';
      if (!boundNickname && cleanEmail) {
        try {
          boundNickname = localStorage.getItem(`banban_user_nickname_${cleanEmail}`) || '';
        } catch (e) {}
      }

      const cleanUser: AuthUser = {
        ...user,
        id: cleanEmail || user.email || user.id,
        nickname: boundNickname || user.nickname
      };
      setCurrentUser(cleanUser);
      setIsSandboxMode(false);
      setIsGuestMode(false);
      try {
        localStorage.setItem('banban_is_guest_mode', 'false');
        localStorage.setItem('banban_is_sandbox_mode', 'false');
        localStorage.setItem('banban_active_system_env', 'prod');
      } catch (e) {}

      setSyncProgressStep(2);
      setSyncStatusText('正在連線 Google 試算表與雲端資料庫...');

      // 1. 若登入時自帶伴侶邀請碼或已傳入邀請資訊 (例如點擊分享連結直接帶入)
      if (partnerInvite && partnerInvite.inviteCode) {
        const inviteAdminEmail = (partnerInvite.adminEmail || '').trim().toLowerCase();
        
        // 🛡️ 防自我配對保護：若登入者自身即為該邀請碼的發起管理者
        if (cleanEmail && inviteAdminEmail && cleanEmail === inviteAdminEmail) {
          const activeGas = partnerInvite.gasWebUrl || '';
          const activeSheet = partnerInvite.deploySheetUrl || '';
          
          if (activeGas) {
            setGasWebUrl(activeGas);
            try { 
              localStorage.setItem('muji_gas_web_url', activeGas);
              localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, activeGas);
            } catch (e) {}
          }
          if (activeSheet) {
            setDeploySheetUrl(activeSheet);
            try { 
              localStorage.setItem('muji_sheet_url', activeSheet);
              localStorage.setItem(`muji_sheet_url_${cleanEmail}`, activeSheet);
            } catch (e) {}
          }

          const adminUser: AuthUser = {
            ...cleanUser,
            userRole: 'admin',
            role: 'admin'
          };
          setCurrentUser(adminUser);
          saveUserCloudConfig(user.email, {
            email: user.email,
            name: user.name,
            nickname: boundNickname || user.nickname,
            gasWebUrl: activeGas,
            deploySheetUrl: activeSheet,
            inviteCode: partnerInvite.inviteCode
          });

          const displayWelcomeName = boundNickname || user.name;
          try {
            localStorage.setItem('banban_auth_user', JSON.stringify(adminUser));
            localStorage.setItem('banban_is_sandbox_mode', 'false');
          } catch (e) {}
          if (activeGas) {
            setSyncProgressStep(3);
            setSyncStatusText(`正在同步管理員帳本資料庫 (${displayWelcomeName})...`);
            await Promise.allSettled([
              fetchDashboardData(false, false),
              fetchShoppingData(false),
              fetchSplitData(true),
              fetchTravelData(true)
            ]);
          }
          setSyncProgressStep(4);
          setSyncStatusText(`✨ 歡迎回來，${displayWelcomeName}！已載入主管理員帳本`);
          await new Promise(res => setTimeout(res, 600));
          setIsInitialSyncing(false);
          setIsCheckingCloudConfig(false);
          return;
        }

        // 💖 真正伴侶登入配對流程
        const activeGas = partnerInvite.gasWebUrl || '';
        const activeSheet = partnerInvite.deploySheetUrl || '';
        
        if (activeGas) {
          setGasWebUrl(activeGas);
          try { 
            localStorage.setItem('muji_gas_web_url', activeGas);
            localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, activeGas);
          } catch (e) {}
        }
        if (activeSheet) {
          setDeploySheetUrl(activeSheet);
          try { 
            localStorage.setItem('muji_sheet_url', activeSheet);
            localStorage.setItem(`muji_sheet_url_${cleanEmail}`, activeSheet);
          } catch (e) {}
        }

        const bindingData: CoupleBindingInfo = {
          adminEmail: partnerInvite.adminEmail || '',
          adminName: partnerInvite.adminName || '主管理員',
          partnerEmail: user.email,
          partnerName: user.name,
          inviteCode: partnerInvite.inviteCode,
          gasWebUrl: activeGas,
          deploySheetUrl: activeSheet,
          boundAt: new Date().toISOString()
        };
        await savePartnerBindingInfo(bindingData);
        setPartnerBindingInfo(bindingData);

        const enhancedPartner: AuthUser = {
          ...cleanUser,
          id: cleanEmail || cleanUser.id,
          nickname: boundNickname || user.nickname,
          userRole: 'partner',
          role: user.role || (user.name ? user.name.charAt(0) : '伴'),
          adminEmail: partnerInvite.adminEmail,
          adminName: partnerInvite.adminName,
          inviteCode: partnerInvite.inviteCode
        };
        setCurrentUser(enhancedPartner);

        await saveUserCloudConfig(user.email, {
          email: user.email,
          name: user.name,
          nickname: boundNickname || user.nickname,
          gasWebUrl: activeGas,
          deploySheetUrl: activeSheet,
          inviteCode: partnerInvite.inviteCode
        });

        const displayWelcomeName = boundNickname || user.name;
        try {
          localStorage.setItem('banban_auth_user', JSON.stringify(enhancedPartner));
          localStorage.setItem('banban_is_sandbox_mode', 'false');
        } catch (e) {}
        if (activeGas) {
          setSyncProgressStep(3);
          setSyncStatusText(`正在同步伴侶帳本與分帳明細 (${partnerInvite.adminName || '管理員'})...`);
          await Promise.allSettled([
            fetchDashboardData(false, false),
            fetchShoppingData(false),
            fetchSplitData(true),
            fetchTravelData(true)
          ]);
        }
        setSyncProgressStep(4);
        setSyncStatusText(`✨ 歡迎 ${displayWelcomeName}！已成功配對並同步伴侶帳本`);
        await new Promise(res => setTimeout(res, 600));
        setIsInitialSyncing(false);
        setIsCheckingCloudConfig(false);
        return;
      }

      // 2. 檢查雲端是否已有伴侶配對紀錄 (另一半發起邀請並已綁定此 Google 帳號)
      try {
        const existingBinding = await fetchPartnerBindingInfoOnline(cleanEmail);
        if (existingBinding && existingBinding.partnerEmail && existingBinding.partnerEmail.toLowerCase() === cleanEmail) {
          if (existingBinding.gasWebUrl) {
            setGasWebUrl(existingBinding.gasWebUrl);
            try { 
              localStorage.setItem('muji_gas_web_url', existingBinding.gasWebUrl);
              localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, existingBinding.gasWebUrl);
            } catch (e) {}
          }
          if (existingBinding.deploySheetUrl) {
            setDeploySheetUrl(existingBinding.deploySheetUrl);
            try { 
              localStorage.setItem('muji_sheet_url', existingBinding.deploySheetUrl);
              localStorage.setItem(`muji_sheet_url_${cleanEmail}`, existingBinding.deploySheetUrl);
            } catch (e) {}
          }
          setPartnerBindingInfo(existingBinding);

          const enhancedPartner: AuthUser = {
            ...cleanUser,
            userRole: 'partner',
            role: cleanUser.role || (cleanUser.name ? cleanUser.name.charAt(0) : '伴'),
            adminEmail: existingBinding.adminEmail,
            adminName: existingBinding.adminName,
            inviteCode: existingBinding.inviteCode
          };
          setCurrentUser(enhancedPartner);

          const displayWelcomeName = boundNickname || user.name;
          try {
            localStorage.setItem('banban_auth_user', JSON.stringify(enhancedPartner));
            localStorage.setItem('banban_is_sandbox_mode', 'false');
          } catch (e) {}
          if (existingBinding.gasWebUrl) {
            setSyncProgressStep(3);
            setSyncStatusText(`正在載入伴侶帳本資料 (${existingBinding.adminName || '管理員'})...`);
            await Promise.allSettled([
              fetchDashboardData(false, false),
              fetchShoppingData(false),
              fetchSplitData(true),
              fetchTravelData(true)
            ]);
          }
          setSyncProgressStep(4);
          setSyncStatusText(`✨ 歡迎回來，${displayWelcomeName}！已載入伴侶帳本`);
          await new Promise(res => setTimeout(res, 600));
          setIsInitialSyncing(false);
          setIsCheckingCloudConfig(false);
          return;
        }
      } catch (e) {}

      // 3. 檢查此帳號先前是否曾建立過專屬 API 資料庫 (主管理員)
      // 🚀 跨裝置優先：先嘗試從傳入的雲端快照獲取，否則優先直查雲端，最後才降級至本地快取
      let activeGas = initialCloudGasUrl || '';
      let activeSheet = initialCloudSheetUrl || '';

      // 2.9 🚀 全端跨裝置帳本數據無縫掛接 (換裝置、換手機登入直接掛接帳本資料庫)
      let serverLedgerData: any = null;
      if (hasBackendServer() && cleanEmail) {
        try {
          const lRes = await fetch(`/api/user-ledger-data?email=${encodeURIComponent(cleanEmail)}`);
          if (lRes.ok) {
            const lJson = await lRes.json();
            if (lJson && lJson.success && lJson.data) {
              serverLedgerData = lJson.data;
              if (serverLedgerData.gasWebUrl && !activeGas) {
                activeGas = serverLedgerData.gasWebUrl.trim();
              }
              if (serverLedgerData.deploySheetUrl && !activeSheet) {
                activeSheet = serverLedgerData.deploySheetUrl.trim();
              }
            }
          }
        } catch (e) {}
      }

      try {
        const cloudConfig = await getUserCloudConfig(user.email, { forceRefresh: true });
        if (cloudConfig) {
          if (cloudConfig.nickname && !boundNickname) {
            boundNickname = cloudConfig.nickname;
            cleanUser.nickname = boundNickname;
            setCurrentUser({ ...cleanUser, nickname: boundNickname });
            if (cleanEmail) {
              try { localStorage.setItem(`banban_user_nickname_${cleanEmail}`, boundNickname); } catch (e) {}
            }
          }

          // 🛡️ 雲端 gasWebUrl 載入校驗：確保使用者換機登入時直接載入自己綁定的資料庫
          if (cloudConfig.gasWebUrl && cloudConfig.gasWebUrl.startsWith('http')) {
            activeGas = cloudConfig.gasWebUrl;
            activeSheet = cloudConfig.deploySheetUrl || activeSheet || '';
          }
          if (cloudConfig.inviteCode) {
            setCurrentInviteCode(cloudConfig.inviteCode);
          }
        }
      } catch (err) {
        console.warn('Failed to retrieve user cloud config on login:', err);
      }

      // 🛡️ 雙重保險備援 1：向 Firestore 情侶綁定紀錄反查此 Email 是否已配對或本身已綁定資料庫
      if (!activeGas && cleanEmail) {
        try {
          const partnerBinding = await fetchPartnerBindingInfoOnline(cleanEmail);
          if (partnerBinding && partnerBinding.gasWebUrl && partnerBinding.gasWebUrl.startsWith('http')) {
            activeGas = partnerBinding.gasWebUrl;
            activeSheet = partnerBinding.deploySheetUrl || activeSheet || '';
            setPartnerBindingInfo(partnerBinding);
          }
        } catch (e) {}
      }

      // 🛡️ 雙重保險備援 2：向邀請碼註冊表與雲端反查此 Email 是否曾建立過專屬邀請與資料庫
      if (!activeGas && cleanEmail) {
        try {
          const activeInvite = getActiveInviteCode();
          if (activeInvite && activeInvite.adminEmail?.toLowerCase() === cleanEmail && activeInvite.gasWebUrl && activeInvite.gasWebUrl.startsWith('http')) {
            activeGas = activeInvite.gasWebUrl;
            activeSheet = activeInvite.deploySheetUrl || activeSheet || '';
            if (activeInvite.inviteCode) {
              setCurrentInviteCode(activeInvite.inviteCode);
            }
          } else {
            const onlineInvite = await fetchInviteCodeOnline(cleanEmail);
            if (onlineInvite && onlineInvite.gasWebUrl && onlineInvite.gasWebUrl.startsWith('http') && onlineInvite.adminEmail?.toLowerCase() === cleanEmail) {
              activeGas = onlineInvite.gasWebUrl;
              activeSheet = onlineInvite.deploySheetUrl || activeSheet || '';
              if (onlineInvite.inviteCode) {
                setCurrentInviteCode(onlineInvite.inviteCode);
              }
            }
          }
        } catch (e) {}
      }

      // 🛡️ 雙重保險備援 3：直接向伺服器全域資料庫或關聯資料庫查詢
      if (!activeGas && hasBackendServer()) {
        try {
          const sysRes = await fetch('/api/system-database');
          if (sysRes.ok) {
            const sysData = await sysRes.json();
            if (sysData && sysData.success && sysData.database?.gasWebUrl) {
              activeGas = sysData.database.gasWebUrl.trim();
              if (sysData.database.deploySheetUrl && !activeSheet) {
                activeSheet = sysData.database.deploySheetUrl.trim();
              }
            }
          }
        } catch (e) {}
      }

      // 🛡️ 雙重保險備援 4：本地快取與全域本地鍵值深度復原掃描（僅在雲端完全無紀錄時降級使用）
      if (!activeGas && cleanEmail) {
        if (cachedPerUserGas && cachedPerUserGas.startsWith('http')) {
          activeGas = cachedPerUserGas;
          activeSheet = cachedPerUserSheet || activeSheet || '';
        } else {
          const recovered = scanAndRecoverGasUrl(cleanEmail);
          if (recovered.gasWebUrl) {
            activeGas = recovered.gasWebUrl;
            if (recovered.deploySheetUrl && !activeSheet) {
              activeSheet = recovered.deploySheetUrl;
            }
          }
        }
      }

      const hasCloudLedger = serverLedgerData && (
        (Array.isArray(serverLedgerData.records) && serverLedgerData.records.length > 0) ||
        (Array.isArray(serverLedgerData.splitItems) && serverLedgerData.splitItems.length > 0) ||
        (Array.isArray(serverLedgerData.shoppingItems) && serverLedgerData.shoppingItems.length > 0) ||
        (serverLedgerData.gasWebUrl && serverLedgerData.gasWebUrl.startsWith('http'))
      );

      const hasLocalBackupData = !isSwitchingDifferentAccount && (
        (localRecordsBackup && localRecordsBackup.length > 0) ||
        (localSplitBackup && localSplitBackup.length > 0) ||
        (localShoppingBackup && localShoppingBackup.length > 0)
      );

      // 若有雲端帳本、或本機既有帳本、或已建立過專屬 API 資料庫 (主管理員)
      if ((hasCloudLedger || hasLocalBackupData || (activeGas && activeGas.startsWith('http'))) && !partnerInvite) {
        const displayWelcomeName = boundNickname || user.name;

        // 1. 掛接帳本紀錄（優先以伺服器資料庫，若伺服器尚無但本機有，平滑採用本機）
        if (hasCloudLedger && serverLedgerData) {
          if (Array.isArray(serverLedgerData.records) && serverLedgerData.records.length > 0) {
            const healed = sanitizeAndHealRecords(serverLedgerData.records);
            setRecords(healed);
            try { 
              localStorage.setItem('muji_ledger_data', JSON.stringify(healed)); 
              if (cleanEmail) {
                localStorage.setItem(`muji_ledger_data_${cleanEmail}`, JSON.stringify(healed));
              }
              localStorage.setItem('banban_sync_version', APP_VERSION);
              if (cleanEmail) {
                localStorage.setItem(`banban_sync_version_${cleanEmail}`, APP_VERSION);
              }
            } catch (e) {}
          }
          if (Array.isArray(serverLedgerData.splitItems) && serverLedgerData.splitItems.length > 0) {
            setSplitItems(serverLedgerData.splitItems);
            try { localStorage.setItem('banban_split_records', JSON.stringify(serverLedgerData.splitItems)); } catch (e) {}
          }
          if (Array.isArray(serverLedgerData.shoppingItems) && serverLedgerData.shoppingItems.length > 0) {
            setShoppingItems(serverLedgerData.shoppingItems);
            try { localStorage.setItem('banban_shopping_items', JSON.stringify(serverLedgerData.shoppingItems)); } catch (e) {}
          }
          if (Array.isArray(serverLedgerData.travelTrips) && serverLedgerData.travelTrips.length > 0) {
            try {
              localStorage.setItem('banban_travel_trips', JSON.stringify(serverLedgerData.travelTrips));
              localStorage.setItem('banban_travel_expenses', JSON.stringify(serverLedgerData.travelExpenses || []));
              localStorage.setItem('banban_travel_wishlist', JSON.stringify(serverLedgerData.travelWishlist || []));
              window.dispatchEvent(new CustomEvent('travel-data-updated', {
                detail: {
                  trips: serverLedgerData.travelTrips,
                  expenses: serverLedgerData.travelExpenses || [],
                  wishlist: serverLedgerData.travelWishlist || []
                }
              }));
            } catch (e) {}
          }
          if (serverLedgerData.splitSummary) {
            setSplitSummary(serverLedgerData.splitSummary);
            try { localStorage.setItem('banban_split_summary', JSON.stringify(serverLedgerData.splitSummary)); } catch (e) {}
          }
        } else if (hasLocalBackupData) {
          if (localRecordsBackup.length > 0) setRecords(sanitizeAndHealRecords(localRecordsBackup));
          if (localSplitBackup.length > 0) setSplitItems(localSplitBackup);
          if (localShoppingBackup.length > 0) setShoppingItems(localShoppingBackup);
        }

        // 2. 掛接 Google 試算表連線
        if (activeGas && activeGas.startsWith('http')) {
          setGasWebUrl(activeGas);
          setDeploySheetUrl(activeSheet);
          try {
            localStorage.setItem('muji_gas_web_url', activeGas);
            localStorage.setItem('muji_sheet_url', activeSheet);
            localStorage.setItem('banban_permanent_gas_url', activeGas);
            if (cleanEmail) {
              localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, activeGas);
              localStorage.setItem(`muji_sheet_url_${cleanEmail}`, activeSheet);
            }
          } catch (e) {}

          saveUserCloudConfig(user.email, {
            gasWebUrl: activeGas,
            deploySheetUrl: activeSheet
          });
        }

        const adminUser: AuthUser = {
          ...cleanUser,
          userRole: 'admin',
          role: 'admin'
        };
        setCurrentUser(adminUser);

        try {
          localStorage.setItem('banban_auth_user', JSON.stringify(adminUser));
          localStorage.setItem('banban_is_sandbox_mode', 'false');
        } catch (e) {}

        setSyncProgressStep(3);
        setSyncStatusText(activeGas ? `正在與 Google 試算表同步資料庫...` : `正在掛接雲端帳本...`);

        if (activeGas && activeGas.startsWith('http')) {
          await Promise.allSettled([
            fetchDashboardData(true, false, activeGas),
            fetchShoppingData(false, activeGas),
            fetchSplitData(true, activeGas),
            fetchTravelData(true, activeGas)
          ]);
        }

        setSyncProgressStep(4);
        setSyncStatusText(`✨ 歡迎回來，${displayWelcomeName}！已直接掛接帳本資料`);
        await new Promise(res => setTimeout(res, 600));
        setIsInitialSyncing(false);
        setIsCheckingCloudConfig(false);
        return;
      } else {
        // 4. 初次或全新獨立帳號：若完全無任何資料庫紀錄，才初始化
        const newInviteCode = generateRandomInviteCode();
        setCurrentInviteCode(newInviteCode);
        setRecords([]);
        setSplitItems([]);
        setShoppingItems([]);
        setPartnerBindingInfo(null);

        const freshUser: AuthUser = {
          ...cleanUser,
          userRole: 'admin',
          role: 'admin'
        };
        setCurrentUser(freshUser);

        // 自動預先註冊此邀請碼至雲端與本機，確保伴侶輸入時代碼即時可查
        if (freshUser.email) {
          saveActiveInviteCode({
            inviteCode: newInviteCode,
            adminEmail: freshUser.email,
            adminName: freshUser.name || '主管理員',
            createdAt: new Date().toISOString()
          });
          saveUserCloudConfig(freshUser.email, {
            inviteCode: newInviteCode,
            email: freshUser.email,
            name: freshUser.name
          });
        }

        try {
          localStorage.setItem('banban_auth_user', JSON.stringify(freshUser));
          localStorage.setItem('banban_is_sandbox_mode', 'false');
        } catch (e) {}

        const displayWelcomeName = boundNickname || user.name;
        setSyncProgressStep(3);
        setSyncStatusText(`✨ 歡迎 ${displayWelcomeName}！正在初始化帳本引導...`);
        await new Promise(res => setTimeout(res, 500));
        setIsInitialSyncing(false);
        setIsCheckingCloudConfig(false);
        // 立即開啟引導小精靈，讓使用者選擇「主管理者（部署帳本）」或「伴侶模式（輸入邀請碼）」
        openUnifiedDatabaseModal('wizard');
      }
    } catch (loginErr) {
      console.error('Login sync error:', loginErr);
    } finally {
      setIsInitialSyncing(false);
      setIsCheckingCloudConfig(false);
    }
  };

  /**
   * 處理透過引導彈窗輸入伴侶邀請碼
   */
  const handleBindPartnerInvite = async (inviteInput: string): Promise<{ success: boolean; message?: string }> => {
    let resolved = resolveInviteCodeOrToken(inviteInput);
    if (!resolved || !resolved.gasWebUrl || resolved.gasWebUrl.includes('/test/')) {
      try {
        const cloudResolved = await fetchInviteCodeOnline(inviteInput);
        if (cloudResolved) {
          resolved = cloudResolved;
        }
      } catch (e) {}
    }

    // 嚴格校驗：邀請碼必須真實存在且解析出發起管理者，絕不允許任意代碼自動通過
    if (!resolved || !resolved.adminEmail) {
      return { 
        success: false, 
        message: '找不到符合的邀請碼，請確認 6 碼代碼是否輸入正確（例如 BB-XXXX）或請主管理者提供最新邀請碼' 
      };
    }

    if (isInviteExpired(resolved)) {
      return {
        success: false,
        message: '⚠️ 此邀請碼已超過 15 分鐘有效時限，請向伴侶索取最新邀請碼！'
      };
    }

    const currentEmail = (currentUser?.email || '').trim().toLowerCase();
    const adminEmail = (resolved.adminEmail || '').trim().toLowerCase();

    // 🛡️ 同一帳號跨裝置同步：若登入者自身即為該邀請碼的發起管理者，自動在手機同步資料庫與管理員權限！
    if (currentEmail && adminEmail && currentEmail === adminEmail) {
      let activeGas = resolved.gasWebUrl || '';
      let activeSheet = resolved.deploySheetUrl || '';

      if (!activeGas && resolved.adminEmail) {
        try {
          const adminConfig = await getUserCloudConfig(resolved.adminEmail);
          if (adminConfig && adminConfig.gasWebUrl) {
            activeGas = adminConfig.gasWebUrl;
            activeSheet = adminConfig.deploySheetUrl || activeSheet;
          }
        } catch (e) {}
      }

      if (activeGas) {
        setGasWebUrl(activeGas);
        try { 
          localStorage.setItem('muji_gas_web_url', activeGas);
          localStorage.setItem(`muji_gas_web_url_${currentEmail}`, activeGas);
          localStorage.setItem('banban_permanent_gas_url', activeGas);
          localStorage.setItem(`banban_permanent_gas_url_${currentEmail}`, activeGas);
          localStorage.setItem('banban_device_master_gas', activeGas);
        } catch (e) {}
      }
      if (activeSheet) {
        setDeploySheetUrl(activeSheet);
        try { 
          localStorage.setItem('muji_sheet_url', activeSheet);
          localStorage.setItem(`muji_sheet_url_${currentEmail}`, activeSheet);
        } catch (e) {}
      }

      const adminUser: AuthUser = {
        ...currentUser,
        userRole: 'admin',
        role: 'admin'
      };
      setCurrentUser(adminUser);
      try {
        localStorage.setItem('banban_auth_user', JSON.stringify(adminUser));
      } catch (e) {}

      saveDeployConfig(activeGas, activeSheet);

      if (activeGas) {
        fetchDashboardData(true, false, activeGas);
        fetchShoppingData(false, activeGas);
        fetchSplitData(true, activeGas);
        fetchTravelData(true, activeGas);
      }

      return { 
        success: true, 
        message: '🎉 跨裝置同步成功！已成功在手機同步您的管理員資料庫！' 
      };
    }

    let activeGas = resolved.gasWebUrl || '';
    let activeSheet = resolved.deploySheetUrl || '';

    // 🛡️ 雙重保險備援 1：若邀請物件中缺少 gasWebUrl，向管理者的 user_configs 自動檢索補齊
    if (!activeGas && resolved.adminEmail) {
      try {
        const adminConfig = await getUserCloudConfig(resolved.adminEmail);
        if (adminConfig && adminConfig.gasWebUrl && adminConfig.gasWebUrl.startsWith('http')) {
          activeGas = adminConfig.gasWebUrl;
          activeSheet = adminConfig.deploySheetUrl || activeSheet;
        }
      } catch (e) {}
    }

    // 🛡️ 雙重保險備援 2：向伺服器全域系統資料庫查詢
    if (!activeGas && hasBackendServer()) {
      try {
        const sysRes = await fetch('/api/system-database');
        if (sysRes.ok) {
          const sysData = await sysRes.json();
          if (sysData && sysData.success && sysData.database?.gasWebUrl) {
            activeGas = sysData.database.gasWebUrl;
            activeSheet = sysData.database.deploySheetUrl || activeSheet;
          }
        }
      } catch (e) {}
    }

    if (activeGas) {
      setGasWebUrl(activeGas);
      try { 
        localStorage.setItem('muji_gas_web_url', activeGas);
        localStorage.setItem('banban_permanent_gas_url', activeGas);
        localStorage.setItem('banban_device_master_gas', activeGas);
        if (currentEmail) {
          localStorage.setItem(`muji_gas_web_url_${currentEmail}`, activeGas);
          localStorage.setItem(`banban_permanent_gas_url_${currentEmail}`, activeGas);
        }
      } catch (e) {}
    }
    if (activeSheet) {
      setDeploySheetUrl(activeSheet);
      try { 
        localStorage.setItem('muji_deploy_sheet_url', activeSheet);
        localStorage.setItem('muji_sheet_url', activeSheet);
        if (currentEmail) {
          localStorage.setItem(`muji_sheet_url_${currentEmail}`, activeSheet);
        }
      } catch (e) {}
    }

    const bindingData: CoupleBindingInfo = {
      adminEmail: resolved.adminEmail || '',
      adminName: resolved.adminName || '主管理員',
      partnerEmail: currentUser?.email || '',
      partnerName: currentUser?.name || '伴侶',
      inviteCode: resolved.inviteCode,
      gasWebUrl: activeGas,
      deploySheetUrl: activeSheet,
      boundAt: new Date().toISOString()
    };

    await savePartnerBindingInfo(bindingData);
    setPartnerBindingInfo(bindingData);

    if (currentUser) {
      const updatedUser: AuthUser = {
        ...currentUser,
        userRole: 'partner',
        role: currentUser.role || (currentUser.name ? currentUser.name.charAt(0) : '伴'),
        adminEmail: resolved.adminEmail,
        adminName: resolved.adminName,
        inviteCode: resolved.inviteCode
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('banban_auth_user', JSON.stringify(updatedUser));
      } catch (e) {}

      // 同步伴侶設定至雲端 (背景非阻塞執行)
      if (currentUser.email) {
        saveUserCloudConfig(currentUser.email, {
          email: currentUser.email,
          name: currentUser.name,
          gasWebUrl: activeGas,
          deploySheetUrl: activeSheet,
          inviteCode: resolved.inviteCode
        }).catch(() => {});
      }
    }

    // 🚀 立即固化伴侶端資料庫設定並啟動資料庫全模組雙向連動
    saveDeployConfig(activeGas, activeSheet);

    if (activeGas) {
      setTimeout(() => {
        fetchDashboardData(true, false, activeGas);
        fetchShoppingData(false, activeGas);
        fetchSplitData(true, activeGas);
        fetchTravelData(true, activeGas);
      }, 50);
    }

    showToast(`💖 已成功綁定伴侶帳本 (${resolved.adminName || '管理員'})！`, 'success');
    return { success: true };
  };


  const handleEnterDevSandbox = () => {
    signOutGoogle().catch(() => {});
    const devUser: AuthUser = {
      id: 'developer.admin@banbanji.internal',
      name: '系統架構師 (開發模式)',
      email: 'developer.admin@banbanji.internal',
      role: 'admin',
      userRole: 'admin',
      isDevSandbox: true,
      loginTime: new Date().toISOString()
    };
    setCurrentUser(devUser);
    setIsSandboxMode(true);
    setIsGuestMode(false);
    setGasWebUrl('');
    setDeploySheetUrl('');
    setPartnerBindingInfo(null);
    setCurrentInviteCode('BB-DEV9');

    try {
      localStorage.setItem('banban_auth_user', JSON.stringify(devUser));
      localStorage.setItem('banban_is_sandbox_mode', 'true');
      localStorage.setItem('banban_is_guest_mode', 'false');
      localStorage.setItem('banban_active_system_env', 'dev');
    } catch (e) {}

    // 載入或初始化專屬沙盒數據（徹底隔離真實用戶資料）
    const sandboxRecs = (() => {
      try {
        const s = localStorage.getItem('banban_dev_sandbox_records');
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p) && p.length > 0) return p;
        }
      } catch (e) {}
      return INITIAL_RECORDS;
    })();
    setRecords(sandboxRecs);

    const sandboxSplit = (() => {
      try {
        const s = localStorage.getItem('banban_dev_sandbox_split_records');
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p) && p.length > 0) return p;
        }
      } catch (e) {}
      return INITIAL_SPLIT_ITEMS;
    })();
    setSplitItems(sandboxSplit);
    calculateLocalSplitSummary(sandboxSplit);

    const sandboxShopping = (() => {
      try {
        const s = localStorage.getItem('banban_dev_sandbox_shopping_items');
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p) && p.length > 0) return p;
        }
      } catch (e) {}
      return INITIAL_SHOPPING_ITEMS;
    })();
    setShoppingItems(sandboxShopping);

    showToast('🛠️ 已進入 DEV 開發環境（系統功能與介面設計專用沙盒）！', 'info');
  };

  const handleResetDevData = () => {
    setRecords([]);
    setSplitItems([]);
    setShoppingItems([]);
    setSplitSummary({
      liaoOwesZhou: 0,
      zhouOwesLiao: 0,
      netDebtor: 'none',
      netAmount: 0,
      summaryText: '目前雙方已結清 💖',
      unsettledCount: 0,
      settledCount: 0
    });
    try {
      localStorage.removeItem('banban_dev_sandbox_records');
      localStorage.removeItem('banban_dev_sandbox_split_records');
      localStorage.removeItem('banban_dev_sandbox_split_summary');
      localStorage.removeItem('banban_dev_sandbox_shopping_items');
      localStorage.removeItem('banban_dev_sandbox_reconciled_months');
      window.dispatchEvent(new CustomEvent('travel-data-updated', {
        detail: { trips: [], expenses: [], wishlist: [] }
      }));
    } catch (e) {}
    showToast('🧹 已清空本機開發測試數據', 'info');
  };

  const handleSeedSampleData = () => {
    setRecords(INITIAL_RECORDS);
    setSplitItems(INITIAL_SPLIT_ITEMS);
    setShoppingItems(INITIAL_SHOPPING_ITEMS);
    calculateLocalSplitSummary(INITIAL_SPLIT_ITEMS);
    try {
      localStorage.setItem('banban_dev_sandbox_records', JSON.stringify(INITIAL_RECORDS));
      localStorage.setItem('banban_dev_sandbox_split_records', JSON.stringify(INITIAL_SPLIT_ITEMS));
      localStorage.setItem('banban_dev_sandbox_shopping_items', JSON.stringify(INITIAL_SHOPPING_ITEMS));
    } catch (e) {}
    showToast('✨ 已注入全套展示測試數據', 'success');
  };

  const handleSyncToProduction = () => {
    setIsProductionReady(true);
    try {
      localStorage.setItem('banban_production_ready', 'true');
    } catch (e) {}
    showToast('🚀 所有設計變更與全域配置已同步至正式系統標準！', 'success');
  };

  const handleExitDevMode = () => {
    setIsDevSettingsModalOpen(false);
    handleLogout();
  };

  const handleEnterGuestMode = () => {
    setCurrentUser(null);
    setPartnerBindingInfo(null);
    setIsSandboxMode(false);
    setIsGuestMode(true);
    setRecords([]);
    setSplitItems([]);
    setSplitSummary({
      liaoOwesZhou: 0,
      zhouOwesLiao: 0,
      netDebtor: 'none',
      netAmount: 0,
      summaryText: '目前雙方已結清 💖',
      unsettledCount: 0,
      settledCount: 0
    });
    setShoppingItems([]);
    try {
      localStorage.removeItem('banban_auth_user');
      localStorage.setItem('banban_is_sandbox_mode', 'false');
      localStorage.setItem('banban_is_guest_mode', 'true');
      window.dispatchEvent(new CustomEvent('travel-data-updated', {
        detail: { trips: [], expenses: [], wishlist: [] }
      }));
    } catch (e) {}
    showToast('📱 已進入「訪客模式」，所有數值已歸零', 'info');
  };

  const handleReturnToLoginPortal = () => {
    signOutGoogle().catch(() => {});
    setCurrentUser(null);
    setPartnerBindingInfo(null);
    setIsSandboxMode(false);
    setIsGuestMode(false);
    setIsUnifiedSettingsModalOpen(false);
    setIsUnifiedDatabaseOpen(false);
    setGasWebUrl('');
    setDeploySheetUrl('');
    setRecords([]);
    setSplitItems([]);
    setSplitSummary({
      liaoOwesZhou: 0,
      zhouOwesLiao: 0,
      netDebtor: 'none',
      netAmount: 0,
      summaryText: '目前雙方已結清 💖',
      unsettledCount: 0,
      settledCount: 0
    });
    setShoppingItems([]);
    try {
      clearAllSessionLedgerCache();
      window.dispatchEvent(new CustomEvent('travel-data-updated', {
        detail: { trips: [], expenses: [], wishlist: [] }
      }));
    } catch (e) {}
    showToast('歡迎回到 Google 帳號登入主畫面', 'info');
  };

  const handleLogout = () => {
    signOutGoogle().catch(() => {});
    setCurrentUser(null);
    setPartnerBindingInfo(null);
    setIsSandboxMode(false);
    setIsGuestMode(false);
    setIsUnifiedSettingsModalOpen(false);
    setIsUnifiedDatabaseOpen(false);
    setGasWebUrl('');
    setDeploySheetUrl('');
    setRecords([]);
    setSplitItems([]);
    setSplitSummary({
      liaoOwesZhou: 0,
      zhouOwesLiao: 0,
      netDebtor: 'none',
      netAmount: 0,
      summaryText: '目前雙方已結清 💖',
      unsettledCount: 0,
      settledCount: 0
    });
    setShoppingItems([]);
    try {
      clearAllSessionLedgerCache();
      window.dispatchEvent(new CustomEvent('travel-data-updated', {
        detail: { trips: [], expenses: [], wishlist: [] }
      }));
    } catch (e) {}
    showToast('已安全登出 Google 帳號，返回登入主畫面', 'info');
  };

  /**
   * 🔄 重設目前 Google 帳號的資料庫與 API 連線（初始化為全新乾淨帳本）
   */
  const handleResetAccountDatabase = async () => {
    const cleanEmail = (currentUser?.email || '').trim().toLowerCase();
    const isPartnerRole = currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail);
    
    // 1. 清空所有狀態
    setGasWebUrl('');
    setDeploySheetUrl('');
    setRecords([]);
    setSplitItems([]);
    setShoppingItems([]);
    setPartnerBindingInfo(null);
    const freshInviteCode = generateRandomInviteCode();
    setCurrentInviteCode(freshInviteCode);

    // 2. 清除本地儲存
    try {
      localStorage.removeItem('muji_gas_web_url');
      localStorage.removeItem('muji_sheet_url');
      localStorage.removeItem('muji_deploy_sheet_url');
      localStorage.removeItem('muji_ledger_data');
      localStorage.removeItem('banban_split_records');
      localStorage.removeItem('banban_shopping_items');
      localStorage.removeItem('banban_partner_binding');
      localStorage.removeItem('banban_sync_version');
      if (cleanEmail) {
        localStorage.removeItem(`muji_gas_web_url_${cleanEmail}`);
        localStorage.removeItem(`muji_sheet_url_${cleanEmail}`);
        localStorage.removeItem(`muji_ledger_data_${cleanEmail}`);
        localStorage.removeItem(`banban_sync_version_${cleanEmail}`);
      }
      window.dispatchEvent(new CustomEvent('travel-data-updated', {
        detail: { trips: [], expenses: [], wishlist: [] }
      }));
    } catch (e) {}

    // 3. 清空雲端此使用者專屬的 API 設定
    if (cleanEmail) {
      try {
        if (!isPartnerRole) {
          // 主管理員重設自己的雲端 API
          await saveUserCloudConfig(cleanEmail, {
            gasWebUrl: '',
            deploySheetUrl: '',
            inviteCode: freshInviteCode
          });
        }
        await removePartnerBinding(cleanEmail);
      } catch (e) {}
    }

    if (currentUser) {
      const resetUser: AuthUser = {
        ...currentUser,
        userRole: 'admin',
        role: 'admin',
        adminEmail: undefined,
        adminName: undefined,
        inviteCode: freshInviteCode
      };
      setCurrentUser(resetUser);
      try {
        localStorage.setItem('banban_auth_user', JSON.stringify(resetUser));
      } catch (e) {}
    }

    showToast('✨ 已重設資料庫連線！帳本已初始化為全新狀態', 'info');
    openUnifiedDatabaseModal('wizard');
  };

  const handleSwitchAccount = () => {
    handleReturnToLoginPortal();
  };

  const handleToggleSandboxMode = (enabled: boolean) => {
    setIsSandboxMode(enabled);
    try {
      localStorage.setItem('banban_is_sandbox_mode', enabled ? 'true' : 'false');
    } catch (e) {}
    showToast(enabled ? '已切換為「開發人員沙盒測試模式」' : '已關閉沙盒模式，切換為「正式連線模式」', 'info');
  };

  const handleUpdateNickname = (
    newNickname: string,
    lengthPreference?: NicknameLengthPreference,
    nickname1Char?: string,
    nickname2Char?: string
  ): boolean => {
    const trimmed = newNickname.trim();
    if (!trimmed || trimmed.length >= 3) {
      showToast('暱稱字數需少於 3 個字 (1~2 個字)', 'error');
      return false;
    }
    if (!currentUser) return false;

    const chosenPref = lengthPreference || (trimmed.length === 1 ? '1-char' : '2-char');
    const final1Char = nickname1Char?.trim() || (trimmed.length === 1 ? trimmed : currentUser.nickname1Char || trimmed[0]);
    const final2Char = nickname2Char?.trim() || (trimmed.length === 2 ? trimmed : currentUser.nickname2Char || trimmed);
    const effectiveNickname = chosenPref === '1-char' ? final1Char : final2Char;

    const updatedUser: AuthUser = {
      ...currentUser,
      nickname: effectiveNickname,
      nicknameLengthPreference: chosenPref,
      nickname1Char: final1Char,
      nickname2Char: final2Char
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('banban_auth_user', JSON.stringify(updatedUser));
      if (currentUser.email) {
        const cleanEmail = currentUser.email.trim().toLowerCase();
        localStorage.setItem(`banban_user_nickname_${cleanEmail}`, effectiveNickname);
        localStorage.setItem(`banban_user_nickname_length_${cleanEmail}`, chosenPref);
        localStorage.setItem(`banban_user_nickname_1char_${cleanEmail}`, final1Char);
        localStorage.setItem(`banban_user_nickname_2char_${cleanEmail}`, final2Char);
      }
    } catch (e) {}

    if (currentUser.email) {
      saveUserCloudConfig(currentUser.email, {
        nickname: effectiveNickname,
        nicknameLengthPreference: chosenPref,
        nickname1Char: final1Char,
        nickname2Char: final2Char,
        email: currentUser.email,
        name: currentUser.name
      });
    }

    showToast(`✨ 稱呼顯示已切換為「${effectiveNickname}」（${chosenPref === '1-char' ? '單字模式' : '雙字模式'}）！`, 'success');
    return true;
  };

  const handleSyncGoogleAvatar = async (): Promise<boolean> => {
    if (!currentUser) return false;
    if (currentUser.isDevSandbox) {
      showToast('⚠️ DEV 開發模式為獨立虛擬帳號，無法同步真實 Google 帳戶頭像', 'info');
      return false;
    }
    if (!currentUser.email || currentUser.authMethod !== 'google_oauth') {
      showToast('此帳號非 Google 授權登入，無法同步頭像', 'info');
      return false;
    }

    showToast('正在與 Google 帳號同步最新頭像...', 'info');
    try {
      const profile = await syncGoogleUserProfile(currentUser.email);
      if (profile && profile.avatar) {
        const updatedUser: AuthUser = {
          ...currentUser,
          avatar: profile.avatar,
          name: profile.name || currentUser.name
        };
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('banban_auth_user', JSON.stringify(updatedUser));
          if (currentUser.email) {
            const cleanEmail = currentUser.email.trim().toLowerCase();
            localStorage.setItem(`banban_user_avatar_${cleanEmail}`, profile.avatar);
          }
        } catch (e) {}

        if (currentUser.email) {
          saveUserCloudConfig(currentUser.email, {
            avatar: profile.avatar,
            name: profile.name || currentUser.name,
            email: currentUser.email
          });
        }
        showToast('🎉 已成功同步 Google 帳戶大頭貼照片！', 'success');
        return true;
      } else {
        showToast('目前未偵測到與您此 Google 帳號匹配的最新頭像', 'info');
        return true;
      }
    } catch (err: any) {
      showToast('同步 Google 頭像失敗，請重新登入或稍後重試', 'error');
      return false;
    }
  };
  
  // ------------------- 即時匯率與出國幣值換算狀態 -------------------
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('muji_exchange_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.rates) return { ...DEFAULT_RATES_MAP, ...parsed.rates };
      }
    } catch (e) {}
    return DEFAULT_RATES_MAP;
  });
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('muji_exchange_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.updated) return parsed.updated;
      }
    } catch (e) {}
    return new Date().toLocaleDateString('zh-TW');
  });
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [rateFetchError, setRateFetchError] = useState(false);

  // 出國幣值試算器 Modal 與計算狀態 (支援雙向對換)
  const [showTravelCalculatorModal, setShowTravelCalculatorModal] = useState(false);
  const [calcInputAmount, setCalcInputAmount] = useState('1000');
  const [calcBaseCurrency, setCalcBaseCurrency] = useState('JPY');
  const [calcMode, setCalcMode] = useState<'foreignToTwd' | 'twdToForeign'>('foreignToTwd');

  // ------------------- 隱密部署與連線設定 Modal 狀態 -------------------
  
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [gasWebUrl, setGasWebUrl] = useState(() => {
    try {
      const rec = scanAndRecoverGasUrl();
      return rec.gasWebUrl || localStorage.getItem('muji_gas_web_url') || '';
    } catch (e) {
      return localStorage.getItem('muji_gas_web_url') || '';
    }
  });
  const [isSyncingGas, setIsSyncingGas] = useState(false);

  // 整合式資料庫設定與精靈 Modal 狀態
  const [isUnifiedDatabaseOpen, setIsUnifiedDatabaseOpen] = useState(false);
  const [unifiedDatabaseTab, setUnifiedDatabaseTab] = useState<'wizard' | 'settings' | 'code' | 'partner'>('wizard');
  const [unifiedDatabaseRole, setUnifiedDatabaseRole] = useState<'admin' | 'partner' | undefined>(undefined);
  const [isCheckingCloudConfig, setIsCheckingCloudConfig] = useState(true);

  // 🛠️ 系統整體設定與開發控制中心 Modal 狀態
  const [isDevSettingsModalOpen, setIsDevSettingsModalOpen] = useState(false);
  const [isProductionReady, setIsProductionReady] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banban_production_ready') === 'true';
    } catch (e) {
      return false;
    }
  });

  const openUnifiedDatabaseModal = (tab: 'wizard' | 'settings' | 'code' | 'partner' = 'wizard', role?: 'admin' | 'partner') => {
    setUnifiedDatabaseTab(tab);
    setUnifiedDatabaseRole(role);
    setIsUnifiedDatabaseOpen(true);
  };

  const isDbConnected = Boolean(
    (gasWebUrl && gasWebUrl.trim().startsWith('http')) ||
    (typeof window !== 'undefined' && (window as any).google?.script?.run) ||
    isSandboxMode
  );

  const handleOpenGasDeploy = (initialTab: 'wizard' | 'settings' | 'code' | 'partner' = 'settings') => {
    if (isGuestMode || !currentUser) {
      showToast('🔒 本機離線模式不支援登入或綁定 Google 試算表金鑰，請先登入 Google 帳號！', 'info');
      return;
    }
    openUnifiedDatabaseModal(initialTab);
  };

  const renderDbUnconnectedState = (
    title = "尚未連線至資料庫",
    desc = "尚未登錄 Google 試算表 Web App API 金鑰，無法讀取資料庫。請先設定連線金鑰以同步雲端數據。"
  ) => (
    <motion.div
      key="unconnected-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-4 sm:pb-6 font-sans"
    >
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-[#E8E2D5] shadow-2xs text-center space-y-4 my-2">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-inner">
          <Database className="w-8 h-8 text-amber-700" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg sm:text-2xl font-black text-[#3E3A36]">{title}</h3>
          <p className="text-xs sm:text-sm text-[#7A7366] leading-relaxed max-w-md mx-auto font-normal">
            {desc}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              showToast('🔍 正在從 Google 雲端與伺服器查詢您在電腦設定的資料庫...', 'info');
              const cleanEmail = (currentUser?.email || '').trim().toLowerCase();
              let foundGas = '';
              let foundSheet = '';
              if (cleanEmail) {
                try {
                  const cfg = await getUserCloudConfig(cleanEmail);
                  if (cfg?.gasWebUrl) {
                    foundGas = cfg.gasWebUrl;
                    foundSheet = cfg.deploySheetUrl || '';
                  }
                } catch (e) {}
              }
              if (!foundGas && hasBackendServer()) {
                try {
                  const res = await fetch('/api/system-database');
                  if (res.ok) {
                    const data = await res.json();
                    if (data?.success && data?.database?.gasWebUrl) {
                      foundGas = data.database.gasWebUrl;
                      foundSheet = data.database.deploySheetUrl || '';
                    }
                  }
                } catch (e) {}
              }
              if (foundGas) {
                setGasWebUrl(foundGas);
                if (foundSheet) setDeploySheetUrl(foundSheet);
                saveDeployConfig(foundGas, foundSheet);
                showToast('🎉 同步成功！已載入電腦端設定的資料庫與帳本', 'success');
                fetchDashboardData(true, false, foundGas);
                fetchShoppingData(false, foundGas);
                fetchSplitData(true, foundGas);
                fetchTravelData(true, foundGas);
              } else {
                showToast('尚未在雲端找到資料庫，請點擊「設定連線」確認或手動輸入 Web App 網址', 'info');
                handleOpenGasDeploy('settings');
              }
            }}
            className="px-5 py-3 bg-[#4A7C59] hover:bg-[#3D6649] text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>從 Google 帳號一鍵同步</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenGasDeploy('settings')}
            className="px-5 py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>手動設定連線金鑰</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ------------------- Google Apps Script / Web App API 整合核心 -------------------
  const callGasApi = async (action: string, payload?: any, overrideGasUrl?: string): Promise<any> => {
    // 若處於開發人員沙盒模式或訪客模式，不對外部 GAS 進行網路呼叫，直接回傳本地回退旗標
    if (isSandboxMode || isGuestMode || !currentUser) {
      return { success: false, isLocalFallback: true, isSandbox: isSandboxMode, isGuest: isGuestMode };
    }

    // 1. 原生 Google Apps Script iframe 環境
    if (typeof window !== 'undefined' && (window as any).google?.script?.run) {
      return new Promise((resolve) => {
        const runner = (window as any).google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: String(err) }));
        if (typeof runner[action] === 'function') {
          runner[action](payload);
        } else {
          resolve({ success: false, error: `Function ${action} not found` });
        }
      });
    }

    // 2. AI Studio 預覽版或獨立 Web 網頁環境，透過 HTTP fetch 呼叫 GAS Web App
    const targetUrl = (
      overrideGasUrl ||
      localStorage.getItem('muji_gas_web_url') ||
      gasWebUrl ||
      localStorage.getItem('banban_permanent_gas_url') ||
      (currentUser?.email ? localStorage.getItem(`muji_gas_web_url_${currentUser.email.toLowerCase()}`) : '') ||
      partnerBindingInfo?.gasWebUrl ||
      ''
    ).trim();

    if (targetUrl && targetUrl.startsWith('http') && !targetUrl.includes('/test/')) {
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, ...payload })
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.warn(`callGasApi HTTP POST to ${action} failed:`, err);
      }
    }

    return { success: false, isLocalFallback: true };
  };

  // 連網與即時同步狀態
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString('zh-TW', { hour12: false }));
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<PendingSyncItem[]>(() => getPendingQueue());

  // 監聽離線佇列變更
  useEffect(() => {
    return subscribeSyncStatus(setPendingSyncQueue);
  }, []);

  // 🚀 監聽版本落後或強制刷新事件：立即從雲端重新抓取最新帳本
  useEffect(() => {
    const handleForceSync = () => {
      fetchDashboardData(false, false);
    };
    window.addEventListener('banban-force-cloud-sync', handleForceSync);
    return () => window.removeEventListener('banban-force-cloud-sync', handleForceSync);
  }, []);

  const handleFlushQueue = async () => {
    setIsSyncingGas(true);
    try {
      const res = await processSyncQueue();
      if (res.processed > 0) {
        showToast(`⚡ 已成功補送 ${res.processed} 筆離線操作至試算表！`, 'success');
        fetchDashboardData(false, true);
        fetchShoppingData(true);
        fetchSplitData(true);
      } else if (res.failed > 0) {
        showToast(`⚠️ 部分重試未成功 (${res.failed} 筆失敗)，請確認網路或 Web App 連線設定`, 'error');
      } else {
        showToast('目前無待同步之離線操作', 'info');
      }
    } finally {
      setIsSyncingGas(false);
    }
  };

  const handleRestoreData = (restored: any) => {
    if (Array.isArray(restored.records)) {
      setRecords(restored.records);
      localStorage.setItem('muji_ledger_data', JSON.stringify(restored.records));
    }
    if (Array.isArray(restored.shoppingItems)) {
      setShoppingItems(restored.shoppingItems);
      localStorage.setItem('muji_shopping_items', JSON.stringify(restored.shoppingItems));
    }
    if (Array.isArray(restored.shoppingStores)) {
      setShoppingStores(restored.shoppingStores);
      localStorage.setItem('muji_shopping_stores', JSON.stringify(restored.shoppingStores));
    }
    if (Array.isArray(restored.splitItems)) {
      setSplitItems(restored.splitItems);
      localStorage.setItem('banban_split_records', JSON.stringify(restored.splitItems));
      calculateLocalSplitSummary(restored.splitItems);
    }
    if (Array.isArray(restored.travelTrips)) {
      localStorage.setItem('banban_travel_trips', JSON.stringify(restored.travelTrips));
    }
    if (Array.isArray(restored.travelExpenses)) {
      localStorage.setItem('banban_travel_expenses', JSON.stringify(restored.travelExpenses));
    }
    if (Array.isArray(restored.travelWishlist)) {
      localStorage.setItem('banban_travel_wishlist', JSON.stringify(restored.travelWishlist));
    }
    showToast('🎉 已成功還原備份資料！', 'success');
  };

  const handleSyncAll = async () => {
    setIsSyncingGas(true);
    try {
      await Promise.all([
        fetchDashboardData(false, false),
        fetchShoppingData(false),
        fetchSplitData(false),
        fetchTravelData(true)
      ]);
      showToast('🎉 所有資料庫（流水帳、採購、代墊、旅遊分帳）已與 Google 試算表完成即時對帳！', 'success');
    } finally {
      setIsSyncingGas(false);
    }
  };

  const fetchDashboardData = async (showToastNotice = false, isBackground = false, overrideGasUrl?: string) => {
    if (!isBackground) setIsSyncingGas(true);
    else setIsBackgroundSyncing(true);

    try {
      const res = await callGasApi('getDashboardData', undefined, overrideGasUrl);
      if (res && res.success) {
        const cleanEmail = (currentUser?.email || '').trim().toLowerCase();
        try {
          localStorage.setItem('banban_sync_version', APP_VERSION);
          if (cleanEmail) {
            localStorage.setItem(`banban_sync_version_${cleanEmail}`, APP_VERSION);
          }
          localStorage.removeItem('banban_pending_cloud_refresh');
        } catch (e) {}

        if (Array.isArray(res.records)) {
          const healed = sanitizeAndHealRecords(res.records);
          setRecords(prev => {
            // 只有在資料內容有變動時才更新狀態，避免無謂 re-render
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(healed);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_ledger_data', nextStr);
              if (cleanEmail) {
                localStorage.setItem(`muji_ledger_data_${cleanEmail}`, nextStr);
              }
              return healed;
            }
            return prev;
          });
          try {
            if (cleanEmail) {
              localStorage.setItem(`muji_ledger_data_${cleanEmail}`, JSON.stringify(healed));
            }
          } catch (e) {}
          if (healed.length > 0) {
            const uniqueMonths = Array.from(new Set(healed.map((r: any) => r.month))).sort((a: any, b: any) => b.localeCompare(a));
            if (uniqueMonths.length > 0) {
              setSettlementMonth(prev => prev || (uniqueMonths[0] as string));
            }
          }
        }
        if (Array.isArray(res.reconciledMonths)) {
          setReconciledMonths(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(res.reconciledMonths);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_reconciled_months', nextStr);
              return res.reconciledMonths;
            }
            return prev;
          });
        }
        const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        setLastSyncedAt(timeStr);
        if (showToastNotice) {
          showToast('🎉 已成功從 Google 試算表抓取最新對帳資料！', 'success');
        }
      } else if (showToastNotice) {
        showToast('⚡ 本機離線模式（若需雲端同步，請於右下角「設定部署」輸入 Web App URL）', 'info');
      }
    } catch (err) {
      console.warn('fetchDashboardData error:', err);
    } finally {
      if (!isBackground) setIsSyncingGas(false);
      setIsBackgroundSyncing(false);
    }
  };

  const fetchShoppingData = async (isBackground = false, overrideGasUrl?: string) => {
    try {
      const res = await callGasApi('getShoppingData', undefined, overrideGasUrl);
      if (res && res.success) {
        if (Array.isArray(res.items)) {
          const normalized = res.items.map((it: any) => ({
            ...it,
            createdTime: getShoppingItemDisplayTime(it) || it.createdTime || formatAmPmTime(new Date())
          }));
          setShoppingItems(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(normalized);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_shopping_items', nextStr);
              return normalized;
            }
            return prev;
          });
        }
        if (Array.isArray(res.stores) && res.stores.length > 0) {
          setShoppingStores(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(res.stores);
            if (prevStr !== nextStr) {
              localStorage.setItem('muji_shopping_stores', nextStr);
              return res.stores;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('fetchShoppingData error:', err);
    }
  };

  const fetchSplitData = async (silent = false, overrideGasUrl?: string) => {
    const activeGas = (
      overrideGasUrl ||
      localStorage.getItem('muji_gas_web_url') ||
      gasWebUrl ||
      (currentUser?.email ? localStorage.getItem(`muji_gas_web_url_${currentUser.email.toLowerCase()}`) : '') ||
      partnerBindingInfo?.gasWebUrl ||
      ''
    ).trim();

    if (!activeGas) {
      calculateLocalSplitSummary(splitItems);
      return;
    }
    if (!silent) setIsSplitLoading(true);
    try {
      const res = await callGasApi('getSplitData', undefined, overrideGasUrl);
      if (res && res.success) {
        if (Array.isArray(res.items)) {
          setSplitItems(res.items);
          localStorage.setItem('banban_split_records', JSON.stringify(res.items));
        }
        if (res.summary) {
          setSplitSummary(res.summary);
          localStorage.setItem('banban_split_summary', JSON.stringify(res.summary));
        } else {
          calculateLocalSplitSummary(res.items || []);
        }
        if (!silent) showToast('代墊明細已同步更新！', 'success');
      } else {
        calculateLocalSplitSummary(splitItems);
      }
    } catch (err) {
      calculateLocalSplitSummary(splitItems);
    } finally {
      if (!silent) setIsSplitLoading(false);
    }
  };

  const fetchTravelData = async (silent = false, overrideGasUrl?: string) => {
    try {
      const res = await callGasApi('getTravelData', undefined, overrideGasUrl);
      if (res && res.success) {
        let delTrips = new Set<string>();
        let delExpenses = new Set<string>();
        let delWishes = new Set<string>();
        try {
          const t = localStorage.getItem('banban_deleted_trip_ids');
          if (t) delTrips = new Set(JSON.parse(t));
          const e = localStorage.getItem('banban_deleted_expense_ids');
          if (e) delExpenses = new Set(JSON.parse(e));
          const w = localStorage.getItem('banban_deleted_wish_ids');
          if (w) delWishes = new Set(JSON.parse(w));
        } catch (e) {}

        const cleanTrips = Array.isArray(res.trips) 
          ? res.trips.filter((t: any) => !delTrips.has(t.id)) 
          : [];
        const cleanExpenses = Array.isArray(res.expenses) 
          ? res.expenses.filter((e: any) => !delExpenses.has(e.id) && !delTrips.has(e.tripId)) 
          : [];
        const cleanWishlist = Array.isArray(res.wishlist) 
          ? res.wishlist.filter((w: any) => !delWishes.has(w.id) && !delTrips.has(w.tripId)) 
          : [];

        localStorage.setItem('banban_travel_trips', JSON.stringify(cleanTrips));
        localStorage.setItem('banban_travel_expenses', JSON.stringify(cleanExpenses));
        localStorage.setItem('banban_travel_wishlist', JSON.stringify(cleanWishlist));

        window.dispatchEvent(new CustomEvent('travel-data-updated', { 
          detail: { ...res, trips: cleanTrips, expenses: cleanExpenses, wishlist: cleanWishlist } 
        }));
        if (!silent) showToast('旅遊分帳資料已同步更新！', 'success');
      }
    } catch (err) {
      console.warn('fetchTravelData error:', err);
    }
  };

  const handleAddSplitRecord = async (data: {
    payer: string;
    itemName: string;
    totalAmount: number;
    splitMode: 'AA平分' | '全額代付' | '自訂金額';
    customOweAmount?: number;
    note?: string;
  }) => {
    const isPayerB = isUserBPayer(data.payer) || data.payer === userB.name || data.payer === userB.displayName || data.payer === userB.shortName;
    const resolvedPayer = isPayerB ? userB.shortName : userA.shortName;
    const otherPerson = isPayerB ? userA.shortName : userB.shortName;
    let debtorAmt = Math.round(data.totalAmount / 2);
    if (data.splitMode === '全額代付') {
      debtorAmt = data.totalAmount;
    } else if (data.splitMode === '自訂金額') {
      debtorAmt = data.customOweAmount !== undefined ? data.customOweAmount : Math.round(data.totalAmount / 2);
    }

    const now = new Date();
    const timeStr = formatAmPmTime(now);

    const payerDisplayName = isPayerB ? userB.displayName : userA.displayName;
    const debtorDisplayName = isPayerB ? userA.displayName : userB.displayName;

    const newItem: SplitRecordItem = {
      id: 'split-' + Date.now(),
      time: timeStr,
      payer: resolvedPayer,
      splitMode: data.splitMode,
      itemName: data.itemName,
      totalAmount: data.totalAmount,
      splitResult: `${debtorDisplayName} 應返還 ${payerDisplayName} NT$ ${(Number(debtorAmt) || 0).toLocaleString()}`,
      debtor: otherPerson,
      debtorAmount: debtorAmt,
      status: '未結清',
      note: data.note || ''
    };

    const updated = [newItem, ...splitItems];
    setSplitItems(updated);
    calculateLocalSplitSummary(updated);
    showToast(`已成功記錄代墊：${newItem.itemName}（${debtorDisplayName} 需返還 $${debtorAmt}）`, 'success');

    if (gasWebUrl) {
      try {
        const res = await callGasApi('addSplitRecord', {
          payer: data.payer,
          totalAmount: data.totalAmount,
          itemName: data.itemName,
          splitMode: data.splitMode,
          customOweAmount: debtorAmt,
          note: data.note || ''
        });
        if (!res || !res.success) {
          enqueueSyncItem('addSplitRecord', {
            payer: data.payer,
            totalAmount: data.totalAmount,
            itemName: data.itemName,
            splitMode: data.splitMode,
            customOweAmount: debtorAmt,
            note: data.note || ''
          }, `新增代墊：${newItem.itemName} ($${newItem.totalAmount})`);
        }
        fetchSplitData(true);
      } catch (err) {
        console.error('GAS add split error:', err);
        enqueueSyncItem('addSplitRecord', {
          payer: data.payer,
          totalAmount: data.totalAmount,
          itemName: data.itemName,
          splitMode: data.splitMode,
          customOweAmount: debtorAmt,
          note: data.note || ''
        }, `新增代墊：${newItem.itemName} ($${newItem.totalAmount})`);
      }
    } else {
      enqueueSyncItem('addSplitRecord', {
        payer: data.payer,
        totalAmount: data.totalAmount,
        itemName: data.itemName,
        splitMode: data.splitMode,
        customOweAmount: debtorAmt,
        note: data.note || ''
      }, `新增代墊：${newItem.itemName} ($${newItem.totalAmount})`);
    }

    return newItem;
  };

  const handleDeleteSplitRecord = (id: string) => {
    const target = splitItems.find(i => String(i.id) === String(id));
    const itemName = target ? `「${target.itemName || '代墊明細'}」` : '這筆代墊明細';
    const amountStr = target && target.totalAmount !== undefined && target.totalAmount !== null ? `（NT$ ${(Number(target.totalAmount) || 0).toLocaleString()}）` : '';

    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認刪除代墊紀錄',
      message: `確定要刪除代墊明細 ${itemName} ${amountStr} 嗎？刪除後系統將自動重新計算所有待結算與還款金額。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        const updated = splitItems.filter(i => String(i.id) !== String(id));
        setSplitItems(updated);
        localStorage.setItem('banban_split_records', JSON.stringify(updated));
        calculateLocalSplitSummary(updated);
        showToast('已刪除該筆代墊明細', 'info');

        try {
          const res = await callGasApi('deleteSplitRecord', { id });
          if (!res || !res.success) {
            enqueueSyncItem('deleteSplitRecord', { id }, `刪除代墊：${itemName}`);
          }
        } catch (err) {
          enqueueSyncItem('deleteSplitRecord', { id }, `刪除代墊：${itemName}`);
        }
      }
    });
  };

  const handleSettleAllSplitRecords = async (settleNote?: string) => {
    const now = new Date();
    const timeStr = formatAmPmTime(now);

    const updated = splitItems.map(item => {
      if (item.status === '未結清') {
        return { ...item, status: '已結清' as const, settledTime: timeStr };
      }
      return item;
    });

    setSplitItems(updated);
    calculateLocalSplitSummary(updated);
    showToast('🎉 所有代墊款項已全數結清！目前債務歸零！', 'success');

    if (gasWebUrl) {
      try {
        const res = await callGasApi('settleAllSplitRecords', { note: settleNote });
        if (!res || !res.success) {
          enqueueSyncItem('settleAllSplitRecords', { note: settleNote }, '全額結清所有代墊款項');
        }
        fetchSplitData(true);
      } catch (err) {
        enqueueSyncItem('settleAllSplitRecords', { note: settleNote }, '全額結清所有代墊款項');
      }
    } else {
      enqueueSyncItem('settleAllSplitRecords', { note: settleNote }, '全額結清所有代墊款項');
    }
  };

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isDatabaseOnboardingOpen, setIsDatabaseOnboardingOpen] = useState(false);
  const [deploySheetUrl, setDeploySheetUrl] = useState(() => {
    try {
      const rec = scanAndRecoverGasUrl();
      return rec.deploySheetUrl || localStorage.getItem('muji_sheet_url') || '';
    } catch (e) {
      return localStorage.getItem('muji_sheet_url') || '';
    }
  });
  const [activeDeployCodeTab, setActiveDeployCodeTab] = useState<'codeGs' | 'indexHtml' | 'splitHtml'>('codeGs');
  const [copiedCodeType, setCopiedCodeType] = useState<'codeGs' | 'indexHtml' | 'splitHtml' | null>(null);

  const saveDeployConfig = (overrideGas?: string, overrideSheet?: string) => {
    if (isGuestMode || !currentUser) {
      showToast('🔒 本機體驗模式不可登入或綁定試算表金鑰，請先登入 Google 帳號！', 'error');
      return;
    }
    const isPartnerRole = currentUser.userRole === 'partner' || Boolean(currentUser.adminEmail);
    if (isPartnerRole) {
      showToast('🔒 伴侶帳號無法變更 API 連線設定，試算表由主管理員統一維護', 'error');
      return;
    }
    const cleanSheet = (overrideSheet !== undefined ? overrideSheet : (deploySheetUrl || localStorage.getItem('muji_sheet_url') || '')).trim();
    const cleanGas = (overrideGas !== undefined ? overrideGas : (gasWebUrl || localStorage.getItem('muji_gas_web_url') || '')).trim();

    if (overrideGas !== undefined) setGasWebUrl(cleanGas);
    if (overrideSheet !== undefined) setDeploySheetUrl(cleanSheet);

    localStorage.setItem('muji_sheet_url', cleanSheet);
    localStorage.setItem('muji_gas_web_url', cleanGas);
    const cleanUserEmail = (currentUser?.email || '').trim().toLowerCase();
    if (cleanGas) {
      try {
        localStorage.setItem('banban_permanent_gas_url', cleanGas);
        localStorage.setItem('banban_device_master_gas', cleanGas);
        if (cleanUserEmail) {
          localStorage.setItem(`muji_gas_web_url_${cleanUserEmail}`, cleanGas);
          localStorage.setItem(`banban_permanent_gas_url_${cleanUserEmail}`, cleanGas);
          localStorage.setItem(`banban_user_has_logged_in_${cleanUserEmail}`, 'true');
        }
      } catch (e) {}
    }
    if (cleanSheet) {
      try {
        localStorage.setItem('banban_permanent_sheet_url', cleanSheet);
        localStorage.setItem('banban_device_master_sheet', cleanSheet);
        if (cleanUserEmail) {
          localStorage.setItem(`muji_sheet_url_${cleanUserEmail}`, cleanSheet);
          localStorage.setItem(`banban_permanent_sheet_url_${cleanUserEmail}`, cleanSheet);
        }
      } catch (e) {}
    }

    // ☁️ 自動將 API 綁定至 Google 帳號雲端，日後換任何手機登入自動生效
    if (currentUser?.email && !isSandboxMode) {
      // 確保主管理者角色鎖定
      if (currentUser.userRole !== 'admin') {
        const updatedAdmin: AuthUser = {
          ...currentUser,
          userRole: 'admin',
          role: currentUser.role || 'admin'
        };
        setCurrentUser(updatedAdmin);
        try {
          localStorage.setItem('banban_auth_user', JSON.stringify(updatedAdmin));
        } catch (e) {}
      }

      saveUserCloudConfig(currentUser.email, {
        email: currentUser.email,
        name: currentUser.name,
        gasWebUrl: cleanGas,
        deploySheetUrl: cleanSheet,
        inviteCode: currentInviteCode
      });

      saveActiveInviteCode({
        inviteCode: currentInviteCode,
        adminEmail: currentUser.email,
        adminName: currentUser.name,
        gasWebUrl: cleanGas,
        deploySheetUrl: cleanSheet,
        createdAt: new Date().toISOString()
      });

      // 若已有伴侶綁定紀錄，同步更新 Firestore 中的情侶資料庫設定
      if (partnerBindingInfo) {
        const updatedBinding: CoupleBindingInfo = {
          ...partnerBindingInfo,
          gasWebUrl: cleanGas,
          deploySheetUrl: cleanSheet
        };
        savePartnerBindingInfo(updatedBinding);
        setPartnerBindingInfo(updatedBinding);
      }
    }

    if (cleanSheet) {
      callGasApi('saveSpreadsheetId', { spreadsheetId: cleanSheet, url: cleanSheet });
    }

    showToast('連線設定與 Web App API 已同步至 Google 雲端帳號！換機免重填。', 'success');
    fetchDashboardData(true);
    fetchShoppingData();
    fetchSplitData(true);
    fetchTravelData(true);
  };

  // ☁️ 全域跨裝置就緒：開機時無論登入與否，主動雙向同步本機與伺服器系統資料庫
  useEffect(() => {
    const syncSystemDatabase = async () => {
      const cleanEmail = (currentUser?.email || '').trim().toLowerCase();
      
      // 🚀 關鍵防護：若使用者已登入，跨裝置同步時應優先向雲端（Google Drive / Firestore / 後端）確認最新資料庫
      if (cleanEmail) {
        try {
          const userConfig = await getUserCloudConfig(cleanEmail, { forceRefresh: true });
          if (userConfig && userConfig.gasWebUrl && userConfig.gasWebUrl.startsWith('http')) {
            const uGas = userConfig.gasWebUrl.trim();
            const uSheet = (userConfig.deploySheetUrl || '').trim();
            setGasWebUrl(uGas);
            if (uSheet) setDeploySheetUrl(uSheet);
            try {
              localStorage.setItem('muji_gas_web_url', uGas);
              localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, uGas);
              localStorage.setItem('banban_permanent_gas_url', uGas);
              localStorage.setItem(`banban_permanent_gas_url_${cleanEmail}`, uGas);
              localStorage.setItem('banban_device_master_gas', uGas);
              if (uSheet) {
                localStorage.setItem('muji_sheet_url', uSheet);
                localStorage.setItem(`muji_sheet_url_${cleanEmail}`, uSheet);
                localStorage.setItem('banban_permanent_sheet_url', uSheet);
              }
            } catch (e) {}
            // 🚀 關鍵修復：立即自動拉取試算表最新帳本明細
            fetchDashboardData(false, true, uGas);
            fetchShoppingData(true, uGas);
            fetchSplitData(true, uGas);
            fetchTravelData(true, uGas);
            return;
          }
        } catch (e) {}
      }

      // 1. 若雲端尚未有設定，但此裝置本地存有該使用者專屬有效網址，才上傳同步至伺服器
      const localGas = (cleanEmail ? localStorage.getItem(`muji_gas_web_url_${cleanEmail}`) : null) ||
        (!cleanEmail ? (localStorage.getItem('muji_gas_web_url') || 
        localStorage.getItem('banban_permanent_gas_url') || 
        localStorage.getItem('banban_device_master_gas')) : null);
      const localSheet = (cleanEmail ? localStorage.getItem(`muji_sheet_url_${cleanEmail}`) : null) ||
        (!cleanEmail ? (localStorage.getItem('muji_sheet_url') || 
        localStorage.getItem('banban_permanent_sheet_url') || 
        localStorage.getItem('banban_device_master_sheet')) : null);
      
      if (localGas && localGas.trim().startsWith('http')) {
        const safeGas = localGas.trim();
        const safeSheet = (localSheet || '').trim();
        if (hasBackendServer()) {
          try {
            fetch('/api/system-database', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gasWebUrl: safeGas,
                deploySheetUrl: safeSheet,
                email: cleanEmail
              })
            }).catch(() => {});

            if (cleanEmail) {
              fetch('/api/user-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: cleanEmail,
                  name: currentUser?.name || '',
                  gasWebUrl: safeGas,
                  deploySheetUrl: safeSheet,
                  inviteCode: currentInviteCode
                })
              }).catch(() => {});
            }
          } catch (e) {}
        }
      } else {
        // 2. 若此裝置本地無網址，向伺服器系統資料庫拉取
        if (hasBackendServer()) {
          try {
            const res = await fetch('/api/system-database');
            if (res.ok) {
              const data = await res.json();
              if (data && data.success && data.database && data.database.gasWebUrl) {
                const sysGas = data.database.gasWebUrl.trim();
                const sysSheet = (data.database.deploySheetUrl || '').trim();
                setGasWebUrl(sysGas);
                if (sysSheet) setDeploySheetUrl(sysSheet);
                try {
                  localStorage.setItem('muji_gas_web_url', sysGas);
                  localStorage.setItem('banban_permanent_gas_url', sysGas);
                  localStorage.setItem('banban_device_master_gas', sysGas);
                  if (sysSheet) {
                    localStorage.setItem('muji_sheet_url', sysSheet);
                    localStorage.setItem('banban_permanent_sheet_url', sysSheet);
                  }
                } catch (e) {}
                // 🚀 關鍵修復：立即自動拉取試算表最新帳本明細
                fetchDashboardData(false, true, sysGas);
                fetchShoppingData(true, sysGas);
                fetchSplitData(true, sysGas);
                fetchTravelData(true, sysGas);
              }
            }
          } catch (e) {}
        }
      }
    };
    syncSystemDatabase();
  }, [currentUser?.email]);

  // ☁️ 確保管理者的有效邀請碼在 Firestore 與後端資料庫隨時就緒 (僅限主管理員帳號，預設 15 分鐘時效)
  useEffect(() => {
    const isPartnerRole = currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail) || (partnerBindingInfo?.partnerEmail && partnerBindingInfo.partnerEmail.toLowerCase() === currentUser?.email?.toLowerCase());
    if (isPartnerRole) return;

    const activeGas = (gasWebUrl || (currentUser?.email ? localStorage.getItem(`muji_gas_web_url_${currentUser.email.toLowerCase()}`) : '') || '').trim();
    const activeSheet = (deploySheetUrl || (currentUser?.email ? localStorage.getItem(`muji_sheet_url_${currentUser.email.toLowerCase()}`) : '') || '').trim();
    if (activeGas && activeGas.startsWith('http') && currentInviteCode && currentUser?.email) {
      const existing = getActiveInviteCode();
      const expiresAt = (existing && !isInviteExpired(existing) && existing.expiresAt)
        ? existing.expiresAt
        : new Date(Date.now() + 15 * 60 * 1000).toISOString();

      saveActiveInviteCode({
        inviteCode: currentInviteCode,
        adminEmail: currentUser.email,
        adminName: currentUser.name || '主管理員',
        gasWebUrl: activeGas,
        deploySheetUrl: activeSheet,
        createdAt: (existing && existing.createdAt) || new Date().toISOString(),
        expiresAt,
        validMinutes: 15
      });
    }
  }, [currentUser?.email, currentUser?.name, currentUser?.userRole, currentUser?.adminEmail, partnerBindingInfo?.partnerEmail, currentInviteCode, gasWebUrl, deploySheetUrl, isSandboxMode]);

  // ☁️ 開機自動同步使用者 Google 帳號所綁定的 API 設定與情侶雙向即時同步
  useEffect(() => {
    if (currentUser?.email && !isSandboxMode) {
      const cleanEmail = currentUser.email.trim().toLowerCase();
      const isPartnerRole = currentUser.userRole === 'partner' || Boolean(currentUser.adminEmail);

      const restoreCloudSync = async () => {
        let activeGas = gasWebUrl || (cleanEmail ? localStorage.getItem(`muji_gas_web_url_${cleanEmail}`) : '') || '';
        let activeSheet = deploySheetUrl || (cleanEmail ? localStorage.getItem(`muji_sheet_url_${cleanEmail}`) : '') || '';
        let updated = false;

        // 0. 本機多重持久掃描（快速秒復原）
        if (!activeGas || !activeGas.startsWith('http')) {
          const recovered = scanAndRecoverGasUrl(cleanEmail);
          if (recovered.gasWebUrl) {
            activeGas = recovered.gasWebUrl;
            setGasWebUrl(activeGas);
            if (recovered.deploySheetUrl && !activeSheet) {
              activeSheet = recovered.deploySheetUrl;
              setDeploySheetUrl(activeSheet);
            }
            updated = true;
          }
        }

        // 1. 無論是主管理員或伴侶，都嘗試同步伴侶綁定紀錄
        try {
          const binding = await fetchPartnerBindingInfoOnline(cleanEmail);
          if (binding) {
            setPartnerBindingInfo(binding);
            if (isPartnerRole) {
              if (binding.gasWebUrl && binding.gasWebUrl !== gasWebUrl) {
                setGasWebUrl(binding.gasWebUrl);
                try { 
                  localStorage.setItem('muji_gas_web_url', binding.gasWebUrl);
                  localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, binding.gasWebUrl);
                } catch (e) {}
                activeGas = binding.gasWebUrl;
                updated = true;
              }
              if (binding.deploySheetUrl && binding.deploySheetUrl !== deploySheetUrl) {
                setDeploySheetUrl(binding.deploySheetUrl);
                try { 
                  localStorage.setItem('muji_sheet_url', binding.deploySheetUrl);
                  localStorage.setItem(`muji_sheet_url_${cleanEmail}`, binding.deploySheetUrl);
                } catch (e) {}
                activeSheet = binding.deploySheetUrl;
                updated = true;
              }
            }
          }
        } catch (e) {}

        // 1.8 若為伴侶身分但本地缺失資料庫網址，自動透過邀請代碼向 Firestore 檢索補齊
        if ((!activeGas || !activeGas.startsWith('http')) && (partnerBindingInfo?.inviteCode || currentUser?.inviteCode)) {
          try {
            const targetCode = partnerBindingInfo?.inviteCode || currentUser?.inviteCode || '';
            const inv = await fetchInviteCodeOnline(targetCode);
            if (inv && inv.gasWebUrl && inv.gasWebUrl.startsWith('http')) {
              activeGas = inv.gasWebUrl;
              setGasWebUrl(activeGas);
              if (inv.deploySheetUrl && !activeSheet) {
                activeSheet = inv.deploySheetUrl;
                setDeploySheetUrl(activeSheet);
              }
              try {
                localStorage.setItem('muji_gas_web_url', activeGas);
                localStorage.setItem('banban_permanent_gas_url', activeGas);
                if (cleanEmail) localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, activeGas);
                if (inv.deploySheetUrl) {
                  localStorage.setItem('muji_sheet_url', inv.deploySheetUrl);
                  if (cleanEmail) localStorage.setItem(`muji_sheet_url_${cleanEmail}`, inv.deploySheetUrl);
                }
              } catch (e) {}
              updated = true;
            }
          } catch (e) {}
        }

        // 2. 從個人 UserCloudConfig 雲端設定同步（換機或無快取時自動載入）
        try {
          const cloudConfig = await getUserCloudConfig(cleanEmail);
          if (cloudConfig) {
            if (cloudConfig.gasWebUrl && (!activeGas || activeGas !== cloudConfig.gasWebUrl)) {
              setGasWebUrl(cloudConfig.gasWebUrl);
              try { 
                localStorage.setItem('muji_gas_web_url', cloudConfig.gasWebUrl);
                localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, cloudConfig.gasWebUrl);
              } catch (e) {}
              activeGas = cloudConfig.gasWebUrl;
              updated = true;
            }
            if (cloudConfig.deploySheetUrl && (!activeSheet || activeSheet !== cloudConfig.deploySheetUrl)) {
              setDeploySheetUrl(cloudConfig.deploySheetUrl);
              try { 
                localStorage.setItem('muji_sheet_url', cloudConfig.deploySheetUrl);
                localStorage.setItem(`muji_sheet_url_${cleanEmail}`, cloudConfig.deploySheetUrl);
              } catch (e) {}
              activeSheet = cloudConfig.deploySheetUrl;
              updated = true;
            }
          }
        } catch (e) {}

        // 2.5 向伺服器全域系統資料庫查詢備援 (換手機時自動繼承電腦已設定之資料庫，僅在伺服器環境下調用)
        if ((!activeGas || !activeGas.startsWith('http')) && hasBackendServer()) {
          try {
            const sysRes = await fetch('/api/system-database');
            if (sysRes.ok) {
              const sysData = await sysRes.json();
              if (sysData && sysData.success && sysData.database && sysData.database.gasWebUrl) {
                const sysGas = sysData.database.gasWebUrl;
                const sysSheet = sysData.database.deploySheetUrl || '';
                activeGas = sysGas;
                setGasWebUrl(sysGas);
                if (sysSheet && !activeSheet) {
                  activeSheet = sysSheet;
                  setDeploySheetUrl(sysSheet);
                }
                updated = true;
              }
            }
          } catch (e) {}
        }

        // 鞏固儲存至多重持久鍵並同步至伺服器與 Firestore 雲端
        if (activeGas && activeGas.startsWith('http')) {
          try {
            localStorage.setItem('muji_gas_web_url', activeGas);
            localStorage.setItem('banban_permanent_gas_url', activeGas);
            localStorage.setItem('banban_device_master_gas', activeGas);
            localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, activeGas);
            localStorage.setItem(`banban_permanent_gas_url_${cleanEmail}`, activeGas);
            localStorage.setItem(`banban_user_has_logged_in_${cleanEmail}`, 'true');
            if (activeSheet) {
              localStorage.setItem('muji_sheet_url', activeSheet);
              localStorage.setItem('banban_permanent_sheet_url', activeSheet);
              localStorage.setItem(`muji_sheet_url_${cleanEmail}`, activeSheet);
              localStorage.setItem(`banban_permanent_sheet_url_${cleanEmail}`, activeSheet);
            }
          } catch (e) {}

          // 🚀 關鍵：主動推送至伺服器與 Firestore 雲端，確保換手機時能即刻自動獲取！
          saveUserCloudConfig(cleanEmail, {
            email: cleanEmail,
            name: currentUser?.name || '',
            gasWebUrl: activeGas,
            deploySheetUrl: activeSheet || '',
            inviteCode: currentInviteCode || ''
          });
        }

        if (updated && activeGas) {
          showToast('☁️ 已從雲端帳號自動同步專屬 API 設定', 'info');
          fetchDashboardData(true, false);
          fetchShoppingData(false);
          fetchSplitData(true);
          fetchTravelData(true);
        }
        setIsCheckingCloudConfig(false);
      };

      restoreCloudSync();

      // 3. 📡 Firestore 雙向即時監聽情侶綁定狀態 (即時接收伴侶綁定/解綁/更新)
      let unsubscribe: (() => void) | null = null;
      if (db) {
        try {
          const docRef = doc(db, 'couple_bindings', cleanEmail);
          unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as CoupleBindingInfo;
              setPartnerBindingInfo(prev => {
                if (!prev?.partnerEmail && data.partnerEmail && !isPartnerRole) {
                  showToast(`💖 伴侶 (${data.partnerName || data.partnerEmail}) 已加入情侶帳本！`, 'success');
                }
                return data;
              });
              if (isPartnerRole && data.gasWebUrl && data.gasWebUrl !== gasWebUrl) {
                setGasWebUrl(data.gasWebUrl);
                try { localStorage.setItem('muji_gas_web_url', data.gasWebUrl); } catch (e) {}
                if (data.deploySheetUrl) {
                  setDeploySheetUrl(data.deploySheetUrl);
                  try { localStorage.setItem('muji_sheet_url', data.deploySheetUrl); } catch (e) {}
                }
                setTimeout(() => {
                  fetchDashboardData(true, false);
                  fetchShoppingData(false);
                  fetchSplitData(true);
                  fetchTravelData(true);
                }, 50);
              }
            }
          }, (err) => {
            console.warn('Firestore onSnapshot error:', err);
          });
        } catch (e) {
          console.warn('Firestore listener setup failed:', e);
        }
      }

      // 3.5 🔄 雙軌心跳自動輪詢：即使 Firestore 離線或無權限，亦能每 3 秒自動與伺服器同步情侶狀態
      let pollTimer: any = null;
      const pollCoupleBindingHeartbeat = async () => {
        try {
          const latest = await fetchPartnerBindingInfoOnline(cleanEmail);
          if (latest) {
            setPartnerBindingInfo(prev => {
              if (!prev || prev.partnerEmail !== latest.partnerEmail || prev.gasWebUrl !== latest.gasWebUrl) {
                if (!prev?.partnerEmail && latest.partnerEmail && !isPartnerRole) {
                  showToast(`💖 伴侶 (${latest.partnerName || latest.partnerEmail}) 已成功綁定共同帳本！`, 'success');
                }
                return latest;
              }
              return prev;
            });

            if (isPartnerRole && latest.gasWebUrl && latest.gasWebUrl !== gasWebUrl) {
              setGasWebUrl(latest.gasWebUrl);
              try { 
                localStorage.setItem('muji_gas_web_url', latest.gasWebUrl);
                localStorage.setItem('banban_permanent_gas_url', latest.gasWebUrl);
                localStorage.setItem(`muji_gas_web_url_${cleanEmail}`, latest.gasWebUrl);
              } catch (e) {}
              if (latest.deploySheetUrl && latest.deploySheetUrl !== deploySheetUrl) {
                setDeploySheetUrl(latest.deploySheetUrl);
                try { 
                  localStorage.setItem('muji_sheet_url', latest.deploySheetUrl);
                  localStorage.setItem(`muji_sheet_url_${cleanEmail}`, latest.deploySheetUrl);
                } catch (e) {}
              }
              setTimeout(() => {
                fetchDashboardData(true, false);
                fetchShoppingData(false);
                fetchSplitData(true);
                fetchTravelData(true);
              }, 50);
            }
          }
        } catch (e) {}
      };

      pollTimer = setInterval(pollCoupleBindingHeartbeat, 3000);
      const onWindowActive = () => { pollCoupleBindingHeartbeat(); };
      window.addEventListener('focus', onWindowActive);
      document.addEventListener('visibilitychange', onWindowActive);

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        window.removeEventListener('focus', onWindowActive);
        document.removeEventListener('visibilitychange', onWindowActive);
      };
    } else {
      setIsCheckingCloudConfig(false);
    }
  }, [currentUser?.email, currentUser?.userRole, isSandboxMode]);

  // 💌 自動註冊當前邀請碼至伺服器與雲端（確保伴侶在另一端隨時隨地可查可配對）
  useEffect(() => {
    if (!currentUser || currentUser.userRole === 'partner' || isSandboxMode) return;
    const cleanEmail = (currentUser.email || '').trim().toLowerCase();
    if (!cleanEmail || !currentInviteCode) return;

    const cleanGas = (gasWebUrl || localStorage.getItem('muji_gas_web_url') || localStorage.getItem('banban_permanent_gas_url') || '').trim();
    const cleanSheet = (deploySheetUrl || localStorage.getItem('muji_sheet_url') || '').trim();

    saveActiveInviteCode({
      inviteCode: currentInviteCode,
      adminEmail: cleanEmail,
      adminName: currentUser.name || '主管理員',
      gasWebUrl: cleanGas,
      deploySheetUrl: cleanSheet,
      validMinutes: 15,
      createdAt: new Date().toISOString()
    });

    const userCfgPayload: any = {
      inviteCode: currentInviteCode
    };
    if (cleanGas && cleanGas.startsWith('http')) {
      userCfgPayload.gasWebUrl = cleanGas;
    }
    if (cleanSheet) {
      userCfgPayload.deploySheetUrl = cleanSheet;
    }
    saveUserCloudConfig(cleanEmail, userCfgPayload).catch(() => {});
  }, [currentUser?.email, currentUser?.userRole, currentInviteCode, gasWebUrl, deploySheetUrl, isSandboxMode]);

  // 🔄 跨裝置即時帳本數據自動備份至伺服器（換手機、換電腦可登入帳號直接掛接）
  useEffect(() => {
    if (isGuestMode || isSandboxMode || !currentUser?.email) return;
    const cleanEmail = currentUser.email.trim().toLowerCase();
    if (!cleanEmail) return;

    // 只有在完全無內容且無任何資料庫網址時才略過，避免無效請求
    if (records.length === 0 && splitItems.length === 0 && shoppingItems.length === 0 && !gasWebUrl && !deploySheetUrl) return;

    const timer = setTimeout(() => {
      if (hasBackendServer()) {
        try {
          let trips: any[] = [];
          let expenses: any[] = [];
          let wishlist: any[] = [];
          try {
            const t = localStorage.getItem('banban_travel_trips');
            if (t) trips = JSON.parse(t);
            const e = localStorage.getItem('banban_travel_expenses');
            if (e) expenses = JSON.parse(e);
            const w = localStorage.getItem('banban_travel_wishlist');
            if (w) wishlist = JSON.parse(w);
          } catch (e) {}

          fetch('/api/user-ledger-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              records,
              splitItems,
              shoppingItems,
              travelTrips: trips,
              travelExpenses: expenses,
              travelWishlist: wishlist,
              splitSummary,
              gasWebUrl: (gasWebUrl || '').trim(),
              deploySheetUrl: (deploySheetUrl || '').trim()
            })
          }).catch(() => {});
        } catch (e) {}
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [records, splitItems, shoppingItems, splitSummary, gasWebUrl, deploySheetUrl, currentUser?.email, isGuestMode, isSandboxMode]);

  const getCustomizedCodeGs = () => {
    let code = CODE_GS_TEMPLATE;

    // 動態代入雙方角色設定
    code = code.replace(
      'var DEFAULT_USER_A_NAME = "廖尹丞";',
      `var DEFAULT_USER_A_NAME = "${userA.name || userA.displayName || '廖尹丞'}";`
    );
    code = code.replace(
      'var DEFAULT_USER_A_SHORT = "廖";',
      `var DEFAULT_USER_A_SHORT = "${userA.shortName || '廖'}";`
    );
    code = code.replace(
      'var DEFAULT_USER_B_NAME = "周沛緹";',
      `var DEFAULT_USER_B_NAME = "${userB.name || userB.displayName || '周沛緹'}";`
    );
    code = code.replace(
      'var DEFAULT_USER_B_SHORT = "周";',
      `var DEFAULT_USER_B_SHORT = "${userB.shortName || '周'}";`
    );
    
    let sheetId = deploySheetUrl.trim();
    if (sheetId.includes('docs.google.com/spreadsheets')) {
      const match = sheetId.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) sheetId = match[1];
    }

    if (sheetId) {
      code = code.replace(
        'var HARDCODED_SPREADSHEET_ID = "";',
        `var HARDCODED_SPREADSHEET_ID = "${sheetId}";`
      );
    }

    return code;
  };

  const copyDeployCode = (type: 'codeGs' | 'indexHtml' | 'splitHtml') => {
    let textToCopy = INDEX_HTML_TEMPLATE;
    let labelName = 'Index.html';
    if (type === 'codeGs') {
      textToCopy = getCustomizedCodeGs();
      labelName = 'Code.gs';
    } else if (type === 'splitHtml') {
      textToCopy = SPLIT_INDEX_HTML_TEMPLATE;
      labelName = 'split/index.html';
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedCodeType(type);
      showToast(`已成功複製 ${labelName} 部署代碼！`, 'success');
      setTimeout(() => setCopiedCodeType(null), 2500);
    }).catch(() => {
      showToast('複製失敗，請手動選取代碼複製。', 'info');
    });
  };

  // 取得最新各國即時匯率 API (優先內部 API 代理 -> 國際匯率 API -> 離線基準/快取)
  const fetchLiveExchangeRates = async (showToastNotice = false, isBackground = false) => {
    if (!isBackground) setIsRateLoading(true);
    setRateFetchError(false);

    const applyRatesFromData = (rates: Record<string, number>, sourceLabel: string) => {
      const newRates: Record<string, number> = { TWD: 1 };
      CURRENCIES.forEach(c => {
        if (c.code === 'TWD') {
          newRates['TWD'] = 1;
        } else if (rates[c.code] && rates[c.code] > 0) {
          const val = rates[c.code];
          newRates[c.code] = Number((1 / val).toFixed(4));
        } else {
          newRates[c.code] = c.defaultRate;
        }
      });
      setExchangeRates(newRates);
      const nowStr = new Date().toLocaleString('zh-TW', { hour12: false });
      setRatesLastUpdated(nowStr);
      try {
        localStorage.setItem('muji_exchange_rates', JSON.stringify({ rates: newRates, updated: nowStr }));
      } catch (e) {}
      if (showToastNotice) showToast(`⚡ 已即時更新${sourceLabel}各國最新匯率！`, 'success');
    };

    // 1. 優先嘗試同源代理 API (僅在有伺服器環境下調用，靜態主機如 GitHub Pages 直接進入步驟 2 避開 404)
    if (hasBackendServer()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('/api/exchange-rates', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            applyRatesFromData(data.rates, '基準市場');
            if (!isBackground) setIsRateLoading(false);
            return;
          }
        }
      } catch (e) {
        // 靜默嘗試下一管道
      }
    }

    // 2. 嘗試主要公開匯率 API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://open.er-api.com/v6/latest/TWD', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          applyRatesFromData(data.rates, '國際匯市');
          if (!isBackground) setIsRateLoading(false);
          return;
        }
      }
    } catch (err) {
      // 靜默嘗試備用 API
    }

    // 3. 嘗試備用公開匯率 API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const resBackup = await fetch('https://api.exchangerate-api.com/v4/latest/TWD', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (resBackup.ok) {
        const dataB = await resBackup.json();
        if (dataB && dataB.rates) {
          applyRatesFromData(dataB.rates, '備用伺服器');
          if (!isBackground) setIsRateLoading(false);
          return;
        }
      }
    } catch (err2) {
      // 離線或外部網路阻擋
    }

    // 4. 全部外網 API 未回應時：平滑退回本機快取或預設基準匯率（不拋出錯誤）
    try {
      const saved = localStorage.getItem('muji_exchange_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.rates) {
          setExchangeRates({ ...DEFAULT_RATES_MAP, ...parsed.rates });
          if (parsed.updated) setRatesLastUpdated(parsed.updated);
        }
      } else {
        setExchangeRates({ ...DEFAULT_RATES_MAP });
      }
    } catch (e) {
      setExchangeRates({ ...DEFAULT_RATES_MAP });
    }

    if (showToastNotice) {
      setRateFetchError(true);
      showToast('目前處於離線環境，已啟用基準牌告匯率', 'info');
    } else {
      setRateFetchError(false);
    }
    if (!isBackground) setIsRateLoading(false);
  };

  // 系統初始化載入與智慧按需同步（保護 Google API 配額與手機效能）
  useEffect(() => {
    // 1. 首次載入時抓取必要數據
    fetchLiveExchangeRates(false, false);
    fetchDashboardData(false, false);
    fetchShoppingData(false);
    fetchSplitData(true);
    fetchTravelData(true);

    // 2. 監聽網路恢復在線事件：自動補送離線操作並刷新最新資料
    const handleOnline = async () => {
      setIsOnline(true);
      fetchLiveExchangeRates(false, true);
      const res = await processSyncQueue();
      if (res.processed > 0) {
        showToast(`⚡ 網路恢復連線！已自動補送 ${res.processed} 筆暫存操作至雲端試算表`, 'success');
      }
      fetchDashboardData(false, true);
      fetchShoppingData(true);
      fetchSplitData(true);
      fetchTravelData(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. 視窗焦點與即時背景同步（當使用者在 Google Sheets 修改後切換回本 App，或停留頁面時皆即時在背景同步，不發送干擾通知）
    let lastVisibilitySync = 0;
    const triggerSilentSync = async () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!online) return;
      try {
        if (getPendingQueue().length > 0) {
          await processSyncQueue();
        }
        await Promise.allSettled([
          fetchDashboardData(false, true),
          fetchShoppingData(true),
          fetchSplitData(true),
          fetchTravelData(true)
        ]);
      } catch (err) {
        // 背景靜默同步，忽略異常
      }
    };

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        const now = Date.now();
        // 當使用者切回分頁或點擊視窗時，若距離上次背景同步大於 2 秒即刻觸發無感同步
        if (now - lastVisibilitySync > 2000) {
          lastVisibilitySync = now;
          triggerSilentSync();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 4. 定時即時靜默輪詢：每 12 秒在背景自動拉取 Google Sheets 最新資料庫資料，保持兩端資料始終完全一致（無通知干擾）
    const realTimePollingTimer = setInterval(() => {
      if (!document.hidden) {
        lastVisibilitySync = Date.now();
        triggerSilentSync();
      }
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(realTimePollingTimer);
    };
  }, [gasWebUrl]);

  // 記帳表單狀態 (新增記錄日期，預設今天，包含貨幣選項與自訂匯率，智慧預設當前登入者)
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payer: defaultPayerName as string,
    type: '支出-日常代墊' as '支出-日常代墊' | '收入-固定公積金',
    currency: 'TWD',
    customRate: ''
  });

  // 當使用者身分切換且表單未填寫時，自動更新預設付款人/登記人
  useEffect(() => {
    setFormData(prev => {
      if (!prev.item && !prev.amount) {
        return { ...prev, payer: defaultPayerName };
      }
      return prev;
    });
    setShoppingForm(prev => {
      if (!prev.item && !prev.id) {
        return { ...prev, creator: defaultPayerName as any };
      }
      return prev;
    });
  }, [defaultPayerName]);

  // 系統載入與模擬重置狀態
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [copied, setCopied] = useState<string | null>(null);

  // ------------------- 通知系統狀態 -------------------
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsOpen, setShowNotificationsOpen] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifySettings, setNotifySettings] = useState({
    notifyOnAdd: true,
    notifyOnDelete: true,
    notifyOnSettle: true
  });
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  // ------------------- PWA 離線安裝狀態 -------------------
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ------------------- App 內建即時通知與設定 -------------------
  const [isAppNotifyModalOpen, setIsAppNotifyModalOpen] = useState(false);
  const [appNotifySettings, setAppNotifySettings] = useState<AppNotifySettings>({
    notifyOnAdd: true,
    notifyOnIncome: true,
    notifyOnEdit: true,
    notifyOnDelete: true,
    notifyOnSettle: true,
    showBalance: true,
    notifyOnShoppingAdd: true,
    notifyOnShoppingComplete: true,
    notifyOnShoppingDelete: true
  });

  const handleOpenEditShopping = (item: ShoppingItem) => {
    setShoppingForm({
      id: item.id,
      category: item.category,
      item: item.item,
      store: item.store || (shoppingStores[0] || '菜市場'),
      customStore: '',
      deadline: item.deadline || '儘快',
      customDeadline: '',
      creator: item.creator || defaultPayerName,
      status: item.status || '待購買',
      createdTime: item.createdTime || getShoppingItemDisplayTime(item) || formatAmPmTime(new Date()),
      note: item.note || ''
    });
    setIsAddShoppingOpen(true);
  };

  const handleAddShoppingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingForm.item.trim()) {
      showToast('請填寫欲購買的品項名稱！', 'error');
      return;
    }
    const finalStore = shoppingForm.store === 'custom' ? (shoppingForm.customStore.trim() || '隨意') : shoppingForm.store;
    const finalDeadline = shoppingForm.deadline === 'custom' ? (shoppingForm.customDeadline.trim() || '儘快') : shoppingForm.deadline;
    const isEdit = !!shoppingForm.id;
    const nowFormattedTime = formatAmPmTime(new Date());

    const itemObj: ShoppingItem = {
      id: shoppingForm.id || (`shop-${Date.now()}`),
      category: shoppingForm.category,
      item: shoppingForm.item.trim(),
      store: finalStore,
      deadline: finalDeadline,
      status: (shoppingForm as any).status || '待購買',
      creator: shoppingForm.creator,
      createdTime: shoppingForm.createdTime || nowFormattedTime,
      note: shoppingForm.note.trim()
    };

    setLoading(true);
    const action = isEdit ? 'updateShoppingItem' : 'addShoppingItem';
    try {
      const res = await callGasApi(action, itemObj);
      if (res && res.success) {
        if (res.createdTime || res.timeStr) {
          itemObj.createdTime = res.createdTime || res.timeStr;
        }
      } else {
        enqueueSyncItem(action, itemObj, `${isEdit ? '修改' : '新增'}採購項目：${itemObj.item}`);
      }
    } catch (err) {
      enqueueSyncItem(action, itemObj, `${isEdit ? '修改' : '新增'}採購項目：${itemObj.item}`);
    } finally {
      setLoading(false);
    }

    if (isEdit) {
      setShoppingItems(prev => prev.map(s => String(s.id) === String(itemObj.id) ? { ...s, ...itemObj } : s));
      showToast(`已成功更新採購筆記「${shoppingForm.item}」！`, 'success');
    } else {
      setShoppingItems(prev => [itemObj, ...prev]);
      showToast(`已成功新增「${shoppingForm.item}」至採購清單！`, 'success');
    }

    setIsAddShoppingOpen(false);
    setIsAddOpen(false);
    setShoppingForm({
      id: '',
      category: '需要買',
      item: '',
      store: '全聯',
      customStore: '',
      deadline: '本週',
      customDeadline: '',
      creator: defaultPayerName as any,
      status: '待購買',
      createdTime: '',
      note: ''
    });
  };

  const handleToggleShoppingStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === '已買到' ? '待購買' : '已買到';
    if (selectedShoppingDetail && String(selectedShoppingDetail.id) === String(id)) {
      setSelectedShoppingDetail({
        ...selectedShoppingDetail,
        status: newStatus as any
      });
    }

    setShoppingItems(prev => prev.map(item => String(item.id) === String(id) ? { ...item, status: newStatus as any } : item));

    try {
      const res = await callGasApi('toggleShoppingItemStatus', { id, status: newStatus });
      if (!res || !res.success) {
        enqueueSyncItem('toggleShoppingItemStatus', { id, status: newStatus }, `標記採購狀態：${id} (${newStatus})`);
      }
    } catch (err) {
      enqueueSyncItem('toggleShoppingItemStatus', { id, status: newStatus }, `標記採購狀態：${id} (${newStatus})`);
    }
    showToast(newStatus === '已買到' ? '🎉 已勾選為「已買到」！' : '已重置狀態為「待購買」！', 'success');
  };

  const handleDeleteShoppingItem = (id: string, name: string) => {
    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認要刪除此筆購物記事嗎？',
      message: `確定要刪除「${name}」這筆購物記事嗎？刪除後將無法還原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      onConfirm: async () => {
        const updated = shoppingItems.filter(item => String(item.id) !== String(id));
        setShoppingItems(updated);
        localStorage.setItem('muji_shopping_items', JSON.stringify(updated));
        showToast(`已刪除購物記事「${name}」`, 'info');

        try {
          const res = await callGasApi('deleteShoppingItem', { id });
          if (!res || !res.success) {
            enqueueSyncItem('deleteShoppingItem', { id }, `刪除採購項目：${name}`);
          }
        } catch (err) {
          enqueueSyncItem('deleteShoppingItem', { id }, `刪除採購項目：${name}`);
        }
      }
    });
  };

  const handleClearDoneShopping = async () => {
    const doneItems = shoppingItems.filter(i => i.status === '已買到');
    if (doneItems.length === 0) {
      showToast('目前沒有已買到的項目喔！', 'info');
      setIsClearDoneConfirmOpen(false);
      return;
    }

    const updated = shoppingItems.filter(i => i.status !== '已買到');
    setShoppingItems(updated);
    localStorage.setItem('muji_shopping_items', JSON.stringify(updated));
    showToast(`🎉 已一次性清空 ${doneItems.length} 項已買到的採購項目！`, 'success');
    setIsClearDoneConfirmOpen(false);

    try {
      await callGasApi('clearDoneShoppingItems');
    } catch (err) {
      console.warn('Clear done shopping items gas error:', err);
    }
  };

  // 🛍️ 一鍵將採購品項帶入轉為代墊記帳
  const handleConvertShoppingToRecord = (item: ShoppingItem) => {
    setSelectedShoppingDetail(null);
    const isCreatorB = isUserBPayer(item.creator) || (item.creator ? false : isCurrentUserPartner);
    const targetPayer = isCreatorB ? userB.name : userA.name;
    const targetSplitPayer = isCreatorB ? userB.shortName : userA.shortName;

    if (appMode === 'split') {
      setSplitAddInitialData({
        payer: targetSplitPayer,
        itemName: item.item,
        note: `從採購清單轉記帳（購買地點：${item.store || '一般'}）`
      });
      setIsSplitAddOpen(true);
    } else {
      setFormData(prev => ({
        ...prev,
        item: item.item,
        payer: targetPayer,
        type: '支出-日常代墊',
        currency: 'TWD',
        amount: ''
      }));
      setAddModalType('record');
      setIsAddOpen(true);
    }
    showToast(`已帶入「${item.item}」至記帳表單 ✍️`, 'info');
  };

  const handleAddStore = () => {
    if (!isAddStoreInput.trim()) return;
    const newName = isAddStoreInput.trim();
    if (shoppingStores.includes(newName)) {
      showToast('該商店已存在常用清單中囉！', 'info');
      return;
    }
    const updated = [...shoppingStores, newName];
    setShoppingStores(updated);
    setIsAddStoreInput('');
    saveStoresToBackend(updated);
  };

  const handleDeleteStore = (storeName: string) => {
    const updated = shoppingStores.filter(s => s !== storeName);
    setShoppingStores(updated);
    saveStoresToBackend(updated);
  };

  const saveStoresToBackend = (newStoresList: string[]) => {
    if (typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run) {
      (window as any).google.script.run
        .withSuccessHandler((res: any) => {
          if (res && res.success) showToast('常用商店清單已更新並同步至 Google 試算表！', 'success');
        })
        .saveStoresList(newStoresList);
    } else {
      localStorage.setItem('muji_shopping_stores_sandbox', JSON.stringify(newStoresList));
      showToast('[沙盒] 常用商店清單已更新！', 'success');
    }
  };

  // 載入當前使用者的個人化通知設定
  useEffect(() => {
    if (currentUser?.email) {
      const userSettings = getUserNotifySettings(currentUser.email);
      if (userSettings) {
        setAppNotifySettings(userSettings);
      }
    } else {
      const savedNotifySettings = localStorage.getItem('banban_app_notify_settings');
      if (savedNotifySettings) {
        try {
          const parsed = JSON.parse(savedNotifySettings);
          setAppNotifySettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    }

    fetchShoppingData();
  }, [gasWebUrl, currentUser?.email]);

  const saveAppNotifySettings = (newSettings: AppNotifySettings) => {
    setAppNotifySettings(newSettings);
    if (currentUser?.email) {
      saveUserNotifySettings(currentUser.email, newSettings);
    } else {
      try {
        localStorage.setItem('banban_app_notify_settings', JSON.stringify(newSettings));
        localStorage.setItem('muji_notification_settings', JSON.stringify(newSettings));
      } catch (e) {}
    }
  };

  const toggleAppNotifySetting = (key: keyof AppNotifySettings) => {
    const updated = {
      ...appNotifySettings,
      [key]: !appNotifySettings[key]
    };
    saveAppNotifySettings(updated);
  };

  const setAllAppNotifySettings = (enableAll: boolean) => {
    const updated: AppNotifySettings = {
      notifyOnAdd: enableAll,
      notifyOnIncome: enableAll,
      notifyOnEdit: enableAll,
      notifyOnDelete: enableAll,
      notifyOnSettle: enableAll,
      showBalance: enableAll,
      notifyOnShoppingAdd: enableAll,
      notifyOnShoppingComplete: enableAll,
      notifyOnShoppingDelete: enableAll
    };
    saveAppNotifySettings(updated);
    showToast(enableAll ? '已開啟所有 App 內建即時通知項目！' : '已關閉所有 App 內建即時通知項目！', 'info');
  };

  const handleTestInAppNotify = () => {
    addNotificationAndSave(
      '🌸 伴伴記即時通知測試',
      '這是一則 App 內建即時通知！當您記帳、代墊、結算或新增購物清單時，都會立即在此收到通知。',
      'system'
    );
    sendNativeNotification({
      title: '🌸 伴伴記即時通知測試',
      body: '這是一則 App 內建原生推播！當伴侶記帳、代墊或更新採購清單時，手機都會立即收到通知。',
      playSound: true
    });
    showToast('🔔 已發送測試通知至通知中心與手機系統！', 'success');
  };

  const handleUndoCommandItem = async (actionData?: { id?: string | number; type: 'income' | 'expense' | 'shopping' }): Promise<boolean> => {
    if (!actionData || !actionData.id) {
      showToast('此項目無法復原或未找到對應識別碼', 'info');
      return false;
    }
    const { id, type } = actionData;
    if (type === 'income') {
      const target = records.find(r => String(r.id) === String(id));
      const updated = records.filter(r => String(r.id) !== String(id));
      setRecords(updated);
      saveRecordsToLocal(updated);
      if (gasWebUrl) {
        callGasApi('deleteRecordByRow', { id, rowId: id });
      }
      showToast(`已撤回/刪除公積金存入紀錄「${target?.item || ''}」`, 'success');
      return true;
    } else if (type === 'expense') {
      const target = splitItems.find(i => String(i.id) === String(id));
      const updated = splitItems.filter(i => String(i.id) !== String(id));
      setSplitItems(updated);
      calculateLocalSplitSummary(updated);
      try {
        localStorage.setItem('banban_split_records', JSON.stringify(updated));
      } catch (e) {}
      if (gasWebUrl) {
        callGasApi('deleteSplitRecord', { id });
      }
      showToast(`已撤回/刪除代墊紀錄「${target?.itemName || ''}」`, 'success');
      return true;
    } else if (type === 'shopping') {
      const target = shoppingItems.find(i => String(i.id) === String(id));
      const updated = shoppingItems.filter(i => String(i.id) !== String(id));
      setShoppingItems(updated);
      try {
        localStorage.setItem('muji_shopping_items_cache', JSON.stringify(updated));
      } catch (e) {}
      if (gasWebUrl) {
        callGasApi('deleteShoppingItem', { id });
      }
      showToast(`已撤回/移除購物清單品項「${target?.item || ''}」`, 'success');
      return true;
    }
    return false;
  };

  const handleExecuteSmartCommand = async (command: string): Promise<SmartCommandResult> => {
    let text = command.trim();
    if (!text) {
      return {
        success: false,
        type: 'error',
        replyText: `請輸入或說出記帳指令（例如：${userA.shortName} 1200 晚餐、存 10000 薪資、需要買 鮮奶 全聯）`
      };
    }

    // 清理常見語音贅字與標點符號
    text = text.replace(/[，。！？、,!?;]/g, ' ').replace(/\s+/g, ' ').trim();

    // 0. 查看今日即時通知
    if (/^(通知|今日通知|查通知|查看通知|訊息|即時通知|最新通知)$/i.test(text)) {
      if (notifications.length === 0) {
        return {
          success: true,
          type: 'notification',
          replyText: '🔔 **今日即時通知中心**\n\n今日尚無任何即時通知紀錄。\n（系統會在每日午夜自動歸檔重置）'
        };
      }
      const unreadCount = notifications.filter(n => !n.read).length;
      const listText = notifications.slice(0, 6).map((n, idx) => {
        let icon = '🔔';
        if (n.type === 'expense') icon = '💳';
        else if (n.type === 'income') icon = '💰';
        else if (n.type === 'settle') icon = '⚖️';
        else if (n.type === 'delete') icon = '🗑️';
        else if (n.type === 'system') icon = '🛒';
        return `${idx + 1}. ${icon} [${formatAmPmTime(n.time)}] **${n.title}**\n   ${n.desc}`;
      }).join('\n\n');

      return {
        success: true,
        type: 'notification',
        replyText: `🔔 **今日即時通知（共 ${notifications.length} 則，${unreadCount} 則未讀）**\n\n${listText}`
      };
    }

    // 0. 今日通知快速指令
    if (/^(今日通知|通知|查看通知|查通知|訊息)$/i.test(text)) {
      const unreadCount = notifications.filter(n => !n.read).length;
      const recentNotifs = notifications.slice(0, 5);
      
      return {
        success: true,
        type: 'notification',
        replyText: `🔔 **今日即時通知（共 ${notifications.length} 則，${unreadCount} 則未讀）**`,
        cardData: {
          categoryBadge: '🔔 今日即時通知摘要',
          tagPill: `${unreadCount} 則未讀`,
          highlightTitle: '今日累積通知',
          highlightValue: `共 ${notifications.length} 則`,
          highlightSub: unreadCount > 0 ? `有 ${unreadCount} 則新訊息待關注` : '所有通知皆已即時同步',
          items: recentNotifs.length > 0 ? recentNotifs.map(n => ({
            label: n.title,
            value: n.desc
          })) : [
            { label: '通知狀態', value: '今日尚無新推播通知' }
          ],
          footerNote: '💡 點擊上方推播開關可自由調整通知項目'
        }
      };
    }

    // 1. 即時查帳 / 狀態查詢
    if (/^(查|查詢|查帳|查代墊|誰欠誰|結算|結餘|餘額|現況|狀況)$/i.test(text)) {
      const summaryMsg = splitSummary.summaryText || '目前雙方已結清，無待還款款項';
      showToast(`📊 ${summaryMsg}`, 'info');

      // 計算公積金最新結存
      const curIncome = records.filter(r => r.type === '收入-固定公積金' || r.type.includes('收入') || r.type.includes('公積金') || r.type.includes('注資')).reduce((s, r) => s + r.amount, 0);
      const curDisbursed = records.filter(r => (r.type.includes('支出') || r.type.includes('代墊')) && isMonthReconciled(r.month, reconciledMonths)).reduce((s, r) => s + r.amount, 0);
      const curPending = records.filter(r => (r.type.includes('支出') || r.type.includes('代墊')) && !isMonthReconciled(r.month, reconciledMonths)).reduce((s, r) => s + r.amount, 0);
      const curBalance = curIncome - curDisbursed;
      const curQuota = curBalance - curPending;

      return {
        success: true,
        type: 'query',
        replyText: `📊 **即時對帳與帳務摘要**\n\n• **代墊結算**：${summaryMsg}\n• **待核銷筆數**：共 ${splitSummary.unsettledCount} 筆\n• **公積金結餘**：NT$ ${curBalance.toLocaleString()} 元\n• **當月預計銷帳前額度**：NT$ ${curQuota.toLocaleString()} 元`,
        cardData: {
          categoryBadge: '📊 即時對帳摘要',
          tagPill: '即時結算',
          highlightTitle: '代墊結算現況',
          highlightValue: summaryMsg,
          highlightSub: `待核銷代墊共 ${splitSummary.unsettledCount} 筆`,
          items: [
            { label: '待核銷筆數', value: `共 ${splitSummary.unsettledCount} 筆` },
            { label: '公積金總結餘', value: `NT$ ${curBalance.toLocaleString()} 元`, isHighlight: true },
            { label: '當月預估銷帳前剩餘', value: `NT$ ${curQuota.toLocaleString()} 元` }
          ],
          footerNote: '💡 可隨時至「代墊分頁」查看明細或進行一鍵清帳平帳。'
        }
      };
    }

    // 數字正規化（支援「一萬」、「五千」等口語中文數字）
    let normalized = text
      .replace(/(\d+),(\d+)/g, '$1$2')
      .replace(/一萬/g, '10000')
      .replace(/兩萬/g, '20000')
      .replace(/三萬/g, '30000')
      .replace(/五千/g, '5000')
      .replace(/三千/g, '3000')
      .replace(/兩千/g, '2000')
      .replace(/一千/g, '1000')
      .replace(/五百/g, '500')
      .replace(/兩百/g, '200')
      .replace(/一百/g, '100');

    // 構建成員名稱的正則匹配模式 (動態相容預設名、暱稱與身分)
    const userANames = Array.from(new Set(['廖', '尹丞', userA.shortName, userA.displayName, userA.name].filter(Boolean))).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const userBNames = Array.from(new Set(['周', '沛緹', userB.shortName, userB.displayName, userB.name].filter(Boolean))).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const allNamesPattern = [...userANames, ...userBNames].join('|');

    const isUserBName = (k?: string) => {
      if (!k) return false;
      const clean = k.trim();
      return clean === '周' || clean === '沛緹' || clean === userB.name || clean === userB.displayName || clean === userB.shortName;
    };

    // 2. 存入公積金 / 固定收入 (例如: "存 10000 薪資", "廖 存 5000", "存入公積金 3000")
    const incRegex1 = new RegExp(`^(?:存入|存|公積金|入帳|轉入|收入)\\s*(${allNamesPattern})?\\s*([0-9\\.]+)\\s*(?:元|塊|NT|NTD)?\\s*(.*)$`, 'i');
    const incRegex2 = new RegExp(`^(${allNamesPattern})\\s*(?:存入|存|入帳)\\s*([0-9\\.]+)\\s*(?:元|塊|NT|NTD)?\\s*(.*)$`, 'i');
    const incRegex3 = new RegExp(`^(${allNamesPattern})?(?:存入|存)\\s*([0-9\\.]+)\\s*(?:元|塊)?\\s*(.*)$`, 'i');
    const incMatch = normalized.match(incRegex1) || normalized.match(incRegex2) || normalized.match(incRegex3);
    if (incMatch) {
      const payerKey = incMatch[1];
      const amt = parseFloat(incMatch[2]) || 0;
      const desc = incMatch[3]?.trim() || '公積金存入';
      const payerName = payerKey ? (isUserBName(payerKey) ? userB.name : userA.name) : (currentUserPersona?.name || userA.name);

      if (amt > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const monthStr = todayStr.substring(0, 7);
        const recordData: RecordItem = {
          id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          month: monthStr,
          date: todayStr,
          item: desc,
          payer: payerName,
          amount: amt,
          type: '收入-固定公積金',
          timestamp: formatAmPmTime(new Date())
        };
        const updated = [recordData, ...records];
        setRecords(updated);
        saveRecordsToLocal(updated);
        if (gasWebUrl) {
          callGasApi('addRecord', recordData);
        }
        addNotificationAndSave(
          '💰 公積金存入成功',
          `${payerName} 存入「${desc}」NT$ ${amt.toLocaleString()} 元`,
          'income',
          true // skipChatPush: true (避免在聊天室重複推播，由指令回傳精美卡片)
        );
        showToast(`已成功記錄公積金存入 NT$ ${amt.toLocaleString()}`, 'success');
        const curIncome = updated.filter(r => r.type === '收入-固定公積金' || r.type.includes('收入') || r.type.includes('公積金') || r.type.includes('注資')).reduce((s, r) => s + r.amount, 0);
        const curDisbursed = updated.filter(r => (r.type.includes('支出') || r.type.includes('代墊')) && isMonthReconciled(r.month, reconciledMonths)).reduce((s, r) => s + r.amount, 0);
        const newBalance = curIncome - curDisbursed;
        return {
          success: true,
          type: 'income',
          data: { id: recordData.id, type: 'income' },
          replyText: `💰 **公積金存入成功！**\n\n• **存入者**：${payerName}\n• **用途項目**：${desc}\n• **存入金額**：NT$ ${amt.toLocaleString()} 元\n• **公積金最新總結餘**：NT$ ${newBalance.toLocaleString()} 元`,
          cardData: {
            categoryBadge: '💰 公積金存入成功',
            tagPill: '已入帳',
            highlightTitle: desc,
            highlightValue: `+ NT$ ${amt.toLocaleString()}`,
            highlightSub: `存入者：${payerName}`,
            items: [
              { label: '存入者', value: payerName },
              { label: '款項用途', value: desc },
              { label: '公積金總結餘', value: `NT$ ${newBalance.toLocaleString()} 元`, isHighlight: true }
            ],
            footerNote: '✨ 已自動同步至收支明細看板與 Google 試算表。'
          }
        };
      }
    }

    // 3. 代墊支出指令 (例如: "廖 1200 晚餐", "周 85 飲料", "廖代墊晚餐1200", "周買了珍奶85元")
    const expRegex1 = new RegExp(`^(${allNamesPattern})\\s*([0-9\\.]+)\\s*(?:元|塊|NT|NTD)?\\s*(.*)$`, 'i');
    const expRegex2 = new RegExp(`^(${allNamesPattern})\\s*(?:代墊了|代墊|付了|付|買了|買)\\s*(.*?)\\s*([0-9\\.]+)\\s*(?:元|塊|NT|NTD)?$`, 'i');
    const expRegex3 = new RegExp(`^(${allNamesPattern})\\s*(?:代墊了|代墊|付了|付|買了|買)\\s*([0-9\\.]+)\\s*(?:元|塊|NT|NTD)?\\s*(.*)$`, 'i');
    const expRegex4 = new RegExp(`^(?:代墊|支出)\\s*(${allNamesPattern})\\s*([0-9\\.]+)\\s*(?:元|塊|NT|NTD)?\\s*(.*)$`, 'i');
    const expMatch = normalized.match(expRegex1) || normalized.match(expRegex2) || normalized.match(expRegex3) || normalized.match(expRegex4);
    if (expMatch) {
      let payerKey = expMatch[1];
      let amt = 0;
      let desc = '';

      if (/^\d+(\.\d+)?$/.test(expMatch[2])) {
        amt = parseFloat(expMatch[2]);
        desc = expMatch[3]?.trim() || '日常代墊';
      } else {
        desc = expMatch[2]?.trim() || '日常代墊';
        amt = parseFloat(expMatch[3]) || 0;
      }

      const isPayerB = isUserBName(payerKey);
      const payer: string = isPayerB ? userB.shortName : userA.shortName;
      const debtorAmt = Math.round(amt / 2);
      const payerDisp = isPayerB ? userB.displayName : userA.displayName;
      const otherDisp = isPayerB ? userA.displayName : userB.displayName;

      if (amt > 0) {
        const createdSplit = await handleAddSplitRecord({
          payer: payer,
          splitMode: 'AA平分',
          itemName: desc,
          totalAmount: amt,
          customOweAmount: debtorAmt,
          note: 'App 智慧指令快捷建立'
        });
        addNotificationAndSave(
          '💳 代墊記帳成功',
          `${payerDisp} 代墊「${desc}」NT$ ${amt.toLocaleString()}（對方應返還 $${debtorAmt.toLocaleString()}）`,
          'expense',
          true // skipChatPush: true
        );
        return {
          success: true,
          type: 'expense',
          data: { id: createdSplit?.id, type: 'expense' },
          replyText: `💳 **代墊記帳成功！**\n\n• **代墊人**：${payerDisp}\n• **消費項目**：${desc}\n• **總金額**：NT$ ${amt.toLocaleString()} 元\n• **分帳模式**：AA 平分（${otherDisp} 應返還 $${debtorAmt.toLocaleString()}）`,
          cardData: {
            categoryBadge: '💳 代墊記帳成功',
            tagPill: 'AA 平分',
            highlightTitle: desc,
            highlightValue: `NT$ ${amt.toLocaleString()}`,
            highlightSub: `${payerDisp} 先墊付 • ${otherDisp} 應返還 NT$ ${debtorAmt.toLocaleString()}`,
            items: [
              { label: '代墊人', value: payerDisp },
              { label: '分攤模式', value: `AA 平分（各半）` },
              { label: '應返還款', value: `NT$ ${debtorAmt.toLocaleString()} 元`, isHighlight: true },
              { label: '最新對帳現況', value: splitSummary.summaryText || '已更新代墊看板' }
            ],
            footerNote: '✨ 已自動記錄至代墊分頁與對帳看板。'
          }
        };
      }
    }

    // 4. 購物清單指令 (例如: "買 全聯 鮮奶" or "想要 PS5" or "需要買 衛生紙")
    if (/^(買|需要買|需要|想要買|想要|觀望)/.test(text)) {
      let category: '需要買' | '想要買' = '需要買';
      let clean = text;
      if (/^(想要買|想要|觀望)/.test(text)) {
        category = '想要買';
        clean = text.replace(/^(想要買|想要|觀望)\s*/, '');
      } else {
        clean = text.replace(/^(買|需要買|需要)\s*/, '');
      }

      const parts = clean.split(/[\s，,]+/);
      let storeName = shoppingStores[0] || '菜市場';
      let itemName = parts[0] || '';

      if (parts.length >= 2) {
        if (shoppingStores.includes(parts[0])) {
          storeName = parts[0];
          itemName = parts.slice(1).join(' ');
        } else {
          itemName = parts[0];
          storeName = parts[1];
        }
      }

      if (itemName) {
        const newItem: ShoppingItem = {
          id: 'shop-' + Date.now(),
          category: category,
          item: itemName,
          store: storeName,
          deadline: '儘快',
          status: '待購買',
          creator: (currentUserPersona?.name || defaultPayerName) as any,
          createdTime: formatAmPmTime(new Date()),
          note: 'App 智慧指令快捷新增'
        };
        const updated = [newItem, ...shoppingItems];
        setShoppingItems(updated);
        try {
          localStorage.setItem('muji_shopping_items_cache', JSON.stringify(updated));
        } catch (e) {}
        addNotificationAndSave(
          '🛒 購物清單新增',
          `[${category}] ${itemName}（地點：${storeName}）`,
          'system',
          true // skipChatPush: true
        );
        showToast(`已加入購物清單：${itemName}`, 'success');
        if (gasWebUrl) {
          callGasApi('addShoppingItem', newItem);
        }
        return {
          success: true,
          type: 'shopping',
          data: { id: newItem.id, type: 'shopping' },
          replyText: `🛒 **已成功加入購物清單！**\n\n• **清單類別**：[${category}]\n• **購買品項**：${itemName}\n• **預計地點**：${storeName}`,
          cardData: {
            categoryBadge: '🛒 購物清單已新增',
            tagPill: `[${category}]`,
            highlightTitle: itemName,
            highlightValue: storeName,
            highlightSub: `採購時限：儘快 • 狀態：待購買`,
            items: [
              { label: '清單類別', value: category },
              { label: '欲購品項', value: itemName },
              { label: '預計採購地點', value: storeName },
              { label: '當前狀態', value: '待購買（可至購物記事勾選）' }
            ],
            footerNote: '✨ 已同步至雙方共享的購物記事清單。'
          }
        };
      }
    }

    showToast('未能辨識指令格式，請參考小秘書範例', 'error');
    return {
      success: false,
      type: 'error',
      replyText: `⚠️ **未能辨識指令格式**\n\n您可以直接輸入或說出：\n• **「${userA.shortName} 1200 晚餐」** 👉 記錄${userA.displayName}代墊\n• **「${userB.shortName} 85 珍奶」** 👉 記錄${userB.displayName}代墊\n• **「存 10000 薪資」** 👉 記錄公積金存入\n• **「需要買 鮮奶 全聯」** 👉 加入購物清單\n• **「查代墊」** 👉 查看最新欠款對帳\n• **「今日通知」** 👉 檢視今日即時通知`
    };
  };
// ------------------- 自訂雙鍵對話確認 Modal -------------------
  const [customConfirmState, setCustomConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const handleSyncClick = () => {
    openUnifiedDatabaseModal('settings');
  };

  // 初始化與本機 LocalStorage 綁定
  useEffect(() => {
    // 1. 載入對帳流水帳紀錄
    const isGuest = localStorage.getItem('banban_is_guest_mode') === 'true';
    const authUser = localStorage.getItem('banban_auth_user');
    const isSandbox = localStorage.getItem('banban_is_sandbox_mode') === 'true';

    // 訪客模式或未登入（且非沙盒測試模式）：強制數值全部歸零
    if (isGuest || (!authUser && !isSandbox)) {
      setRecords([]);
      setSettlementMonth('');
      setReconciledMonths([]);
      return;
    }

    // 🛠️ DEV 沙盒模式：嚴格只載入沙盒專屬測試資料，絕不讀取或覆寫真實 Google 使用者之 muji_ledger_data
    if (isSandbox) {
      const sandboxSaved = localStorage.getItem('banban_dev_sandbox_records');
      if (sandboxSaved) {
        try {
          const parsed = JSON.parse(sandboxSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecords(parsed);
            setSettlementMonth(parsed[0]?.month || '2026-06');
            return;
          }
        } catch (e) {}
      }
      setRecords(INITIAL_RECORDS);
      setSettlementMonth('2026-06');
      return;
    }

    let cleanEmail = '';
    if (authUser) {
      try {
        const parsed = JSON.parse(authUser);
        cleanEmail = (parsed.email || '').trim().toLowerCase();
      } catch (e) {}
    }

    // 🚀 在讀取 localStorage 前先檢查 banban_sync_version 版本號
    const userSyncVersion = cleanEmail ? localStorage.getItem(`banban_sync_version_${cleanEmail}`) : null;
    const syncVersion = userSyncVersion || localStorage.getItem('banban_sync_version');
    const isOutdated = isSyncVersionOutdated(syncVersion, APP_VERSION);

    if (isOutdated) {
      // 偵測到版本號落後，不載入本地舊緩存，優先強制自雲端抓取
      setRecords([]);
      setSettlementMonth('');
      fetchDashboardData(false, false);
      return;
    }

    const userSaved = cleanEmail ? localStorage.getItem(`muji_ledger_data_${cleanEmail}`) : null;
    const saved = userSaved || localStorage.getItem('muji_ledger_data');
    let loadedRecords: RecordItem[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // 防呆與舊資料遷移：確保每條紀錄都有 date
          const migrated = parsed.map((r: any) => {
            let mStr = String(r.month || '').trim();
            if (!/^\d{4}-\d{2}$/.test(mStr)) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(mStr)) {
                mStr = mStr.substring(0, 7);
              } else {
                const d = new Date(mStr);
                if (!isNaN(d.getTime())) {
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  mStr = `${year}-${month}`;
                }
              }
            }
            return {
              ...r,
              month: mStr,
              date: r.date || `${mStr}-01`
            };
          });
          loadedRecords = migrated;
          setRecords(migrated);
          
          // 預設結算對帳月份為最新一筆的月份
          if (migrated.length > 0) {
            const uniqueMonths = Array.from(new Set(migrated.map((r: any) => r.month))).sort((a: any, b: any) => b.localeCompare(a));
            if (uniqueMonths.length > 0) {
              setSettlementMonth(uniqueMonths[0] as string);
            }
          }
        }
      } catch (err) {
        setRecords([]);
        setSettlementMonth('');
      }
    } else {
      setRecords([]);
      setSettlementMonth('');
    }

    // 2. 載入已核銷月份
    const savedReconciled = cleanEmail ? localStorage.getItem(`muji_reconciled_months_${cleanEmail}`) : null;
    const globalReconciled = savedReconciled || localStorage.getItem('muji_reconciled_months');
    if (globalReconciled) {
      try {
        setReconciledMonths(JSON.parse(globalReconciled));
      } catch (e) {
        setReconciledMonths([]);
      }
    }

    // 3. 載入通知紀錄（僅保留「當天」通知，隔天自動全數清除歸零，並徹底清理沙盒模擬假通知）
    const getTodayDateStr = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    };

    const currentTodayStr = getTodayDateStr();
    const lastNotifDay = localStorage.getItem('muji_notification_day');
    const isMockPurged = localStorage.getItem('muji_mock_sandbox_cleared_v2');
    const savedNotifications = localStorage.getItem('muji_notifications');
    let initialLoadedNotifs: AppNotification[] = [];

    // 若未清除過舊沙盒殘留資料，或跨日（存檔日期與今天不同），直接全數清空歸零
    if (!isMockPurged || (lastNotifDay && lastNotifDay !== currentTodayStr)) {
      initialLoadedNotifs = [];
      localStorage.setItem('muji_notifications', JSON.stringify([]));
      localStorage.setItem('muji_mock_sandbox_cleared_v2', 'true');
    } else if (savedNotifications) {
      try {
        const parsedNotifs: AppNotification[] = JSON.parse(savedNotifications);
        // 嚴格過濾出今天 (Local Date) 的通知，且排除舊版模擬隨機假項目
        initialLoadedNotifs = parsedNotifs.filter(n => {
          if (!isTodayNotification(n.timestamp || n.time)) return false;
          const text = `${n.title || ''} ${n.desc || ''}`;
          if (text.includes('全家便利商店買零食') || text.includes('蝦皮公共小拖鞋') || text.includes('家樂福公共垃圾袋') || text.includes('美廉社採買牛奶飲料')) {
            return false;
          }
          return true;
        });
      } catch (e) {
        initialLoadedNotifs = [];
      }
    } else {
      initialLoadedNotifs = [];
    }
    
    setNotifications(initialLoadedNotifs);
    localStorage.setItem('muji_notifications', JSON.stringify(initialLoadedNotifs));
    localStorage.setItem('muji_notification_day', currentTodayStr);

    // 4. 載入通知偏好設定
    const savedSettings = localStorage.getItem('muji_notification_settings');
    if (savedSettings) {
      try {
        setNotifySettings(JSON.parse(savedSettings));
      } catch (e) {
        // Use default values
      }
    }

    }, []);

  // 🕒 跨日自動清理機制：精準在每日午夜 00:00:00 與視窗喚醒時自動清空昨日所有通知與紅點
  useEffect(() => {
    const getTodayDateStr = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    };

    const cleanNonTodayNotifications = () => {
      const todayStr = getTodayDateStr();
      const lastDay = localStorage.getItem('muji_notification_day');

      if (lastDay && lastDay !== todayStr) {
        setNotifications([]);
        localStorage.setItem('muji_notifications', JSON.stringify([]));
        localStorage.setItem('muji_notification_day', todayStr);
        return;
      }
      localStorage.setItem('muji_notification_day', todayStr);

      setNotifications(prev => {
        const todayNotifs = prev.filter(n => isTodayNotification(n.timestamp || n.time));
        if (todayNotifs.length !== prev.length) {
          localStorage.setItem('muji_notifications', JSON.stringify(todayNotifs));
          return todayNotifs;
        }
        return prev;
      });
    };

    // 1. 每 10 秒排程快速比對換日狀態
    const intervalTimer = setInterval(cleanNonTodayNotifications, 10000);

    // 2. 精準排程午夜 (00:00:00) 換日歸零觸發器
    let midnightTimeoutId: any = null;
    const scheduleMidnightClean = () => {
      const now = new Date();
      const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 100);
      const msUntilMidnight = Math.max(1000, tomorrowMidnight.getTime() - now.getTime());
      
      midnightTimeoutId = setTimeout(() => {
        cleanNonTodayNotifications();
        scheduleMidnightClean();
      }, msUntilMidnight);
    };
    scheduleMidnightClean();

    // 3. 使用者切換分頁、解鎖手機或視窗重新聚焦時立即檢查
    const onVisibilityOrFocus = () => cleanNonTodayNotifications();
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      clearInterval(intervalTimer);
      if (midnightTimeoutId) clearTimeout(midnightTimeoutId);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, []);

  // 在初始化載入完之後，延遲一秒將 isAppLoaded 設為 true，此後的新增才觸發推播
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 📱 支援由螢幕最左邊緣向右滑動手勢以喚出側邊設定選單
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isEdgeStart = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      // 僅當觸控起點位於螢幕最左邊緣 (<= 35px)
      isEdgeStart = startX <= 35;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeStart || e.changedTouches.length !== 1) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = Math.abs(endY - startY);

      // 由左往右滑動超過 40px，且垂直偏移小於 60px
      if (diffX > 40 && diffY < 60) {
        setIsUnifiedSettingsModalOpen(true);
      }
      isEdgeStart = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 判斷此通知是否為發給當前使用者的（由伴侶或系統發送：我記帳對方收到通知，他記帳我的手機收到通知）
  const isIncomingNotification = (n: AppNotification) => {
    return isIncomingFromPartner(n, currentUser);
  };

  const incomingUnreadCount = notifications.filter(n => !n.read && isIncomingNotification(n)).length;

  const addNotificationAndSave = (
    title: string,
    desc: string,
    type: 'expense' | 'income' | 'system' | 'delete' | 'settle',
    skipChatPush: boolean = false,
    meta?: {
      actorEmail?: string;
      actorName?: string;
      actorRole?: '廖' | '周' | string;
      targetEmail?: string;
      targetRole?: '廖' | '周' | string;
    }
  ) => {
    if (!notifyEnabled && type !== 'system') return;
    if (type === 'expense') {
      if (!appNotifySettings.notifyOnAdd) return;
    }
    if (type === 'income') {
      if (!appNotifySettings.notifyOnIncome) return;
    }
    if (type === 'delete') {
      if (!appNotifySettings.notifyOnDelete) return;
    }
    if (type === 'settle') {
      if (!appNotifySettings.notifyOnSettle) return;
    }

    const actorEmail = meta?.actorEmail || currentUser?.email || '';
    const actorName = meta?.actorName || currentUser?.nickname || currentUser?.name || currentUserPersona?.displayName || userA.displayName;
    const actorRole = meta?.actorRole || currentUser?.role || currentUserPersona?.shortName || (currentUser?.userRole === 'partner' ? userB.shortName : userA.shortName);
    const targetRole = meta?.targetRole || (actorRole === userA.shortName ? userB.shortName : userA.shortName);
    const targetEmail = meta?.targetEmail || currentUser?.partnerEmail || '';

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + Math.random().toString(36).substring(2, 7),
      title,
      desc,
      time: timeStr,
      read: false,
      type,
      timestamp: Date.now(),
      actorEmail,
      actorName,
      actorRole,
      targetEmail,
      targetRole
    };

    setNotifications(prev => {
      // 僅保留今日通知 + 新增的通知
      const todayPrev = prev.filter(n => isTodayNotification(n.timestamp || n.time));
      const updated = [newNotif, ...todayPrev];
      try {
        localStorage.setItem('muji_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 發送手機原生系統推播與輕柔提示音 (若使用者已授權)
    sendNativeNotification({
      title,
      body: desc,
      tag: newNotif.id,
      playSound: true
    }).catch(() => {});

    // 若非聊天室直接觸發的指令（例如來自代墊表單、存入彈窗或結算按鈕），則非同步推播單一通知卡片至聊天訊息中
    if (!skipChatPush) {
      setTimeout(() => {
        try {
          const savedMsgsRaw = localStorage.getItem('banban_chat_messages');
          const savedMsgs = savedMsgsRaw ? JSON.parse(savedMsgsRaw) : [];
          const notifMsg = {
            id: `notif-msg-${newNotif.id}`,
            sender: 'assistant' as const,
            text: desc,
            timestamp: formatAmPmTime(timeStr),
            type: type === 'system' ? ('notification' as const) : type,
            meta: {
              title,
              desc,
              time: timeStr,
              isNotificationCard: true
            }
          };
          const updatedMsgs = [...savedMsgs, notifMsg];
          localStorage.setItem('banban_chat_messages', JSON.stringify(updatedMsgs.slice(-50)));
          window.dispatchEvent(new CustomEvent('banban:new_chat_message', { detail: notifMsg }));
        } catch (err) {}
      }, 0);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('已將所有通知標示為已讀', 'success');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('muji_notifications', JSON.stringify(updated));
      return updated;
    });
    showToast('已刪除該通知', 'info');
  };

  const clearAllTodayNotifications = () => {
    setNotifications([]);
    localStorage.setItem('muji_notifications', JSON.stringify([]));
    showToast('已清空今日通知', 'info');
  };

  const saveNotifySettings = (newSettings: typeof notifySettings) => {
    setNotifySettings(newSettings);
    localStorage.setItem('muji_notification_settings', JSON.stringify(newSettings));
    showToast('通知設定已儲存', 'success');
  };

  // 儲存已核銷月份到本機
  const saveReconciledToLocal = (newReconciled: string[]) => {
    setReconciledMonths(newReconciled);
    const cleanEmail = (currentUser?.email || '').trim().toLowerCase();
    if (isSandboxMode) {
      try {
        localStorage.setItem('banban_dev_sandbox_reconciled_months', JSON.stringify(newReconciled));
      } catch (e) {}
    } else {
      try {
        localStorage.setItem('muji_reconciled_months', JSON.stringify(newReconciled));
        if (cleanEmail) {
          localStorage.setItem(`muji_reconciled_months_${cleanEmail}`, JSON.stringify(newReconciled));
        }
      } catch (e) {}
    }
  };

  // 變更並同步月份核銷/結清狀態至 Google 試算表與本機
  const handleToggleMonthReconciled = async (targetMonth: string) => {
    if (!targetMonth) return;
    const isReconciled = isMonthReconciled(targetMonth, reconciledMonths);
    const nextState = !isReconciled;
    let updated: string[];

    if (isReconciled) {
      updated = reconciledMonths.filter(m => normalizeMonth(m) !== normalizeMonth(targetMonth));
      showToast(`${targetMonth} 月份已更改為：待核銷狀態`, 'info');
      addNotificationAndSave(
        `⚠️ 有帳目需重啟核對：${targetMonth} 變更為「待核銷」`,
        `已撤銷了 ${targetMonth} 月份的對帳結清狀態，請雙方主動重啟明細之覆核。`,
        'settle'
      );
    } else {
      updated = [...reconciledMonths.filter(m => normalizeMonth(m) !== normalizeMonth(targetMonth)), targetMonth];
      showToast(`${targetMonth} 月份已成功核銷結清！`, 'success');
      addNotificationAndSave(
        `✅ ${targetMonth} 月份對帳成功核銷`,
        `本月公積金撥款與日常代墊已全數核對完畢，狀態已更新為「已核銷結清」。`,
        'settle'
      );
    }

    saveReconciledToLocal(updated);

    // 🚀 同步至 Google 試算表「月度核銷狀態」工作表
    try {
      const res = await callGasApi('setMonthReconciled', {
        month: targetMonth,
        isReconciled: nextState
      });
      if (res && res.success) {
        if (Array.isArray(res.reconciledMonths)) {
          saveReconciledToLocal(res.reconciledMonths);
        }
      }
    } catch (e) {
      console.warn('Sync month reconciliation to Google Sheets failed:', e);
    }
  };

  // 儲存至本機
  const saveRecordsToLocal = (newRecords: RecordItem[]) => {
    setRecords(newRecords);
    const cleanEmail = (currentUser?.email || '').trim().toLowerCase();
    if (isSandboxMode) {
      try {
        localStorage.setItem('banban_dev_sandbox_records', JSON.stringify(newRecords));
      } catch (e) {}
    } else {
      try {
        localStorage.setItem('muji_ledger_data', JSON.stringify(newRecords));
        if (cleanEmail) {
          localStorage.setItem(`muji_ledger_data_${cleanEmail}`, JSON.stringify(newRecords));
        }
      } catch (e) {}
    }
  };

  // 觸發置中動畫 HUD Toast 通知 (快速動畫打勾，自動於 1.6 秒後淡出)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 1600) => {
    if (isInitialSyncing) return;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type, duration });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  };

  // 表單送出處理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) {
      showToast('請輸入款項項目名稱', 'error');
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('款項金額必須是正數或大於 0 的數值', 'error');
      return;
    }
    const selectedCurrency = formData.currency || 'TWD';
    const effectiveRate = selectedCurrency === 'TWD'
      ? 1
      : (parseFloat(formData.customRate) || exchangeRates[selectedCurrency] || DEFAULT_RATES_MAP[selectedCurrency] || 1);
    const twdAmount = selectedCurrency === 'TWD' ? numAmount : Math.round(numAmount * effectiveRate);
    const selectedDateStr = formData.date || new Date().toISOString().split('T')[0];
    const monthStr = selectedDateStr.substring(0, 7);
    const nowObj = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const mockTimestamp = `${nowObj.getFullYear()}-${pad(nowObj.getMonth() + 1)}-${pad(nowObj.getDate())} ${pad(nowObj.getHours())}:${pad(nowObj.getMinutes())}:${pad(nowObj.getSeconds())}`;

    const recordData: RecordItem = {
      id: editingRecord ? editingRecord.id : ('rec_' + Date.now() + '_' + Math.floor(Math.random() * 10000)),
      month: monthStr,
      date: selectedDateStr,
      item: formData.item.trim(),
      payer: formData.payer,
      amount: twdAmount,
      type: formData.type,
      timestamp: mockTimestamp,
      currency: selectedCurrency,
      originalAmount: numAmount,
      exchangeRate: Number(effectiveRate.toFixed(4))
    };

    setLoading(true);

    if (editingRecord) {
      // 編輯既有項目
      try {
        const res = await callGasApi('updateRecordByRow', recordData);
        if (!res || !res.success) {
          enqueueSyncItem('updateRecordByRow', recordData, `修改對帳紀錄：${recordData.item} ($${recordData.amount})`);
        }
      } catch (err) {
        enqueueSyncItem('updateRecordByRow', recordData, `修改對帳紀錄：${recordData.item} ($${recordData.amount})`);
      } finally {
        setLoading(false);
      }

      const updated = records.map(r => r.id === editingRecord.id ? { ...r, ...recordData } : r);
      setRecords(updated);
      saveRecordsToLocal(updated);

      setIsAddOpen(false);
      setEditingRecord(null);
      showToast('✨ 對帳項目修改完成並同步試算表！', 'success');
    } else {
      // 新增項目
      try {
        const res = await callGasApi('addRecord', recordData);
        if (!res || !res.success) {
          enqueueSyncItem('addRecord', recordData, `新增對帳紀錄：${recordData.item} ($${recordData.amount})`);
        }
      } catch (err) {
        enqueueSyncItem('addRecord', recordData, `新增對帳紀錄：${recordData.item} ($${recordData.amount})`);
      } finally {
        setLoading(false);
      }

      const updated = [recordData, ...records];
      setRecords(updated);
      saveRecordsToLocal(updated);

      const isExpense = formData.type.startsWith('支出');
      const currObj = CURRENCIES.find(c => c.code === selectedCurrency);
      const foreignStr = selectedCurrency !== 'TWD'
        ? ` (原幣 ${currObj?.flag || ''} ${(Number(numAmount) || 0).toLocaleString('zh-TW')} ${selectedCurrency}, 匯率 ${effectiveRate})`
        : '';
      const notifTitle = isExpense 
        ? `💸 ${formData.payer} 新增了日常代墊${selectedCurrency !== 'TWD' ? ' (外幣)' : ''}`
        : `💰 ${formData.payer} 撥入了公積金`;
      const notifDesc = `「${formData.item.trim()}」：金額 $${(Number(twdAmount) || 0).toLocaleString('zh-TW')} 元${foreignStr} (${monthStr} 月份)`;
      addNotificationAndSave(notifTitle, notifDesc, isExpense ? 'expense' : 'income');

      setIsAddOpen(false);
      showToast('對帳項目登錄成功並同步 Google 試算表！', 'success');
    }

    setFormData({
      item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payer: defaultPayerName,
      type: '支出-日常代墊',
      currency: 'TWD',
      customRate: ''
    });
  };

  const handleEditRecord = (record: RecordItem) => {
    setEditingRecord(record);
    setFormData({
      item: record.item,
      amount: String(record.originalAmount || record.amount),
      currency: record.currency || 'TWD',
      customRate: String(record.exchangeRate || (exchangeRates[record.currency || 'TWD'] || '')),
      date: record.date || new Date().toISOString().split('T')[0],
      payer: record.payer,
      type: record.type
    });
    setAddModalType('record');
    setIsAddOpen(true);
  };

  // 刪除對帳項目項
  const handleDelete = (id: string | number) => {
    const itemToDelete = records.find(r => String(r.id) === String(id));
    const itemName = itemToDelete ? itemToDelete.item : '此項目';

    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認要刪除此筆對帳紀錄嗎？',
      message: `您確定要刪除「${itemName}」嗎？這會自 Google 試算表永久移去資料。`,
      confirmText: '永久刪除',
      cancelText: '保留紀錄',
      onConfirm: async () => {
        const filtered = records.filter(r => String(r.id) !== String(id));
        setRecords(filtered);
        saveRecordsToLocal(filtered);

        addNotificationAndSave('🗑️ 刪除了對帳紀錄', `「${itemName}」已被移除`, 'delete');
        showToast('已成功刪除該筆對帳紀錄！', 'success');

        try {
          const res = await callGasApi('deleteRecordByRow', { id, rowId: id });
          if (!res || !res.success) {
            enqueueSyncItem('deleteRecordByRow', { id, rowId: id }, `刪除對帳紀錄：${itemName}`);
          }
        } catch (err) {
          enqueueSyncItem('deleteRecordByRow', { id, rowId: id }, `刪除對帳紀錄：${itemName}`);
        }
      }
    });
  };

  // 重新同步/重置為預設假資料
  const handleResetData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      saveRecordsToLocal(INITIAL_RECORDS);
      showToast('已同步試算表完畢，已還原乾淨預設值！', 'success');
    }, 1000);
  };

  // 1. 最新月份代墊與收入計算 (供底部浮動合計面板、首頁即時顯示使用)
  const latestMonth = React.useMemo(() => {
    if (records.length === 0) return '2026-06';
    const validMonths = records
      .map(r => r.month)
      .filter(m => typeof m === 'string' && /^\d{4}-\d{2}$/.test(m));
    if (validMonths.length === 0) {
      const fromDates = records
        .map(r => (typeof r.date === 'string' && r.date.length >= 7 ? r.date.substring(0, 7) : ''))
        .filter(m => /^\d{4}-\d{2}$/.test(m));
      if (fromDates.length > 0) {
        fromDates.sort((a, b) => b.localeCompare(a));
        return fromDates[0];
      }
      return new Date().toISOString().substring(0, 7);
    }
    const unique = Array.from(new Set(validMonths)) as string[];
    unique.sort((a, b) => b.localeCompare(a));
    return unique[0];
  }, [records]);

  const liaoLatestTotal = React.useMemo(() => {
    return records
      .filter(r => r.month === latestMonth && isUserAPayer(r.payer) && (r.type.includes('支出') || r.type.includes('代墊')))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, latestMonth, isUserAPayer]);

  const zhouLatestTotal = React.useMemo(() => {
    return records
      .filter(r => r.month === latestMonth && isUserBPayer(r.payer) && (r.type.includes('支出') || r.type.includes('代墊')))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, latestMonth, isUserBPayer]);

  // 全域所有月份的累計代墊 (相容舊有狀態)
  const liaoTotal = React.useMemo(() => {
    return records
      .filter(r => isUserAPayer(r.payer) && (r.type.includes('支出') || r.type.includes('代墊')))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, isUserAPayer]);

  const zhouTotal = React.useMemo(() => {
    return records
      .filter(r => isUserBPayer(r.payer) && (r.type.includes('支出') || r.type.includes('代墊')))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [records, isUserBPayer]);

  // 2. 計算全域所有月份累計（不分月份）已撥款給雙方後，剩下的總額度 (公積金實際餘額與銷帳前 Quota 試算)
  const overallStats = React.useMemo(() => {
    let income = 0;
    let disbursedExpenses = 0; // 已銷帳代墊
    let pendingExpenses = 0;   // 待銷帳代墊
    records.forEach(r => {
      if (r.type === '收入-固定公積金' || r.type.includes('收入') || r.type.includes('公積金') || r.type.includes('注資') || r.type.includes('撥入')) {
        income += r.amount;
      } else if (r.type.includes('支出') || r.type.includes('代墊')) {
        // 判斷是否屬於已核銷/已結清月份
        if (isMonthReconciled(r.month, reconciledMonths)) {
          disbursedExpenses += r.amount;
        } else {
          pendingExpenses += r.amount;
        }
      }
    });

    const currentBalance = income - disbursedExpenses; // 扣除已銷帳撥款後的公積金實際餘額
    const estimatedQuota = currentBalance - pendingExpenses; // 當月銷帳前預計所剩的餘額 Quota

    return { 
      income, 
      expenses: disbursedExpenses, 
      pendingExpenses,
      diff: currentBalance, 
      estimatedQuota 
    };
  }, [records, reconciledMonths]);

  // 3. 獲取單一月份統計數據的 Memo (用於圓形比例圓餅圖與入不敷出診斷)
  const monthlyBalances = React.useMemo(() => {
    const stats: { [month: string]: { income: number; expenses: number; deficit: number; liaoExp: number; zhouExp: number } } = {};
    records.forEach(r => {
      const m = r.month;
      if (!stats[m]) {
        stats[m] = { income: 0, expenses: 0, deficit: 0, liaoExp: 0, zhouExp: 0 };
      }
      if (r.type === '收入-固定公積金' || r.type.includes('收入') || r.type.includes('公積金') || r.type.includes('注資') || r.type.includes('撥入')) {
        stats[m].income += r.amount;
      } else if (r.type.includes('支出') || r.type.includes('代墊')) {
        stats[m].expenses += r.amount;
        if (isUserAPayer(r.payer)) {
          stats[m].liaoExp += r.amount;
        } else if (isUserBPayer(r.payer)) {
          stats[m].zhouExp += r.amount;
        }
      }
    });

    // 剩餘的總公積金 (核銷過後的已從總公積金中扣掉)
    const remainingPool = overallStats.diff;

    // 計算各月份收支平衡狀況（若該月為待核銷且支出超出公積金總底池，則標註赤字金額）
    Object.keys(stats).forEach(m => {
      const isReconciled = isMonthReconciled(m, reconciledMonths);
      if (isReconciled) {
        stats[m].deficit = 0;
      } else {
        const diff = stats[m].expenses - remainingPool;
        stats[m].deficit = diff > 0 ? diff : 0;
      }
    });

    return stats;
  }, [records, overallStats.diff, reconciledMonths]);

  // 新增：首頁整合數據統計
  const homeStats = React.useMemo(() => {
    let income = 0;
    let liaoExp = 0;
    let zhouExp = 0;
    let expenses = 0;
    Object.values(monthlyBalances).forEach((b: any) => {
      income += b.income;
      liaoExp += b.liaoExp;
      zhouExp += b.zhouExp;
      expenses += b.expenses;
    });
    return { income, liaoExp, zhouExp, expenses };
  }, [monthlyBalances]);

  // 4. 購物記事篩選計算 (Shopping List Filter)
  const filteredShoppingItems = React.useMemo(() => {
    const list = shoppingItems.filter((item) => {
      if (shoppingFilter === 'need' && (item.category !== '需要買' || item.status === '已買到')) return false;
      if (shoppingFilter === 'want' && (item.category !== '想要買' || item.status === '已買到')) return false;
      if (shoppingFilter === 'done' && item.status !== '已買到') return false;
      
      if (selectedStoreFilter !== 'all' && item.store !== selectedStoreFilter) return false;
      
      if (shoppingSearch.trim()) {
        const q = shoppingSearch.toLowerCase();
        return (
          item.item.toLowerCase().includes(q) ||
          (item.store && item.store.toLowerCase().includes(q)) ||
          (item.deadline && item.deadline.toLowerCase().includes(q)) ||
          (item.creator && item.creator.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      if (a.status === '已買到' && b.status !== '已買到') return 1;
      if (a.status !== '已買到' && b.status === '已買到') return -1;
      return 0;
    });
  }, [shoppingItems, shoppingFilter, selectedStoreFilter, shoppingSearch]);

  // 5. 智慧安全通知與診斷系統提醒 (即時計算)
  const smartAlerts = React.useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      message: string;
      type: 'error' | 'warning' | 'info';
    }> = [];

    const sortedMonths = (Array.from(new Set(records.map(r => r.month))) as string[]).sort((a, b) => a.localeCompare(b));
    const remainingPool = overallStats.diff;

    // A. 檢查是否有月份入不敷出 (代墊費大於公積金剩餘盈餘)
    sortedMonths.forEach(m => {
      // 警示部分若提及該月已經完全核銷，就不須再有該月的警示
      if (isMonthReconciled(m, reconciledMonths)) return;

      const stat = monthlyBalances[m];
      if (stat && stat.expenses > remainingPool) {
        const deficit = stat.expenses - remainingPool;
        alerts.push({
          id: `deficit-${m}`,
          title: `⚠️ ${m} 月份入不敷出提示`,
          message: `${m} 月份代墊支出為 $${(Number(stat.expenses) || 0).toLocaleString()} 元，目前剩餘的總公積金為 $${(Number(remainingPool) || 0).toLocaleString()} 元，可用額度不足，超支達 $${(Number(deficit) || 0).toLocaleString()} 元。請注意花錢狀況！`,
          type: 'error'
        });
      }
    });

    // B. 檢查隔月份有撥入收入款 (固定公積金)，就通知使用者應先優先核銷上一月份被超支墊付的赤字，並特別提示少花錢
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevM = sortedMonths[i - 1];
      const curM = sortedMonths[i];

      // 若提及上個月已經完全核銷，就不須再有該上個月的跨月警示建議
      if (isMonthReconciled(prevM, reconciledMonths)) continue;

      const prevStat = monthlyBalances[prevM];
      const curStat = monthlyBalances[curM];

      if (prevStat && prevStat.expenses > remainingPool && curStat && curStat.income > 0) {
        const deficit = prevStat.expenses - remainingPool;
        alerts.push({
          id: `consecutive-clear-${curM}`,
          title: `💡 跨月結算與省錢通知`,
          message: `本月 (${curM}) 已有撥入公積金。然而上個月 (${prevM}) 代墊支出超過剩餘的總公積金（超支赤字 $${(Number(deficit) || 0).toLocaleString()} 元），請本月撥款時優先補繳、結清上月款項，並切記注意花錢與非必要性日常消費！`,
          type: 'warning'
        });
      }
    }

    return alerts;
  }, [records, monthlyBalances, reconciledMonths, overallStats.diff]);

  // 進入網頁時自動警示提醒
  const [hasShownLoadAlert, setHasShownLoadAlert] = useState(false);
  const [showLoadAlertModal, setShowLoadAlertModal] = useState(false);

  // 每個功能頁面跳轉進入，自動從頁首開始捲動
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [activeTab]);

  useEffect(() => {
    if (records.length > 0 && !hasShownLoadAlert) {
      const hasDeficits = Object.values(monthlyBalances).some((s: any) => s.deficit > 0);
      if (hasDeficits && smartAlerts.length > 0) {
        setShowLoadAlertModal(true);
        setHasShownLoadAlert(true);
      }
    }
  }, [records, monthlyBalances, smartAlerts, hasShownLoadAlert]);


  // 若未登入 Google 帳號且非沙盒測試模式，且非本機訪客模式，顯示 Google 帳號登入入口
  if (!currentUser && !isSandboxMode && !isGuestMode) {
    return (
      <>
        <FullScreenSyncOverlay
          isVisible={isInitialSyncing}
          step={syncProgressStep}
          statusText={syncStatusText}
          userEmail={syncingUserEmail}
          userName={syncingUserName}
          userAvatar={syncingUserAvatar}
          onSkip={() => setIsInitialSyncing(false)}
        />
        <GoogleAuthPortal
          onLogin={handleGoogleLogin}
          onEnterDevSandbox={handleEnterDevSandbox}
          onEnterGuestMode={handleEnterGuestMode}
        />
      </>
    );
  }

  // 🛡️ 初次登入強制引導小精靈 Gatekeeper（角色判定與資料庫綁定攔截）
  // 只要是已登入的真實使用者，且資料庫尚未綁定（且不在沙盒模式與訪客模式下），且雲端配置已檢索完畢，
  // 必須強制停留在小精靈中完成管理者 API 綁定或伴侶邀請碼輸入，鎖定帳號模式後方可進入主系統。
  if (currentUser && !isDbConnected && !isGuestMode && !isSandboxMode && !isCheckingCloudConfig) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex flex-col justify-center items-center p-4">
        <FullScreenSyncOverlay
          isVisible={isInitialSyncing}
          step={syncProgressStep}
          statusText={syncStatusText}
          userEmail={syncingUserEmail}
          userName={syncingUserName}
          userAvatar={syncingUserAvatar}
          onSkip={() => setIsInitialSyncing(false)}
        />
        {/* 背景光暈 */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#F2EFE7] to-transparent opacity-40 pointer-events-none -z-10" />

        <UnifiedDatabaseModal
          isOpen={true}
          onClose={() => {
            // 強制模式下無法由點擊關閉按鈕退出，但若已連線則自動放行
          }}
          isForcedOnboarding={true}
          onCompleteOnboarding={() => {
            fetchDashboardData(true, false);
            fetchShoppingData(false);
            fetchSplitData(true);
            fetchTravelData(true);
          }}
          currentUser={currentUser}
          gasWebUrl={gasWebUrl}
          setGasWebUrl={setGasWebUrl}
          deploySheetUrl={deploySheetUrl}
          setDeploySheetUrl={setDeploySheetUrl}
          saveDeployConfig={saveDeployConfig}
          customizedCodeGs={getCustomizedCodeGs()}
          currentInviteCode={currentInviteCode}
          onGenerateNewInviteCode={handleGenerateNewInviteCode}
          onCopyInviteShare={handleCopyInviteShare}
          onBindPartnerInvite={handleBindPartnerInvite}
          partnerBindingInfo={partnerBindingInfo}
          onUnbindPartner={handleUnbindPartner}
          onResetAccountDatabase={handleResetAccountDatabase}
          isSandboxMode={isSandboxMode}
          onToggleSandboxMode={handleToggleSandboxMode}
          initialTab="wizard"
          initialWizardRole={unifiedDatabaseRole}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#3E3A36] font-sans flex flex-col bg-[#F8F7F3] relative overflow-x-hidden antialiased selection:bg-[#E4DFD3] selection:text-[#3E3A36]">
      {/* 🚀 全屏同步中動畫 (登入與雲端資料庫同步時顯示，取代右下角 Toast) */}
      <FullScreenSyncOverlay
        isVisible={isInitialSyncing}
        step={syncProgressStep}
        statusText={syncStatusText}
        userEmail={syncingUserEmail}
        userName={syncingUserName}
        userAvatar={syncingUserAvatar}
        onSkip={() => setIsInitialSyncing(false)}
      />

      {/* 淡淡的無印木質感、日系暖色調背景光波 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#F2EFE7] to-transparent opacity-40 pointer-events-none -z-10" />

      {/* 頂部精緻極簡 Header */}
      <Header
        isOnline={isOnline}
        isBackgroundSyncing={isBackgroundSyncing}
        lastSyncedAt={lastSyncedAt}
        appMode={appMode}
        setAppMode={(mode) => {
          setAppMode(mode);
          try {
            localStorage.setItem('banban_active_mode', mode);
          } catch (e) {}
          if (mode === 'split') {
            window.location.hash = '/split';
          } else if (window.location.hash.includes('split')) {
            window.location.hash = '';
          }
        }}
        unsettledSplitCount={splitSummary.unsettledCount}
        onOpenTravelCalculator={() => setShowTravelCalculatorModal(true)}
        onOpenSettings={() => setIsUnifiedSettingsModalOpen(true)}
        onReturnToLoginPortal={handleReturnToLoginPortal}
        onOpenNotifySettings={() => setIsAppNotifyModalOpen(true)}
        unreadNotificationCount={incomingUnreadCount}
        pendingQueueCount={pendingSyncQueue.length}
        currentUser={currentUser}
        isSandboxMode={isSandboxMode}
        gasWebUrl={gasWebUrl}
        onOpenDevSettings={() => setIsDevSettingsModalOpen(true)}
        onOpenVersionInfo={() => setIsVersionInfoModalOpen(true)}
      />


      {/* 主呈現區 (預留固定頂部 Header 高度間距，避免內容被遮擋) */}
      <main className="w-full max-w-4xl mx-auto px-3 sm:px-4 flex-grow pt-[116px] sm:pt-20 pb-16 sm:pb-20">
        
        {/* 🔑 若未綁定 Google 試算表 Web App API，顯示顯眼的友善引導卡片 */}
        {!gasWebUrl && !isSandboxMode && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <FileCode className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#3E3A36] flex items-center gap-1.5">
                  <span>尚未設定 Google 試算表連線金鑰</span>
                  <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-bold">待連動</span>
                </h4>
                <p className="text-[11px] text-[#7A7366] leading-relaxed">
                  請點擊右側按鈕綁定您的 <strong>Google Apps Script Web App API 網址</strong>，開啟雙向即時雲端記帳同步！
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openUnifiedDatabaseModal('wizard')}
              className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap self-start sm:self-center shrink-0"
            >
              設定連線金鑰與同步
            </button>
          </div>
        )}

        {/* 🧪 若為開發人員沙盒測試模式，顯示沙盒模式說明與關閉按鈕 */}
        {isSandboxMode && (
          <div className="bg-slate-800 text-slate-100 rounded-2xl p-3 sm:p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs border border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-[10px]">
                測試沙盒
              </span>
              <span className="text-slate-200">
                您正處於<strong>「開發人員沙盒測試模式」</strong>，資料僅保存在本機快取中。
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSandboxMode(false)}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              關閉沙盒模式
            </button>
          </div>
        )}

        {/* 核心內容視窗切換區，加入優雅 motion 轉場效果 */}
        <div className="relative">
          <AnimatePresence mode="wait">

            {/* Tab 1: 首頁整合面板 */}
            {activeTab === 'home' && (
              appMode === 'split' ? (
                <SplitHomeTab
                  key="split-home"
                  summary={splitSummary}
                  recentItems={splitItems}
                  isLoading={isSplitLoading}
                  onRefresh={() => fetchSplitData(false)}
                  onOpenAdd={() => setIsSplitAddOpen(true)}
                  onGoToHistory={() => setActiveTab('history')}
                  onGoToSettlement={() => setActiveTab('settlement')}
                  onOpenSettleModal={() => setIsSplitSettleModalOpen(true)}
                  onExecuteSmartCommand={handleExecuteSmartCommand}
                  onOpenChatAssistant={() => setIsChatAssistantOpen(true)}
                  isDbConnected={isDbConnected}
                  onOpenGasDeploy={() => openUnifiedDatabaseModal('settings')}
                  onOpenWizard={(role) => openUnifiedDatabaseModal('wizard', role)}
                  onEnableSandbox={() => handleToggleSandboxMode(true)}
                  currentUser={currentUser}
                  partnerBindingInfo={partnerBindingInfo}
                />
              ) : (
                !isDbConnected ? (
                  <InitialEmptyEntryFrame
                    currentUser={currentUser}
                    partnerBindingInfo={partnerBindingInfo}
                    onOpenWizard={(role) => openUnifiedDatabaseModal('wizard', role)}
                    onOpenDirectSettings={() => openUnifiedDatabaseModal('settings')}
                    onEnableSandbox={() => handleToggleSandboxMode(true)}
                    appMode="fund"
                  />
                ) : (
                  <motion.div 
                    key="tab-home"
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -12 }} 
                    transition={{ duration: 0.25 }}
                    className="space-y-4 sm:space-y-6"
                  >
                  {/* 🎯 當月銷帳之前預計所剩餘額 核心重點看板 */}
                {(() => {
                  const quota = overallStats.estimatedQuota;
                  const currentPool = overallStats.diff;
                  const pending = overallStats.pendingExpenses;
                  
                  let statusBadgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
                  let statusText = "🟢 額度充裕";
                  let adviceMessage = "目前銷帳試算後的餘額充足，可正常消費。";
                  
                  if (quota < 0) {
                    statusBadgeColor = "bg-rose-50 text-rose-800 border-rose-200/80 animate-pulse";
                    statusText = "🚨 預計赤字超支";
                    adviceMessage = "待銷帳代墊總額已超出目前公積金餘額，建議適當補充公積金。";
                  } else if (quota < 3000) {
                    statusBadgeColor = "bg-amber-50 text-amber-800 border-amber-200/80";
                    statusText = "🟡 預算緊繃";
                    adviceMessage = "預計銷帳後剩餘額度較少，建議控制非必要開支。";
                  }

                  return (
                    <div className="bg-gradient-to-br from-white via-[#FAF9F5] to-[#F5F2E9] rounded-3xl p-4 sm:p-6 border border-[#E3DFD5] shadow-2xs space-y-3.5 sm:space-y-4 relative overflow-hidden">
                      {/* 背景幾何圖示 */}
                      <div className="absolute -right-4 -bottom-4 text-[#E6E2D8] opacity-25 pointer-events-none">
                        <Target className="w-28 h-28 sm:w-32 sm:h-32" />
                      </div>

                      {/* 頂部標題列：標題、狀態標籤與算式拆解標籤整齊排列 */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 border-b border-[#ECE8DE] pb-3">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#8C8475] uppercase flex items-center gap-1.5 whitespace-nowrap">
                            <Target className="w-4 h-4 text-[#8C8475]" />
                            當月銷帳前預計所剩餘額
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 whitespace-nowrap ${statusBadgeColor}`}>
                            {statusText}
                          </span>
                        </div>

                        {/* 算式拆解標籤三者整齊排列 */}
                        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-sans tabular-nums bg-white/95 backdrop-blur-xs px-2.5 py-1.5 sm:px-3 rounded-xl border border-[#EBE8DE] text-[#5C564E] shrink-0 whitespace-nowrap shadow-2xs">
                          <span className="inline-flex items-center gap-1">
                            <span>池內餘額</span>
                            <strong className="text-emerald-700 text-xs sm:text-sm font-extrabold">${(Number(currentPool) || 0).toLocaleString('zh-TW')}</strong>
                          </span>
                          <span className="text-gray-300 font-bold px-0.5">-</span>
                          <span className="inline-flex items-center gap-1">
                            <span>待銷帳代墊</span>
                            <strong className="text-amber-700 text-xs sm:text-sm font-extrabold">${(Number(pending) || 0).toLocaleString('zh-TW')}</strong>
                          </span>
                          <span className="text-gray-300 font-bold px-0.5">=</span>
                          <span className="inline-flex items-center gap-1">
                            <span>預計剩餘</span>
                            <strong className={`text-xs sm:text-sm font-extrabold ${quota >= 0 ? 'text-emerald-700' : 'text-[#C55757]'}`}>
                              {quota < 0 ? '-' : ''}${(Number(Math.abs(quota)) || 0).toLocaleString('zh-TW')}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 pt-1">
                        <div className="space-y-1">
                          <div className={`text-3xl sm:text-4xl lg:text-5xl font-light font-sans tabular-nums leading-none tracking-tight break-words ${quota >= 0 ? 'text-emerald-700' : 'text-[#C55757]'}`}>
                            {quota < 0 ? '- $ ' : '$ '}
                            <span className="font-extrabold">{(Number(Math.abs(quota)) || 0).toLocaleString('zh-TW')}</span>
                            <span className="text-base sm:text-lg font-medium text-[#7A756E] ml-2">元</span>
                            {quota < 0 && <span className="text-sm font-bold text-[#C55757] ml-2">(超支)</span>}
                          </div>
                        </div>
                      </div>

                      {/* 智慧消費判斷建議列 - 嚴謹水平與垂直置中對齊 */}
                      <div className="bg-white/95 rounded-xl px-3.5 py-2.5 border border-[#EAE6DC] flex items-center gap-2.5 text-xs text-[#4A4641] shadow-2xs">
                        <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm text-[#4A4641] leading-none flex-1 truncate">
                          {adviceMessage}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 財務即時統計卡片 3 欄位 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {/* 1. 公積金底池撥入 */}
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border-l-4 border-[#6E8C78] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[5.5rem]">
                    <div>
                      <h3 className="text-xs font-semibold text-[#5C564E]">公積金撥入額度</h3>
                    </div>
                    <div className="text-base font-light text-[#3E3A36] font-sans tabular-nums leading-none mt-2 break-words">
                      $ <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold">{(Number(homeStats?.income) || 0).toLocaleString('zh-TW')}</span> <span className="text-xs text-[#8C8475] font-normal">元</span>
                    </div>
                  </div>

                  {/* 2. 雙方代墊總支出 */}
                  <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border-l-4 border-[#8C8475] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[5.5rem]">
                    <div>
                      <h3 className="text-xs font-semibold text-[#5C564E]">雙方代墊總支出</h3>
                    </div>
                    <div className="text-base font-light text-[#3E3A36] font-sans tabular-nums leading-none mt-2 break-words">
                      $ <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold">{(Number(homeStats?.expenses) || 0).toLocaleString('zh-TW')}</span> <span className="text-xs text-[#8C8475] font-normal">元</span>
                    </div>
                  </div>

                  {/* 3. 盈餘與赤字狀態 / 扣除已銷帳撥款後餘額 */}
                  <div className={`bg-white/70 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border-l-4 ${overallStats.diff >= 0 ? 'border-emerald-600' : 'border-[#C55757]'} shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[5.5rem]`}>
                    <div>
                      <h3 className="text-xs font-semibold text-[#5C564E]">
                        {overallStats.diff >= 0 ? '扣除已銷帳撥款後餘額' : '累計超支 (赤字)'}
                      </h3>
                    </div>
                    <div className={`text-base font-light font-sans tabular-nums leading-none mt-2 break-words ${overallStats.diff >= 0 ? 'text-emerald-700' : 'text-[#C55757]'}`}>
                      $ <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold">{(Number(Math.abs(overallStats?.diff || 0)) || 0).toLocaleString('zh-TW')}</span> <span className="text-xs text-[#8C8475] font-normal">元</span>
                    </div>
                  </div>
                </div>

                {/* ✈️ 出國旅遊與即時匯率換算看板 (可折疊收納) */}
                <div className="bg-gradient-to-r from-[#FAF8F3] via-white to-[#F6F3EA] rounded-2xl p-3 sm:p-4 border border-[#E5E1D5] shadow-2xs space-y-2.5 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isExchangeRatesCollapsed;
                        setIsExchangeRatesCollapsed(next);
                        try {
                          localStorage.setItem('banban_rates_collapsed', String(next));
                        } catch (e) {}
                      }}
                      className="flex items-center gap-2 text-left cursor-pointer group flex-1 min-w-0"
                    >
                      <div className="w-7 h-7 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-amber-200 transition-colors">
                        💱
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#3E3A36] group-hover:text-amber-900 transition-colors truncate">
                            出國外幣即時匯率換算
                          </h4>
                          <span className="text-[10px] text-[#A39E92] flex items-center">
                            {isExchangeRatesCollapsed ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#8C8475]" />
                            ) : (
                              <ChevronUp className="w-3.5 h-3.5 text-[#8C8475]" />
                            )}
                          </span>
                        </div>
                        {isExchangeRatesCollapsed && (
                          <p className="text-[10px] text-[#8C8475] truncate">
                            🇯🇵 日圓 ${exchangeRates['JPY'] || DEFAULT_RATES_MAP['JPY']} · 🇺🇸 美元 ${exchangeRates['USD'] || DEFAULT_RATES_MAP['USD']} (點擊展開)
                          </p>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTravelCalculatorModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 shrink-0 active:scale-95"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>計算器</span>
                    </button>
                  </div>

                  {/* 快捷熱門外幣即時匯率展示 (未折疊時顯示) */}
                  {!isExchangeRatesCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#EFECE3]">
                      {[
                        { code: 'JPY', name: '日圓', flag: '🇯🇵' },
                        { code: 'USD', name: '美元', flag: '🇺🇸' },
                        { code: 'EUR', name: '歐元', flag: '🇪🇺' },
                        { code: 'KRW', name: '韓元', flag: '🇰🇷' }
                      ].map(c => (
                        <div key={c.code} className="bg-white/90 rounded-xl p-2 sm:p-2.5 border border-[#EAE6DC] flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#4A4641] flex items-center gap-1">
                            <span>{c.flag}</span>
                            <span>{c.code}</span>
                          </span>
                          <span className="text-xs font-black font-sans tabular-nums text-emerald-800">
                            ${exchangeRates[c.code] || DEFAULT_RATES_MAP[c.code] || 1} <span className="text-[9px] font-normal text-[#8C8475]">TWD</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 智慧安全通知提醒 */}
                {smartAlerts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 pl-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C8475]" />
                      <h3 className="text-xs font-bold text-[#8C8475] tracking-wider uppercase">
                        📋 智慧收支診斷與警示
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {smartAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-2xs ${
                            alert.type === 'error' 
                              ? 'bg-red-50/75 border-red-200/40 text-[#C55757]' 
                              : 'bg-amber-50/75 border-amber-200/40 text-[#8C5E24]'
                          }`}
                        >
                          <span className="text-sm shrink-0 mt-0.5">
                            {alert.type === 'error' ? '🚨' : '💡'}
                          </span>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold">{alert.title}</h4>
                            <p className="text-[11px] leading-relaxed opacity-90">{alert.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最近動態預覽 */}
                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-[#EBE8E0] shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-wider text-[#8C8475] uppercase flex items-center gap-1.5 pl-0.5">
                      <span>📌</span> 最近登錄的對帳動態
                    </h3>
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-xs text-[#8C8475] hover:text-[#5C564E] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>全帳單</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {records.slice(0, 3).length === 0 ? (
                      <p className="text-center py-6 text-xs text-[#9E988D] font-light">目前無任何記帳數據。</p>
                    ) : (
                      records.slice(0, 3).map((r) => {
                        const isExp = r.type.includes('支出');
                        return (
                          <div 
                            key={r.id} 
                            className="bg-white/60 border border-[#EEEDE3]/80 rounded-xl p-2.5 sm:p-3 flex items-center justify-between text-xs hover:bg-white transition-all gap-2"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-sans tabular-nums text-[9px] text-[#8C8475] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#EBE8DE]">
                                  {r.date}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border leading-none ${isExp ? 'bg-[#FCF4F4] text-[#C55757] border-[#F4DFDF]' : 'bg-[#F2F8F4] text-[#428564] border-[#DCEFE5]'}`}>
                                  {r.payer} {(isExp ? '代墊' : '撥入')}
                                </span>
                              </div>
                              <h4 className="font-semibold text-[#3E3A36] truncate text-xs sm:text-sm">{r.item}</h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-sans tabular-nums font-bold text-xs sm:text-sm text-[#3E3A36] whitespace-nowrap bg-[#FAF9F5] px-2 py-1 rounded border border-[#E8E4D9] block">
                                $ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}
                              </span>
                              {r.currency && r.currency !== 'TWD' && (
                                <span className="text-[9px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-sans tabular-nums block mt-0.5">
                                  {CURRENCIES.find(c => c.code === r.currency)?.flag} {(Number(r?.originalAmount) || 0).toLocaleString('zh-TW')} {r.currency}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditRecord(r)}
                                className="text-[#8C8475] hover:text-[#4A4641] p-1.5 rounded-lg hover:bg-gray-100 transition-all border border-transparent cursor-pointer"
                                title="編輯對帳紀錄"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                title="移除對帳紀錄"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 首頁採購清單快覽小工具 (Compact Shopping List Widget) */}
                <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-[#EBE8E0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                      <h3 className="text-xs font-bold tracking-wider text-[#8C8475] uppercase flex items-center gap-1.5">
                        待辦採購筆記
                      </h3>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                        {shoppingItems.filter(i => i.status === '待購買').length} 待買
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('notebook')}
                      className="text-xs text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>全頁面</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {shoppingItems.filter(i => i.status === '待購買').length === 0 ? (
                    <p className="text-center py-4 text-xs text-[#9E988D] font-light">目前沒有待購買的品項喔！🎉</p>
                  ) : (
                    <div className="space-y-2">
                      {shoppingItems.filter(i => i.status === '待購買').slice(0, 3).map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 bg-white/60 rounded-xl border border-[#EEEDE3] text-xs hover:bg-white transition-all gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.category === '需要買' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <span className="font-semibold text-[#3E3A36] truncate">{item.item}</span>
                            <span className="text-[10px] text-[#8C8475] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#E8E4D9] flex items-center gap-1"><MapPin className="w-3 h-3 text-[#8C8475]" /><span>{item.store || '隨意'}</span></span>
                            <span className="text-[10px] text-[#8C8475] flex items-center gap-1"><Clock className="w-3 h-3 text-[#8C8475]" /><span>{item.deadline || '儘快'}</span></span>
                          </div>
                          <button
                            onClick={() => handleToggleShoppingStatus(item.id, item.status)}
                            className="self-end sm:self-auto text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0"
                          >
                            標記買到
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
                )
              )
            )}

            {/* Tab 2: 歷史流水帳 */}
            {activeTab === 'history' && (
              appMode === 'split' ? (
                <SplitHistoryTab
                  key="split-history"
                  items={splitItems}
                  onDeleteItem={handleDeleteSplitRecord}
                  onOpenAdd={() => setIsSplitAddOpen(true)}
                  isDbConnected={isDbConnected}
                  onOpenGasDeploy={handleOpenGasDeploy}
                  currentUser={currentUser}
                  partnerBindingInfo={partnerBindingInfo}
                />
              ) : (
                !isDbConnected ? (
                  renderDbUnconnectedState(
                    "尚未連線至資料庫",
                    "尚未登錄 Google 試算表 Web App API 金鑰，無法讀取公積金歷史記帳明細。請先設定連線金鑰以同步雲端數據。"
                  )
                ) : (
                  <motion.div 
                    key="tab-history"
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -12 }} 
                    transition={{ duration: 0.25 }}
                    className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-6 md:p-8 border border-white/50 shadow-2xs border-[#EBE8E0]"
                  >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 pb-3.5 border-b border-[#F0ECE1] gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#4A4641] flex items-center gap-2">
                      <span className="p-1 bg-[#EEEDE9] rounded-lg text-sm">📋</span> 歷史記帳明細
                    </h2>
                    <p className="text-xs text-[#9E9A92] mt-0.5 font-light leading-relaxed">
                      家庭所有日常代墊支出與公積金固定撥入的流水清單。
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const q = searchQuery.trim().toLowerCase();
                        const filtered = records.filter(r => {
                          const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
                          const matchPayer = selectedPayer === 'all' || r.payer === selectedPayer;
                          const matchDate = selectedDate === 'all' || r.date === selectedDate;
                          const matchQuery = !q || (
                            (r.item && r.item.toLowerCase().includes(q)) ||
                            (r.payer && r.payer.toLowerCase().includes(q)) ||
                            (r.type && r.type.toLowerCase().includes(q)) ||
                            (r.date && r.date.includes(q)) ||
                            (r.month && r.month.includes(q)) ||
                            r.amount.toString().includes(q)
                          );
                          return matchMonth && matchPayer && matchDate && matchQuery;
                        });
                        exportFundRecordsToCSV(filtered, `伴伴記_公積金明細_${new Date().toISOString().substring(0, 10)}.csv`);
                      }}
                      className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#4A4641] border border-[#DDD8CD] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="匯出當前篩選結果為 CSV 試算表"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>匯出 CSV</span>
                    </button>
                  </div>
                </div>

                {/* 🔍 關鍵字搜尋列 */}
                <div className="relative mb-3.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8475]">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`搜尋項目名稱、金額、代墊者 (例如: 全聯、${userA.name}、300)...`}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/80 border border-[#DDD9CE] text-xs text-[#3E3A36] placeholder-[#A39E92] focus:outline-none focus:border-[#8C8475] focus:bg-white transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="清除搜尋內容"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 篩選器工具列 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5">
                  <div className="space-y-1">
                    <label htmlFor="filter-month" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">月份篩選</label>
                    <select
                      id="filter-month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedDate('all'); // 當切換月份時，清除詳細日期，避免篩選互斥
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      <option value="all">📅 全部月份</option>
                      {(Array.from(new Set(records.map(r => r.month))) as string[]).sort((a,b) => b.localeCompare(a)).map(m => (
                        <option key={m} value={m}>{m} 月份</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="filter-payer" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">代墊者 / 來源篩選</label>
                    <select
                      id="filter-payer"
                      value={selectedPayer}
                      onChange={(e) => setSelectedPayer(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      <option value="all">👤 所有出資/來源</option>
                      <option value={userA.name}>{userA.displayName} ({userA.name})</option>
                      <option value={userB.name}>{userB.isPendingBinding ? '待確認伴侶 (等待受邀)' : `${userB.displayName} (${userB.name})`}</option>
                      <option value="共同帳戶">共同帳戶</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="filter-date" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">詳細日期篩選</label>
                    <div className="relative">
                      <input
                        id="filter-date"
                        type="date"
                        value={selectedDate === 'all' ? '' : selectedDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setSelectedDate(val);
                            setSelectedMonth(val.substring(0, 7)); // 連動設定月份
                          } else {
                            setSelectedDate('all');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                      />
                      {selectedDate !== 'all' && (
                        <button 
                          onClick={() => setSelectedDate('all')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded px-1 border border-gray-200 cursor-pointer"
                          title="清除日期"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="filter-sort" className="block text-[10px] font-semibold text-[#8C8475] uppercase tracking-wider">排序方式</label>
                    <select
                      id="filter-sort"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      <option value="date-desc">📅 記帳日期：由新到舊 (預設)</option>
                      <option value="date-asc">📅 記帳日期：由舊到新</option>
                      <option value="amount-desc">💵 金額：由大到小</option>
                      <option value="amount-asc">💵 金額：由小到大</option>
                    </select>
                  </div>
                </div>

                {/* 篩選結果即時統計卡片 */}
                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = records.filter(r => {
                    const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
                    const matchPayer = selectedPayer === 'all' || r.payer === selectedPayer;
                    const matchDate = selectedDate === 'all' || r.date === selectedDate;
                    const matchQuery = !q || (
                      (r.item && r.item.toLowerCase().includes(q)) ||
                      (r.payer && r.payer.toLowerCase().includes(q)) ||
                      (r.type && r.type.toLowerCase().includes(q)) ||
                      (r.date && r.date.includes(q)) ||
                      (r.month && r.month.includes(q)) ||
                      r.amount.toString().includes(q)
                    );
                    return matchMonth && matchPayer && matchDate && matchQuery;
                  });

                  const expSum = filtered.filter(r => r.type.includes('支出')).reduce((acc, r) => acc + r.amount, 0);
                  const incSum = filtered.filter(r => r.type.includes('收入')).reduce((acc, r) => acc + r.amount, 0);
                  const liaoAdv = filtered.filter(r => r.type.includes('支出') && isUserAPayer(r.payer)).reduce((acc, r) => acc + r.amount, 0);
                  const zhouAdv = filtered.filter(r => r.type.includes('支出') && isUserBPayer(r.payer)).reduce((acc, r) => acc + r.amount, 0);
                  const hasActiveFilters = selectedMonth !== 'all' || selectedPayer !== 'all' || selectedDate !== 'all' || searchQuery;

                  return (
                    <div className="mb-4 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE8DC] flex flex-col">
                          <span className="text-[10px] text-[#8C8475]">顯示筆數</span>
                          <span className="font-sans tabular-nums font-bold text-[#3E3A36]">{filtered.length} 筆</span>
                        </div>
                        <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60 flex flex-col">
                          <span className="text-[10px] text-rose-800 font-semibold">支出小計</span>
                          <span className="font-sans tabular-nums font-bold text-rose-900">NT$ {(Number(expSum) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/60 flex flex-col">
                          <span className="text-[10px] text-sky-800 font-semibold">{userA.displayName}代墊小計</span>
                          <span className="font-sans tabular-nums font-bold text-sky-900">NT$ {(Number(liaoAdv) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 flex flex-col">
                          <span className="text-[10px] text-amber-800 font-semibold">{userB.displayName}代墊小計</span>
                          <span className="font-sans tabular-nums font-bold text-amber-900">NT$ {(Number(zhouAdv) || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {hasActiveFilters && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMonth('all');
                              setSelectedPayer('all');
                              setSelectedDate('all');
                              setSearchQuery('');
                            }}
                            className="text-[11px] text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <span>重設所有篩選條件</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 行動裝置優選：帳目卡片清單 (取代直式被擠壓之表格) */}
                <div className="space-y-2.5">
                  {(() => {
                    const q = searchQuery.trim().toLowerCase();
                    const filtered = records.filter(r => {
                      const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
                      const matchPayer = selectedPayer === 'all' || r.payer === selectedPayer;
                      const matchDate = selectedDate === 'all' || r.date === selectedDate;
                      
                      const matchQuery = !q || (
                        (r.item && r.item.toLowerCase().includes(q)) ||
                        (r.payer && r.payer.toLowerCase().includes(q)) ||
                        (r.type && r.type.toLowerCase().includes(q)) ||
                        (r.date && r.date.includes(q)) ||
                        (r.month && r.month.includes(q)) ||
                        r.amount.toString().includes(q)
                      );

                      return matchMonth && matchPayer && matchDate && matchQuery;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-[#9A958C] text-xs font-light tracking-wide bg-[#FAF9F5]/40 rounded-2xl border border-dashed border-[#E3DFD4] p-4">
                          {searchQuery ? `找不到與「${searchQuery}」符合的記帳紀錄` : '目前尚無符合篩選條件的交易紀錄'}
                        </div>
                      );
                    }

                    // 依據「某一天記帳的日期 (r.date)」來排序，補記帳時不會錯亂
                    const sorted = [...filtered].sort((a, b) => {
                      if (sortOrder === 'date-desc') {
                        const dateA = a.date || `${a.month}-01`;
                        const dateB = b.date || `${b.month}-01`;
                        if (dateA !== dateB) {
                          return dateB.localeCompare(dateA);
                        }
                        const timeA = a.timestamp || String(a.id);
                        const timeB = b.timestamp || String(b.id);
                        return timeB.localeCompare(timeA) || (Number(b.id) - Number(a.id));
                      } else if (sortOrder === 'date-asc') {
                        const dateA = a.date || `${a.month}-01`;
                        const dateB = b.date || `${b.month}-01`;
                        if (dateA !== dateB) {
                          return dateA.localeCompare(dateB);
                        }
                        const timeA = a.timestamp || String(a.id);
                        const timeB = b.timestamp || String(b.id);
                        return timeA.localeCompare(timeB) || (Number(a.id) - Number(b.id));
                      } else if (sortOrder === 'amount-desc') {
                        return b.amount - a.amount;
                      } else if (sortOrder === 'amount-asc') {
                        return a.amount - b.amount;
                      }
                      return 0;
                    });

                    return sorted.map(r => {
                      const isExp = r.type.includes('支出');
                      return (
                        <div 
                          key={r.id} 
                          className="bg-white/80 border border-[#EEEDE3] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-2xs hover:border-[#D5D0C2] hover:bg-white transition-all gap-2.5 sm:gap-2"
                        >
                          <div className="space-y-1 flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-sans tabular-nums text-[9px] text-[#8C8475] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#EBE8DE]">
                                📅 {r.date || `${r.month}-01`}
                              </span>
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-medium border ${
                                isExp 
                                ? 'bg-[#FCF4F4] text-[#C55757] border-[#F4DFDF]' 
                                : 'bg-[#F2F8F4] text-[#428564] border-[#DCEFE5]'
                            }`}>
                                {isExp ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                                {isExp ? '日常代墊支出' : '公積金固定撥入'}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-semibold text-[#3E3A36] leading-snug truncate max-w-[170px] min-[360px]:max-w-[220px] sm:max-w-md" title={r.item}>{r.item}</h4>
                            
                            <div className="flex items-center gap-1 text-[11px] text-[#8C8475]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8C8475] shrink-0" />
                              <span>{r.type === '收入-固定公積金' ? '來源：' : '代墊者：'}</span>
                              <span className="font-semibold text-[#4D4942]">{r.payer}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3F0E6]">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-[#A59F94] block font-light">金額 (台幣 NT$)</span>
                              <span className="font-sans tabular-nums font-bold text-[#3E3A36] text-sm sm:text-base block">
                                $ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}
                              </span>
                              {r.currency && r.currency !== 'TWD' && (
                                <span className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-sans tabular-nums block mt-0.5">
                                  {CURRENCIES.find(c => c.code === r.currency)?.flag} {(Number(r?.originalAmount) || 0).toLocaleString('zh-TW')} {r.currency} (匯率 {r.exchangeRate})
                                </span>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => handleDelete(r.id)}
                              className="text-[#A59F94] hover:text-[#C55757] p-2 rounded-xl hover:bg-[#FAF9F5] hover:border-[#F4DFDF] transition-all border border-transparent cursor-pointer"
                              title="移除對帳紀錄"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
                )
              )
            )}

            {/* Tab 3: 月底自動結算 */}
            {activeTab === 'settlement' && (
              appMode === 'split' ? (
                <SplitSettlementTab
                  key="split-settlement"
                  summary={splitSummary}
                  items={splitItems}
                  onOpenSettleModal={() => setIsSplitSettleModalOpen(true)}
                  isLoading={isSplitLoading}
                  isDbConnected={isDbConnected}
                  onOpenGasDeploy={handleOpenGasDeploy}
                  currentUser={currentUser}
                  partnerBindingInfo={partnerBindingInfo}
                />
              ) : (
                !isDbConnected ? (
                  <InitialEmptyEntryFrame
                    currentUser={currentUser}
                    partnerBindingInfo={partnerBindingInfo}
                    onOpenWizard={(role) => openUnifiedDatabaseModal('wizard', role)}
                    onOpenDirectSettings={() => openUnifiedDatabaseModal('settings')}
                    onEnableSandbox={() => handleToggleSandboxMode(true)}
                    appMode="fund"
                  />
                ) : (
                  <motion.div 
                    key="tab-settlement"
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -12 }} 
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                {/* 月份選取器與核銷狀態大面板 */}
                <div className="bg-white/75 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#EBE8E0] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="space-y-1 w-full sm:w-auto">
                    <label htmlFor="settlement-month-select" className="block text-[10px] font-bold text-[#8C8475] uppercase tracking-wider">正在核對月份</label>
                    <select
                      id="settlement-month-select"
                      value={settlementMonth || (records.length > 0 ? records[0].month : new Date().toISOString().slice(0, 7))}
                      onChange={(e) => setSettlementMonth(e.target.value)}
                      className="w-full sm:w-48 px-3 py-2.5 rounded-xl bg-white/70 border border-[#DDD9CE] text-xs font-semibold text-[#3E3A36] focus:outline-none focus:border-[#8C8475] cursor-pointer"
                    >
                      {(() => {
                        const allMonths = Array.from(new Set([
                          ...records.map(r => r.month),
                          settlementMonth,
                          new Date().toISOString().slice(0, 7)
                        ])).filter(Boolean) as string[];
                        return allMonths.sort((a,b) => b.localeCompare(a)).map(m => (
                          <option key={m} value={m}>{m} 月份</option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* 核銷核取狀態 */}
                    {isMonthReconciled(settlementMonth, reconciledMonths) ? (
                      <div className="flex items-center gap-1.5 bg-[#F2F8F4] border border-[#DCEFE5] text-[#428564] px-3.5 py-2 rounded-xl text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#428564] shrink-0 animate-pulse" />
                        此月份已結清
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 text-[#8C5E24] px-3.5 py-2 rounded-xl text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        代墊款對帳中
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const targetMonth = settlementMonth || (records.length > 0 ? records[0].month : new Date().toISOString().slice(0, 7));
                        handleToggleMonthReconciled(targetMonth);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        isMonthReconciled(settlementMonth, reconciledMonths)
                          ? 'bg-[#EAE8E1] hover:bg-[#DDD9CE] text-[#5C564E]'
                          : 'bg-[#6E8C78] hover:bg-[#5C7765] text-white'
                      }`}
                    >
                      {isMonthReconciled(settlementMonth, reconciledMonths) ? '取消核銷標記' : '變更為「本月已核銷」'}
                    </button>
                  </div>
                </div>

                {/* 雙邊結算數字看板 (僅計算該指定核銷月份之累計數字) */}
                {(() => {
                  const compLiaoMonthTotal = records
                    .filter(r => r.month === settlementMonth && isUserAPayer(r.payer) && r.type.includes('支出'))
                    .reduce((sum, r) => sum + r.amount, 0);

                  const compZhouMonthTotal = records
                    .filter(r => r.month === settlementMonth && isUserBPayer(r.payer) && r.type.includes('支出'))
                    .reduce((sum, r) => sum + r.amount, 0);

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                        {/* userA 卡片 */}
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-l-4 border-[#8C8475] shadow-2xs border-[#EBE8E0] relative overflow-hidden flex flex-col justify-between min-h-[8rem]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-2 ring-[#8C8475]/30 bg-[#FAF9F5] flex items-center justify-center">
                                  {userA.avatar ? (
                                    <img
                                      src={userA.avatar}
                                      alt={userA.displayName}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-amber-700 to-amber-900 text-white font-black text-lg sm:text-xl flex items-center justify-center">
                                      {userA.shortName}
                                    </div>
                                  )}
                                </div>
                                {userA.email && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-amber-200 shadow-2xs flex items-center justify-center text-[9px] font-bold text-amber-800" title={`Google 帳號: ${userA.email}`}>
                                    G
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-[#A59F94]">{userA.romanizedName}</p>
                                <h3 className="text-xs sm:text-sm font-bold text-[#3E3A36] mt-0.5 truncate">{userA.displayName} • {settlementMonth} 代墊總額</h3>
                                {userA.email && (
                                  <p className="text-[10px] text-[#8C8475] font-mono truncate">{userA.email}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#F2EFE8] flex items-baseline justify-between">
                            <span className="text-[10px] text-[#8C8475] font-medium">代墊款累計</span>
                            <div className="text-lg sm:text-xl font-normal text-[#3E3A36] font-sans tabular-nums leading-none break-words">
                              $ <span className="text-xl sm:text-2xl font-black">{(Number(compLiaoMonthTotal) || 0).toLocaleString('zh-TW')}</span> 元
                            </div>
                          </div>
                        </div>

                        {/* userB 卡片 */}
                        <div className={`rounded-2xl p-4 sm:p-5 border-l-4 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[8.5rem] transition-all ${
                          userB.isPendingBinding
                            ? 'bg-neutral-50/90 border-l-neutral-400 border border-neutral-300/80 border-dashed backdrop-blur-md'
                            : 'bg-white/80 border-l-[#C1B79E] border-[#EBE8E0] backdrop-blur-md'
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md flex items-center justify-center ${
                                  userB.isPendingBinding
                                    ? 'ring-2 ring-neutral-400/50 bg-neutral-200/80 text-neutral-600'
                                    : 'ring-2 ring-[#C1B79E]/40 bg-[#FAF9F5]'
                                }`}>
                                  {userB.isPendingBinding ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-700 font-bold">
                                      <span className="text-base font-black">待</span>
                                      <span className="text-[8px] tracking-tighter text-neutral-500 font-medium">未綁定</span>
                                    </div>
                                  ) : userB.avatar ? (
                                    <img
                                      src={userB.avatar}
                                      alt={userB.displayName}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-rose-600 to-rose-800 text-white font-black text-lg sm:text-xl flex items-center justify-center">
                                      {userB.shortName}
                                    </div>
                                  )}
                                </div>
                                {userB.email && !userB.isPendingBinding && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-rose-200 shadow-2xs flex items-center justify-center text-[9px] font-bold text-rose-800" title={`Google 帳號: ${userB.email}`}>
                                    G
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[10px] uppercase font-bold tracking-wider text-[#A59F94]">{userB.romanizedName}</p>
                                  {userB.isPendingBinding && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-900 text-white shadow-2xs">
                                      ⏳ 待確認 (反白)
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-[#3E3A36] mt-0.5 truncate">
                                  {userB.isPendingBinding ? (
                                    <span className="text-neutral-800 font-extrabold">
                                      待確認伴侶 • {settlementMonth} 代墊總額
                                    </span>
                                  ) : (
                                    `${userB.displayName} • ${settlementMonth} 代墊總額`
                                  )}
                                </h3>
                                {userB.isPendingBinding ? (
                                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">
                                    女朋友確認受邀綁定後，將自動取消反白並換上其真實名字與 Google 照
                                  </p>
                                ) : (
                                  userB.email && (
                                    <p className="text-[10px] text-[#8C8475] font-mono truncate">{userB.email}</p>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#F2EFE8] flex items-baseline justify-between">
                            <span className="text-[10px] text-[#8C8475] font-medium">
                              {userB.isPendingBinding ? '代墊款累計（待確認）' : '代墊款累計'}
                            </span>
                            <div className="text-lg sm:text-xl font-normal text-[#3E3A36] font-sans tabular-nums leading-none break-words">
                              $ <span className="text-xl sm:text-2xl font-black">{(Number(compZhouMonthTotal) || 0).toLocaleString('zh-TW')}</span> 元
                            </div>
                          </div>
                          {userB.isPendingBinding && currentUser && !isGuestMode && (
                            <div className="mt-2 pt-1.5 border-t border-dashed border-neutral-200 flex items-center justify-between text-[10px]">
                              <span className="text-neutral-500">尚未綁定另一半</span>
                              <button
                                type="button"
                                onClick={() => setIsUnifiedSettingsModalOpen(true)}
                                className="font-bold text-neutral-800 hover:text-black underline flex items-center gap-1 cursor-pointer"
                              >
                                發送邀請碼給另一半 ➔
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 智慧結算金流提示核心黃金對帳區 */}
                      <div className="bg-gradient-to-br from-[#FAF8F2] to-[#EFEADA] border border-[#DDD9CE] rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xs relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#8C8475]" />
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold tracking-wider text-[#5C564E] uppercase flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-amber-800" />
                            {settlementMonth} 月度公積金撥款對帳建議
                          </h3>
                          
                          {/* 精簡對帳結果 */}
                          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#EBE8DE] shadow-2xs">
                            {compLiaoMonthTotal === 0 && compZhouMonthTotal === 0 ? (
                              <p className="text-[#3E3A36] text-xs font-medium py-1">
                                本月（{settlementMonth}）雙方暫無任何代墊紀錄，無需撥款返還。
                              </p>
                            ) : (
                              <div className="space-y-2 text-xs text-[#3E3A36]">
                                {compLiaoMonthTotal > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D0C9BA] shrink-0 bg-[#FAF9F5] shadow-2xs">
                                      {userA.avatar ? (
                                        <img src={userA.avatar} alt={userA.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="w-full h-full bg-[#8C8475] text-white text-[10px] font-bold flex items-center justify-center">{userA.shortName}</span>
                                      )}
                                    </div>
                                    <span>公積金應撥款給 <strong>{userA.displayName}</strong>：</span>
                                    <span className="font-sans tabular-nums font-bold text-sm text-[#8C5E24] underline decoration-wavy">$ {(Number(compLiaoMonthTotal) || 0).toLocaleString('zh-TW')}</span>
                                    <span>元</span>
                                  </div>
                                )}
                                {compZhouMonthTotal > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D0C9BA] shrink-0 bg-[#FAF9F5] shadow-2xs flex items-center justify-center">
                                      {userB.isPendingBinding ? (
                                        <span className="w-full h-full bg-neutral-300 text-neutral-800 text-[10px] font-bold flex items-center justify-center">待</span>
                                      ) : userB.avatar ? (
                                        <img src={userB.avatar} alt={userB.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="w-full h-full bg-[#C1B79E] text-white text-[10px] font-bold flex items-center justify-center">{userB.shortName}</span>
                                      )}
                                    </div>
                                    <span>
                                      公積金應撥款給{' '}
                                      <strong>{userB.isPendingBinding ? '待確認伴侶' : userB.displayName}</strong>
                                      {userB.isPendingBinding && (
                                        <span className="ml-1 text-[9px] bg-neutral-900 text-white px-1.5 py-0.2 rounded font-bold">待確認</span>
                                      )}
                                      ：
                                    </span>
                                    <span className="font-sans tabular-nums font-bold text-sm text-[#8C5E24] underline decoration-wavy">$ {(Number(compZhouMonthTotal) || 0).toLocaleString('zh-TW')}</span>
                                    <span>元</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* 代墊細項核對庫 - 列出個別對帳款項 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#4A4641] tracking-wider flex items-center gap-2 uppercase whitespace-nowrap">
                      <span>👥</span> {settlementMonth} 月度個別支出細項明細
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* userA 的明細 */}
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-[#EEEDE3] space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#F2F1EC] pb-2 font-medium text-xs text-[#5C564E] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#DDD8CD] shrink-0 bg-[#FAF9F5] shadow-2xs">
                            {userA.avatar ? (
                              <img src={userA.avatar} alt={userA.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full bg-[#8C8475] text-white text-[10px] font-bold flex items-center justify-center">{userA.shortName}</span>
                            )}
                          </div>
                          <span>{userA.displayName} 的代墊細目</span>
                        </div>
                        <span className="font-sans tabular-nums font-bold text-[#8C8475] whitespace-nowrap">
                          {records.filter(r => r.month === settlementMonth && isUserAPayer(r.payer) && r.type.includes('支出')).length} 筆
                        </span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {records.filter(r => r.month === settlementMonth && isUserAPayer(r.payer) && r.type.includes('支出')).length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-[#A59F94] font-light whitespace-nowrap">本月份無{userA.displayName}之代墊</div>
                        ) : (
                          records.filter(r => r.month === settlementMonth && isUserAPayer(r.payer) && r.type.includes('支出')).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-xs bg-[#FAF9F5]/50 hover:bg-white p-2.5 rounded-xl transition-all border border-[#F2EDE1] gap-2">
                              <div className="space-y-0.5 flex-grow min-w-0 pr-1">
                                <div className="font-bold text-[#3E3A36] leading-snug truncate">{r.item}</div>
                                <div className="font-sans tabular-nums text-[9px] text-[#9A948C] whitespace-nowrap">📅 {r.date || `${r.month}-01`}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-sans tabular-nums font-bold text-[#4D4942] whitespace-nowrap">$ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}</span>
                                <button 
                                  onClick={() => handleDelete(r.id)}
                                  className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                  title="移除此筆錯誤紀錄"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* userB 的明細 */}
                    <div className={`backdrop-blur-md rounded-2xl p-5 border space-y-3 shadow-xs transition-all ${
                      userB.isPendingBinding
                        ? 'bg-neutral-50/70 border-neutral-300/80 border-dashed'
                        : 'bg-white/60 border-[#EEEDE3]'
                    }`}>
                      <div className="flex items-center justify-between border-b border-[#F2F1EC] pb-2 font-medium text-xs text-[#5C564E] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-[#DDD8CD] shrink-0 bg-[#FAF9F5] shadow-2xs flex items-center justify-center">
                            {userB.isPendingBinding ? (
                              <span className="w-full h-full bg-neutral-300 text-neutral-800 text-[10px] font-bold flex items-center justify-center">待</span>
                            ) : userB.avatar ? (
                              <img src={userB.avatar} alt={userB.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full bg-[#C1B79E] text-white text-[10px] font-bold flex items-center justify-center">{userB.shortName}</span>
                            )}
                          </div>
                          <span>
                            {userB.isPendingBinding ? '待確認伴侶 (等待受邀)' : userB.displayName} 的代墊細目
                          </span>
                          {userB.isPendingBinding && (
                            <span className="text-[9px] bg-neutral-900 text-white px-1.5 py-0.2 rounded font-bold shadow-2xs">
                              反白待定
                            </span>
                          )}
                        </div>
                        <span className="font-sans tabular-nums font-bold text-[#8C8475] whitespace-nowrap">
                          {records.filter(r => r.month === settlementMonth && isUserBPayer(r.payer) && r.type.includes('支出')).length} 筆
                        </span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {records.filter(r => r.month === settlementMonth && isUserBPayer(r.payer) && r.type.includes('支出')).length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-[#A59F94] font-light whitespace-nowrap">
                            本月份無{userB.isPendingBinding ? '待確認伴侶' : userB.displayName}之代墊
                          </div>
                        ) : (
                          records.filter(r => r.month === settlementMonth && isUserBPayer(r.payer) && r.type.includes('支出')).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-xs bg-[#FAF9F5]/50 hover:bg-white p-2.5 rounded-xl transition-all border border-[#F2EDE1] gap-2">
                              <div className="space-y-0.5 flex-grow min-w-0 pr-1">
                                <div className="font-bold text-[#3E3A36] leading-snug truncate">{r.item}</div>
                                <div className="font-sans tabular-nums text-[9px] text-[#9A948C] whitespace-nowrap">📅 {r.date || `${r.month}-01`}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-sans tabular-nums font-bold text-[#4D4942] whitespace-nowrap">$ {(Number(r?.amount) || 0).toLocaleString('zh-TW')}</span>
                                <button 
                                  onClick={() => handleDelete(r.id)}
                                  className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                  title="移除此筆錯誤紀錄"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 隱密部署與連線設定按鈕 */}
                  <div className="pt-6 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsDeployModalOpen(true)}
                      className="text-[10px] text-[#A59F94]/40 hover:text-[#5C564E] transition-all flex items-center gap-1 cursor-pointer opacity-40 hover:opacity-100 py-1 px-2.5 rounded-lg border border-transparent hover:border-[#E8E4D9] hover:bg-white/60"
                      title="系統部署與進階設定"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>進階部署與一鍵複製代碼</span>
                    </button>
                  </div>
                </div>
              </motion.div>
                )
              )
            )}

            {/* 🛒 購物清單 (生活模式) / ✈️ 旅遊分帳 (代墊借還模式) */}
            {activeTab === 'notebook' && (
              appMode === 'split' ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="inline-flex p-1 bg-[#EBE8E0]/70 rounded-2xl border border-[#DDD9CE]">
                      <button
                        type="button"
                        onClick={() => setSplitNotebookSubTab('travel')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          splitNotebookSubTab === 'travel'
                            ? 'bg-white text-[#3E3A36] shadow-2xs'
                            : 'text-[#8C8475] hover:text-[#5C564E]'
                        }`}
                      >
                        ✈️ 旅遊多幣別專案
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitNotebookSubTab('wishlist')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          splitNotebookSubTab === 'wishlist'
                            ? 'bg-white text-[#3E3A36] shadow-2xs'
                            : 'text-[#8C8475] hover:text-[#5C564E]'
                        }`}
                      >
                        🛍️ 待代買願望清單
                      </button>
                    </div>
                  </div>

                  {splitNotebookSubTab === 'travel' ? (
                    <SplitTravelTab
                      key="split-travel"
                      currentUser={currentUser}
                      partnerBindingInfo={partnerBindingInfo}
                      gasWebUrl={gasWebUrl}
                      callGasApi={callGasApi}
                      enqueueSyncItem={enqueueSyncItem}
                      onConvertToSplit={(item) => {
                        handleAddSplitRecord({
                          payer: item.payer,
                          itemName: item.itemName,
                          totalAmount: item.totalAmount,
                          splitMode: 'AA平分'
                        });
                      }}
                      showToast={showToast}
                      isDbConnected={isDbConnected}
                      onOpenGasDeploy={handleOpenGasDeploy}
                    />
                  ) : (
                    <SplitNotebookTab
                      key="split-wishlist"
                      currentUser={currentUser}
                      partnerBindingInfo={partnerBindingInfo}
                      onConvertToSplit={(item) => {
                        handleAddSplitRecord({
                          payer: item.payer,
                          itemName: item.itemName,
                          totalAmount: item.totalAmount,
                          splitMode: 'AA平分'
                        });
                      }}
                      showToast={showToast}
                      isDbConnected={isDbConnected}
                      onOpenGasDeploy={handleOpenGasDeploy}
                    />
                  )}
                </div>
              ) : (
                !isDbConnected ? (
                  renderDbUnconnectedState(
                    "尚未連線至資料庫",
                    "尚未登錄 Google 試算表 Web App API 金鑰，無法讀取或同步待辦採購筆記。請先設定連線金鑰以同步雲端數據。"
                  )
                ) : (
                  <motion.div
                    key="notebook"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6 max-w-4xl mx-auto pb-12"
                  >
                {/* 頂部功能區標題與橫幅 */}
                <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-700/60 text-amber-100 text-[10px] sm:text-[11px] font-bold tracking-wider border border-amber-600/50">
                          🛒 雙人採購記事本
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                        生活採購與待買清單
                      </h2>
                      <p className="text-amber-200/90 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed font-light">
                        區分「剛需需要買」與「心動想要買」，共同管理補貨需求。可點擊項目觀看詳細說明與備註！
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShoppingForm({
                          id: '',
                          category: '需要買',
                          item: '',
                          store: '菜市場',
                          customStore: '',
                          deadline: '儘快',
                          customDeadline: '',
                          status: '待購買',
                          creator: defaultPayerName,
                          createdTime: '',
                          note: ''
                        });
                        setIsAddShoppingOpen(true);
                      }}
                      className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-amber-900 hover:bg-amber-50 rounded-xl sm:rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-amber-700 stroke-[3]" />
                      <span>新增採購記事</span>
                    </button>
                  </div>
                </div>

                {/* 篩選與搜尋列 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-[#EAE7DF] shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* 頁籤開關 (可平滑橫向滾動) */}
                    <div className="flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E4D9] w-full sm:w-auto overflow-x-auto scrollbar-none gap-1">
                      <button
                        onClick={() => setShoppingFilter('all')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'all' ? 'bg-white text-[#3E3A36] shadow-2xs border border-[#E0DCD0]' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        全部待買 ({shoppingItems.filter(i => i.status === '待購買').length})
                      </button>
                      <button
                        onClick={() => setShoppingFilter('need')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'need' ? 'bg-rose-50 text-rose-800 shadow-2xs border border-rose-200' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        需要買 ({shoppingItems.filter(i => i.category === '需要買' && i.status === '待購買').length})
                      </button>
                      <button
                        onClick={() => setShoppingFilter('want')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'want' ? 'bg-amber-50 text-amber-800 shadow-2xs border border-amber-200' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        想要買 ({shoppingItems.filter(i => i.category === '想要買' && i.status === '待購買').length})
                      </button>
                      <button
                        onClick={() => setShoppingFilter('done')}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                          shoppingFilter === 'done' ? 'bg-emerald-50 text-emerald-800 shadow-2xs border border-emerald-200' : 'text-[#8C8475] hover:text-[#3E3A36]'
                        }`}
                      >
                        已買到 ({shoppingItems.filter(i => i.status === '已買到').length})
                      </button>
                    </div>

                    {/* 搜尋框與清空按鈕 */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      {shoppingFilter === 'done' && shoppingItems.some(i => i.status === '已買到') && (
                        <button
                          onClick={() => setIsClearDoneConfirmOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>清空已購 ({shoppingItems.filter(i => i.status === '已買到').length})</span>
                        </button>
                      )}
                      <div className="relative w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A39E92]" />
                        <input
                          type="text"
                          placeholder="搜尋品項/門市..."
                          value={shoppingSearch}
                          onChange={(e) => setShoppingSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F5] border border-[#E5E1D7] rounded-xl text-xs text-[#3E3A36] focus:outline-none focus:border-[#8C8475] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 門市 Chips 快速標籤 */}
                  {shoppingStores.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs no-scrollbar">
                      <span className="text-[11px] text-[#8C8475] shrink-0 font-bold mr-0.5 inline-flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-amber-800" />
                        <span>地點門市：</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedStoreFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 font-bold inline-flex items-center ${
                          selectedStoreFilter === 'all'
                            ? 'bg-[#4D4942] text-white shadow-2xs'
                            : 'bg-[#F2EFE9] text-[#6C675F] hover:bg-[#E5E1D7]'
                        }`}
                      >
                        全部地點
                      </button>
                      {shoppingStores.map((st) => {
                        const isSelected = selectedStoreFilter === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSelectedStoreFilter(isSelected ? 'all' : st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 font-bold ${
                              isSelected
                                ? 'bg-amber-700 text-white shadow-2xs'
                                : 'bg-[#F2EFE9] text-[#6C675F] hover:bg-[#E5E1D7] hover:text-amber-900'
                            }`}
                          >
                            <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-100' : 'text-[#8C8475]'}`} />
                            <span className="whitespace-nowrap">{st}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 購物清單卡片列表 */}
                <div className="space-y-3">
                  {filteredShoppingItems.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-[#EAE7DF] shadow-xs">
                      <div className="w-12 h-12 rounded-full bg-[#FAF9F5] flex items-center justify-center mx-auto mb-3 text-2xl">
                        🛒
                      </div>
                      <h3 className="text-sm font-semibold text-[#3E3A36]">目前沒有符合條件的採購項目</h3>
                      <p className="text-xs text-[#8C8475] mt-1 max-w-xs mx-auto">
                        您可以點擊畫面下方「＋」按鈕新增，或使用代墊頁面的「智慧指令盒」快速入單！
                      </p>
                      <button
                        onClick={() => {
                          setAddModalType('shopping');
                          setIsAddOpen(true);
                        }}
                        className="mt-4 px-4 py-2 rounded-xl bg-[#4D4942] text-white text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增採購記事</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredShoppingItems.map((item) => {
                        const isDone = item.status === '已買到';
                        const isNeed = item.category === '需要買';

                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            onClick={() => setSelectedShoppingDetail(item)}
                            className={`bg-white rounded-2xl p-4 border transition-all duration-200 relative group flex flex-col justify-between cursor-pointer ${
                              isDone 
                                ? 'border-[#EAE7DF] bg-[#FAF9F6]/80 opacity-75 hover:opacity-95' 
                                : isNeed 
                                  ? 'border-rose-200/80 hover:border-rose-300 shadow-2xs hover:shadow-md' 
                                  : 'border-amber-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                {/* 分類 Tag */}
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isNeed
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-500' : isNeed ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                  {isDone ? '已採購完成' : item.category}
                                </span>

                                {/* 操作按鈕區：鉛筆編輯 + 刪除 */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditShopping(item);
                                    }}
                                    className="text-[#A39E92] hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="編輯此採購項目"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteShoppingItem(item.id, item.item);
                                    }}
                                    className="text-[#A39E92] hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="刪除此紀錄"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* 品項與 Checkbox */}
                              <div className="flex items-start gap-3 my-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleShoppingStatus(item.id, item.status);
                                  }}
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-[#CBD5E1] hover:border-amber-500 bg-white text-transparent hover:text-amber-300'
                                  }`}
                                  title={isDone ? '標記為待購買' : '標記為已買到'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-semibold text-[#3E3A36] truncate max-w-[180px] min-[360px]:max-w-[240px] sm:max-w-md ${isDone ? 'line-through text-[#8C8475]' : ''}`} title={item.item}>
                                    {item.item}
                                  </h4>

                                  {/* 商店、期限與備註提示 */}
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#7A7469]">
                                    <span className="bg-[#F5F3ED] px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-[#E8E4D9] shrink-0 font-medium">
                                      <MapPin className="w-3 h-3 text-[#8C8475] shrink-0" /><span className="truncate max-w-[120px]">{item.store || '隨意'}</span>
                                    </span>
                                    <span className="bg-[#F5F3ED] px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-[#E8E4D9] shrink-0 font-medium">
                                      <Clock className="w-3 h-3 text-[#8C8475] shrink-0" /><span className="truncate max-w-[120px]">{item.deadline || '儘快'}</span>
                                    </span>
                                    {item.note && item.note.trim() !== '' && (
                                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 shrink-0">
                                        <FileText className="w-3 h-3 text-amber-700 shrink-0" /><span>附備註</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* 詳細備註預覽區塊 */}
                                  {item.note && item.note.trim() !== '' && (
                                    <div className="mt-2.5 px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E8E4D9] rounded-xl text-xs text-[#5C564E] flex items-start gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2 break-all">{item.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 底部時間與詳情按鈕 */}
                            <div className="mt-3 pt-2 border-t border-[#F3F0E6] flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#A39E92]">
                              <span className="truncate max-w-[200px] sm:max-w-none">
                                登記人：{item.creator || '夥伴'}
                                {(() => {
                                  const displayTime = getShoppingItemDisplayTime(item);
                                  return displayTime ? ` · ${displayTime}` : '';
                                })()}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                {isDone && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConvertShoppingToRecord(item);
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95 whitespace-nowrap"
                                    title="一鍵將此已購項目轉為記帳支出"
                                  >
                                    <CreditCard className="w-3 h-3 text-amber-700" />
                                    <span>轉記代墊</span>
                                  </button>
                                )}
                                <span className="text-amber-800 font-semibold group-hover:underline flex items-center gap-0.5 text-[11px] whitespace-nowrap">
                                  <span>詳情</span><ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
                )
              )
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 底部浮動合計看板 (依據當前模式：公積金模式顯示當月代墊累計，代墊借還模式顯示即時未結淨額與雙方先付) */}
      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'history') && !isFloatingBarDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-[calc(100%-2rem)] backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.25)] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 ${
              appMode === 'split'
                ? 'bg-[#2D2825]/95 border border-rose-900/50 shadow-[0_8px_25px_rgba(225,29,72,0.2)]'
                : 'bg-[#4D4942]/95 border border-[#5C564E]'
            }`}
          >
            {appMode === 'split' ? (
              // 💳 代墊借還模式專屬懸浮看板
              <>
                <div className="text-[10px] sm:text-xs text-[#E8DFC8] font-bold tracking-wider flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span>
                    {(splitSummary?.unsettledCount || 0) > 0
                      ? `未結代墊 (${splitSummary.unsettledCount}筆)：`
                      : '代墊狀態：'}
                  </span>
                </div>

                <div className="flex gap-2 sm:gap-3 items-center shrink-0">
                  {(splitSummary?.unsettledCount || 0) === 0 ? (
                    <span className="text-emerald-400 text-[11px] sm:text-xs font-bold whitespace-nowrap">
                      ✨ 目前已全部結清
                    </span>
                  ) : (
                    <>
                      <div className="text-[10px] sm:text-xs text-white/90 whitespace-nowrap hidden sm:block">
                        {userA.shortName}代墊: <span className="font-sans tabular-nums font-bold text-rose-300">$ {(Number(splitSummary?.zhouOwesLiao) || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/90 whitespace-nowrap hidden sm:block">
                        {userB.shortName}代墊: <span className="font-sans tabular-nums font-bold text-rose-300">$ {(Number(splitSummary?.liaoOwesZhou) || 0).toLocaleString()}</span>
                      </div>

                      {/* 淨結算方向按鈕，點擊可直接開啟對帳彈窗 */}
                      <button
                        type="button"
                        onClick={() => setIsSplitSettleModalOpen(true)}
                        className="cursor-pointer transition-all active:scale-95"
                        title="點擊開啟結算對帳"
                      >
                        {isUserBPayer(splitSummary?.netDebtor) ? (
                          <span className="bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1">
                            <span>{userB.shortName}應還{userA.shortName}</span>
                            <span className="font-sans tabular-nums text-white">$ {(Number(splitSummary?.netAmount) || 0).toLocaleString()}</span>
                          </span>
                        ) : isUserAPayer(splitSummary?.netDebtor) ? (
                          <span className="bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1">
                            <span>{userA.shortName}應還{userB.shortName}</span>
                            <span className="font-sans tabular-nums text-white">$ {(Number(splitSummary?.netAmount) || 0).toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap">
                            雙方金額持平
                          </span>
                        )}
                      </button>
                    </>
                  )}

                  {/* 關閉按鈕 */}
                  <button
                    onClick={() => {
                      setIsFloatingBarDismissed(true);
                      showToast('已暫時收合代墊看板，可點擊右下角圖示重新展開', 'info');
                    }}
                    className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none p-1"
                    title="暫時收合看板"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              // 💰 公積金模式專屬懸浮看板
              <>
                <div className="text-[10px] sm:text-xs text-[#DDD9CE] font-bold tracking-wider flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D5CDBC]" />
                  <span>{latestMonth} 月公積金代墊：</span>
                </div>
                <div className="flex gap-2 sm:gap-3.5 items-center shrink-0">
                  <div className="text-[11px] sm:text-xs text-white whitespace-nowrap">
                    {userA.shortName}: <span className="font-sans tabular-nums font-bold text-[#EFC38E]">$ {(Number(liaoLatestTotal) || 0).toLocaleString('zh-TW')}</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-white whitespace-nowrap">
                    {userB.shortName}: <span className="font-sans tabular-nums font-bold text-[#EFC38E]">$ {(Number(zhouLatestTotal) || 0).toLocaleString('zh-TW')}</span>
                  </div>
                  
                  {/* 關閉按鈕 */}
                  <button
                    onClick={() => {
                      setIsFloatingBarDismissed(true);
                      showToast('已暫時收合累計代墊，可點擊右下角錢包圖示重新展開', 'info');
                    }}
                    className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-bold leading-none p-1"
                    title="暫時關閉看板"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 迷你懸浮錢包小按鈕 (當合計看板被收合時顯示於右下角) */}
      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'history') && isFloatingBarDismissed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsFloatingBarDismissed(false)}
            className={`fixed bottom-[88px] right-4 z-30 w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-95 ${
              appMode === 'split'
                ? 'bg-[#2D2825]/95 hover:bg-[#3D3531] border border-rose-900/60 shadow-rose-950/20'
                : 'bg-[#4D4942]/95 hover:bg-[#3E3A35] border border-[#5C564E]'
            }`}
            title={appMode === 'split' ? '展開代墊借還看板' : '展開累計代墊'}
          >
            {appMode === 'split' ? (
              <ArrowRightLeft className="w-5 h-5 text-rose-400" />
            ) : (
              <Wallet className="w-5 h-5 text-[#EFC38E]" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* 💬 智慧對話記帳懸浮圓形按鈕 */}
      <FloatingChatButton
        isOpen={isChatAssistantOpen}
        onClick={() => setIsChatAssistantOpen(true)}
        unreadCount={incomingUnreadCount}
      />

      {/* 💬 智慧對話記帳小秘書 Drawer / Modal (語音輸入與即時記帳) */}
      <ChatAssistantDrawer
        isOpen={isChatAssistantOpen}
        onClose={() => setIsChatAssistantOpen(false)}
        onExecuteCommand={handleExecuteSmartCommand}
        onUndo={handleUndoCommandItem}
        appMode={appMode}
        notifications={notifications}
        currentUser={currentUser}
        onMarkRead={markNotificationAsRead}
        onMarkAllRead={markAllNotificationsAsRead}
        onDeleteNotification={deleteNotification}
        onClearAllNotifications={clearAllTodayNotifications}
        notifySettings={appNotifySettings}
        setAllNotifySettings={setAllAppNotifySettings}
        toggleNotifySetting={toggleAppNotifySetting}
        onTestNotification={handleTestInAppNotify}
      />

      {/* ⚙️ 統一系統設定與帳戶中心 Modal (Profile / GAS / Backup / PWA) */}
      <UnifiedSettingsModal
        isOpen={isUnifiedSettingsModalOpen}
        onClose={() => setIsUnifiedSettingsModalOpen(false)}
        currentUser={currentUser}
        isGuestMode={isGuestMode}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        onLoginGoogle={handleReturnToLoginPortal}
        onOpenGasDeploy={handleOpenGasDeploy}
        gasWebUrl={gasWebUrl}
        deploySheetUrl={deploySheetUrl}
        isSandboxMode={isSandboxMode}
        onToggleSandboxMode={handleToggleSandboxMode}
        onOpenDataBackup={() => setIsDataBackupOpen(true)}
        onOpenPwaInstall={() => setIsPwaInstallModalOpen(true)}
        currentInviteCode={currentInviteCode}
        onGenerateNewInviteCode={handleGenerateNewInviteCode}
        onCopyInviteShare={handleCopyInviteShare}
        partnerBindingInfo={partnerBindingInfo}
        onUnbindPartner={handleUnbindPartner}
        onBindPartnerInvite={handleBindPartnerInvite}
        onUpdateNickname={handleUpdateNickname}
        onSyncGoogleAvatar={handleSyncGoogleAvatar}
        pendingQueueCount={pendingSyncQueue.length}
        isOnline={isOnline}
        lastSyncedAt={lastSyncedAt}
        notifySettings={appNotifySettings}
        setAllNotifySettings={setAllAppNotifySettings}
        toggleNotifySetting={toggleAppNotifySetting}
        onTestNotification={handleTestInAppNotify}
        onOpenVersionInfo={() => setIsVersionInfoModalOpen(true)}
      />

      {/* 🏷️ 系統版本與運行環境資訊 Modal */}
      <VersionInfoModal
        isOpen={isVersionInfoModalOpen}
        onClose={() => setIsVersionInfoModalOpen(false)}
        isSandboxMode={isSandboxMode}
        isGuestMode={isGuestMode}
        isDevUser={currentUser?.isDevSandbox}
        gasWebUrl={gasWebUrl}
        onOpenDatabaseSettings={handleOpenGasDeploy}
        onToggleDevSandbox={() => handleToggleSandboxMode(!isSandboxMode)}
      />

      {/* 進入網頁時的超支/省錢警告通知彈窗 */}
      <SmartAlertModal
        isOpen={showLoadAlertModal}
        onClose={() => setShowLoadAlertModal(false)}
        smartAlerts={smartAlerts}
      />

      {/* 🛠️ 自訂極簡無印風雙鍵對話確認 Modal */}
      <CustomConfirmModal
        state={customConfirmState}
        onClose={() => setCustomConfirmState(null)}
      />

      

      {/* 🎯 螢幕中央快速動畫 HUD 通知 (CenterToast) */}
      <CenterToast toast={toast} />

      {/* 底部功能列 Floating Dock (含更多設定入口) */}
      <FloatingDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appMode={appMode}
        onOpenAdd={() => {
          if (appMode === 'split') {
            setIsSplitAddOpen(true);
          } else {
            setIsAddOpen(true);
          }
        }}
        unsettledCount={splitSummary.unsettledCount}
        pendingShoppingCount={shoppingItems.filter(i => i.status === '待購買').length}
        onOpenSettings={() => setIsUnifiedSettingsModalOpen(true)}
        hasSettingsAlert={!gasWebUrl || pendingSyncQueue.length > 0}
      />

      {/* 💳 代墊分帳專屬 Modals */}
      <SplitAddModal
        isOpen={isSplitAddOpen}
        onClose={() => {
          setIsSplitAddOpen(false);
          setSplitAddInitialData(undefined);
        }}
        initialData={splitAddInitialData}
        onAddSplit={handleAddSplitRecord}
        onSubmit={handleAddSplitRecord}
        showToast={showToast}
        currentUser={currentUser}
        partnerBindingInfo={partnerBindingInfo}
      />

      <SplitSettleModal
        isOpen={isSplitSettleModalOpen}
        onClose={() => setIsSplitSettleModalOpen(false)}
        summary={splitSummary}
        onConfirmSettle={handleSettleAllSplitRecords}
        onSettle={handleSettleAllSplitRecords}
        currentUser={currentUser}
        partnerBindingInfo={partnerBindingInfo}
      />

      {/* 快速新增項目 Modal (含記帳代墊與購物記事雙模式) */}
      <AddRecordModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        addModalType={addModalType}
        setAddModalType={setAddModalType}
        formData={formData}
        setFormData={setFormData}
        onSubmitRecord={handleSubmit}
        exchangeRates={exchangeRates}
        shoppingForm={shoppingForm}
        setShoppingForm={setShoppingForm}
        onSubmitShopping={handleAddShoppingSubmit}
        shoppingStores={shoppingStores}
        onOpenManageStores={() => setIsManageStoresOpen(true)}
        currentUser={currentUser}
      />

      {/* 🛒 新增/編輯採購項目專屬 Modal */}
      <AddShoppingModal
        isOpen={isAddShoppingOpen}
        onClose={() => setIsAddShoppingOpen(false)}
        shoppingForm={shoppingForm}
        setShoppingForm={setShoppingForm}
        onSubmitShopping={handleAddShoppingSubmit}
        shoppingStores={shoppingStores}
        onOpenManageStores={() => setIsManageStoresOpen(true)}
        currentUser={currentUser}
      />

      {/* 🏪 管理常用商店 Modal */}
      <ManageStoresModal
        isOpen={isManageStoresOpen}
        onClose={() => setIsManageStoresOpen(false)}
        shoppingStores={shoppingStores}
        isAddStoreInput={isAddStoreInput}
        setIsAddStoreInput={setIsAddStoreInput}
        onAddStore={handleAddStore}
        onDeleteStore={handleDeleteStore}
      />

      {/* 🗑️ 清空已購項目確認 Modal */}
      <ClearDoneConfirmModal
        isOpen={isClearDoneConfirmOpen}
        onClose={() => setIsClearDoneConfirmOpen(false)}
        doneCount={shoppingItems.filter(i => i.status === '已買到').length}
        shoppingItems={shoppingItems}
        onConfirm={handleClearDoneShopping}
      />

      {/* 🔍 採購項目詳情與備註 Modal */}
      <ShoppingDetailModal
        item={selectedShoppingDetail}
        onClose={() => setSelectedShoppingDetail(null)}
        onEdit={(item) => {
          setSelectedShoppingDetail(null);
          handleOpenEditShopping(item);
        }}
        onToggleStatus={handleToggleShoppingStatus}
        onDelete={handleDeleteShoppingItem}
        onConvertToRecord={handleConvertShoppingToRecord}
      />

      {/* ✈️ 各國即時匯率與出國幣值試算器 Modal */}
      <CurrencyCalculatorModal
        isOpen={showTravelCalculatorModal}
        onClose={() => setShowTravelCalculatorModal(false)}
        exchangeRates={exchangeRates}
        ratesLastUpdated={ratesLastUpdated}
        isRateLoading={isRateLoading}
        rateFetchError={rateFetchError}
        onRefreshRates={() => fetchLiveExchangeRates(true)}
        calcBaseCurrency={calcBaseCurrency}
        setCalcBaseCurrency={setCalcBaseCurrency}
        calcInputAmount={calcInputAmount}
        setCalcInputAmount={setCalcInputAmount}
        calcMode={calcMode}
        setCalcMode={setCalcMode}
      />

        {/* 💬 App 內建即時通知開關與偏好設定 Modal */}
        <AppNotificationModal
          isOpen={isAppNotifyModalOpen}
          onClose={() => setIsAppNotifyModalOpen(false)}
          isTestingNotify={false}
          handleTestNotify={handleTestInAppNotify}
          notifySettings={appNotifySettings}
          setAllNotifySettings={setAllAppNotifySettings}
          toggleNotifySetting={toggleAppNotifySetting}
          notifications={notifications}
          currentUser={currentUser}
          onMarkRead={markNotificationAsRead}
          onMarkAllRead={markAllNotificationsAsRead}
          onDeleteNotification={deleteNotification}
          onClearAllNotifications={clearAllTodayNotifications}
        />

        {/* 💾 資料備份、還原與離線同步管理 Modal */}
        <DataBackupModal
          isOpen={isDataBackupOpen}
          onClose={() => setIsDataBackupOpen(false)}
          records={records}
          shoppingItems={shoppingItems}
          shoppingStores={shoppingStores}
          splitItems={splitItems}
          isOnline={isOnline}
          lastSyncedAt={lastSyncedAt}
          onRestoreData={handleRestoreData}
          onSyncAll={handleSyncAll}
          isSyncing={isSyncingGas}
          isAdmin={!(currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail))}
          isPartner={currentUser?.userRole === 'partner' || Boolean(currentUser?.adminEmail)}
        />

        {/* 📱 PWA 手機桌面安裝與引導 Modal */}
        <PwaInstallModal
          isOpen={isPwaInstallModalOpen}
          onClose={() => setIsPwaInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstalled={() => {
            showToast('🎉 伴伴記已成功安裝至主畫面！', 'success');
            setDeferredPrompt(null);
          }}
        />

        {/* 👤 使用者帳戶與情侶伴侶權限管理 Modal */}
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => setIsUserProfileModalOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchAccount={handleSwitchAccount}
          onOpenGasDeploy={() => openUnifiedDatabaseModal('settings')}
          isSandboxMode={isSandboxMode}
          onToggleSandboxMode={handleToggleSandboxMode}
          gasWebUrl={gasWebUrl}
          deploySheetUrl={deploySheetUrl}
          currentInviteCode={currentInviteCode}
          onGenerateNewInviteCode={handleGenerateNewInviteCode}
          onCopyInviteShare={handleCopyInviteShare}
          partnerBindingInfo={partnerBindingInfo}
          onUnbindPartner={handleUnbindPartner}
          onBindPartnerInvite={handleBindPartnerInvite}
          hasDatabaseBound={Boolean(gasWebUrl && gasWebUrl.startsWith('http'))}
          onOpenDatabaseOnboarding={() => openUnifiedDatabaseModal('wizard')}
          onUpdateNickname={handleUpdateNickname}
          onSyncGoogleAvatar={handleSyncGoogleAvatar}
        />

        {/* 🚀 整合式資料庫設定與引導小精靈 Modal (整合精靈、設定、Code.gs 與邀請碼) */}
        <UnifiedDatabaseModal
          isOpen={isUnifiedDatabaseOpen}
          onClose={() => setIsUnifiedDatabaseOpen(false)}
          currentUser={currentUser}
          gasWebUrl={gasWebUrl}
          setGasWebUrl={setGasWebUrl}
          deploySheetUrl={deploySheetUrl}
          setDeploySheetUrl={setDeploySheetUrl}
          saveDeployConfig={saveDeployConfig}
          customizedCodeGs={getCustomizedCodeGs()}
          currentInviteCode={currentInviteCode}
          onGenerateNewInviteCode={handleGenerateNewInviteCode}
          onCopyInviteShare={handleCopyInviteShare}
          onBindPartnerInvite={handleBindPartnerInvite}
          partnerBindingInfo={partnerBindingInfo}
          onUnbindPartner={handleUnbindPartner}
          onResetAccountDatabase={handleResetAccountDatabase}
          isSandboxMode={isSandboxMode}
          onToggleSandboxMode={handleToggleSandboxMode}
          initialTab={unifiedDatabaseTab}
          initialWizardRole={unifiedDatabaseRole}
        />

        {/* 🛠️ 系統整體設定與開發控制中心 Modal */}
        <DeveloperSettingsModal
          isOpen={isDevSettingsModalOpen}
          onClose={() => setIsDevSettingsModalOpen(false)}
          currentUser={currentUser}
          onResetDevData={handleResetDevData}
          onSeedSampleData={handleSeedSampleData}
          onExitDevMode={handleExitDevMode}
          onSyncToProduction={handleSyncToProduction}
          isProductionReady={isProductionReady}
        />


      {/* Footer 簡介 */}
      <footer className="w-full text-center py-4 border-t border-[#EEEDE8] bg-[#EEEDE9]/30 text-xs text-[#999489] font-light mt-auto pb-16 sm:pb-20">
        <p>©2026公積金記帳系統｜Designed by YIN-CHENG</p>
      </footer>
    </div>
  );
}
