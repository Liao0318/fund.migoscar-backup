import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Loader2,
  Check,
  HelpCircle,
  X,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  CloudCheck,
  UserCheck,
  Terminal,
  Key,
  Eye,
  EyeOff,
  Rocket,
  Sliders,
  Palette,
  Heart,
  UserPlus
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { AuthUser, PartnerInviteData } from '../../types';
import { APP_VERSION, APP_BUILD_DATE, APP_NAME } from '../../version';
import { 
  signInWithGooglePopup, 
  requestGoogleOAuthToken
} from '../../utils/googleOAuthService';
import { 
  fetchPartnerBindingInfoOnline, 
  getActiveInviteCode,
  parseInviteFromCurrentUrl,
  fetchInviteCodeOnline,
  clearPendingInvite
} from '../../utils/partnerInvite';
import { getUserCloudConfig, scanAndRecoverGasUrl } from '../../utils/userConfigService';
import { hasBackendServer } from '../../utils/environment';

interface GoogleAuthPortalProps {
  onLogin: (user: AuthUser, partnerInvite?: PartnerInviteData | null, initialCloudGasUrl?: string, initialCloudSheetUrl?: string) => void;
  onEnterDevSandbox?: () => void;
  onEnterGuestMode?: () => void;
}

export const GoogleAuthPortal: React.FC<GoogleAuthPortalProps> = ({
  onLogin,
  onEnterDevSandbox,
  onEnterGuestMode
}) => {
  // DEV 與上路正式系統切換（預設依前次存取或上路系統）
  const [activePortalTab, setActivePortalTab] = useState<'prod' | 'dev'>(() => {
    try {
      return localStorage.getItem('banban_active_system_env') === 'dev' ? 'dev' : 'prod';
    } catch (e) {
      return 'prod';
    }
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberAccount, setRememberAccount] = useState<boolean>(() => {
    try {
      return localStorage.getItem('banban_remember_login') !== 'false';
    } catch (e) {
      return true;
    }
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSignUpNotice, setShowSignUpNotice] = useState(false);
  
  // 💌 伴侶邀請代碼即時檢測與甜蜜橫幅
  const [detectedInvite, setDetectedInvite] = useState<PartnerInviteData | null>(null);
  const [detectedRawCode, setDetectedRawCode] = useState<string>('');

  useEffect(() => {
    const pending = parseInviteFromCurrentUrl();
    if (pending) {
      if (pending.raw) setDetectedRawCode(pending.raw);
      if (pending.invite) {
        setDetectedInvite(pending.invite);
      } else if (pending.raw) {
        fetchInviteCodeOnline(pending.raw).then((cloudInv) => {
          if (cloudInv) {
            setDetectedInvite(cloudInv);
          }
        }).catch(() => {});
      }
    }
  }, []);

  // 開發通道通行碼（安全脫敏）
  const [showDevPasswordModal, setShowDevPasswordModal] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devPasswordError, setDevPasswordError] = useState<string | null>(null);
  const [showDevPasswordText, setShowDevPasswordText] = useState(false);

  const toggleRememberAccount = () => {
    const nextVal = !rememberAccount;
    setRememberAccount(nextVal);
    try {
      localStorage.setItem('banban_remember_login', String(nextVal));
    } catch (e) {}
  };

  /**
   * 處理成功登入流程，自動連結雲端帳本配置
   */
  const processSuccessfulUser = async (rawUser: AuthUser) => {
    let cloudGas = '';
    let cloudSheet = '';
    let savedNickname = '';
    const cleanEmail = (rawUser.email || '').trim().toLowerCase();

    // 1. 🚀 跨裝置唯一真理：優先強制自雲端（Google Drive / Firestore / 伺服器 API）獲取該帳號最新資料庫配置
    try {
      const existingConfig = await getUserCloudConfig(rawUser.email, { forceRefresh: true });
      if (existingConfig) {
        if (existingConfig.gasWebUrl && existingConfig.gasWebUrl.trim().startsWith('http')) {
          cloudGas = existingConfig.gasWebUrl.trim();
        }
        if (existingConfig.deploySheetUrl) {
          cloudSheet = existingConfig.deploySheetUrl.trim();
        }
        if (existingConfig.nickname) {
          savedNickname = existingConfig.nickname;
          if (cleanEmail) {
            try {
              localStorage.setItem(`banban_user_nickname_${cleanEmail}`, savedNickname);
            } catch (e) {}
          }
        }
      }
      
      // 若尚未取得，自動查詢情侶配對紀錄（伴侶或管理者換機同步）
      if (!cloudGas && cleanEmail) {
        const partnerBinding = await fetchPartnerBindingInfoOnline(cleanEmail);
        if (partnerBinding && partnerBinding.gasWebUrl && partnerBinding.gasWebUrl.trim().startsWith('http')) {
          cloudGas = partnerBinding.gasWebUrl.trim();
          cloudSheet = partnerBinding.deploySheetUrl || '';
        }
      }

      // 若尚未取得，反查本機或註冊表中的管理員邀請碼
      if (!cloudGas && cleanEmail) {
        const activeInvite = getActiveInviteCode();
        if (activeInvite && activeInvite.adminEmail?.toLowerCase() === cleanEmail && activeInvite.gasWebUrl) {
          cloudGas = activeInvite.gasWebUrl.trim();
          cloudSheet = activeInvite.deploySheetUrl || '';
        }
      }

      // 1.9 從跨裝置帳本持久化 API 獲取配置與網址
      if (!cloudGas && hasBackendServer() && cleanEmail) {
        try {
          const lRes = await fetch(`/api/user-ledger-data?email=${encodeURIComponent(cleanEmail)}`);
          if (lRes.ok) {
            const lData = await lRes.json();
            if (lData?.success && lData?.data?.gasWebUrl) {
              cloudGas = lData.data.gasWebUrl.trim();
              if (lData.data.deploySheetUrl && !cloudSheet) {
                cloudSheet = lData.data.deploySheetUrl.trim();
              }
            }
          }
        } catch (e) {}
      }

      // 若尚未取得，且在伺服器環境下，直接查詢全系統伺服器資料庫 (跨裝置統一配置)
      if (!cloudGas && hasBackendServer()) {
        try {
          const sysRes = await fetch('/api/system-database');
          if (sysRes.ok) {
            const sysData = await sysRes.json();
            if (sysData?.success && sysData?.database?.gasWebUrl) {
              cloudGas = sysData.database.gasWebUrl.trim();
              if (sysData.database.deploySheetUrl && !cloudSheet) {
                cloudSheet = sysData.database.deploySheetUrl.trim();
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed to load user cloud config:', e);
    }

    // 2. 本地回退：僅在雲端完全查無設定時，才回退讀取本地專屬備援
    if (!cloudGas) {
      try {
        if (cleanEmail) {
          if (!savedNickname) {
            savedNickname = localStorage.getItem(`banban_user_nickname_${cleanEmail}`) || '';
          }
          const userGas = localStorage.getItem(`muji_gas_web_url_${cleanEmail}`);
          const userSheet = localStorage.getItem(`muji_sheet_url_${cleanEmail}`);
          if (userGas && userGas.trim().startsWith('http')) {
            cloudGas = userGas.trim();
          }
          if (userSheet) {
            cloudSheet = userSheet.trim();
          }
        }
        // 深度全域與本機多層級掃描復原
        if (!cloudGas) {
          const recovered = scanAndRecoverGasUrl(cleanEmail);
          if (recovered.gasWebUrl) {
            cloudGas = recovered.gasWebUrl;
            if (recovered.deploySheetUrl && !cloudSheet) {
              cloudSheet = recovered.deploySheetUrl;
            }
          }
        }
      } catch (e) {}
    }

    // 💖 優先解析待綁定之伴侶邀請
    let finalPartnerInvite = detectedInvite;
    if (!finalPartnerInvite && detectedRawCode) {
      try {
        finalPartnerInvite = await fetchInviteCodeOnline(detectedRawCode);
      } catch (e) {}
    }

    // 若伴侶邀請存在且有資料庫設定，使用邀請中的資料庫設定
    if (finalPartnerInvite && finalPartnerInvite.gasWebUrl) {
      if (!cloudGas) cloudGas = finalPartnerInvite.gasWebUrl;
      if (!cloudSheet && finalPartnerInvite.deploySheetUrl) cloudSheet = finalPartnerInvite.deploySheetUrl;
    }

    const enhancedUser: AuthUser = {
      ...rawUser,
      nickname: savedNickname || rawUser.nickname,
      authMethod: 'google_oauth'
    };

    onLogin(enhancedUser, finalPartnerInvite, cloudGas, cloudSheet);
  };

  /**
   * 觸發 Google 官方 OAuth 授權登入流程
   */
  const handleGoogleOfficialOAuthLogin = async () => {
    setErrorMessage(null);
    setIsLoggingIn(true);

    try {
      // 1. 優先透過 Firebase Google 官方彈跳授權視窗登入
      const result = await signInWithGooglePopup();
      if (result && result.user) {
        await processSuccessfulUser(result.user);
        setIsLoggingIn(false);
        return;
      }
    } catch (fbErr: any) {
      console.warn('Firebase signInWithPopup info:', fbErr?.code || fbErr?.message || fbErr);
      
      // 使用者主動取消或關閉視窗
      if (fbErr?.code === 'auth/popup-closed-by-user' || fbErr?.message?.includes('closed-by-user')) {
        setErrorMessage('Google 登入視窗已關閉。請點擊登入按鈕重新進行驗證。');
        setIsLoggingIn(false);
        return;
      }

      // 2. 嘗試使用 Google GSI 官方授權視窗 (Google Identity Services)
      try {
        const gsiResult = await requestGoogleOAuthToken();
        if (gsiResult && gsiResult.user) {
          await processSuccessfulUser(gsiResult.user);
          setIsLoggingIn(false);
          return;
        }
      } catch (gsiErr: any) {
        console.warn('Google GSI Token Client error:', gsiErr);
        if (gsiErr?.message?.includes('popup_closed_by_user') || gsiErr?.type === 'popup_closed') {
          setErrorMessage('Google 登入視窗已關閉，請再次點擊登入。');
        } else {
          setErrorMessage('無法開啟 Google 授權頁面，請確認瀏覽器是否允許快顯視窗（Pop-up），並點擊按鈕重試。');
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * 處理開發通道通行碼登入（安全脫敏驗證）
   */
  const handleDevPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDevPasswordError(null);
    const entered = devPasswordInput.trim();
    const storedDevPassword = localStorage.getItem('banban_dev_password') || '1912';

    if (entered && (entered === storedDevPassword || (!localStorage.getItem('banban_dev_password') && entered === '1912'))) {
      setShowDevPasswordModal(false);
      setDevPasswordInput('');
      try {
        localStorage.setItem('banban_active_system_env', 'dev');
      } catch (err) {}
      if (onEnterDevSandbox) {
        onEnterDevSandbox();
      }
    } else {
      setDevPasswordError('通道通行密碼不正確，請重新確認後輸入。');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2E2924] flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-[#F2ECE1]">
      {/* 頂部暖杏與日系自然弧形光暈裝飾 */}
      <div className="absolute top-0 right-0 w-[280px] sm:w-[460px] h-[220px] sm:h-[340px] bg-gradient-to-bl from-[#F6EDE2] via-[#FDF5E6]/60 to-transparent rounded-bl-[100%] opacity-80 pointer-events-none -z-0" />
      <div className="absolute top-16 -left-16 w-56 h-56 bg-[#F5EFE6]/50 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* 主體置中容器 */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-6 sm:px-8 pt-10 sm:pt-14 pb-8 sm:pb-10 z-10 relative">
        
        {/* 🌸 頂部品牌主視覺區 */}
        <div className="text-center pt-2 sm:pt-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* 伴伴記官方專屬 Logo (填滿圓角邊緣，立體鮮明) */}
            <div className="mb-4 relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] sm:rounded-[32px] bg-white shadow-[0_12px_28px_rgba(82,68,54,0.12)] border border-[#EDE5DA] flex items-center justify-center p-0 overflow-hidden transition-transform hover:scale-105">
                <BrandLogo className="w-full h-full" transparent={false} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow-sm font-bold border-2 border-white">
                ♥
              </div>
            </div>

            {/* 品牌名稱 */}
            <h1 className="text-3xl sm:text-4xl font-black text-[#2D2823] tracking-tight font-sans">
              伴伴記
            </h1>
            
            {/* 副標語 */}
            <p className="text-sm sm:text-base font-medium text-[#7D7569] mt-2 tracking-wide">
              情侶公積金與日常甜蜜記帳
            </p>
          </motion.div>
        </div>

        {/* 🧭 系統環境切換：🚀 上路正式系統 ｜ 🛠️ DEV 開發環境 */}
        <div className="flex p-1 bg-[#EDE6DC] rounded-2xl border border-[#DDD5C7] mb-4 sm:mb-5 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setActivePortalTab('prod');
              setErrorMessage(null);
              try {
                localStorage.setItem('banban_active_system_env', 'prod');
              } catch (e) {}
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePortalTab === 'prod'
                ? 'bg-white text-[#2D2823] shadow-xs scale-[1.01]'
                : 'text-[#7D7569] hover:text-[#2D2823]'
            }`}
          >
            <Rocket className="w-4 h-4 text-emerald-700" />
            <span>🚀 上路正式系統</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortalTab('dev');
              setDevPasswordError(null);
              try {
                localStorage.setItem('banban_active_system_env', 'dev');
              } catch (e) {}
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePortalTab === 'dev'
                ? 'bg-[#2E2822] text-amber-300 shadow-xs scale-[1.01]'
                : 'text-[#7D7569] hover:text-[#2D2823]'
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>🛠️ DEV 開發環境</span>
          </button>
        </div>

        {/* 🪟 中央登入卡片區域 */}
        {activePortalTab === 'prod' ? (
          <div className="space-y-4 my-auto py-1">
            {/* 💌 若檢測到伴侶邀請，顯示溫馨伴侶加入卡片 */}
            {(detectedInvite || detectedRawCode) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-rose-50 via-pink-50/80 to-rose-50 border-2 border-rose-300/90 rounded-2xl p-3.5 sm:p-4 text-left shadow-xs space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      <Heart className="w-4 h-4 fill-white animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-rose-950 flex items-center gap-1.5">
                        <span>收到伴侶共同記帳邀請！</span>
                        <span className="text-[10px] bg-rose-200/80 text-rose-800 font-extrabold px-1.5 py-0.2 rounded-full">
                          即將自動配對
                        </span>
                      </h4>
                      <p className="text-[11px] text-rose-800 font-medium">
                        {detectedInvite?.adminName 
                          ? `由「${detectedInvite.adminName}」發起` 
                          : '登入後將自動加入伴侶帳本'}
                        {detectedInvite?.inviteCode ? ` · 代碼 【${detectedInvite.inviteCode}】` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetectedInvite(null);
                      setDetectedRawCode('');
                      clearPendingInvite();
                    }}
                    className="text-[#998F80] hover:text-[#3E3A36] p-1 rounded-lg hover:bg-rose-100/50 cursor-pointer text-xs"
                    title="清除此邀請"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-rose-900/90 bg-white/70 p-2 rounded-xl border border-rose-200/60 leading-relaxed font-medium">
                  ✨ 點擊下方以 Google 帳號登入，系統將<strong>自動完成配對</strong>並載入共同公積金與分帳帳本！
                </div>
              </motion.div>
            )}

            {/* 上路正式系統專屬提示 */}
            {!detectedInvite && !detectedRawCode && (
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 sm:p-3 text-[11px] sm:text-xs text-emerald-950 flex items-center justify-between text-left">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>上路正式系統：情侶真實記帳與雲端同步</span>
                </span>
                <span className="text-[10px] bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 rounded font-bold border border-emerald-300/80 shrink-0">
                  帳號獨立隔離
                </span>
              </div>
            )}

            {/* 主 Google 登入入口卡片 */}
            <div 
              onClick={handleGoogleOfficialOAuthLogin}
              className="w-full bg-white border-2 border-[#E8E1D5] hover:border-amber-700/60 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-[0_4px_16px_rgba(82,68,54,0.04)] hover:shadow-[0_6px_20px_rgba(82,68,54,0.08)] group relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                {/* Google 4 色官方大 Logo 圖標底座 */}
                <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#EDE7DC] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-black text-[#2D2823] tracking-tight group-hover:text-amber-900 transition-colors">
                      以 Google 帳號登入
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#A89F91] group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-[#8A8275] mt-0.5 font-medium truncate">
                    免記密碼・一鍵登入・雲端即時同步
                  </p>
                </div>
              </div>

              {/* 底部功能亮點標籤 */}
              <div className="mt-3.5 pt-3 border-t border-[#F5EFEB] flex items-center justify-between text-[11px] text-[#7A7366]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Google 官方安全驗證
                </span>
                <span className="flex items-center gap-1">
                  <CloudCheck className="w-3.5 h-3.5 text-blue-500" />
                  試算表自動同步
                </span>
                <span className="flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                  情侶雙人協作
                </span>
              </div>
            </div>

            {/* 核取方塊：保持登入狀態 */}
            <div className="pt-1 flex items-center justify-between">
              <label 
                onClick={toggleRememberAccount}
                className="inline-flex items-center gap-2 cursor-pointer select-none group py-1"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  rememberAccount 
                    ? 'bg-amber-800 border-amber-800 text-white' 
                    : 'bg-white border-[#B0A799]'
                }`}>
                  {rememberAccount && (
                    <Check className="w-3 h-3 stroke-[3]" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#544D42] group-hover:text-[#2D2823]">
                  保持登入狀態
                </span>
              </label>

              <span className="text-xs text-[#999083]">
                個人專屬帳本隔離
              </span>
            </div>

            {/* 錯誤警示提示 */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-start gap-2 text-left"
                >
                  <div className="leading-relaxed font-medium">{errorMessage}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 橫排輔助連結：訪客登入 ｜ 使用說明 ｜ 加入會員 */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[#8C7A63] font-bold text-xs sm:text-sm pt-4 select-none">
              <button
                type="button"
                onClick={() => {
                  if (onEnterGuestMode) {
                    onEnterGuestMode();
                  } else {
                    try {
                      localStorage.setItem('banban_is_guest_mode', 'true');
                    } catch (e) {}
                    window.location.reload();
                  }
                }}
                className="hover:text-amber-900 hover:underline cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>訪客登入</span>
              </button>

              <span className="text-[#DDD6CB] font-light">|</span>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="hover:text-amber-900 hover:underline cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>使用說明</span>
              </button>

              <span className="text-[#DDD6CB] font-light">|</span>

              <button
                type="button"
                onClick={() => setShowSignUpNotice(true)}
                className="hover:text-amber-900 hover:underline cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>加入會員</span>
              </button>
            </div>
          </div>
        ) : (
          /* 🛠️ DEV 開發環境專屬通道中央卡片 */
          <div className="space-y-4 my-auto py-1">
            <div className="bg-white border-2 border-purple-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_rgba(75,0,130,0.06)] text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2F2B28] to-[#423D38] flex items-center justify-center text-amber-300 shadow-xs shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#2D2823] tracking-tight">
                    DEV 系統功能與介面設計通道
                  </h3>
                  <p className="text-xs text-[#7A7366] mt-0.5 font-medium">
                    所有功能調整與介面設計均在此進行
                  </p>
                </div>
              </div>

              {/* 隔離安全說明 */}
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/80 text-xs text-purple-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>DEV 與上路正式帳號絕對分離</span>
                </div>
                <p className="text-[11px] text-purple-900/85 leading-relaxed pl-5">
                  此處登入使用獨立 DEV 開發身分，配備專屬模擬數據沙盒，所有操作絕不污染上路正式帳本。
                </p>
              </div>

              {/* 密碼輸入表單 */}
              <form onSubmit={handleDevPasswordSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#4E473D] mb-1.5">
                    請輸入 DEV 通道通行密碼：
                  </label>
                  <div className="relative">
                    <input
                      type={showDevPasswordText ? 'text' : 'password'}
                      value={devPasswordInput}
                      onChange={(e) => setDevPasswordInput(e.target.value)}
                      placeholder="請輸入通道通行密碼"
                      autoFocus
                      className="w-full px-3.5 py-2.5 pr-10 bg-[#FAF8F5] border border-[#D5CDC0] rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-purple-700 focus:bg-white tracking-wider transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDevPasswordText(!showDevPasswordText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9588] hover:text-[#3E3A36] cursor-pointer"
                    >
                      {showDevPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {devPasswordError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium flex items-center gap-1.5">
                    <span>{devPasswordError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2F2B28] to-[#4A433D] hover:from-[#1F1C1A] hover:to-[#38332E] text-amber-300 font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>驗證進入 DEV 開發環境</span>
                </button>
              </form>

              {/* 功能亮點清單 */}
              <div className="pt-2 border-t border-[#F0EBE0] grid grid-cols-2 gap-2 text-[11px] text-[#6E6659]">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>全介面排版與動效即時預覽</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>全功能除錯與上線整備</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 底部主按鈕區域 */}
        <div className="space-y-3 pt-6 sm:pt-8 mt-auto">
          {activePortalTab === 'prod' ? (
            <>
              {/* 主按鈕：以 Google 帳戶快速登入 */}
              <button
                type="button"
                onClick={handleGoogleOfficialOAuthLogin}
                disabled={isLoggingIn}
                className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#3E3A36] hover:bg-[#2C2926] text-white font-black text-base sm:text-lg tracking-wide transition-all cursor-pointer shadow-[0_4px_12px_rgba(62,58,54,0.15)] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-75"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isLoggingIn ? '正在開啟 Google 驗證...' : '使用 Google 帳戶登入'}</span>
              </button>

              {/* 次按鈕：立即訪客體驗 */}
              <button
                type="button"
                onClick={() => {
                  if (onEnterGuestMode) {
                    onEnterGuestMode();
                  } else {
                    try {
                      localStorage.setItem('banban_is_guest_mode', 'true');
                    } catch (e) {}
                    window.location.reload();
                  }
                }}
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#5C5549] border border-[#DDD5C7] font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer shadow-2xs active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>訪客立即試用（免登入）</span>
              </button>

              <div className="text-center pt-2 space-y-1">
                <p className="text-[11px] text-[#A69E91] font-medium leading-relaxed">
                  資料經由 Google 安全連線加密傳輸，不儲存任何明文密碼
                </p>
                <div className="pt-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setDevPasswordError(null);
                      setShowDevPasswordModal(true);
                    }}
                    className="text-[11px] text-[#B0A799] hover:text-[#5C5549] transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-[#F0ECE1]/70"
                    title="系統整體設定與開發工程通道"
                  >
                    <Terminal className="w-3 h-3 text-[#A89F91]" />
                    <span>系統整體設定通道 (Dev)</span>
                  </button>
                </div>

                {/* 🏷️ 系統版本號與環境標記 */}
                <div className="pt-2 text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAE5D9]/80 border border-[#DDD6C8] text-[10px] font-mono text-[#787164]">
                    <span>{APP_NAME}</span>
                    <span className="font-bold text-[#3E3A36]">{APP_VERSION}</span>
                    <span className="text-[#B3ABA0]">|</span>
                    <span>正式雲端版</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* DEV 模式下的底部快速指引 */}
              <button
                type="button"
                onClick={() => {
                  setActivePortalTab('prod');
                }}
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#5C5549] border border-[#DDD5C7] font-bold text-sm tracking-wide transition-all cursor-pointer shadow-2xs active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4 text-emerald-700" />
                <span>返回上路正式系統登入</span>
              </button>
              <div className="text-center pt-1 space-y-1">
                <p className="text-[11px] text-[#9C9486] font-medium">
                  DEV 模式專供介面設計與全功能調校・帳號登入完全獨立隔離
                </p>
                {/* 🏷️ DEV 版本號標記 */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-[10px] font-mono text-purple-900">
                    <span>{APP_NAME}</span>
                    <span className="font-bold">{APP_VERSION}</span>
                    <span>(DEV 測試沙盒)</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* 💡 使用說明彈窗 */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-xs sm:max-w-sm w-full border border-[#EAE4D8] shadow-xl text-left space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-2.5">
                <div className="flex items-center gap-2 font-black text-[#2E2924] text-sm">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>伴伴記・使用說明</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 text-[#8C8475] hover:text-black rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-[#5C564E] leading-relaxed space-y-2.5">
                <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE6DC]">
                  <strong className="text-[#3E3A36] block mb-0.5">🌟 Google 帳戶登入：</strong>
                  支援雲端即時雙向同步、情侶雙人連線記帳、個人代墊對帳與自訂備份。
                </div>
                <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE6DC]">
                  <strong className="text-[#3E3A36] block mb-0.5">🎒 訪客體驗模式：</strong>
                  免登入即可立即體驗記帳、匯率換算、心願清單與旅遊記帳，資料保存在本機瀏覽器。
                </div>
                <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE6DC]">
                  <strong className="text-[#3E3A36] block mb-0.5">💑 伴侶邀請：</strong>
                  登入後由主管理者生成專屬邀請碼，伴侶配對後即可兩人共用同一個公積金帳本。
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full py-2.5 bg-[#3E3A36] hover:bg-[#2C2926] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💡 加入會員說明彈窗 */}
      <AnimatePresence>
        {showSignUpNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-xs sm:max-w-sm w-full border border-[#EAE4D8] shadow-xl text-left space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-2.5">
                <div className="flex items-center gap-2 font-black text-[#2E2924] text-sm">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>加入伴伴記會員</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignUpNotice(false)}
                  className="p-1 text-[#8C8475] hover:text-black rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-[#5C564E] leading-relaxed space-y-2">
                <p>
                  加入會員<strong>完全免費且零門檻</strong>！直接點擊「使用 Google 帳戶登入」，系統即會自動開通專屬帳號與獨立雲端帳本，免除任何繁雜註冊填表手續。
                </p>
                <p className="text-[#8C8475] text-[11px]">
                  開通後即可與另一半配對共享帳本，體驗無縫同步的甜蜜財務管理！
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignUpNotice(false)}
                  className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#EDE8DC] text-[#5C564E] rounded-xl text-xs font-bold border border-[#DDD8CC] transition-all cursor-pointer"
                >
                  稍後再說
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignUpNotice(false);
                    handleGoogleOfficialOAuthLogin();
                  }}
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span>立即以 Google 登入</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔐 隱密開發入口通行碼輸入彈窗（安全脫敏） */}
      <AnimatePresence>
        {showDevPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-xs sm:max-w-sm w-full border border-[#EAE4D8] shadow-xl text-left space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-2.5">
                <div className="flex items-center gap-2 font-black text-[#2E2924] text-sm">
                  <Terminal className="w-4 h-4 text-purple-700" />
                  <span>系統開發與整體設定通道</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDevPasswordModal(false)}
                  className="p-1 text-[#8C8475] hover:text-black rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-[#5C564E] leading-relaxed space-y-1">
                <p>
                  此為<strong>系統架構師與開發整體設定專屬區域</strong>。
                </p>
                <p className="text-[#8C8475] text-[11px]">
                  登入後可進行全域功能除錯、數據調校，並隨時進行正式系統上線同步整備。
                </p>
              </div>

              <form onSubmit={handleDevPasswordSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#4E473D] mb-1">
                    請輸入開發通行碼：
                  </label>
                  <div className="relative">
                    <input
                      type={showDevPasswordText ? 'text' : 'password'}
                      value={devPasswordInput}
                      onChange={(e) => setDevPasswordInput(e.target.value)}
                      placeholder="請輸入通道通行密碼"
                      autoFocus
                      className="w-full px-3 py-2.5 pr-10 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-purple-600 tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDevPasswordText(!showDevPasswordText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9588] hover:text-[#3E3A36] cursor-pointer"
                    >
                      {showDevPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {devPasswordError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg font-medium">
                    {devPasswordError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDevPasswordModal(false)}
                    className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#EDE8DC] text-[#5C564E] rounded-xl text-xs font-bold border border-[#DDD8CC] transition-all cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5 text-purple-200" />
                    <span>驗證並進入</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
