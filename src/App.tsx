import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  Calculator,
  Building2,
  Phone,
  Clock,
  Calendar,
  ChevronRight,
  ArrowLeft,
  PlayCircle,
  Video,
  Check,
  ExternalLink,
  Landmark,
  AlertCircle,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle as QuestionIcon,
  PhoneCall,
  X
} from "lucide-react";
import contentData from "./data/contentData.json";
import { FAQGuide, Branch, SavingTerm, AmortizationRow } from "./types";

// Helper to format currency
const formatVND = (value: number) => {
  return value.toLocaleString("vi-VN") + " đ";
};

// Raw text-based input formatting (e.g. "1.000.000" or "1000000" -> number)
const parseFormattedNumber = (str: string): number => {
  const normalized = str.replace(/[^0-9]/g, "");
  return normalized ? parseInt(normalized, 10) : 0;
};

// Add dots as thousands separator for display during input
const formatNumberInput = (num: number): string => {
  if (num === 0) return "";
  return num.toLocaleString("vi-VN");
};

export default function App() {
  const data = contentData;

  // Tabs: 'faq' | 'savings' | 'loan' | 'branches'
  const [activeTab, setActiveTab] = useState<"faq" | "savings" | "loan" | "branches">("faq");

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
      const dayName = days[now.getDay()];
      const dateStr = now.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      const timeStr = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      setCurrentTime(`${dayName}, ${dateStr} - ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 1. FAQ STATE ---
  const [selectedGuide, setSelectedGuide] = useState<FAQGuide | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [feedbackStatus, setFeedbackStatus] = useState<"ok" | "not_ok" | null>(null);
  const [chatEnded, setChatEnded] = useState<boolean>(false);

  const handleSelectGuide = (guide: FAQGuide) => {
    setSelectedGuide(guide);
    setCurrentStepIndex(0);
    setFeedbackStatus(null);
    setChatEnded(false);
  };

  const handleNextStep = () => {
    if (!selectedGuide) return;
    if (currentStepIndex < selectedGuide.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleResetFaq = () => {
    setSelectedGuide(null);
    setCurrentStepIndex(0);
    setFeedbackStatus(null);
    setChatEnded(false);
  };

  // --- 2. SAVINGS CALCULATOR STATE ---
  const [savingsInput, setSavingsInput] = useState<string>("400.000.000");
  const [selectedTermId, setSelectedTermId] = useState<string>("5"); // Default 12 Months
  const [customRate, setCustomRate] = useState<string>("4.7");
  const [savingsError, setSavingsError] = useState<string>("");

  const selectedTerm = data.savingsConfig.terms.find((t) => t.id === selectedTermId) || data.savingsConfig.terms[4];

  // Auto-populate rate when term changes
  const handleTermChange = (id: string) => {
    setSelectedTermId(id);
    const term = data.savingsConfig.terms.find((t) => t.id === id);
    if (term) {
      setCustomRate(term.rate.toString());
    }
  };

  // Savings calculations
  const depositAmt = parseFormattedNumber(savingsInput);
  const rateNum = parseFloat(customRate) || 0;
  const months = selectedTerm.months;
  const interestEarned = Math.round(depositAmt * (rateNum / 100) * (months / 12));
  const savingsTotal = depositAmt + interestEarned;

  // Validation feedback
  const isSavingsValid = depositAmt >= 100000 && rateNum >= 0;

  // --- 3. LOAN CALCULATOR STATE ---
  const [assetValueInput, setAssetValueInput] = useState<string>("33.333.333.333");
  const [loanAmountInput, setLoanAmountInput] = useState<string>("6.666.666.667");
  const [loanTermInput, setLoanTermInput] = useState<string>("240");
  const [loanInterestRate, setLoanInterestRate] = useState<string>("8.0");
  const [disbursementDate, setDisbursementDate] = useState<string>("2026-06-16");
  const [paymentDay, setPaymentDay] = useState<string>("25");
  const [paymentFrequency, setPaymentFrequency] = useState<"monthly" | "quarterly" | "half_yearly" | "yearly">("monthly");
  const [roundingRule, setRoundingRule] = useState<"unit" | "thousand">("thousand");
  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationRow[]>([]);
  const [isScheduleVisible, setIsScheduleVisible] = useState<boolean>(false);

  // Trigger calculation when input changes
  const calculateLoanSchedule = () => {
    const loanAmt = parseFormattedNumber(loanAmountInput);
    const termMonths = parseInt(loanTermInput, 10) || 1;
    const rate = parseFloat(loanInterestRate) || 0;
    const payDay = parseInt(paymentDay, 10) || 25;

    if (loanAmt <= 0 || termMonths <= 0 || rate <= 0) return;

    // Call date and amortization generator
    const schedule = generateAmortizationSchedule(
      loanAmt,
      termMonths,
      rate,
      disbursementDate,
      payDay,
      paymentFrequency,
      roundingRule
    );
    setAmortizationSchedule(schedule);
    setIsScheduleVisible(true);
  };

  // Helper date generator for Loan
  const generateAmortizationSchedule = (
    loanAmount: number,
    termMonths: number,
    annualRate: number,
    disbursementDateStr: string,
    payDay: number,
    frequency: "monthly" | "quarterly" | "half_yearly" | "yearly",
    rounding: "unit" | "thousand"
  ): AmortizationRow[] => {
    const schedule: AmortizationRow[] = [];
    let monthsPerCycle = 1;
    let divisor = 12;

    if (frequency === "quarterly") {
      monthsPerCycle = 3;
      divisor = 4;
    } else if (frequency === "half_yearly") {
      monthsPerCycle = 6;
      divisor = 2;
    } else if (frequency === "yearly") {
      monthsPerCycle = 12;
      divisor = 1;
    }

    const N = Math.ceil(termMonths / monthsPerCycle);
    const periodInterestRate = annualRate / 100 / divisor;
    const rawPrincipalPerPeriod = loanAmount / N;

    const roundValue = (val: number) => {
      if (rounding === "thousand") {
        return Math.round(val / 1000) * 1000;
      }
      return Math.round(val);
    };

    let remainingBalance = loanAmount;
    const parseDisbursement = new Date(disbursementDateStr);
    const startYear = parseDisbursement.getFullYear();
    const startMonth = parseDisbursement.getMonth();

    for (let i = 1; i <= N; i++) {
      const beginningBalance = remainingBalance;
      let principal = roundValue(rawPrincipalPerPeriod);

      if (i === N) {
        principal = beginningBalance;
      } else if (principal > beginningBalance) {
        principal = beginningBalance;
      }

      const interest = roundValue(beginningBalance * periodInterestRate);
      const totalPayment = principal + interest;
      remainingBalance = beginningBalance - principal;

      const targetMonthIndex = startMonth + i * monthsPerCycle;
      const targetDate = new Date(startYear, targetMonthIndex, 1);
      const lastDayInTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(payDay, lastDayInTargetMonth);
      targetDate.setDate(actualDay);

      const dd = String(targetDate.getDate()).padStart(2, "0");
      const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
      const yyyy = targetDate.getFullYear();
      const paymentDateStr = `${dd}/${mm}/${yyyy}`;

      schedule.push({
        period: i,
        paymentDate: paymentDateStr,
        beginningBalance,
        principal,
        interest,
        totalPayment,
        endingBalance: Math.max(0, remainingBalance)
      });
    }

    return schedule;
  };

  // Get min/max period payment
  const getLoanMinMaxPayments = () => {
    if (amortizationSchedule.length === 0) return { min: 0, max: 0, totalInterest: 0, totalPayment: 0 };
    let min = Infinity;
    let max = -Infinity;
    let totalInterest = 0;
    let totalPayment = 0;

    amortizationSchedule.forEach((row) => {
      if (row.totalPayment < min) min = row.totalPayment;
      if (row.totalPayment > max) max = row.totalPayment;
      totalInterest += row.interest;
      totalPayment += row.totalPayment;
    });

    return { min, max, totalInterest, totalPayment };
  };

  const { min: minRepay, max: maxRepay, totalInterest, totalPayment: loanTotalPay } = getLoanMinMaxPayments();

  // --- 4. BRANCH LOCATOR STATE ---
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [branchSearch, setBranchSearch] = useState<string>("");

  const filteredBranches = data.branchList.filter(
    (b) =>
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.address.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const currentBranch = data.branchList.find((b) => b.id === selectedBranchId) || data.branchList[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* HEADER BAR WITH VIETINBANK LOGO */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={data.logoUrl}
              alt="VietinBank Logo"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#002D62] tracking-tight flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[#005B94]" />
                VietinBank Bắc Phú Thọ
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Trợ Lý Quầy Giao Dịch Tương Tác</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-right">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              Sẵn Sàng Phục Vụ Tại Quầy
            </div>
            <div className="text-xs sm:text-sm font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-inner">
              {currentTime || "Đang tải thời gian..."}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER WITH SIDEBAR LAYOUT (VERTICAL / HÀNG DỌC) */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md">
            <h2 className="text-xs font-extrabold text-[#002D62] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
              Danh Mục Nghiệp Vụ
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setActiveTab("faq");
                  handleResetFaq();
                }}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 text-left cursor-pointer ${
                  activeTab === "faq"
                    ? "bg-[#002D62] text-white border-[#002D62] shadow-lg scale-[1.02] font-bold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === "faq" ? "bg-white text-[#002D62]" : "bg-red-50 text-red-500"}`}>
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Giải Đáp Thắc Mắc</div>
                  <div className={`text-xs ${activeTab === "faq" ? "text-slate-300" : "text-slate-400 font-medium"}`}>iPay, đóng thẻ, sinh trắc học</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("savings")}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 text-left cursor-pointer ${
                  activeTab === "savings"
                    ? "bg-[#002D62] text-white border-[#002D62] shadow-lg scale-[1.02] font-bold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === "savings" ? "bg-white text-[#002D62]" : "bg-amber-50 text-amber-500"}`}>
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Tính Lãi Tiết Kiệm</div>
                  <div className={`text-xs ${activeTab === "savings" ? "text-slate-300" : "text-slate-400 font-medium"}`}>Tính lãi gửi định kỳ</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("loan")}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 text-left cursor-pointer ${
                  activeTab === "loan"
                    ? "bg-[#002D62] text-white border-[#002D62] shadow-lg scale-[1.02] font-bold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === "loan" ? "bg-white text-[#002D62]" : "bg-emerald-50 text-emerald-500"}`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Lập Lịch Trả Nợ Vay</div>
                  <div className={`text-xs ${activeTab === "loan" ? "text-slate-300" : "text-slate-400 font-medium"}`}>Dư nợ giảm dần đều</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("branches")}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 text-left cursor-pointer ${
                  activeTab === "branches"
                    ? "bg-[#002D62] text-white border-[#002D62] shadow-lg scale-[1.02] font-bold"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${activeTab === "branches" ? "bg-white text-[#002D62]" : "bg-sky-50 text-sky-500"}`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Chi Nhánh &amp; Bản Đồ</div>
                  <div className={`text-xs ${activeTab === "branches" ? "text-slate-300" : "text-slate-400 font-medium"}`}>Tra cứu mạng lưới &amp; map</div>
                </div>
              </button>
            </div>
          </div>

          {/* QUICK CONTACT BOX */}
          <div className="bg-gradient-to-br from-[#002D62] to-[#005B94] text-white p-5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden hidden lg:block">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <Landmark className="w-24 h-24" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Hỗ trợ tại quầy</h3>
            <p className="text-xs text-slate-200 mb-4 font-medium leading-relaxed">
              Nếu Quý khách cần bất cứ hỗ trợ trực tiếp nào từ Chuyên viên giao dịch:
            </p>
            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                HT
              </div>
              <div className="text-xs">
                <p className="font-bold">{data.contact.name}</p>
                <p className="text-[10px] text-slate-300">{data.contact.role}</p>
              </div>
            </div>
            <a
              href={`tel:${data.contact.phone.replace(/\./g, "")}`}
              className="mt-3 w-full bg-amber-400 hover:bg-amber-500 text-[#002D62] py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Hotline: {data.contact.phone}
            </a>
          </div>
        </aside>

        {/* CORE WORKSPACE SCREEN (RIGHT SIDE) WITH TAB ANIMATIONS */}
        <div className="flex-grow min-w-0 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === "faq" && (
            <motion.div
              key="faq-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex flex-col gap-6"
            >
              {/* FAQ MAIN OR ACTIVE GUIDE */}
              {!selectedGuide ? (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md">
                  <div className="text-center max-w-2xl mx-auto mb-8">
                    <h2 className="text-2xl font-extrabold text-[#002D62] mb-3">
                      Hệ Thống Hướng Dẫn Tự Phục Vụ iPay &amp; Thẻ
                    </h2>
                    <p className="text-slate-500 font-medium">
                      Anh/chị đang gặp khó khăn hoặc cần hỗ trợ với nội dung nào dưới đây?
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                    {data.faqGuides.map((guide) => (
                      <button
                        key={guide.id}
                        onClick={() => handleSelectGuide(guide as FAQGuide)}
                        className="group bg-slate-50 hover:bg-slate-100 hover:border-[#005B94]/40 border border-slate-200/80 p-6 rounded-xl text-left transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-start gap-4"
                      >
                        <div className="p-3.5 bg-[#005B94]/10 text-[#005B94] rounded-lg group-hover:bg-[#005B94]/20 transition-colors">
                          <QuestionIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold text-slate-800 text-base group-hover:text-[#005B94] transition-colors mb-1.5">
                            {guide.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                            Xem hướng dẫn từng bước
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-12 p-5 bg-blue-50 border border-blue-100 rounded-xl max-w-2xl mx-auto text-center">
                    <p className="text-sm text-[#002D62] font-semibold flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      Cần trợ giúp khẩn cấp? Vui lòng liên hệ Chuyên viên:{" "}
                      <span className="font-bold text-red-600">{data.contact.name}</span> ({data.contact.phone})
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col md:flex-row flex-grow min-h-[500px]">
                  {/* Left Column - Steps Navigation list */}
                  <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-5 flex flex-col shrink-0">
                    <button
                      onClick={handleResetFaq}
                      className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-2 mb-6 group border border-slate-200 hover:border-slate-300 bg-white px-3 py-2 rounded-lg transition-all"
                    >
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                      Quay lại danh mục chính
                    </button>

                    <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase mb-4 text-[#002D62]">
                      Tiến trình thực hiện
                    </h3>

                    <div className="flex flex-col gap-2.5 flex-grow overflow-y-auto">
                      {selectedGuide.steps.map((st, idx) => (
                        <button
                          key={st.step}
                          onClick={() => {
                            if (!feedbackStatus && !chatEnded) {
                              setCurrentStepIndex(idx);
                            }
                          }}
                          disabled={!!feedbackStatus || chatEnded}
                          className={`w-full text-left p-3 rounded-lg border text-xs flex items-center gap-3 transition-all ${
                            currentStepIndex === idx
                              ? "bg-[#002D62] text-white border-[#002D62] font-bold shadow-md"
                              : idx < currentStepIndex
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${
                              currentStepIndex === idx
                                ? "bg-white text-[#002D62]"
                                : idx < currentStepIndex
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {idx < currentStepIndex ? <Check className="w-3.5 h-3.5" /> : st.step}
                          </span>
                          <span className="line-clamp-2 leading-snug">{st.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Active Step Detail & Media View */}
                  <div className="flex-grow p-6 sm:p-8 flex flex-col justify-between">
                    <div className="flex-grow">
                      {/* Guide Header */}
                      <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs bg-[#005B94]/10 text-[#005B94] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                            {selectedGuide.title}
                          </span>
                          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">
                            Bước {currentStepIndex + 1}: {selectedGuide.steps[currentStepIndex].text}
                          </h2>
                        </div>
                        <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full shrink-0">
                          {currentStepIndex + 1} / {selectedGuide.steps.length} bước
                        </div>
                      </div>

                      {/* Content Interactive Block */}
                      <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-xl border border-slate-100 mb-6">
                        {/* Render Step Image */}
                        <div className="relative max-w-xs sm:max-w-sm w-full mx-auto aspect-[3/4] bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden flex items-center justify-center p-2 mb-4 group">
                          <img
                            src={selectedGuide.steps[currentStepIndex].imageUrl}
                            alt={`Hình ảnh minh họa bước ${currentStepIndex + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-auto max-h-[380px] object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step Navigation Actions */}
                    <div className="border-t border-slate-100 pt-6 flex flex-col gap-5">
                      {/* Standard Step Progress Buttons */}
                      {!feedbackStatus && !chatEnded && (
                        <div className="flex items-center justify-between gap-4">
                          <button
                            onClick={handlePrevStep}
                            disabled={currentStepIndex === 0}
                            className={`flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                              currentStepIndex === 0
                                ? "text-slate-300 border-slate-100 bg-slate-50/50 cursor-not-allowed"
                                : "text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100"
                            }`}
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Trước đó
                          </button>

                          {currentStepIndex < selectedGuide.steps.length - 1 ? (
                            <button
                              onClick={handleNextStep}
                              className="bg-[#005B94] hover:bg-[#002D62] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow-md transition-all active:scale-98"
                            >
                              Tiếp tục
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          ) : (
                            <div className="bg-slate-100 border border-slate-200/80 p-4 rounded-xl w-full flex flex-col items-center text-center gap-3">
                              <p className="text-sm font-bold text-slate-800">
                                Quý khách đã xem hết tất cả các bước hướng dẫn.
                              </p>
                              <div className="flex flex-wrap justify-center gap-3">
                                <a
                                  href={selectedGuide.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                                >
                                  <Video className="w-4 h-4" />
                                  Xem video Youtube hướng dẫn chi tiết
                                </a>
                              </div>

                              <div className="h-px bg-slate-200 w-full my-1"></div>

                              {/* Interactive Feedback survey */}
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-sm font-extrabold text-[#002D62]">
                                  Anh/chị đã thực hiện ổn hay chưa?
                                </span>
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => setFeedbackStatus("ok")}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Đã ổn
                                  </button>
                                  <button
                                    onClick={() => setFeedbackStatus("not_ok")}
                                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Chưa ổn
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* FEEDBACK RESPONSES AND END DIALOGUE */}
                      {feedbackStatus && !chatEnded && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                          {feedbackStatus === "ok" ? (
                            <div className="text-center py-4">
                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-8 h-8" />
                              </div>
                              <h4 className="text-lg font-bold text-emerald-800 mb-1">Cảm ơn Quý khách!</h4>
                              <p className="text-sm text-slate-600 mb-4">
                                Rất vui khi biết hướng dẫn đã giúp ích cho Quý khách.
                              </p>
                            </div>
                          ) : (
                            <div className="text-left py-2">
                              <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-red-900 leading-relaxed mb-4">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p>
                                  Cảm ơn Quý khách đã phản hồi. Quý khách có thể liên hệ Chuyên viên tư vấn{" "}
                                  <span className="font-bold text-[#002D62]">{data.contact.name}</span> – số điện
                                  thoại: <span className="font-bold text-red-600">{data.contact.phone}</span> để hỗ
                                  trợ trực tiếp. Em sẽ cố gắng cải thiện để phục vụ Quý khách tốt hơn!
                                </p>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#005B94]/10 text-[#005B94] rounded-full flex items-center justify-center font-bold">
                                    HT
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">{data.contact.role}</p>
                                    <p className="text-sm font-bold text-slate-800">{data.contact.name}</p>
                                  </div>
                                </div>
                                <a
                                  href={`tel:${data.contact.phone.replace(/\./g, "")}`}
                                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                                >
                                  <PhoneCall className="w-4 h-4" />
                                  Gọi ngay: {data.contact.phone}
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="h-px bg-slate-200 my-4"></div>

                          {/* Navigation Options After Feedback */}
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                              onClick={handleResetFaq}
                              className="w-full sm:w-auto bg-[#005B94] hover:bg-[#002D62] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                            >
                              Quay lại menu chính
                            </button>
                            <button
                              onClick={() => setChatEnded(true)}
                              className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                            >
                              Kết thúc cuộc trò chuyện
                            </button>
                          </div>
                        </div>
                      )}

                      {chatEnded && (
                        <div className="bg-[#002D62] text-white p-6 rounded-xl text-center shadow-md border border-white/10">
                          <div className="w-14 h-14 bg-white/10 text-[#005B94] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Landmark className="w-8 h-8 text-amber-400" />
                          </div>
                          <h4 className="text-xl font-bold text-white mb-2">Xin chân thành cảm ơn!</h4>
                          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                            Cảm ơn Quý khách đã sử dụng dịch vụ của VietinBank. Chúc Quý khách một ngày tốt lành!
                          </p>
                          <button
                            onClick={handleResetFaq}
                            className="bg-white hover:bg-slate-100 text-[#002D62] px-6 py-2 rounded-lg text-xs font-extrabold transition-all"
                          >
                            Bắt đầu cuộc trò chuyện mới
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "savings" && (
            <motion.div
              key="savings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl font-extrabold text-[#002D62] mb-2 flex items-center justify-center gap-2">
                  <Calculator className="h-6 w-6 text-amber-500" />
                  Công Cụ Tính Lãi Suất Tiết Kiệm
                </h2>
                <p className="text-slate-500 text-sm">
                  Cung cấp thông tin trực quan về số tiền lãi nhận được đối với sản phẩm tiền gửi thông thường trả lãi sau.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
                {/* Inputs Pane */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-[#002D62] text-sm uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    Tiền Gửi Dự Tính
                  </h3>

                  <div className="space-y-5">
                    {/* Input Deposit Amount */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tổng tiền gửi (VND) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <input
                          type="text"
                          value={savingsInput}
                          onChange={(e) => {
                            const raw = parseFormattedNumber(e.target.value);
                            setSavingsInput(formatNumberInput(raw));
                          }}
                          className={`w-full bg-white border ${
                            depositAmt < data.savingsConfig.minAmount && depositAmt > 0
                              ? "border-amber-400 focus:ring-amber-400 focus:border-amber-400"
                              : "border-slate-300 focus:ring-[#005B94] focus:border-[#005B94]"
                          } rounded-lg pl-3 pr-14 py-2.5 font-bold text-slate-800 text-lg`}
                          placeholder="Nhập số tiền..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-xs font-extrabold text-slate-400 uppercase">VND</span>
                        </div>
                      </div>
                      {/* Warnings and format helper */}
                      <div className="mt-1.5 flex flex-col gap-1">
                        {depositAmt > 0 && (
                          <span className="text-xs font-bold text-[#005B94]">
                            Bằng chữ: {formatVND(depositAmt)}
                          </span>
                        )}
                        {depositAmt > 0 && depositAmt < data.savingsConfig.minAmount && (
                          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {data.savingsConfig.minAmountWarning}
                          </div>
                        )}
                        {depositAmt === 0 && (
                          <div className="text-xs text-red-500 font-semibold">Vui lòng nhập số tiền gửi hợp lệ.</div>
                        )}
                      </div>
                    </div>

                    {/* Input Term Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Kỳ hạn gửi (Tháng) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedTermId}
                        onChange={(e) => handleTermChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 focus:ring-[#005B94] focus:border-[#005B94]"
                      >
                        {data.savingsConfig.terms.map((term) => (
                          <option key={term.id} value={term.id}>
                            {term.label} (Lãi suất: {term.rate}%/năm)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Input custom rate */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Lãi suất áp dụng (%/năm) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-lg shadow-sm">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={customRate}
                          onChange={(e) => setCustomRate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 font-bold text-slate-800 text-sm focus:ring-[#005B94] focus:border-[#005B94]"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-xs font-extrabold text-slate-400">%</span>
                        </div>
                      </div>
                      {(!customRate || rateNum < 0) && (
                        <div className="text-xs text-red-500 font-semibold mt-1">Vui lòng nhập lãi suất hợp lệ.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Outputs Display Pane */}
                <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-blue-50/50 to-slate-50 border border-slate-200/80 p-6 rounded-xl">
                  <div>
                    <h3 className="font-bold text-[#002D62] text-sm uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      Tiền Lãi Dự Tính Nhận Được
                    </h3>

                    {isSavingsValid ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                              Tiền gửi gốc
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 block">
                              {formatVND(depositAmt)}
                            </span>
                          </div>
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                              Kỳ hạn gửi
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 block">
                              {selectedTerm.label} ({months} Tháng)
                            </span>
                          </div>
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                              Lãi suất hàng năm
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 block">{rateNum}% / Năm</span>
                          </div>
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                              Lãi suất kỳ hạn
                            </span>
                            <span className="text-sm font-extrabold text-slate-800 block">
                              {((rateNum * months) / 12).toFixed(3)}%
                            </span>
                          </div>
                        </div>

                        {/* Huge Interest Card Display */}
                        <div className="bg-gradient-to-r from-[#002D62] to-[#005B94] text-white p-5 rounded-xl shadow-md border border-white/5 relative overflow-hidden">
                          <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-5 pointer-events-none">
                            <Calculator className="w-48 h-48 text-white" />
                          </div>
                          <span className="text-slate-300 text-xs uppercase font-extrabold tracking-wider block mb-1">
                            Tiền Lãi Dự Kiến (Nhận Cuối Kỳ)
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-400 block mb-3 animate-pulse">
                            {formatVND(interestEarned)}
                          </span>

                          <div className="h-px bg-white/10 my-3"></div>

                          <span className="text-slate-300 text-xs uppercase font-extrabold tracking-wider block mb-1">
                            Tổng tiền dự kiến nhận được (Gốc + Lãi)
                          </span>
                          <span className="text-lg font-extrabold text-white block">{formatVND(savingsTotal)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm font-bold">Vui lòng hoàn thành thông tin tiền gửi hợp lệ ở cột bên trái</p>
                      </div>
                    )}
                  </div>

                  {/* Tiktok Video Guidance Link */}
                  <div className="mt-8 pt-4 border-t border-slate-200">
                    <a
                      href={data.savingsConfig.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-800 hover:bg-black text-white p-4 rounded-xl flex items-center justify-between shadow-sm transition-all text-xs font-bold"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                          <PlayCircle className="w-5 h-5 text-red-400" />
                        </span>
                        <div className="text-left">
                          <p className="text-white font-extrabold">Video hướng dẫn gửi tiết kiệm</p>
                          <p className="text-slate-400 text-[10px] font-medium">Bí quyết tích lũy hiệu quả trên Tiktok</p>
                        </div>
                      </div>
                      <span className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1 shrink-0">
                        Xem video
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "loan" && (
            <motion.div
              key="loan-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 flex flex-col gap-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-4">
                <h2 className="text-2xl font-extrabold text-[#002D62] mb-2 flex items-center justify-center gap-2">
                  <Calendar className="h-6 w-6 text-emerald-500" />
                  Bảng Tính Lịch Trả Nợ Thường Niên
                </h2>
                <p className="text-slate-500 text-sm">
                  Công cụ hỗ trợ khách hàng tính lịch trả nợ với dư nợ giảm dần (Gốc trả đều hằng kỳ, lãi suất thực tế tính trên dư nợ còn lại).
                </p>
              </div>

              {/* Loan Configuration Inputs */}
              <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-xl">
                <h3 className="font-extrabold text-[#002D62] text-xs uppercase tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                  Bước 1: Nhập thông tin nhu cầu vay vốn
                </h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Asset Value */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Giá trị bất động sản (VND)
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="text"
                        value={assetValueInput}
                        onChange={(e) => {
                          const raw = parseFormattedNumber(e.target.value);
                          setAssetValueInput(formatNumberInput(raw));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-[#005B94] focus:border-[#005B94]"
                        placeholder="Ví dụ: 33,333,333,333"
                      />
                    </div>
                  </div>

                  {/* Loan Amount */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Số tiền muốn vay (VND) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="text"
                        value={loanAmountInput}
                        onChange={(e) => {
                          const raw = parseFormattedNumber(e.target.value);
                          setLoanAmountInput(formatNumberInput(raw));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-[#005B94] focus:border-[#005B94]"
                        placeholder="Nhập số tiền vay..."
                      />
                    </div>
                  </div>

                  {/* Term Months */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Thời gian vay (Tháng) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={loanTermInput}
                        onChange={(e) => setLoanTermInput(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-[#005B94] focus:border-[#005B94]"
                        placeholder="Ví dụ: 240"
                      />
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Lãi suất (%/Năm) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={loanInterestRate}
                        onChange={(e) => setLoanInterestRate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-[#005B94] focus:border-[#005B94]"
                        placeholder="Ví dụ: 8"
                      />
                    </div>
                  </div>

                  {/* Disbursement Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ngày giải ngân <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={disbursementDate}
                      onChange={(e) => setDisbursementDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-[#005B94] focus:border-[#005B94]"
                    />
                  </div>

                  {/* Repayment Day */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ngày trả nợ định kỳ hằng tháng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-[#005B94] focus:border-[#005B94]"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Chu kỳ trả nợ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentFrequency}
                      onChange={(e) => setPaymentFrequency(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-[#005B94] focus:border-[#005B94]"
                    >
                      <option value="monthly">Hằng tháng</option>
                      <option value="quarterly">Hằng quý</option>
                      <option value="half_yearly">6 tháng</option>
                      <option value="yearly">Hằng năm</option>
                    </select>
                  </div>

                  {/* Rounding Rule */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quy tắc làm tròn
                    </label>
                    <select
                      value={roundingRule}
                      onChange={(e) => setRoundingRule(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:ring-[#005B94] focus:border-[#005B94]"
                    >
                      <option value="thousand">Làm tròn đến 1,000 đồng</option>
                      <option value="unit">Làm tròn đến đơn vị đồng</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={calculateLoanSchedule}
                    className="bg-[#002D62] hover:bg-[#005B94] text-white px-8 py-3 rounded-lg text-sm font-extrabold shadow-md transition-all active:scale-98"
                  >
                    Xem chi tiết bảng tính nợ
                  </button>
                </div>
              </div>

              {/* Step 2 Display Results & Schedule */}
              {isScheduleVisible && (
                <div className="flex flex-col gap-6">
                  {/* Results Summary Box */}
                  <div className="bg-gradient-to-br from-[#002D62] to-[#005B94] text-white rounded-xl p-6 shadow-md relative overflow-hidden">
                    <div className="grid md:grid-cols-3 gap-6 relative z-10 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-white/10">
                      {/* Range payments */}
                      <div className="pb-4 md:pb-0">
                        <span className="text-xs uppercase font-extrabold text-slate-300 tracking-wider block mb-1">
                          Số tiền trả hàng tháng
                        </span>
                        <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kỳ đầu (Lớn nhất)</span>
                            <span className="text-xl sm:text-2xl font-black text-amber-400">{formatVND(maxRepay)}</span>
                          </div>
                          <span className="text-slate-400 hidden sm:inline-block">→</span>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kỳ cuối (Nhỏ nhất)</span>
                            <span className="text-xl sm:text-2xl font-black text-amber-400">{formatVND(minRepay)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Interest paid */}
                      <div className="py-4 md:py-0 md:pl-6">
                        <span className="text-slate-300 text-xs uppercase font-extrabold tracking-wider block mb-1">
                          Tổng số tiền lãi phải trả
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white">{formatVND(totalInterest)}</span>
                        <span className="text-[10px] text-slate-300 block font-medium">
                          (Dư nợ giảm dần giúp tiết kiệm lãi vay)
                        </span>
                      </div>

                      {/* Total payment */}
                      <div className="pt-4 md:pt-0 md:pl-6">
                        <span className="text-slate-300 text-xs uppercase font-extrabold tracking-wider block mb-1">
                          Tổng tiền trả (Gốc + Lãi)
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white">{formatVND(loanTotalPay)}</span>
                        <span className="text-[10px] text-slate-300 block font-medium">
                          (Gốc gốc trả: {formatVND(parseFormattedNumber(loanAmountInput))})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amortization table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-100 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider text-[#002D62]">
                          Lịch thanh toán chi tiết từng kỳ
                        </h4>
                        <p className="text-xs text-slate-500">
                          * Sai lệch do làm tròn số tiền hằng kỳ được bù trừ và điều chỉnh hoàn toàn vào kỳ cuối cùng.
                        </p>
                      </div>
                      <div className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-semibold">
                        {amortizationSchedule.length} Kỳ trả nợ
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[#002D62] uppercase tracking-wider font-extrabold">
                            <th className="px-4 py-3 text-center">Stt</th>
                            <th className="px-4 py-3">Kỳ trả nợ</th>
                            <th className="px-4 py-3 text-right">Dư nợ đầu kỳ</th>
                            <th className="px-4 py-3 text-right">Gốc trả</th>
                            <th className="px-4 py-3 text-right">Lãi trả</th>
                            <th className="px-4 py-3 text-right bg-slate-100 font-black">Tổng Gốc + Lãi</th>
                            <th className="px-4 py-3 text-right">Dư nợ cuối kỳ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {amortizationSchedule.map((row) => (
                            <tr key={row.period} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 text-center font-bold text-slate-500">{row.period}</td>
                              <td className="px-4 py-2.5 font-medium">{row.paymentDate}</td>
                              <td className="px-4 py-2.5 text-right font-mono">{formatVND(row.beginningBalance)}</td>
                              <td className="px-4 py-2.5 text-right font-mono text-emerald-700 font-bold">
                                {formatVND(row.principal)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-amber-700 font-bold">
                                {formatVND(row.interest)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono bg-slate-50 font-black text-slate-800">
                                {formatVND(row.totalPayment)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-slate-400">
                                {formatVND(row.endingBalance)}
                              </td>
                            </tr>
                          ))}

                          {/* Table Total Row */}
                          <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-800">
                            <td className="px-4 py-3 text-center uppercase" colSpan={2}>
                              Tổng cộng
                            </td>
                            <td className="px-4 py-3 text-right">-</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-800">
                              {formatVND(parseFormattedNumber(loanAmountInput))}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-amber-800">
                              {formatVND(totalInterest)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono bg-slate-200/80 text-slate-900">
                              {formatVND(loanTotalPay)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "branches" && (
            <motion.div
              key="branches-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 flex-grow"
            >
              {/* Left Column: Branch Directory List */}
              <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#002D62] mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-5.5 h-5.5 text-sky-500" />
                    Mạng Lưới Giao Dịch
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    VietinBank Chi Nhánh Bắc Phú Thọ
                  </p>
                </div>

                {/* Search query box */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Tìm chi nhánh, phòng giao dịch..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#005B94] focus:bg-white"
                  />
                </div>

                {/* Scrollable list of counters */}
                <div className="flex-grow overflow-y-auto max-h-[420px] pr-1 space-y-2.5">
                  {filteredBranches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranchId(branch.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                        selectedBranchId === branch.id
                          ? "bg-sky-50 border-sky-300 shadow-sm"
                          : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          selectedBranchId === branch.id
                            ? "bg-[#002D62] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {branch.id}
                      </span>
                      <div className="flex-grow">
                        <h4
                          className={`font-bold text-sm leading-snug transition-colors ${
                            selectedBranchId === branch.id ? "text-[#002D62]" : "text-slate-800"
                          }`}
                        >
                          {branch.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{branch.address}</span>
                        </p>
                      </div>
                    </button>
                  ))}

                  {filteredBranches.length === 0 && (
                    <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Không tìm thấy phòng giao dịch nào khớp.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Google map and Address Details */}
              <div className="flex-grow flex flex-col justify-between border border-slate-100 bg-slate-50/50 p-5 rounded-2xl min-h-[450px]">
                {currentBranch ? (
                  <div className="space-y-5 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Active branch headers */}
                      <div className="border-b border-slate-200 pb-3.5 mb-4">
                        <h3 className="text-lg font-black text-[#002D62]">{currentBranch.name}</h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {currentBranch.address}
                        </p>
                      </div>

                      {/* Google map iframe wrapper */}
                      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative aspect-video sm:aspect-auto sm:h-[350px]">
                        <iframe
                          src={currentBranch.mapEmbedUrl}
                          className="w-full h-full border-0"
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>
                    </div>

                    {/* Information cards underneath the map */}
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      {/* Contact card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                        <div className="p-2.5 bg-green-50 text-green-700 rounded-lg">
                          <Phone className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Số điện thoại hỗ trợ
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                            {currentBranch.phone !== "Đang cập nhật" ? (
                              <a
                                href={`tel:${currentBranch.phone.replace(/\./g, "")}`}
                                className="text-green-600 hover:underline"
                              >
                                {currentBranch.phone}
                              </a>
                            ) : (
                              "1900 558 868"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Business hours card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                        <div className="p-2.5 bg-sky-50 text-sky-700 rounded-lg">
                          <Clock className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-grow">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Thời gian mở cửa giao dịch
                          </span>
                          <div className="text-xs text-slate-600 mt-1 space-y-1">
                            <p className="font-bold flex justify-between gap-2 text-slate-800">
                              <span>T2 - T6:</span>
                              <span className="text-[#005B94]">Sáng {data.branchHours.weekdays.morning}</span>
                            </p>
                            <p className="font-bold flex justify-between gap-2 text-slate-800">
                              <span></span>
                              <span className="text-[#005B94]">Chiều {data.branchHours.weekdays.afternoon}</span>
                            </p>
                            <p className="font-extrabold text-red-500 flex justify-between gap-2">
                              <span>T7 - CN:</span>
                              <span>{data.branchHours.weekends}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Building2 className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm font-bold">Chọn một chi nhánh từ danh sách để xem bản đồ và chi tiết</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* FOOTER BAR WITH BRAND INFO */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-amber-400" />
            <p className="font-semibold text-slate-300">
              © 2026 Ngân hàng Thương mại Cổ phần Công Thương Việt Nam - VietinBank Bắc Phú Thọ.
            </p>
          </div>
          <div className="text-center md:text-right font-medium text-slate-500">
            Ứng dụng tương tác quầy hỗ trợ trải nghiệm khách hàng số hiệu quả.
          </div>
        </div>
      </footer>
    </div>
  );
}
