"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderLock,
  Languages,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";

type Lang = "en" | "ar";
type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  locationAr: string;
  posted: string;
  postedAr: string;
  score: number;
  accent: string;
  initials: string;
  matched: string[];
  matchedAr: string[];
  missing: string[];
  missingAr: string[];
};
type LocalDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: "processing" | "ready";
  blob: Blob;
};
type PreviewState = { doc: LocalDocument; url: string };
type JobAnalysis = {
  source: "live" | "demo";
  fallbackReason?: string;
  jobTitle: string;
  company: string;
  location: string;
  requiredExperience: string;
  requiredSkills: string[];
  certifications: string[];
  matchedRequirements: string[];
  partiallyMatchedRequirements: string[];
  missingRequirements: string[];
  scoreBreakdown: { category: string; earned: number; possible: number }[];
  overallMatchScore: number;
  recommendation: "Apply" | "Review" | "Skip";
};
const DB_NAME = "careerpilot-local-vault",
  STORE_NAME = "documents";
function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function getLocalDocuments() {
  const db = await openVault();
  return new Promise<LocalDocument[]>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();
    request.onsuccess = () => resolve(request.result as LocalDocument[]);
    request.onerror = () => reject(request.error);
  });
}
async function saveLocalDocument(doc: LocalDocument) {
  const db = await openVault();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put(doc);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
async function deleteLocalDocument(id: string) {
  const db = await openVault();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
const jobs: Job[] = [
  {
    id: 1,
    title: "Site Engineer",
    company: "Al Bawani Construction",
    location: "Riyadh, Saudi Arabia",
    locationAr: "الرياض، المملكة العربية السعودية",
    posted: "2 days ago",
    postedAr: "منذ يومين",
    score: 100,
    accent: "#142f30",
    initials: "AB",
    matched: [
      "B.Sc. Civil Engineering",
      "5+ years site experience",
      "AutoCAD",
      "Valid Saudi driving licence",
      "PMP certification (preferred)",
    ],
    matchedAr: [
      "بكالوريوس هندسة مدنية",
      "خبرة ميدانية لأكثر من 5 سنوات",
      "AutoCAD",
      "رخصة قيادة سعودية سارية",
      "شهادة PMP (مفضلة)",
    ],
    missing: [],
    missingAr: [],
  },
  {
    id: 2,
    title: "Project Engineer",
    company: "Nesma & Partners",
    location: "Jeddah, Saudi Arabia",
    locationAr: "جدة، المملكة العربية السعودية",
    posted: "4 days ago",
    postedAr: "منذ 4 أيام",
    score: 84,
    accent: "#d59d48",
    initials: "NP",
    matched: [
      "B.Sc. Civil Engineering",
      "Construction planning",
      "Team coordination",
    ],
    matchedAr: [
      "بكالوريوس هندسة مدنية",
      "تخطيط أعمال الإنشاء",
      "تنسيق فرق العمل",
    ],
    missing: ["Primavera P6", "Aramco project experience"],
    missingAr: ["Primavera P6", "خبرة في مشاريع أرامكو"],
  },
  {
    id: 3,
    title: "Civil Site Supervisor",
    company: "El Seif Engineering",
    location: "Riyadh, Saudi Arabia",
    locationAr: "الرياض، المملكة العربية السعودية",
    posted: "1 week ago",
    postedAr: "منذ أسبوع",
    score: 76,
    accent: "#3b775e",
    initials: "ES",
    matched: ["Site supervision", "Safety compliance", "Concrete works"],
    matchedAr: [
      "الإشراف الميداني",
      "الالتزام بمتطلبات السلامة",
      "الأعمال الخرسانية",
    ],
    missing: ["10+ years experience", "NEBOSH certification"],
    missingAr: ["خبرة لأكثر من 10 سنوات", "شهادة NEBOSH"],
  },
];
const verifiedTargetRoles = [
  "Construction Manager",
  "QA/QC Manager",
  "Senior QA/QC Engineer",
  "Senior Civil Engineer",
  "Senior Site Engineer",
];
const l = (ar: boolean, en: string, arabic: string) => (ar ? arabic : en);

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [jobId, setJobId] = useState(1);
  const [tab, setTab] = useState<"cv" | "letter" | "message">("cv");
  const [toast, setToast] = useState("");
  const [localDocs, setLocalDocs] = useState<LocalDocument[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastAnalysisRequest = useRef(0);
  const [jobDescription, setJobDescription] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<JobAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState("");
  const ar = lang === "ar";
  const job = useMemo(() => jobs.find((j) => j.id === jobId)!, [jobId]);
  const notify = (en: string, arabic: string) => {
    setToast(l(ar, en, arabic));
    window.setTimeout(() => setToast(""), 2200);
  };
  const loadDemo = () => {
    document
      .getElementById("dashboard")
      ?.scrollIntoView({ behavior: "smooth" });
    notify(
      "Anonymized demo candidate loaded",
      "تم تحميل بيانات المرشح التجريبي المجهّلة",
    );
  };
  useEffect(() => {
    getLocalDocuments()
      .then((docs) =>
        setLocalDocs(
          docs.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
        ),
      )
      .catch(() => undefined);
  }, []);
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];
    const valid = Array.from(files).filter(
      (file) =>
        allowed.includes(file.type) ||
        /\.(pdf|docx|jpe?g|png)$/i.test(file.name),
    );
    if (valid.length !== files.length)
      notify(
        "Some unsupported files were skipped",
        "تم تجاهل بعض الملفات غير المدعومة",
      );
    for (const file of valid) {
      const doc: LocalDocument = {
        id: `${Date.now()}-${crypto.randomUUID()}`,
        name: file.name,
        type: file.type || file.name.split(".").pop()?.toUpperCase() || "File",
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: "processing",
        blob: file,
      };
      setLocalDocs((current) => [doc, ...current]);
      await saveLocalDocument(doc);
      window.setTimeout(async () => {
        const ready = { ...doc, status: "ready" as const };
        await saveLocalDocument(ready);
        setLocalDocs((current) =>
          current.map((item) => (item.id === ready.id ? ready : item)),
        );
      }, 1200);
    }
    if (fileInput.current) fileInput.current.value = "";
  };
  const closePreview = () => {
    if (!preview) return;
    URL.revokeObjectURL(preview.url);
    setPreview(null);
  };
  const removeFile = async (doc: LocalDocument) => {
    await deleteLocalDocument(doc.id);
    setLocalDocs((current) => current.filter((item) => item.id !== doc.id));
    if (preview?.doc.id === doc.id) closePreview();
    notify(
      "Document removed from this browser",
      "تم حذف المستند من هذا المتصفح",
    );
  };
  const openDocument = (doc: LocalDocument) => {
    if (doc.status !== "ready") return;
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ doc, url: URL.createObjectURL(doc.blob) });
  };
  const analyzeJob = async () => {
    if (!jobDescription.trim()) {
      setAnalysisNotice(
        l(ar, "Paste a job description first.", "ألصق وصف الوظيفة أولاً."),
      );
      return;
    }
    if (Date.now() - lastAnalysisRequest.current < 3000) {
      setAnalysisNotice(
        l(
          ar,
          "Please wait a moment before another analysis.",
          "يرجى الانتظار قليلاً قبل إجراء تحليل آخر.",
        ),
      );
      return;
    }
    lastAnalysisRequest.current = Date.now();
    setAnalysisLoading(true);
    setAnalysisNotice("");
    try {
      const response = await fetch("/api/job-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      if (!response.ok) throw new Error("analysis failed");
      const result = (await response.json()) as JobAnalysis;
      setAiAnalysis(result);
      setAnalysisNotice(
        result.source === "demo"
          ? l(
              ar,
              "Demo Analysis — no API request was sent.",
              "تحليل تجريبي — لم يتم إرسال أي طلب إلى API.",
            )
          : l(
              ar,
              "Live AI analysis complete. Based only on verified demo data.",
              "اكتمل تحليل الذكاء الاصطناعي المباشر. يستند فقط إلى بيانات العرض الموثّقة.",
            ),
      );
    } catch {
      const fallback: JobAnalysis = {
        source: "demo",
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        requiredExperience: "5+ years site experience",
        requiredSkills: job.matched,
        certifications: job.missing.filter((item) =>
          /certification/i.test(item),
        ),
        matchedRequirements: job.matched,
        partiallyMatchedRequirements: [],
        missingRequirements: job.missing,
        scoreBreakdown: [
          { category: "Experience", earned: 14, possible: 14 },
          { category: "Education", earned: 12, possible: 12 },
          { category: "Certifications", earned: 3, possible: 3 },
          { category: "Technical skills", earned: 10, possible: 10 },
          { category: "Management responsibilities", earned: 8, possible: 8 },
          { category: "Location and work eligibility", earned: 6, possible: 6 },
          { category: "Language", earned: 0, possible: 0 },
        ],
        overallMatchScore: job.score,
        recommendation:
          job.score >= 85 ? "Apply" : job.score >= 70 ? "Review" : "Skip",
      };
      setAiAnalysis(fallback);
      setAnalysisNotice(
        l(
          ar,
          "Demo Analysis — live AI failed, so CareerPilot is showing the local demo match.",
          "تحليل تجريبي — تعذر الذكاء الاصطناعي المباشر، لذا يعرض CareerPilot نتيجة العرض المحلية.",
        ),
      );
    } finally {
      setAnalysisLoading(false);
    }
  };
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const nav = [
    ["Overview", "نظرة عامة", "#overview"],
    ["Career Vault", "خزنة المسار المهني", "#vault"],
    ["Job Matches", "الوظائف المتوافقة", "#matches"],
    ["Applications", "طلبات التوظيف", "#applications"],
  ];
  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      lang={lang}
      className={`min-h-screen bg-[#f6f8f5] text-[#153331] ${ar ? "text-right" : "text-left"}`}
    >
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full bg-[#153331] px-5 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-[#dfe7e1] bg-[#fbfcfa]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a
            href="#"
            className="flex items-center gap-3 font-bold"
            aria-label="CareerPilot AI"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#153331] text-[#dff05a]">
              <Zap size={19} fill="currentColor" />
            </span>
            <span className="text-lg tracking-tight" dir="ltr">
              CareerPilot <em className="not-italic text-[#6b7f24]">AI</em>
            </span>
          </a>
          <nav
            aria-label={l(ar, "Main navigation", "التنقل الرئيسي")}
            className="hidden items-center gap-8 text-sm font-medium text-[#596b67] md:flex"
          >
            {nav.map((n) => (
              <a
                key={n[2]}
                href={n[2]}
                className="transition hover:text-[#153331]"
              >
                {ar ? n[1] : n[0]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(ar ? "en" : "ar")}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#d7e0da] bg-white px-3 text-sm font-semibold hover:bg-[#f2f5f2]"
              aria-label={l(ar, "Switch to Arabic", "التبديل إلى الإنجليزية")}
            >
              <Languages size={16} />
              {ar ? "English" : "العربية"}
            </button>
            <button
              onClick={loadDemo}
              className="hidden h-10 items-center gap-2 rounded-xl bg-[#153331] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#234844] sm:flex"
            >
              <CircleUserRound size={17} />
              {l(ar, "Demo Candidate", "مرشح تجريبي")}
            </button>
          </div>
        </div>
      </header>

      <section
        id="overview"
        className="relative overflow-hidden border-b border-[#dde7df] bg-[#f8faf6]"
      >
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="absolute -end-32 -top-32 size-96 rounded-full bg-[#e8f59d]/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-[#d5e48d] bg-[#f1f7cc] px-3 py-1.5 text-xs font-bold tracking-[.1em] text-[#53651d]">
              <Sparkles size={14} />
              {l(ar, "BUILT FOR AMBITIOUS CAREERS", "مصمم لمسيرة مهنية طموحة")}
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-.035em] sm:text-6xl lg:text-7xl">
              {l(ar, "Your career.", "مسيرتك المهنية.")}
              <br />
              <span className="text-[#8a9d31]">
                {l(ar, "Verified. Matched. Ready.", "موثقة. متوافقة. جاهزة.")}
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5e716c]">
              {l(
                ar,
                "Turn your documents into a trusted career profile, discover roles that truly fit, and apply with confidence — without overstating a single qualification.",
                "حوّل مستنداتك إلى ملف مهني موثوق، واكتشف الفرص المناسبة لك فعلاً، وتقدّم بثقة — دون المبالغة في أي مؤهل.",
              )}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={loadDemo}
                className="group flex h-13 items-center gap-3 rounded-xl bg-[#153331] px-6 font-semibold text-white shadow-[0_10px_25px_rgba(21,51,49,.18)] hover:bg-[#244a46]"
              >
                {l(ar, "Explore your matches", "استكشف فرصك المتوافقة")}
                <Arrow size={18} />
              </button>
              <span className="flex items-center gap-2 text-sm text-[#61736e]">
                <ShieldCheck size={17} className="text-[#7e9229]" />
                {l(
                  ar,
                  "No sign-up · Local demo",
                  "دون تسجيل · نسخة تجريبية محلية",
                )}
              </span>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#dfe7e1] pt-6 text-xs font-semibold tracking-wider text-[#6f807c]">
              <span className="flex items-center gap-2">
                <FolderLock size={15} />
                {l(ar, "PRIVATE BY DESIGN", "خصوصية بتصميم واعٍ")}
              </span>
              <span className="flex items-center gap-2">
                <FileCheck2 size={15} />
                {l(ar, "DOCUMENT-BACKED", "موثّق بالمستندات")}
              </span>
              <span className="flex items-center gap-2">
                <Languages size={15} />
                {l(ar, "ARABIC + ENGLISH", "العربية + الإنجليزية")}
              </span>
            </div>
          </div>
          <HeroPanel ar={ar} />
        </div>
      </section>

      <section id="dashboard" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[.14em] text-[#82952c]">
              {l(ar, "CANDIDATE WORKSPACE", "مساحة عمل المرشح")}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {l(ar, "Good morning, Candidate 014", "صباح الخير، المرشح 014")}
            </h2>
            <p className="mt-2 text-[#697a76]">
              {l(
                ar,
                "Your career evidence is organized and ready to work for you.",
                "أدلتك المهنية منظّمة وجاهزة لدعم مسيرتك.",
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#dbe5dd] bg-white px-4 py-3 shadow-sm">
            <div className="relative grid size-12 place-items-center rounded-full bg-[#edf3d2] font-bold text-[#59691f]">
              86
              <span className="absolute -bottom-1 -end-1 grid size-5 place-items-center rounded-full bg-[#153331] text-white">
                <Check size={12} />
              </span>
            </div>
            <div>
              <p className="text-xs text-[#71817d]">
                {l(ar, "Profile strength", "قوة الملف")}
              </p>
              <p className="text-sm font-bold">
                {l(ar, "Strong profile", "ملف قوي")}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Stat
            icon={<FolderLock />}
            label={l(ar, "Career Vault", "خزنة المسار المهني")}
            value={l(ar, "5 documents", "5 مستندات")}
            note={l(ar, "All files processed", "تمت معالجة جميع الملفات")}
            tone="dark"
            ar={ar}
          />
          <Stat
            icon={<ShieldCheck />}
            label={l(ar, "Verified claims", "المعلومات الموثقة")}
            value={l(ar, "18 verified", "18 معلومة موثقة")}
            note={l(ar, "100% source-linked", "مرتبطة بالمصادر بنسبة 100%")}
            tone="lime"
            ar={ar}
          />
          <Stat
            icon={<BriefcaseBusiness />}
            label={l(ar, "Active matches", "الفرص المتوافقة")}
            value={l(ar, "3 roles", "3 وظائف")}
            note={l(ar, "Top match: 100%", "أفضل توافق: 100%")}
            tone="gold"
            ar={ar}
          />
        </div>

        <section id="vault" className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">
                  {l(ar, "Career Vault", "خزنة المسار المهني")}
                </span>
                <h3>
                  {l(ar, "Documents & credentials", "المستندات والمؤهلات")}
                </h3>
                <p className="mt-1 text-xs text-[#7a8985]">
                  {l(
                    ar,
                    "Stored only in this browser",
                    "محفوظة في هذا المتصفح فقط",
                  )}
                </p>
              </div>
              <button
                aria-label={l(ar, "Add document", "إضافة مستند")}
                onClick={() => fileInput.current?.click()}
                className="icon-btn"
              >
                <Plus size={18} />
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              onChange={(event) => addFiles(event.target.files)}
              className="sr-only"
              aria-label={l(
                ar,
                "Choose source documents",
                "اختيار مستندات المصدر",
              )}
            />
            <div className="space-y-3">
              <Document
                name="CV_Engineer_2026.pdf"
                meta={l(
                  ar,
                  "CV · Updated 14 Jul 2026",
                  "السيرة الذاتية · حُدثت في 14 يوليو 2026",
                )}
                status={l(ar, "Verified", "موثّق")}
              />
              <Document
                name="BSc_Civil_Engineering.pdf"
                meta={l(
                  ar,
                  "Degree · Cairo University",
                  "مؤهل جامعي · جامعة القاهرة",
                )}
                status={l(ar, "Verified", "موثّق")}
              />
              <Document
                name="Saudi_Council_Certificate.pdf"
                meta={l(
                  ar,
                  "Professional certificate · Valid",
                  "شهادة مهنية · سارية",
                )}
                status={l(ar, "Verified", "موثّق")}
              />
              <Document
                name="AutoCAD_Certificate.pdf"
                meta={l(
                  ar,
                  "Training certificate · 2021",
                  "شهادة تدريب · 2021",
                )}
                status={l(ar, "Verified", "موثّق")}
              />
              <Document
                name="PMP_Certificate.pdf"
                meta={l(
                  ar,
                  "PMP certification · Verified evidence linked",
                  "شهادة PMP · دليل موثّق ومرتبط بالمصدر",
                )}
                status={l(ar, "Verified", "موثّق")}
              />
              {localDocs.map((doc) => (
                <UploadedDocument
                  key={doc.id}
                  doc={doc}
                  ar={ar}
                  onPreview={() => openDocument(doc)}
                  onRemove={() => removeFile(doc)}
                />
              ))}
            </div>
            <button
              onClick={() => fileInput.current?.click()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#becbc2] py-3 text-sm font-semibold text-[#5d706b] hover:bg-[#f5f8f5]"
            >
              <Upload size={17} />
              {l(ar, "Add a source document", "إضافة مستند مصدر")}
            </button>
            <p className="mt-2 text-center text-[11px] text-[#87948f]">
              PDF · DOCX · JPG · PNG ·{" "}
              {l(ar, "Multiple files allowed", "يمكن اختيار عدة ملفات")}
            </p>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">
                  {l(ar, "Verified Career Profile", "الملف المهني الموثّق")}
                </span>
                <h3>
                  {l(
                    ar,
                    "Evidence you can trust",
                    "أدلة مهنية يمكنك الوثوق بها",
                  )}
                </h3>
              </div>
              <span className="verified-pill">
                <ShieldCheck size={14} />
                {l(ar, "18 verified", "18 موثقة")}
              </span>
            </div>
            <div className="space-y-5">
              <Claim
                label={l(ar, "Education", "التعليم")}
                value={l(
                  ar,
                  "B.Sc. Civil Engineering",
                  "بكالوريوس هندسة مدنية",
                )}
                source="BSc_Civil_Engineering.pdf"
                ar={ar}
              />
              <Claim
                label={l(ar, "Experience", "الخبرة")}
                value={l(
                  ar,
                  "5 years, 8 months · Construction",
                  "5 سنوات و8 أشهر · الإنشاءات",
                )}
                source="CV_Engineer_2026.pdf"
                ar={ar}
              />
              <Claim
                label={l(ar, "Registration", "التسجيل المهني")}
                value={l(
                  ar,
                  "Saudi Council of Engineers · Valid",
                  "الهيئة السعودية للمهندسين · ساري",
                )}
                source="Saudi_Council_Certificate.pdf"
                ar={ar}
              />
              <Claim
                label={l(ar, "Certification", "الشهادة المهنية")}
                value={l(
                  ar,
                  "PMP (Project Management Professional) · Verified",
                  "PMP (محترف إدارة المشاريع) · موثّقة",
                )}
                source="PMP_Certificate.pdf"
                ar={ar}
              />
              <Claim
                label={l(ar, "Core skills", "المهارات الأساسية")}
                value={l(
                  ar,
                  "AutoCAD · Site supervision · QA/QC",
                  "AutoCAD · الإشراف الميداني · QA/QC",
                )}
                source={l(
                  ar,
                  "CV + training certificate",
                  "السيرة الذاتية + شهادة التدريب",
                )}
                ar={ar}
              />
              <Claim
                label={l(
                  ar,
                  "Verified target roles",
                  "الأدوار المستهدفة الموثّقة",
                )}
                value={l(
                  ar,
                  verifiedTargetRoles.join(" · "),
                  "مدير إنشاءات · مدير QA/QC · مهندس QA/QC أول · مهندس مدني أول · مهندس موقع أول",
                )}
                source="CV_Engineer_2026.pdf"
                ar={ar}
              />
            </div>
            <div className="mt-5 rounded-xl bg-[#f2f5ef] p-3 text-xs leading-5 text-[#657671]">
              <strong className="text-[#294540]">
                {l(ar, "Evidence rule:", "قاعدة التوثيق:")}
              </strong>{" "}
              {l(
                ar,
                "CareerPilot only uses claims found in the source documents shown above.",
                "لا يستخدم CareerPilot إلا المعلومات الواردة في مستندات المصدر الموضحة أعلاه.",
              )}
            </div>
          </div>
        </section>

        <section id="matches" className="mt-20">
          <div className="mb-7">
            <span className="eyebrow">
              {l(ar, "Job Matcher", "مطابقة الوظائف")}
            </span>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {l(
                ar,
                "Roles that fit your evidence",
                "وظائف تتوافق مع أدلتك المهنية",
              )}
            </h2>
            <p className="mt-2 text-[#6a7c77]">
              {l(
                ar,
                "Paste a job description for a server-side AI analysis, or explore the local demo matches below.",
                "ألصق وصف الوظيفة لتحليله بالذكاء الاصطناعي على الخادم، أو استكشف نتائج العرض المحلي أدناه.",
              )}
            </p>
          </div>
          <div className="mb-6 rounded-2xl border border-[#d8e3dc] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <label htmlFor="job-description" className="text-sm font-bold">
                {l(ar, "Analyze a job description", "تحليل وصف وظيفة")}
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                maxLength={3000}
                rows={6}
                placeholder={l(
                  ar,
                  "Paste a construction job description here…",
                  "ألصق وصف وظيفة في قطاع الإنشاءات هنا…",
                )}
                className="w-full resize-y rounded-xl border border-[#d9e3dc] bg-[#fbfcfa] p-3 text-sm leading-6 outline-none transition focus:border-[#83972f] focus:ring-2 focus:ring-[#eaf1c5]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#71817d]">
                  {jobDescription.length.toLocaleString()} / 3,000 ·{" "}
                  {l(
                    ar,
                    "Demo mode is active; no API credits are used.",
                    "وضع العرض التجريبي نشط؛ لا يتم استخدام أي رصيد API.",
                  )}
                </p>
                <button
                  onClick={analyzeJob}
                  disabled={analysisLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#153331] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  {analysisLoading
                    ? l(ar, "Analyzing…", "جارٍ التحليل…")
                    : l(ar, "Analyze with AI", "تحليل بالذكاء الاصطناعي")}
                </button>
              </div>
              {analysisNotice && (
                <p
                  role="status"
                  className="rounded-xl bg-[#f1f5ea] px-3 py-2 text-sm text-[#566b3b]"
                >
                  {analysisNotice}
                </p>
              )}
            </div>
          </div>
          {aiAnalysis && <AIAnalysisResult analysis={aiAnalysis} ar={ar} />}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#526762]">
              {l(ar, "Local demo matches", "نتائج العرض المحلي")}
            </p>
            <span className="text-xs text-[#7a8985]">
              {l(
                ar,
                "Fallback stays available",
                "النتيجة المحلية متاحة دائماً",
              )}
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
            <div className="space-y-3">
              {jobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  active={jobId === j.id}
                  onClick={() => setJobId(j.id)}
                  ar={ar}
                />
              ))}
            </div>
            <MatchDetail job={job} ar={ar} />
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-7">
            <span className="eyebrow">
              {l(ar, "Application Studio", "استوديو التقديم")}
            </span>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {l(ar, "Tailored, never fabricated", "مخصص لك، دون اختلاق")}
            </h2>
            <p className="mt-2 text-[#6a7c77]">
              {l(
                ar,
                "Drafted only from verified profile claims and the selected job.",
                "تُصاغ المحتويات فقط من معلومات الملف الموثّقة ومتطلبات الوظيفة المختارة.",
              )}
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#d9e3dc] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e8e3] px-5 py-4">
              <div className="flex gap-1 rounded-xl bg-[#f0f3ef] p-1">
                {(
                  [
                    ["cv", l(ar, "Tailored CV", "السيرة الذاتية المخصصة")],
                    ["letter", l(ar, "Cover letter", "خطاب التقديم")],
                    [
                      "message",
                      l(ar, "Recruiter message", "رسالة مسؤول التوظيف"),
                    ],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-white text-[#153331] shadow-sm" : "text-[#6b7c77]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                aria-label={l(ar, "Copy draft", "نسخ المسودة")}
                onClick={() =>
                  notify("Draft copied (demo)", "تم نسخ المسودة (تجريبي)")
                }
                className="icon-btn"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="grid lg:grid-cols-[220px_1fr]">
              <aside className="border-b border-[#e4ebe6] bg-[#f8faf7] p-5 lg:border-b-0 lg:border-e">
                <p className="text-xs font-bold tracking-wider text-[#7d8c88]">
                  {l(ar, "TAILORED FOR", "مُخصصة لوظيفة")}
                </p>
                <p className="mt-3 font-bold" dir="ltr">
                  {job.title}
                </p>
                <p className="mt-1 text-sm text-[#677873]" dir="ltr">
                  {job.company}
                </p>
                <div className="mt-5 rounded-xl border border-[#dce5de] bg-white p-3">
                  <p className="text-xs text-[#778682]">
                    {l(ar, "Evidence coverage", "تغطية الأدلة")}
                  </p>
                  <p className="mt-1 text-2xl font-bold">{job.score}%</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#e8ede9]">
                    <div
                      className="h-full rounded-full bg-[#9caf36]"
                      style={{ width: `${job.score}%` }}
                    />
                  </div>
                </div>
              </aside>
              <DraftContent tab={tab} job={job} ar={ar} />
            </div>
          </div>
        </section>

        <section id="applications" className="mt-20">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <span className="eyebrow">
                {l(ar, "Application Tracker", "متابعة طلبات التوظيف")}
              </span>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {l(
                  ar,
                  "Keep every opportunity moving",
                  "تابع كل فرصة حتى خطوتها التالية",
                )}
              </h2>
            </div>
            <button
              onClick={() =>
                notify(
                  "Application added to tracker",
                  "تمت إضافة الطلب إلى المتابعة",
                )
              }
              className="hidden items-center gap-2 rounded-xl bg-[#153331] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
            >
              <Plus size={16} />
              {l(ar, "Add application", "إضافة طلب")}
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Tracker
              title={l(ar, "Preparing", "قيد التجهيز")}
              count={2}
              color="bg-[#dce98f]"
              cards={[
                {
                  title: "Site Engineer",
                  company: "Al Bawani",
                  date: l(ar, "CV ready", "السيرة الذاتية جاهزة"),
                },
                {
                  title: "Project Engineer",
                  company: "Nesma & Partners",
                  date: l(ar, "Review gaps", "مراجعة المتطلبات الناقصة"),
                },
              ]}
            />
            <Tracker
              title={l(ar, "Applied", "تم التقديم")}
              count={1}
              color="bg-[#e6c27d]"
              cards={[
                {
                  title: "Civil Engineer",
                  company: "BuildCo Arabia",
                  date: l(ar, "Applied 12 Jul", "تم التقديم في 12 يوليو"),
                },
              ]}
            />
            <Tracker
              title={l(ar, "Interview", "مقابلة")}
              count={1}
              color="bg-[#8db6a3]"
              cards={[
                {
                  title: "QA/QC Engineer",
                  company: "Gulf Structures",
                  date: l(ar, "20 Jul · 10:30", "20 يوليو · 10:30"),
                },
              ]}
            />
          </div>
        </section>
      </section>
      {preview && (
        <PreviewModal preview={preview} ar={ar} onClose={closePreview} />
      )}
      <footer className="border-t border-[#dce5df] bg-[#153331] px-5 py-8 text-[#d5dfdc]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm sm:flex-row">
          <span className="font-semibold text-white" dir="ltr">
            CareerPilot AI{" "}
            <span className="text-[#dff05a]">
              · {l(ar, "Local MVP", "نسخة محلية أولية")}
            </span>
          </span>
          <span>
            {l(
              ar,
              "No external accounts · No job scraping · No automated applications",
              "دون حسابات خارجية · دون جمع بيانات الوظائف · دون تقديم آلي للطلبات",
            )}
          </span>
        </div>
      </footer>
    </main>
  );
}

function HeroPanel({ ar }: { ar: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-xl self-center">
      <div className="absolute -start-5 top-12 hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl backdrop-blur sm:block">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-[#edf5bc] text-[#687722]">
            <ShieldCheck size={19} />
          </span>
          <div>
            <p className="text-xs text-[#75847f]">
              {l(ar, "Profile verified", "الملف موثّق")}
            </p>
            <p className="text-sm font-bold">
              {l(ar, "18 source-linked claims", "18 معلومة مرتبطة بمصادرها")}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`${ar ? "-rotate-1" : "rotate-1"} rounded-[28px] border border-[#d4ded7] bg-white p-3 shadow-[0_30px_80px_rgba(35,61,57,.16)]`}
      >
        <div className="rounded-[21px] bg-[#153331] p-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-widest text-[#b5c3be]">
              {l(ar, "TOP CAREER MATCH", "أفضل توافق وظيفي")}
            </span>
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
              {l(ar, "Today", "اليوم")}
            </span>
          </div>
          <div className="mt-8 flex items-end justify-between">
            <div>
              <div className="mb-3 grid size-12 place-items-center rounded-xl bg-[#f7f9f4] font-bold text-[#153331]">
                AB
              </div>
              <h3 className="text-2xl font-semibold" dir="ltr">
                Site Engineer
              </h3>
              <p className="mt-1 text-sm text-[#b7c7c2]">
                <span dir="ltr">Al Bawani</span> · {l(ar, "Riyadh", "الرياض")}
              </p>
            </div>
            <div
              className="grid size-24 place-items-center rounded-full border-[7px] border-[#dbe963] text-center"
              dir="ltr"
            >
              <div>
                <strong className="text-2xl">100%</strong>
                <p className="text-[10px] tracking-wider text-[#c6d2ce]">
                  {l(ar, "MATCH", "توافق")}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/7 p-3">
              <p className="text-xs text-[#a9bab5]">
                {l(ar, "Requirements", "المتطلبات")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#eff7be]">
                {l(ar, "5 of 5 matched", "تطابق 5 من 5")}
              </p>
            </div>
            <div className="rounded-xl bg-white/7 p-3">
              <p className="text-xs text-[#a9bab5]">
                {l(ar, "Documents", "المستندات")}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {l(ar, "5 verified", "5 موثّقة")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 end-0 rounded-2xl border border-[#d9e3dc] bg-white p-4 shadow-xl sm:end-[-18px]">
        <p className="flex items-center gap-2 text-xs text-[#71817d]">
          <Sparkles size={14} className="text-[#85992e]" />
          {l(ar, "Tailored CV ready", "السيرة الذاتية المخصصة جاهزة")}
        </p>
        <p className="mt-1 text-sm font-bold">
          {l(ar, "No qualifications invented", "دون اختلاق أي مؤهلات")}
        </p>
      </div>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  note,
  tone,
  ar,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: string;
  ar: boolean;
}) {
  const c =
    tone === "dark"
      ? "bg-[#153331] text-white"
      : tone === "lime"
        ? "bg-[#edf3cc] text-[#31443e]"
        : "bg-[#f3e8d4] text-[#4b463c]";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <div className={`rounded-2xl p-5 ${c}`}>
      <div className="mb-7 flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-white/50">
          {icon}
        </span>
        <Arrow size={18} className="opacity-50" />
      </div>
      <p className="text-sm opacity-65">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs opacity-70">
        <CheckCircle2 size={13} />
        {note}
      </p>
    </div>
  );
}
function Document({
  name,
  meta,
  status,
}: {
  name: string;
  meta: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e0e7e2] p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f0f3ef] text-[#46625c]">
        <FileText size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" dir="ltr">
          {name}
        </p>
        <p className="mt-0.5 text-xs text-[#7a8985]">{meta}</p>
      </div>
      <span className="rounded-full bg-[#e9f0cb] px-2 py-1 text-[10px] font-bold text-[#657522]">
        {status}
      </span>
    </div>
  );
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function fileLabel(doc: LocalDocument) {
  const name = doc.name.toLowerCase();
  if (doc.type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (doc.type.includes("word") || name.endsWith(".docx")) return "DOCX";
  if (doc.type.includes("png") || name.endsWith(".png")) return "PNG";
  if (doc.type.includes("jpeg") || /\.jpe?g$/i.test(name)) return "JPG";
  return doc.type || "Unknown";
}
function UploadedDocument({
  doc,
  ar,
  onPreview,
  onRemove,
}: {
  doc: LocalDocument;
  ar: boolean;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const date = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(doc.uploadedAt));
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#cfdcd3] bg-[#fbfcfa] p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e7eee9] text-[#365951]">
        <FileText size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" dir="auto">
          {doc.name}
        </p>
        <p className="mt-0.5 text-xs text-[#7a8985]">
          {fileLabel(doc)} · {formatSize(doc.size)} · {date}
        </p>
        <p
          className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${doc.status === "ready" ? "text-[#6c7e22]" : "text-[#9a7629]"}`}
        >
          {doc.status === "ready" ? (
            <CheckCircle2 size={12} />
          ) : (
            <LoaderCircle size={12} className="animate-spin" />
          )}
          {doc.status === "ready"
            ? l(ar, "Ready for review", "جاهز للمراجعة")
            : l(ar, "Processing…", "جارٍ المعالجة…")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          disabled={doc.status !== "ready"}
          onClick={onPreview}
          aria-label={l(ar, "Preview document", "معاينة المستند")}
          className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eye size={15} />
        </button>
        <button
          onClick={onRemove}
          aria-label={l(ar, "Remove document", "حذف المستند")}
          className="icon-btn text-[#a04d42] hover:bg-[#fff1ee]"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
function PreviewModal({
  preview,
  ar,
  onClose,
}: {
  preview: PreviewState;
  ar: boolean;
  onClose: () => void;
}) {
  const { doc, url } = preview;
  const kind = fileLabel(doc);
  const image = kind === "JPG" || kind === "PNG";
  const pdf = kind === "PDF";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102724]/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={l(ar, "Document preview", "معاينة المستند")}
    >
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#dfe7e1] px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-bold" dir="auto">
              {doc.name}
            </p>
            <p className="text-xs text-[#73837e]">
              {kind} · {formatSize(doc.size)} ·{" "}
              {l(ar, "Stored locally", "محفوظ محلياً")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={l(ar, "Close preview", "إغلاق المعاينة")}
            className="icon-btn"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex flex-1 items-center justify-center bg-[#eef2ef] p-3">
          {image ? (
            <img
              src={url}
              alt={doc.name}
              className="h-full w-full object-contain"
            />
          ) : pdf ? (
            <object
              data={url}
              type="application/pdf"
              className="h-full w-full rounded-lg bg-white"
            >
              <PreviewFallback doc={doc} url={url} ar={ar} />
            </object>
          ) : (
            <PreviewFallback doc={doc} url={url} ar={ar} />
          )}
        </div>
      </div>
    </div>
  );
}
function PreviewFallback({
  doc,
  url,
  ar,
}: {
  doc: LocalDocument;
  url: string;
  ar: boolean;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#d8e1db] bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eef2ef] text-[#49625c]">
        <FileText size={26} />
      </span>
      <h3 className="mt-4 text-lg font-bold">
        {l(ar, "Preview unavailable", "المعاينة غير متاحة")}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#6c7c77]">
        {l(
          ar,
          "This browser cannot display this file format inline. The file is still stored safely in this browser.",
          "لا يستطيع هذا المتصفح عرض هذا التنسيق داخلياً. ما زال الملف محفوظاً بأمان في هذا المتصفح.",
        )}
      </p>
      <a
        href={url}
        download={doc.name}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#153331] px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Download size={16} />
        {l(ar, "Download to open", "تنزيل لفتحه")}
      </a>
    </div>
  );
}
function Claim({
  label,
  value,
  source,
  ar,
}: {
  label: string;
  value: string;
  source: string;
  ar: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-[#e6efb7] text-[#647522]">
        <Check size={13} />
      </span>
      <div>
        <p className="text-xs font-semibold tracking-wider text-[#82908c]">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-[#778783]">
          <FileCheck2 size={12} />
          {l(ar, "Source:", "المصدر:")} <span dir="ltr">{source}</span>
        </p>
      </div>
    </div>
  );
}
function JobCard({
  job,
  active,
  onClick,
  ar,
}: {
  job: Job;
  active: boolean;
  onClick: () => void;
  ar: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-start transition ${active ? "border-[#153331] bg-[#153331] text-white shadow-lg" : "border-[#dce4df] bg-white hover:border-[#aebdb4]"}`}
    >
      <div className="flex gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl font-bold"
          style={{
            background: active ? "rgba(255,255,255,.12)" : "#f0f3ee",
            color: active ? "white" : job.accent,
          }}
        >
          {job.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2">
            <div>
              <p className="font-bold" dir="ltr">
                {job.title}
              </p>
              <p
                className={`mt-0.5 text-sm ${active ? "text-[#b8c8c3]" : "text-[#6e7f7a]"}`}
                dir="ltr"
              >
                {job.company}
              </p>
            </div>
            <span
              className={`text-xl font-bold ${active ? "text-[#e2ef6e]" : "text-[#80932c]"}`}
              dir="ltr"
            >
              {job.score}%
            </span>
          </div>
          <div
            className={`mt-3 flex flex-wrap gap-3 text-xs ${active ? "text-[#b4c5c0]" : "text-[#84918e]"}`}
          >
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {ar ? job.locationAr : job.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock3 size={12} />
              {ar ? job.postedAr : job.posted}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
function MatchDetail({ job, ar }: { job: Job; ar: boolean }) {
  const matched = ar ? job.matchedAr : job.matched,
    missing = ar ? job.missingAr : job.missing;
  return (
    <div className="panel h-fit">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#72827e]">
            {l(ar, "Match analysis", "تحليل المطابقة")}
          </p>
          <h3 className="mt-1 text-2xl font-bold" dir="ltr">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-[#647671]">
            <span dir="ltr">{job.company}</span> ·{" "}
            {ar ? job.locationAr : job.location}
          </p>
        </div>
        <div className={ar ? "text-left" : "text-right"} dir="ltr">
          <p className="text-4xl font-bold text-[#80942c]">{job.score}%</p>
          <p className="text-xs text-[#7b8a86]">
            {l(ar, "Strong match", "توافق قوي")}
          </p>
        </div>
      </div>
      <div className="my-5 h-2 overflow-hidden rounded-full bg-[#e8ede9]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#153331] to-[#b1c645]"
          style={{ width: `${job.score}%` }}
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Req
          title={l(ar, "Matched requirements", "المتطلبات المتطابقة")}
          items={matched}
          ok
        />
        <Req
          title={l(ar, "Missing or unverified", "ناقصة أو غير موثّقة")}
          items={missing}
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e2e8e4] pt-5">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#153331] px-4 py-3 text-sm font-bold text-white">
          <Sparkles size={16} />
          {l(ar, "Tailor application", "تخصيص مستندات التقديم")}
        </button>
        <button
          aria-label={l(ar, "More options", "خيارات إضافية")}
          className="icon-btn"
        >
          <ChevronDown size={17} />
        </button>
      </div>
    </div>
  );
}
function AIAnalysisResult({
  analysis,
  ar,
}: {
  analysis: JobAnalysis;
  ar: boolean;
}) {
  const recommendationColor = {
    Apply: "bg-[#e7f0c2] text-[#52651d]",
    Review: "bg-[#f9ecd6] text-[#966226]",
    Skip: "bg-[#f5e3df] text-[#9b4d43]",
  }[analysis.recommendation];
  const recommendation = l(
    ar,
    analysis.recommendation,
    analysis.recommendation === "Apply"
      ? "تقدّم"
      : analysis.recommendation === "Review"
        ? "راجع"
        : "تجاهل",
  );
  const heading =
    analysis.source === "demo"
      ? l(ar, "DEMO ANALYSIS", "تحليل تجريبي")
      : l(ar, "LIVE AI ANALYSIS", "تحليل مباشر بالذكاء الاصطناعي");
  return (
    <div className="mb-6 rounded-2xl border border-[#cfdcd3] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <p className="text-xs font-bold tracking-[.14em] text-[#82952c]">
            {heading}
          </p>
          <h3 className="mt-1 text-2xl font-bold" dir="auto">
            {analysis.jobTitle}
          </h3>
          <p className="mt-1 text-sm text-[#687a75]" dir="auto">
            {analysis.company} · {analysis.location}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#77902d]">
              {analysis.overallMatchScore}%
            </p>
            <p className="text-xs text-[#71817d]">{l(ar, "match", "توافق")}</p>
          </div>
          <span
            className={`rounded-full px-3 py-2 text-sm font-bold ${recommendationColor}`}
          >
            {recommendation}
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-5 border-t border-[#e1e8e3] pt-5 md:grid-cols-3">
        <div className="space-y-3">
          <AIField
            label={l(ar, "Required experience", "الخبرة المطلوبة")}
            value={analysis.requiredExperience}
          />
          <AIList
            label={l(ar, "Required skills", "المهارات المطلوبة")}
            items={analysis.requiredSkills}
          />
          <AIList
            label={l(ar, "Certifications", "الشهادات")}
            items={analysis.certifications}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3 md:col-span-2">
          <Req
            title={l(ar, "Matched requirements", "المتطلبات المتطابقة")}
            items={analysis.matchedRequirements}
            ok
          />
          <Req
            title={l(
              ar,
              "Partially matched or unverified",
              "متطلبات متطابقة جزئياً أو غير موثّقة",
            )}
            items={analysis.partiallyMatchedRequirements}
            partial
          />
          <Req
            title={l(ar, "Missing requirements", "المتطلبات الناقصة")}
            items={analysis.missingRequirements}
          />
        </div>
      </div>
      <ScoreBreakdown breakdown={analysis.scoreBreakdown} ar={ar} />
    </div>
  );
}
function AIField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wider text-[#7e8e89]">{label}</p>
      <p className="mt-1 text-sm text-[#48605a]">{value}</p>
    </div>
  );
}
function AIList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wider text-[#7e8e89]">{label}</p>
      <p className="mt-1 text-sm text-[#48605a]">
        {items.length ? items.join(" · ") : "—"}
      </p>
    </div>
  );
}
function Req({
  title,
  items,
  ok = false,
  partial = false,
}: {
  title: string;
  items: string[];
  ok?: boolean;
  partial?: boolean;
}) {
  const tone = ok
    ? "bg-[#e8efc5] text-[#667723]"
    : partial
      ? "bg-[#e3edf4] text-[#46718a]"
      : "bg-[#f5e8d3] text-[#a56f2d]";
  const Icon = ok ? Check : partial ? Clock3 : X;
  const iconTone = ok
    ? "text-[#82952d]"
    : partial
      ? "text-[#527f99]"
      : "text-[#bd7f39]";
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className={`grid size-5 place-items-center rounded-full ${tone}`}>
          <Icon size={12} />
        </span>
        {title}
      </p>
      <div className="space-y-2">
        {items.length ? (
          items.map((x) => (
            <p key={x} className="flex gap-2 text-sm text-[#566863]">
              <Icon size={14} className={`mt-0.5 shrink-0 ${iconTone}`} />
              {x}
            </p>
          ))
        ) : (
          <p className="text-sm text-[#73837e]">—</p>
        )}
      </div>
    </div>
  );
}
function ScoreBreakdown({
  breakdown,
  ar,
}: {
  breakdown: JobAnalysis["scoreBreakdown"];
  ar: boolean;
}) {
  const categoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      Experience: "الخبرة",
      Education: "التعليم",
      Certifications: "الشهادات",
      "Technical skills": "المهارات الفنية",
      "Management responsibilities": "مسؤوليات الإدارة",
      "Location and work eligibility": "الموقع وأهلية العمل",
      Language: "اللغة",
    };
    return ar ? labels[category] || category : category;
  };
  return (
    <div className="mt-5 rounded-xl bg-[#f3f6f2] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold">
          {l(ar, "Transparent score breakdown", "تفصيل شفاف للدرجة")}
        </p>
        <p className="text-xs text-[#6c7c77]">
          {l(
            ar,
            "Matched = full weight · partial/unverified = 45% · missing = 0 · preferred items carry lower weight",
            "المتطابق = الوزن كاملاً · الجزئي/غير الموثّق = 45٪ · الناقص = 0 · المتطلبات المفضلة وزنها أقل",
          )}
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {breakdown.map((group) => (
          <div
            key={group.category}
            className="rounded-lg border border-[#dce5df] bg-white px-3 py-2"
          >
            <p className="text-xs font-semibold text-[#637570]">
              {categoryLabel(group.category)}
            </p>
            <p className="mt-1 text-sm font-bold text-[#294540]" dir="ltr">
              {group.possible ? `${group.earned}/${group.possible}` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
function DraftContent({
  tab,
  job,
  ar,
}: {
  tab: "cv" | "letter" | "message";
  job: Job;
  ar: boolean;
}) {
  if (tab === "letter")
    return (
      <article className="p-7 text-sm leading-7 text-[#415651]">
        <p className="mb-5 font-semibold">
          {l(
            ar,
            `Dear Hiring Team at ${job.company},`,
            `السادة فريق التوظيف في ${job.company}،`,
          )}
        </p>
        <p>
          {l(
            ar,
            `I am writing to express my interest in the ${job.title} role. My verified background includes a B.Sc. in Civil Engineering, PMP certification, and more than five years of construction-site experience, with hands-on work in site supervision, QA/QC, and AutoCAD.`,
            `أتقدم للتعبير عن اهتمامي بوظيفة ${job.title}. تشمل خلفيتي الموثّقة بكالوريوس في الهندسة المدنية وشهادة PMP وأكثر من خمس سنوات من الخبرة في مواقع الإنشاء، مع خبرة عملية في الإشراف الميداني وQA/QC وAutoCAD.`,
          )}
        </p>
        <p className="mt-4">
          {l(
            ar,
            "I would welcome the opportunity to discuss how this documented experience could support your project team. I have intentionally not claimed the unverified requirements identified in the match review.",
            "يسعدني مناقشة كيفية إسهام هذه الخبرة الموثّقة في دعم فريق مشاريعكم. وقد حرصت على عدم ادعاء أي متطلبات غير موثّقة ظهرت في مراجعة المطابقة.",
          )}
        </p>
        <p className="mt-5">
          {l(ar, "Sincerely,", "مع خالص التحية،")}
          <br />
          <strong>{l(ar, "Candidate 014", "المرشح 014")}</strong>
        </p>
      </article>
    );
  if (tab === "message")
    return (
      <article className="p-7">
        <div
          className={`max-w-2xl rounded-2xl ${ar ? "rounded-tr-sm" : "rounded-tl-sm"} bg-[#edf2e9] p-5 text-sm leading-7 text-[#415651]`}
        >
          <MessageSquareText size={18} className="mb-3 text-[#82952d]" />
          {l(
            ar,
            `Hello — I’m interested in the ${job.title} role at ${job.company}. I’m a PMP-certified Civil Engineer with 5+ years of verified construction-site experience, including site supervision and QA/QC. My tailored CV is ready, and I’d be glad to share it for your review. Thank you.`,
            `مرحباً — أهتم بفرصة ${job.title} لدى ${job.company}. أنا مهندس مدني حاصل على شهادة PMP، بخبرة موثّقة تزيد على 5 سنوات في مواقع الإنشاء، تشمل الإشراف الميداني وQA/QC. سيرتي الذاتية المخصصة جاهزة، ويسعدني مشاركتها معكم للمراجعة. شكراً لكم.`,
          )}
        </div>
        <p className="mt-3 text-xs text-[#82908c]">
          {l(
            ar,
            "Concise · Claims checked against 5 source documents",
            "موجزة · تمت مراجعة المعلومات مقابل 5 مستندات مصدر",
          )}
        </p>
      </article>
    );
  const matched = ar ? job.matchedAr : job.matched;
  return (
    <article className="p-7">
      <div className="mx-auto max-w-2xl border border-[#e1e7e3] bg-white p-7 shadow-sm">
        <div className="border-b-2 border-[#183c38] pb-4">
          <h3 className="text-2xl font-bold">
            {l(ar, "CANDIDATE 014", "المرشح 014")}
          </h3>
          <p className="mt-1 text-sm text-[#61736e]">
            {l(
              ar,
              "Civil Engineer · Riyadh, Saudi Arabia",
              "مهندس مدني · الرياض، المملكة العربية السعودية",
            )}
          </p>
        </div>
        <div className="mt-5">
          <CVHeading>
            {l(ar, "Professional summary", "الملخص المهني")}
          </CVHeading>
          <p className="text-sm leading-6 text-[#50635e]">
            {l(
              ar,
              "PMP-certified Civil Engineer with 5 years and 8 months of verified construction experience in site supervision, QA/QC, and concrete works. Registered with the Saudi Council of Engineers and trained in AutoCAD.",
              "مهندس مدني حاصل على شهادة PMP، بخبرة موثّقة تبلغ 5 سنوات و8 أشهر في الإنشاءات، تشمل الإشراف الميداني وQA/QC والأعمال الخرسانية. مسجل لدى الهيئة السعودية للمهندسين ومدرب على AutoCAD.",
            )}
          </p>
        </div>
        <div className="mt-5">
          <CVHeading>
            {l(
              ar,
              "Verified strengths for this role",
              "نقاط القوة الموثّقة لهذه الوظيفة",
            )}
          </CVHeading>
          <div className="grid gap-2 text-sm text-[#50635e] sm:grid-cols-2">
            {matched.map((x) => (
              <p key={x} className="flex gap-2">
                <Check size={14} className="mt-1 shrink-0 text-[#84972f]" />
                {x}
              </p>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <CVHeading>{l(ar, "Certification", "الشهادة المهنية")}</CVHeading>
          <p className="text-sm font-semibold text-[#50635e]">
            {l(
              ar,
              "PMP (Project Management Professional) · Verified · Evidence: PMP_Certificate.pdf",
              "PMP (محترف إدارة المشاريع) · موثّقة · الدليل: PMP_Certificate.pdf",
            )}
          </p>
        </div>
        <div className="mt-5">
          <CVHeading>
            {l(ar, "Verified target roles", "الأدوار المستهدفة الموثّقة")}
          </CVHeading>
          <p className="text-sm leading-6 text-[#50635e]">
            {l(
              ar,
              verifiedTargetRoles.join(" · "),
              "مدير إنشاءات · مدير QA/QC · مهندس QA/QC أول · مهندس مدني أول · مهندس موقع أول",
            )}
          </p>
        </div>
        <div className="mt-5">
          <CVHeading>{l(ar, "Experience", "الخبرة المهنية")}</CVHeading>
          <p className="text-sm font-bold">
            <span dir="ltr">Site Engineer</span> ·{" "}
            {l(ar, "Construction Company", "شركة إنشاءات")}
          </p>
          <p className="mt-1 text-xs text-[#71817d]">
            {l(
              ar,
              "2020–2026 · Details anonymized for demo",
              "2020–2026 · التفاصيل مجهّلة لأغراض العرض",
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
function CVHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-xs font-bold tracking-[.12em] text-[#617327]">
      {children}
    </h4>
  );
}
function Tracker({
  title,
  count,
  color,
  cards,
}: {
  title: string;
  count: number;
  color: string;
  cards: { title: string; company: string; date: string }[];
}) {
  return (
    <div className="rounded-2xl bg-[#eef2ed] p-3">
      <div className="mb-3 flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${color}`} />
          <p className="text-sm font-bold">{title}</p>
        </div>
        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-[#687873]">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-[#dde5df] bg-white p-4 shadow-sm"
          >
            <p className="font-bold" dir="ltr">
              {card.title}
            </p>
            <p className="mt-1 text-sm text-[#6c7c77]" dir="ltr">
              {card.company}
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-[#82908d]">
              <Clock3 size={12} />
              {card.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
