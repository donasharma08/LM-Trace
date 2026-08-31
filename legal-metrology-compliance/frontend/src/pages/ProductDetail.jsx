import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ComplianceStamp from "../components/ComplianceStamp";
import CompanyNote from "../components/CompanyNote";
import EvidenceViewer from "../components/EvidenceViewer";
import ViolationList from "../components/ViolationList";
import { api } from "../lib/api";

export default function ProductDetail() {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    api.getScanDetail(scanId).then((res) => setScan(res.data));
  }, [scanId]);

  if (!scan) {
    return <div className="max-w-4xl mx-auto px-6 py-8 text-ink-muted text-sm">Loading…</div>;
  }

  const companyNote =
    scan.company && scan.company.non_compliant_count > 1
      ? `${scan.company.name_raw} has ${scan.company.non_compliant_count} non-compliant scans on record across ${scan.company.total_scans} total inspections.`
      : null;

  const primaryImageUrl = scan.evidence_urls?.[0];
  const otherEvidence = scan.evidence_urls?.slice(1, -1) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-8 space-y-6"
    >
      <div className="panel p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow">{scan.product_name}</div>
          <div className="font-mono text-xs text-ink-muted mt-1">
            Scan ID: {scan.id} — {new Date(scan.created_at).toLocaleString()}
            {scan.re_scan_of && " — re-scan"}
          </div>
          <div className="mt-2">
            <ComplianceStamp status={scan.overall_status} calibrated={scan.calibrated} />
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={api.pdfReportUrl(scan.id)}
            className="text-xs font-mono border border-grid px-3 py-2 rounded-sm hover:border-ink"
          >
            Download PDF
          </a>
          <a
            href={api.docxReportUrl(scan.id)}
            className="text-xs font-mono border border-grid px-3 py-2 rounded-sm hover:border-ink"
          >
            Download DOCX
          </a>
        </div>
      </div>

      <CompanyNote note={companyNote} />

      {primaryImageUrl && (
        <div>
          <span className="eyebrow block mb-2">Evidence — hover a declaration below to locate it</span>
          <EvidenceViewer
            imageUrl={primaryImageUrl}
            imageWidth={scan.image_width}
            imageHeight={scan.image_height}
            declarations={scan.declarations}
            activeId={activeId}
            onHover={setActiveId}
          />
        </div>
      )}

      <ViolationList
        declarations={scan.declarations}
        structuralFlags={scan.structural_flags}
        activeId={activeId}
        onHover={setActiveId}
      />

      {otherEvidence.length > 0 && (
        <div className="panel p-5">
          <span className="eyebrow">Additional evidence photos</span>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {otherEvidence.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Evidence ${i + 1}`} className="rounded-sm border border-grid w-full h-28 object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
