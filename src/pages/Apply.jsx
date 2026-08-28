import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Section from "../components/Section.jsx";
import PageHero from "../components/PageHero.jsx";
import Seo from "../components/Seo.jsx";
import SignaturePad from "../components/SignaturePad.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { submitAdmissionApplication } from "../lib/admissions.js";
import { formCopy, rules } from "../lib/i18n/admissionTranslations.js";
import { STUDIO } from "../data/studio.js";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MOBILE_RE = /^[6-9]\d{9}$/;

const emptyForm = {
  student_name: "",
  student_mobile: "",
  current_address: "",
  permanent_address: "",
  reference_details: "",
  class_start_time: "",
  class_end_time: "",
  website: "",
};

const inputClass =
  "w-full border border-ink/12 rounded-xl px-4 py-3 text-sm bg-white transition-all duration-150 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/10";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function RequiredMark() {
  return (
    <span className="text-red-600 font-bold ml-0.5" aria-hidden="true">
      *
    </span>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  required = false,
  optionalLabel,
  className = "",
}) {
  return (
    <div className={`text-left ${className}`}>
      {label && (
        <label
          className="block text-sm font-semibold text-ink mb-1.5"
          htmlFor={htmlFor}
        >
          <span>
            {label}
            {required && <RequiredMark />}
          </span>
          {optionalLabel && (
            <span className="text-xs font-medium text-ink-soft ml-1.5 normal-case">
              ({optionalLabel})
            </span>
          )}
        </label>
      )}
      {hint && <p className="text-xs text-ink-soft mb-2 leading-relaxed">{hint}</p>}
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FormSection({ number, title, children }) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-white shadow-card overflow-hidden text-left">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-sand/80 to-white border-b border-ink/6">
        <span
          className="w-9 h-9 rounded-full bg-maroon text-ivory text-sm font-bold flex items-center justify-center shrink-0 shadow-sm"
          aria-hidden="true"
        >
          {number}
        </span>
        <h2 className="text-base md:text-lg font-bold text-ink tracking-tight">
          {title}
        </h2>
      </div>
      <div className="p-5 md:p-6 space-y-5 text-left">{children}</div>
    </section>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1.5 font-medium">{message}</p>;
}

function LanguageToggle({ language, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
        {label}
      </span>
      <div className="inline-flex rounded-xl border border-ink/10 bg-sand/60 p-1">
        <button
          type="button"
          onClick={() => onChange("en")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
            language === "en"
              ? "bg-maroon text-ivory shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => onChange("gu")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
            language === "gu"
              ? "bg-maroon text-ivory shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          ગુજરાતી
        </button>
      </div>
    </div>
  );
}

export default function Apply() {
  const { showToast } = useToast();
  const [language, setLanguage] = useState("gu");
  const [form, setForm] = useState(emptyForm);
  const [agreed, setAgreed] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [photoDrag, setPhotoDrag] = useState(false);
  const fileInputRef = useRef(null);

  const t = formCopy[language];
  const ruleTexts = rules[language];

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((e) => ({ ...e, [name]: undefined }));
    }
  };

  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setField("student_mobile", digits);
  };

  const validate = () => {
    const errors = {};
    if (!form.student_name.trim()) errors.student_name = t.errors.name;
    const mobile = form.student_mobile.replace(/\D/g, "");
    if (!mobile) errors.student_mobile = t.errors.mobile;
    else if (!MOBILE_RE.test(mobile)) errors.student_mobile = t.errors.mobile;
    if (!photoDataUrl) errors.photo = t.errors.photo;
    if (!form.current_address.trim()) errors.current_address = t.errors.currentAddress;
    if (!form.permanent_address.trim()) errors.permanent_address = t.errors.permanentAddress;
    if (!form.class_start_time.trim()) errors.class_start_time = t.errors.classStart;
    if (!form.class_end_time.trim()) errors.class_end_time = t.errors.classEnd;
    if (!signatureDataUrl) errors.signature = t.errors.signature;
    if (!agreed) errors.agree = t.errors.agree;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processPhotoFile = async (file) => {
    if (!file) return;
    const type = file.type.toLowerCase();
    if (!["image/jpeg", "image/jpg", "image/png"].includes(type)) {
      setFieldErrors((err) => ({ ...err, photo: t.errors.photoType }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFieldErrors((err) => ({ ...err, photo: t.errors.photoSize }));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotoPreview(dataUrl);
      setPhotoDataUrl(dataUrl);
      setFieldErrors((err) => ({ ...err, photo: undefined }));
    } catch {
      showToast("Could not read photo file", { type: "error" });
    }
  };

  const handlePhotoChange = (e) => processPhotoFile(e.target.files?.[0]);

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setPhotoDrag(false);
    processPhotoFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const mobile = form.student_mobile.replace(/\D/g, "");
    const { data, error } = await submitAdmissionApplication({
      student_name: form.student_name.trim(),
      student_mobile: mobile,
      student_photo: photoDataUrl,
      student_signature: signatureDataUrl,
      current_address: form.current_address.trim(),
      permanent_address: form.permanent_address.trim(),
      reference_details: form.reference_details.trim(),
      class_start_time: form.class_start_time.trim(),
      class_end_time: form.class_end_time.trim(),
      preferred_language: language,
      agreed_to_terms: true,
      website: form.website,
    });
    setSubmitting(false);

    if (error) {
      showToast(error, { type: "error" });
      return;
    }

    setSuccess({ form_number: data?.form_number });
  };

  if (success) {
    return (
      <>
        <Seo title={t.successTitle} description={t.successBody} />
        <Section tone="ivory" className="py-16 md:py-24">
          <div className="max-w-md mx-auto text-center">
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal/15 text-teal flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-maroon mb-3">
              {t.successTitle}
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-8">
              {t.successBody}
            </p>
            <div className="bg-white rounded-2xl shadow-card border border-ink/8 p-8 mb-6">
              {success.form_number != null && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-2">
                    {t.formNumberLabel}
                  </p>
                  <p className="text-5xl font-bold text-maroon tabular-nums">
                    {success.form_number}
                  </p>
                </div>
              )}
            </div>
            <Link to="/" className="btn-primary inline-flex">
              {t.backHome}
            </Link>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Seo title={t.pageTitle} description={t.pageDescription} />
      <PageHero eyebrow="Classes" title={t.pageTitle}>
        <p>{t.pageDescription}</p>
      </PageHero>

      <Section tone="ivory" align="left">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-8 lg:gap-10 items-start text-left">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-5">
            <div className="rounded-2xl bg-maroon text-ivory p-6 shadow-card">
              <p className="eyebrow text-gold-light mb-2">
                Om Design & Classes
              </p>
              <h2 className="text-xl font-bold mb-4 text-ivory/90">
                {t.sidebarTitle}
              </h2>
              <ol className="space-y-3 text-sm text-ivory/90 leading-relaxed">
                {t.sidebarSteps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-ivory/15 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                {t.sidebarContact}
              </p>
              <div className="space-y-2 text-sm">
                <a
                  href={`tel:${STUDIO.phoneTel}`}
                  className="font-semibold text-maroon hover:underline block"
                >
                  {STUDIO.phoneDisplay}
                </a>
                <p className="text-ink-soft">
                  {STUDIO.addressLines.join(", ")}
                </p>
                <Link
                  to="/contact"
                  className="text-sm font-semibold text-maroon hover:underline"
                >
                  Contact page →
                </Link>
              </div>
            </div>
          </aside>

          {/* Form */}
          <div className="space-y-5 w-full text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-ink/8 bg-white px-5 py-4 shadow-sm text-left">
              <p className="text-sm text-ink-soft font-medium">
                {t.pageDescription}
              </p>
              <LanguageToggle
                language={language}
                onChange={setLanguage}
                label={t.languageLabel}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 w-full text-left" noValidate>
              <p className="text-xs text-ink-soft">{t.requiredLegend}</p>
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={(e) => setField("website", e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] w-1 h-1 opacity-0"
              />

              <FormSection number={1} title={t.sectionPersonal}>
                <div className="space-y-5">
                  <FormField
                    label={t.studentName}
                    htmlFor="student_name"
                    required
                    error={fieldErrors.student_name}
                  >
                    <input
                      id="student_name"
                      type="text"
                      value={form.student_name}
                      onChange={(e) => setField("student_name", e.target.value)}
                      className={inputClass}
                      aria-required="true"
                    />
                  </FormField>

                  <FormField
                    label={t.studentMobile}
                    htmlFor="student_mobile"
                    required
                    error={fieldErrors.student_mobile}
                  >
                    <input
                      id="student_mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      value={form.student_mobile}
                      onChange={handleMobileChange}
                      className={inputClass}
                      placeholder={t.mobilePlaceholder}
                      aria-required="true"
                    />
                  </FormField>

                  <FormField
                    label={t.photoLabel}
                    hint={t.photoHint}
                    required
                    error={fieldErrors.photo}
                  >
                    <div className="grid sm:grid-cols-[9rem_minmax(0,1fr)] gap-4 items-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setPhotoDrag(true);
                        }}
                        onDragLeave={() => setPhotoDrag(false)}
                        onDrop={handlePhotoDrop}
                        className={`relative flex flex-col items-center justify-center w-full sm:w-36 h-48 rounded-2xl border-2 border-dashed transition-all duration-150 overflow-hidden shrink-0 ${
                          photoDrag
                            ? "border-maroon bg-maroon/5"
                            : photoPreview
                              ? "border-ink/15 bg-sand/30"
                              : "border-ink/20 bg-sand/40 hover:border-maroon/40 hover:bg-sand/60"
                        }`}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <svg
                              className="w-7 h-7 text-ink-soft mb-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs font-semibold text-ink-soft px-2 text-center">
                              {t.uploadPhoto}
                            </span>
                          </>
                        )}
                      </button>
                      <div className="flex flex-col gap-3 sm:pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary !text-xs !py-2.5 self-start"
                        >
                          {photoPreview ? t.changePhoto : t.uploadPhoto}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                      </div>
                    </div>
                  </FormField>
                </div>
              </FormSection>

              <FormSection number={2} title={t.sectionAddress}>
                <div className="space-y-5">
                  <FormField
                    label={t.currentAddress}
                    htmlFor="current_address"
                    required
                    error={fieldErrors.current_address}
                  >
                    <textarea
                      id="current_address"
                      rows={3}
                      value={form.current_address}
                      onChange={(e) =>
                        setField("current_address", e.target.value)
                      }
                      className={inputClass}
                      aria-required="true"
                    />
                  </FormField>
                  <FormField
                    label={t.permanentAddress}
                    htmlFor="permanent_address"
                    required
                    error={fieldErrors.permanent_address}
                  >
                    <textarea
                      id="permanent_address"
                      rows={3}
                      value={form.permanent_address}
                      onChange={(e) =>
                        setField("permanent_address", e.target.value)
                      }
                      className={inputClass}
                      aria-required="true"
                    />
                  </FormField>
                  <FormField
                    label={t.referenceDetails}
                    htmlFor="reference_details"
                    optionalLabel={t.optionalLabel}
                  >
                    <textarea
                      id="reference_details"
                      rows={2}
                      value={form.reference_details}
                      onChange={(e) =>
                        setField("reference_details", e.target.value)
                      }
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection number={3} title={t.sectionClass}>
                <FormField label={t.classTime} required>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <label
                        className="text-xs font-semibold text-ink-soft mb-1.5 block"
                        htmlFor="class_start_time"
                      >
                        {t.classTimeFrom}
                        <RequiredMark />
                      </label>
                      <input
                        id="class_start_time"
                        type="text"
                        value={form.class_start_time}
                        onChange={(e) =>
                          setField("class_start_time", e.target.value)
                        }
                        className={inputClass}
                        placeholder={t.timePlaceholderStart}
                        aria-required="true"
                      />
                      <FieldError message={fieldErrors.class_start_time} />
                    </div>
                    <div>
                      <label
                        className="text-xs font-semibold text-ink-soft mb-1.5 block"
                        htmlFor="class_end_time"
                      >
                        {t.classTimeTo}
                        <RequiredMark />
                      </label>
                      <input
                        id="class_end_time"
                        type="text"
                        value={form.class_end_time}
                        onChange={(e) =>
                          setField("class_end_time", e.target.value)
                        }
                        className={inputClass}
                        placeholder={t.timePlaceholderEnd}
                        aria-required="true"
                      />
                      <FieldError message={fieldErrors.class_end_time} />
                    </div>
                  </div>
                </FormField>
              </FormSection>

              <FormSection number={4} title={t.sectionRules}>
                <div className="rounded-xl bg-sand/50 border border-ink/8 p-4 max-h-56 overflow-y-auto">
                  <h3 className="text-sm font-bold text-ink mb-3">
                    {t.rulesHeading}
                  </h3>
                  <ol className="space-y-2.5 text-sm text-ink leading-relaxed">
                    {ruleTexts.slice(0, 9).map((rule, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="font-bold text-maroon shrink-0 w-5">
                          {i + 1}.
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <FormField
                  label={t.signatureLabel}
                  hint={t.signatureHint}
                  required
                  error={fieldErrors.signature}
                >
                  <div className="rounded-xl border border-ink/12 overflow-hidden bg-white">
                    <SignaturePad
                      onChange={setSignatureDataUrl}
                      clearLabel={t.signatureClear}
                    />
                  </div>
                </FormField>

                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors duration-150 ${
                    agreed
                      ? "border-maroon/30 bg-maroon/5"
                      : "border-ink/12 bg-white hover:border-ink/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (e.target.checked)
                        setFieldErrors((err) => ({ ...err, agree: undefined }));
                    }}
                    className="mt-0.5 rounded border-ink/20 text-maroon focus:ring-maroon"
                  />
                  <span className="text-sm font-semibold leading-snug">
                    {t.agreeLabel}
                    <RequiredMark />
                  </span>
                </label>
                <FieldError message={fieldErrors.agree} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full !py-3.5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </FormSection>
            </form>
          </div>
        </div>
      </Section>
    </>
  );
}
