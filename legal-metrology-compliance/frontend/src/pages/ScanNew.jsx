import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ComplianceStamp from "../components/ComplianceStamp";
import CompanyNote from "../components/CompanyNote";
import ScanUploader from "../components/ScanUploader";
import ViolationList from "../components/ViolationList";
import { api } from "../lib/api";

export default function ScanNew() {
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.createScan(formData);
      setResult(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "object"
          ? `${detail.message}: ${detail.issues?.join(" ")}`
          : detail || "Scan failed — check the backend logs."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-ink">New scan</h1>

      {!result && <ScanUploader onSubmit={handleSubmit} submitting={submitting} />}
      {error && <p className="text-sm font-mono text-fail">{error}</p>}

      {result && (
        <div className="space-y-5">
          <div className="panel p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="eyebrow">{result.product_name}</div>
              <div className="mt-2">
                <ComplianceStamp status={result.overall_status} calibrated={result.calibrated} />
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={api.pdfReportUrl(result.scan_id)}
                className="text-xs font-mono border border-grid px-3 py-2 rounded-sm hover:border-ink"
              >
                Download PDF
              </a>
              <a
                href={api.docxReportUrl(result.scan_id)}
                className="text-xs font-mono border border-grid px-3 py-2 rounded-sm hover:border-ink"
              >
                Download DOCX
              </a>
            </div>
          </div>

          <CompanyNote note={result.company_note} />

          <ViolationList declarations={result.declarations} structuralFlags={result.structural_flags} />

          <div className="flex gap-3">
            <button
              onClick={() => setResult(null)}
              className="text-sm font-medium text-ink underline underline-offset-2"
            >
              Run another scan
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm font-medium text-ink-muted underline underline-offset-2"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
