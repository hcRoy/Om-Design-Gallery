import {
  ADMISSION_COMPANY,
  formCopy,
  rules,
  stampText,
} from '../../lib/i18n/admissionTranslations.js'
import { LOGO_SRC } from '../../data/studio.js'
import './admission-print.css'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(value) {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function installmentColumns(installments) {
  if (installments?.length > 0) return installments
  return Array.from({ length: 4 }, () => ({}))
}

function computeTotal(installments) {
  return installments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
}

function FeeTable({ installments, labels, tableClass = 'fee-table' }) {
  const cols = installmentColumns(installments)
  const total = computeTotal(installments)

  return (
    <table className={tableClass}>
      <thead>
        <tr>
          <th>{labels.date}</th>
          {cols.map((row, i) => (
            <th key={row.id ?? `d-${i}`}>{formatDate(row.installment_date)}</th>
          ))}
          <th>{labels.total}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="row-label">{labels.installmentAmount}</td>
          {cols.map((row, i) => (
            <td key={`a-${row.id ?? i}`}>{formatAmount(row.amount)}</td>
          ))}
          <td>{total > 0 ? formatAmount(total) : ''}</td>
        </tr>
        <tr>
          <td className="row-label">{labels.installmentReceived}</td>
          {cols.map((row, i) => (
            <td key={`s-${row.id ?? i}`}>{row.received_by ?? ''}</td>
          ))}
          <td />
        </tr>
      </tbody>
    </table>
  )
}

function PrintPageHeader({ formNumber, address }) {
  return (
    <div className="print-header">
      <div className="company-header">
        <div className="header-left">
          <img src={LOGO_SRC} alt="" className="company-logo" />
        </div>
        <div className="header-content">
          <div className="company-name">{ADMISSION_COMPANY.name}</div>
          <div className="company-address">{address}</div>
          <div className="company-mobile">
            <span className="company-mobile-label">Mo.</span>
            {ADMISSION_COMPANY.mobilePrint}
          </div>
          <div className="form-number-box">
            <div className="form-number-label">
              <span className="form-number-label-en">Form No</span>
              <span className="form-number-label-gu">ફોર્મ નં</span>
            </div>
            <div className="form-number-value">{formNumber}</div>
          </div>
        </div>
      </div>
      <div className="form-title-bar">
        <span className="form-title-en">{formCopy.en.print.admissionForm}</span>
        <span className="form-title-gu">{formCopy.gu.print.admissionForm}</span>
      </div>
    </div>
  )
}

/**
 * Two-page printable admission record — layout matches the physical paper form.
 */
export default function AdmissionPrintDocument({
  admission,
  installments = [],
  language = 'gu',
  photoUrl,
  signatureUrl,
}) {
  const lang = language === 'en' ? 'en' : 'gu'
  const t = formCopy[lang].print
  const ruleList = rules[lang]
  const address =
    lang === 'gu' ? ADMISSION_COMPANY.addressGu : ADMISSION_COMPANY.addressEn
  const formNumber = admission?.form_number ?? ''
  const classTime =
    admission?.class_start_time && admission?.class_end_time
      ? `${admission.class_start_time} ${t.to} ${admission.class_end_time}`
      : [admission?.class_start_time, admission?.class_end_time].filter(Boolean).join(' ')

  return (
    <div className="admission-print-root">
      <div className="page">
        <PrintPageHeader formNumber={formNumber} address={address} />

        <div className="admission-container">
          <div className="admission-background">
            <img src={LOGO_SRC} alt="" />
          </div>

          <div className="photo-box">
            {photoUrl ? (
              <img src={photoUrl} alt="" />
            ) : (
              <div className="photo-placeholder">{t.photo}</div>
            )}
          </div>

          <div className="field-row student-name-row">
            <div className="field-label">{formCopy[lang].studentName}</div>
            <div className="field-line">{admission?.student_name ?? ''}</div>
          </div>

          <div className="field-row mobile-row">
            <div className="field-label">{formCopy[lang].studentMobile}</div>
            <div className="field-line">{admission?.student_mobile ?? ''}</div>
          </div>

          <div className="field-row address-row">
            <div className="field-label">{formCopy[lang].currentAddress}</div>
            <div className="field-line">{admission?.current_address ?? ''}</div>
          </div>
          <div className="address-line" />

          <div className="field-row address-row">
            <div className="field-label">{formCopy[lang].permanentAddress}</div>
            <div className="field-line">{admission?.permanent_address ?? ''}</div>
          </div>
          <div className="address-line" />

          <div className="reference-row">
            <div className="reference-description">{formCopy[lang].referenceDetails}</div>
            <div className="reference-line">{admission?.reference_details ?? ''}</div>
            <div className="reference-line" />
          </div>

          <div className="time-row">
            <div className="field-label">{formCopy[lang].classTime}</div>
            <div className="time-input">{admission?.class_start_time ?? ''}</div>
            <div className="time-separator">{t.to}</div>
            <div className="time-input">{admission?.class_end_time ?? ''}</div>
          </div>

          <div className="section-label">{t.feeDetails}</div>
          <FeeTable installments={installments} labels={t} />

          <div className="signature-row">
            <div className="signature-field">
              <div className="signature-line">
                {signatureUrl ? <img src={signatureUrl} alt="" /> : null}
              </div>
              {t.studentSignature}
            </div>
          </div>
        </div>

        <div className="cut-line">
          <span className="scissors">✂</span>
        </div>

        <div className="student-copy">
          <div className="student-copy-header">
            <div className="student-copy-logo-section">
              <img src={LOGO_SRC} alt="" className="student-copy-logo" />
            </div>
            <div className="student-copy-content">
              <div className="student-copy-company-name">{ADMISSION_COMPANY.name}</div>
              <div className="student-copy-address">{address}</div>
              <div className="student-copy-mobile">
                Mo. {ADMISSION_COMPANY.mobilePrint}
              </div>
              <div className="student-copy-form-number">
                <div className="student-copy-form-number-title">{t.formNo}</div>
                <div className="student-copy-form-number-value">{formNumber}</div>
              </div>
            </div>
          </div>
          <div className="student-copy-body">
            <div className="student-copy-field">
              <div className="student-copy-label">{t.studentCopyName}</div>
              <div className="student-copy-value">{admission?.student_name ?? ''}</div>
            </div>
            <div className="student-copy-field">
              <div className="student-copy-label">{t.studentCopyTime}</div>
              <div className="student-copy-value">{classTime}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page">
        <div className="rules-page">
          <div className="rules-title">{t.rulesTitle}</div>

          {ruleList.map((text, idx) => (
            <div className="rule" key={idx}>
              <div className="rule-number">{idx + 1}.</div>
              <div className="rule-text">{text}</div>
            </div>
          ))}

          <div className="rules-signature">
            <div className="signature-field">
              <div className="signature-line">
                {signatureUrl ? <img src={signatureUrl} alt="" /> : null}
              </div>
              {t.studentSignature}
            </div>
          </div>

          <div className="rule-stamp">
            <div>{stampText.gu}</div>
            <div style={{ marginTop: '2mm' }}>{stampText.en}</div>
          </div>

          <div className="rules-fee-section">
            <div className="rules-fee-title">{t.feeWarning}</div>
            <FeeTable
              installments={installments}
              labels={t}
              tableClass="rules-fee-table"
            />
            <div className="administrator-signature">
              <div className="signature-field">
                <div className="signature-line" />
                {t.administratorSignature}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
