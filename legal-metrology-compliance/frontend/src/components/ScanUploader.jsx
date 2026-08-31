import { motion } from "framer-motion";
import { useRef, useState } from "react";

function ImagePicker({ label, required, file, onChange }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const setFile = (f) => {
    if (!f) return;
    onChange(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  return (
    <div>
      <label className="eyebrow block mb-1">
        {label} {required && <span className="text-fail">*</span>}
      </label>

      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        animate={{
          borderColor: isDragOver ? "#1B2A4A" : "#D8DEE4",
          backgroundColor: isDragOver ? "rgba(27,42,74,0.03)" : "transparent",
        }}
        className="border-2 border-dashed rounded-sm p-4 transition-colors"
      >
        {previewUrl ? (
          <div className="flex items-center gap-3">
            <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-sm border border-grid" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-ink truncate">{file.name}</div>
              <button
                type="button"
                onClick={() => { onChange(null); setPreviewUrl(null); }}
                className="text-xs text-fail underline underline-offset-2 mt-1"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-ink-muted mb-2">Drag a photo here, or:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="text-xs font-medium border border-grid px-3 py-2 rounded-sm hover:border-ink transition-colors bg-panel"
              >
                📷 Take photo
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="text-xs font-medium border border-grid px-3 py-2 rounded-sm hover:border-ink transition-colors bg-panel"
              >
                🖼 Choose from gallery / files
              </button>
            </div>
          </>
        )}
      </motion.div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files[0])}
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
    <motion.form
      onSubmit={handleSubmit}
      className="panel p-6 space-y-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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

      <div className="border border-dashed border-grid rounded-sm p-3 bg-paper/40">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted/60">Future scope — not active this build</span>
        <p className="text-xs text-ink-muted mt-1">
          Barcode-based font-size calibration is not wired in this MVP — font-size fields
          will show REVIEW REQUIRED rather than a measured value.
        </p>
      </div>

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

      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: submitting ? 1 : 1.01 }}
        whileTap={{ scale: submitting ? 1 : 0.98 }}
        className="w-full bg-ink text-white font-medium text-sm py-2.5 rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
      >
        {submitting ? "Scanning…" : "Run compliance scan"}
      </motion.button>
    </motion.form>
  );
}
