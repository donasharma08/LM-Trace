import { useRef, useState } from "react";

function ImagePicker({ label, required, file, onChange }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  return (
    <div>
      <label className="eyebrow block mb-1">
        {label} {required && <span className="text-fail">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap items-center">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="text-xs font-medium border border-grid px-3 py-2 rounded-sm hover:border-ink transition-colors"
        >
          📷 Take photo
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="text-xs font-medium border border-grid px-3 py-2 rounded-sm hover:border-ink transition-colors"
        >
          🖼 Choose from gallery / files
        </button>
        {file && <span className="text-xs font-mono text-ink-muted truncate max-w-[10rem]">{file.name}</span>}
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
      />
    </div>
  );
}

export default function ScanUploader({ onSubmit, submitting }) {
  const [productName, setProductName] = useState("");
  const [isImported, setIsImported] = useState(false);
  const [labelImage, setLabelImage] = useState(null);
  const [backPanelImage, setBackPanelImage] = useState(null);
  const [evidencePhotos, setEvidencePhotos] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!labelImage || !productName) return;
    const formData = new FormData();
    formData.append("product_name", productName);
    formData.append("is_imported", isImported);
    formData.append("image", labelImage);
    if (backPanelImage) formData.append("back_panel_image", backPanelImage);
    evidencePhotos.forEach((f) => formData.append("evidence_photos", f));
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
      <div>
        <label className="eyebrow block mb-1">Product name</label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
          className="w-full border border-grid rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
          placeholder="e.g. FreshBite Instant Noodles 70g"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={isImported} onChange={(e) => setIsImported(e.target.checked)} />
        Imported product (requires country-of-origin declaration)
      </label>

      <ImagePicker label="Front / primary label photo" required file={labelImage} onChange={setLabelImage} />
      <ImagePicker
        label="Back panel photo (optional — improves accuracy, avoids REVIEW REQUIRED on back-panel fields)"
        file={backPanelImage}
        onChange={setBackPanelImage}
      />

      <div>
        <label className="eyebrow block mb-1">Additional evidence photos (optional)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setEvidencePhotos(Array.from(e.target.files))}
          className="text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink text-white font-medium text-sm py-2.5 rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
      >
        {submitting ? "Scanning…" : "Run compliance scan"}
      </button>
    </form>
  );
}
