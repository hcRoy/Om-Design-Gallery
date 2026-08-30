import { useRef, useState } from 'react'
import AdmissionPrintDocument from './AdmissionPrintDocument.jsx'
import { admissionPdfFilename, downloadAdmissionPdf } from '../../lib/admissionPdf.js'

/**
 * Off-screen print template + download handler for admission PDF export.
 */
export default function AdmissionPdfExport({
  admission,
  installments = [],
  language = 'gu',
  photoUrl,
  signatureUrl,
  onError,
  children,
}) {
  const pdfRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const download = async () => {
    if (!pdfRef.current || !admission) return
    setDownloading(true)
    try {
      await downloadAdmissionPdf(
        pdfRef.current,
        admissionPdfFilename(admission),
      )
    } catch (err) {
      onError?.(err.message || 'Could not generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div
        className="admission-pdf-export fixed left-0 top-0 -z-10 w-[210mm] opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <div ref={pdfRef}>
          <AdmissionPrintDocument
            admission={admission}
            installments={installments}
            language={language}
            photoUrl={photoUrl}
            signatureUrl={signatureUrl}
          />
        </div>
      </div>
      {children({ download, downloading })}
    </>
  )
}
