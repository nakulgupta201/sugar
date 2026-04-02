"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export const LANGUAGES = [
  { code: "en", label: "English",    nativeLabel: "English",    flag: "🇬🇧" },
  { code: "hi", label: "Hindi",      nativeLabel: "हिन्दी",       flag: "🇮🇳" },
  { code: "ur", label: "Urdu",       nativeLabel: "اردو",         flag: "🇵🇰" },
  { code: "bn", label: "Bengali",    nativeLabel: "বাংলা",        flag: "🇧🇩" },
  { code: "ta", label: "Tamil",      nativeLabel: "தமிழ்",        flag: "🇮🇳" },
  { code: "te", label: "Telugu",     nativeLabel: "తెలుగు",       flag: "🇮🇳" },
  { code: "mr", label: "Marathi",    nativeLabel: "मराठी",        flag: "🇮🇳" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

// ─── Translation maps ─────────────────────────────────────────────────────────
// Key translations for all India languages. English is the base fallback.
const TRANSLATIONS: Record<LangCode, Record<string, string>> = {
  en: {},
  hi: {
    "nav.home": "होम", "nav.predict": "अनुमान", "nav.about": "परिचय",
    "nav.history": "इतिहास", "nav.login": "लॉग इन", "nav.logout": "लॉग आउट",
    "nav.startAssessment": "मूल्यांकन शुरू करें",
    "predict.pageTitle": "मधुमेह जोखिम भविष्यवक्ता",
    "predict.pageSubtitle": "अपनी स्वास्थ्य जानकारी भरें। इसमें 60 सेकंड से कम समय लगता है।",
    "predict.gender": "लिंग", "predict.male": "पुरुष", "predict.female": "महिला", "predict.other": "अन्य",
    "predict.age": "आयु (वर्ष)", "predict.hypertension": "उच्च रक्तचाप",
    "predict.heartDisease": "हृदय रोग", "predict.smokingHistory": "धूम्रपान इतिहास",
    "predict.bmi": "BMI (kg/m²)", "predict.hba1c": "HbA1c स्तर (%)",
    "predict.glucose": "रक्त शर्करा (mg/dL)", "predict.yes": "हाँ", "predict.no": "नहीं",
    "predict.next": "अगला", "predict.back": "वापस",
    "predict.submit": "मेरा जोखिम स्कोर प्राप्त करें",
    "predict.analyzing": "विश्लेषण हो रहा है…",
    "predict.disclaimer": "⚠️ यह उपकरण केवल सूचनात्मक उद्देश्यों के लिए है।",
    "results.lowRisk": "बढ़िया! आपका जोखिम कम है।",
    "results.mediumRisk": "मध्यम जोखिम पाया गया।",
    "results.highRisk": "उच्च जोखिम — कृपया डॉक्टर से परामर्श करें।",
    "results.keyFactors": "प्रमुख योगदान कारक",
    "results.modelPerformance": "मॉडल प्रदर्शन",
    "results.medicalDisclaimer": "⚠️ यह AI मूल्यांकन केवल सूचनात्मक उद्देश्यों के लिए है।",
    "history.title": "भविष्यवाणी इतिहास",
    "history.empty": "अभी तक कोई भविष्यवाणी नहीं।",
    "auth.loginTitle": "वापस स्वागत है", "auth.loginBtn": "साइन इन करें",
    "auth.registerTitle": "खाता बनाएं", "auth.registerBtn": "खाता बनाएं",
  },
  ur: {
    "nav.home": "ہوم", "nav.predict": "پیشگوئی", "nav.about": "تعارف",
    "nav.history": "تاریخ", "nav.login": "لاگ ان", "nav.logout": "لاگ آؤٹ",
    "nav.startAssessment": "جائزہ شروع کریں",
    "predict.pageTitle": "ذیابطیس خطرہ پیش گو",
    "predict.pageSubtitle": "اپنی صحت کی معلومات بھریں۔ 60 سیکنڈ سے کم وقت لگتا ہے۔",
    "predict.gender": "جنس", "predict.male": "مرد", "predict.female": "عورت", "predict.other": "دیگر",
    "predict.age": "عمر (سال)", "predict.hypertension": "ہائی بلڈ پریشر",
    "predict.heartDisease": "دل کی بیماری", "predict.smokingHistory": "سگریٹ نوشی کی تاریخ",
    "predict.bmi": "BMI (kg/m²)", "predict.hba1c": "HbA1c سطح (%)",
    "predict.glucose": "خون میں شکر (mg/dL)", "predict.yes": "جی", "predict.no": "نہیں",
    "predict.next": "اگلا", "predict.back": "واپس",
    "predict.submit": "میرا خطرے کا اسکور حاصل کریں",
    "predict.analyzing": "تجزیہ ہو رہا ہے…",
    "results.lowRisk": "بہت اچھا! آپ کا خطرہ کم ہے۔",
    "results.mediumRisk": "اعتدال پسند خطرہ پایا گیا۔",
    "results.highRisk": "زیادہ خطرہ — براہ کرم ڈاکٹر سے مشورہ کریں۔",
    "results.keyFactors": "اہم عوامل",
    "history.title": "پیش گوئی کی تاریخ",
    "auth.loginTitle": "خوش آمدید", "auth.loginBtn": "سائن ان",
    "auth.registerTitle": "اکاؤنٹ بنائیں", "auth.registerBtn": "اکاؤنٹ بنائیں",
  },
  bn: {
    "nav.home": "হোম", "nav.predict": "পূর্বাভাস", "nav.about": "সম্পর্কে",
    "nav.history": "ইতিহাস", "nav.login": "লগইন", "nav.logout": "লগআউট",
    "nav.startAssessment": "মূল্যায়ন শুরু করুন",
    "predict.pageTitle": "ডায়াবেটিস ঝুঁকি পূর্বাভাসক",
    "predict.pageSubtitle": "আপনার স্বাস্থ্য তথ্য পূরণ করুন। ৬০ সেকেন্ডের কম সময় লাগে।",
    "predict.gender": "লিঙ্গ", "predict.male": "পুরুষ", "predict.female": "মহিলা", "predict.other": "অন্যান্য",
    "predict.age": "বয়স (বছর)", "predict.hypertension": "উচ্চ রক্তচাপ",
    "predict.heartDisease": "হৃদরোগ", "predict.smokingHistory": "ধূমপানের ইতিহাস",
    "predict.bmi": "BMI (kg/m²)", "predict.hba1c": "HbA1c স্তর (%)",
    "predict.glucose": "রক্তে শর্করা (mg/dL)", "predict.yes": "হ্যাঁ", "predict.no": "না",
    "predict.next": "পরবর্তী", "predict.back": "পিছনে",
    "predict.submit": "আমার ঝুঁকি স্কোর পান",
    "results.lowRisk": "দারুণ! আপনার ঝুঁকি কম।",
    "results.mediumRisk": "মাঝারি ঝুঁকি সনাক্ত হয়েছে।",
    "results.highRisk": "উচ্চ ঝুঁকি — অনুগ্রহ করে ডাক্তারের পরামর্শ নিন।",
    "history.title": "পূর্বাভাস ইতিহাস",
    "auth.loginTitle": "আবার স্বাগতম", "auth.loginBtn": "সাইন ইন",
    "auth.registerTitle": "অ্যাকাউন্ট তৈরি করুন", "auth.registerBtn": "অ্যাকাউন্ট তৈরি করুন",
  },
  ta: {
    "nav.home": "முகப்பு", "nav.predict": "கணிப்பு", "nav.about": "பற்றி",
    "nav.history": "வரலாறு", "nav.login": "உள்நுழை", "nav.logout": "வெளியேறு",
    "nav.startAssessment": "மதிப்பீடு தொடங்கு",
    "predict.pageTitle": "நீரிழிவு ஆபத்து கணிப்பு",
    "predict.pageSubtitle": "உங்கள் உடல்நல தகவலை நிரப்பவும். 60 விநாடிகளுக்கும் குறைவான நேரம் எடுக்கும்.",
    "predict.gender": "பாலினம்", "predict.male": "ஆண்", "predict.female": "பெண்", "predict.other": "மற்றவை",
    "predict.age": "வயது (ஆண்டுகள்)", "predict.hypertension": "உயர் இரத்த அழுத்தம்",
    "predict.heartDisease": "இதய நோய்", "predict.smokingHistory": "புகைபிடிக்கும் வரலாறு",
    "predict.bmi": "BMI (kg/m²)", "predict.hba1c": "HbA1c அளவு (%)",
    "predict.glucose": "இரத்த சர்க்கரை (mg/dL)", "predict.yes": "ஆம்", "predict.no": "இல்லை",
    "predict.next": "அடுத்து", "predict.back": "பின்",
    "predict.submit": "என் ஆபத்து மதிப்பெண் பெறு",
    "results.lowRisk": "அருமை! உங்கள் ஆபத்து குறைவாக உள்ளது.",
    "results.mediumRisk": "மிதமான ஆபத்து கண்டறியப்பட்டது.",
    "results.highRisk": "அதிக ஆபத்து — மருத்துவரை அணுகவும்.",
    "history.title": "கணிப்பு வரலாறு",
    "auth.loginTitle": "மீண்டும் வரவேற்கிறோம்", "auth.loginBtn": "உள்நுழை",
    "auth.registerTitle": "கணக்கு உருவாக்கு", "auth.registerBtn": "கணக்கு உருவாக்கு",
  },
  te: {
    "nav.home": "హోమ్", "nav.predict": "అంచనా", "nav.about": "గురించి",
    "nav.history": "చరిత్ర", "nav.login": "లాగిన్", "nav.logout": "లాగవుట్",
    "nav.startAssessment": "అంచనా ప్రారంభించు",
    "predict.pageTitle": "మధుమేహ ప్రమాద అంచనాకర్త",
    "predict.pageSubtitle": "మీ ఆరోగ్య సమాచారాన్ని నింపండి. 60 సెకన్లలోపు పూర్తవుతుంది.",
    "predict.gender": "లింగం", "predict.male": "పురుషుడు", "predict.female": "స్త్రీ", "predict.other": "ఇతర",
    "predict.age": "వయసు (సంవత్సరాలు)", "predict.hypertension": "అధిక రక్తపోటు",
    "predict.heartDisease": "హృదయ వ్యాధి",
    "predict.bmi": "BMI (kg/m²)", "predict.hba1c": "HbA1c స్థాయి (%)",
    "predict.glucose": "రక్తంలో చక్కెర (mg/dL)", "predict.yes": "అవును", "predict.no": "కాదు",
    "predict.next": "తదుపరి", "predict.back": "వెనక్కి",
    "predict.submit": "నా ప్రమాద స్కోర్ పొందు",
    "results.lowRisk": "అద్భుతం! మీ ప్రమాదం తక్కువగా ఉంది.",
    "results.mediumRisk": "మధ్యస్థ ప్రమాదం కనుగొనబడింది.",
    "results.highRisk": "అధిక ప్రమాదం — దయచేసి వైద్యుడిని సంప్రదించండి.",
    "history.title": "అంచనా చరిత్ర",
    "auth.loginTitle": "మళ్ళీ స్వాగతం", "auth.loginBtn": "సైన్ ఇన్",
    "auth.registerTitle": "ఖాతా సృష్టించు", "auth.registerBtn": "ఖాతా సృష్టించు",
  },
  mr: {
    "nav.home": "मुख्यपृष्ठ", "nav.predict": "अंदाज", "nav.about": "परिचय",
    "nav.history": "इतिहास", "nav.login": "लॉगिन", "nav.logout": "लॉगआउट",
    "nav.startAssessment": "मूल्यांकन सुरू करा",
    "predict.pageTitle": "मधुमेह जोखीम अंदाजक",
    "predict.pageSubtitle": "आपली आरोग्य माहिती भरा. 60 सेकंदांपेक्षा कमी वेळ लागतो.",
    "predict.gender": "लिंग", "predict.male": "पुरुष", "predict.female": "स्त्री", "predict.other": "इतर",
    "predict.age": "वय (वर्षे)", "predict.hypertension": "उच्च रक्तदाब",
    "predict.heartDisease": "हृदयरोग", "predict.smokingHistory": "धूम्रपानाचा इतिहास",
    "predict.bmi": "BMI (kg/m²)", "predict.hba1c": "HbA1c पातळी (%)",
    "predict.glucose": "रक्तातील साखर (mg/dL)", "predict.yes": "हो", "predict.no": "नाही",
    "predict.next": "पुढे", "predict.back": "मागे",
    "predict.submit": "माझा जोखीम स्कोर मिळवा",
    "results.lowRisk": "छान! तुमचा जोखीम कमी आहे.",
    "results.mediumRisk": "मध्यम जोखीम आढळला.",
    "results.highRisk": "उच्च जोखीम — कृपया डॉक्टरांचा सल्ला घ्या.",
    "history.title": "अंदाज इतिहास",
    "auth.loginTitle": "पुन्हा स्वागत आहे", "auth.loginBtn": "साइन इन करा",
    "auth.registerTitle": "खाते तयार करा", "auth.registerBtn": "खाते तयार करा",
  },
};

interface I18nCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang: "en", setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = localStorage.getItem("diabetes_ai_lang") as LangCode | null;
    if (stored && LANGUAGES.find((l) => l.code === stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem("diabetes_ai_lang", l);
    document.documentElement.setAttribute("lang", l);
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[lang];
    let str = dict[key] ?? TRANSLATIONS["en"][key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
