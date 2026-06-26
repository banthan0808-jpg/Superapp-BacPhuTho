export interface Step {
  step: number;
  text: string;
  imageUrl: string;
}

export interface FAQGuide {
  id: string;
  title: string;
  videoUrl: string;
  steps: Step[];
}

export interface SavingTerm {
  id: string;
  label: string;
  months: number;
  rate: number;
}

export interface SavingsConfig {
  videoUrl: string;
  terms: SavingTerm[];
  minAmount: number;
  minAmountWarning: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  mapEmbedUrl: string;
}

export interface ContentData {
  logoUrl: string;
  contact: {
    name: string;
    role: string;
    phone: string;
  };
  branchHours: {
    weekdays: {
      morning: string;
      afternoon: string;
    };
    weekends: string;
  };
  faqGuides: FAQGuide[];
  savingsConfig: SavingsConfig;
  branchList: Branch[];
}

export interface AmortizationRow {
  period: number;
  paymentDate: string;
  beginningBalance: number;
  principal: number;
  interest: number;
  totalPayment: number;
  endingBalance: number;
}
