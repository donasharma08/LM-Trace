import { motion } from "framer-motion";

/**
 * Renders the original scan image with each matched declaration's
 * bounding box overlaid as a responsive, hoverable region. Boxes are
 * positioned as percentages of the natural image size, so they stay
 * aligned at any render width. `activeId` (hovered from the checklist)
 * highlights the matching box; hovering a box calls back the other way.
 */
export default function EvidenceViewer({ imageUrl, imageWidth, imageHeight, declarations, activeId, onHover }) {
  const boxable = declarations.filter((d) => d.bbox_px && imageWidth && imageHeight);

  const toPercent = (bbox) => {
    const xs = bbox.map((p) => p[0]);
    const ys = bbox.map((p) => p[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const w = Math.max(...xs) - x;
    const h = Math.max(...ys) - y;
    return {
      left: `${(x / imageWidth) * 100}%`,
      top: `${(y / imageHeight) * 100}%`,
      width: `${(w / imageWidth) * 100}%`,
      height: `${(h / imageHeight) * 100}%`,
    };
  };

  if (!imageUrl) return null;

  return (
    <div className="relative inline-block w-full rounded-sm overflow-hidden border border-grid">
      <img src={imageUrl} alt="Scan evidence" className="w-full h-auto block select-none" draggable={false} />
      {boxable.map((d) => {
        const isActive = activeId === d.id;
        return (
          <motion.div
            key={d.id}
            onMouseEnter={() => onHover?.(d.id)}
            onMouseLeave={() => onHover?.(null)}
            className="absolute cursor-pointer"
            style={toPercent(d.bbox_px)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-full h-full rounded-sm"
              animate={{
                borderWidth: isActive ? 3 : 1.5,
                boxShadow: isActive ? "0 0 0 4px rgba(27,42,74,0.12)" : "0 0 0 0 rgba(0,0,0,0)",
              }}
              style={{
                borderStyle: "solid",
                borderColor:
                  d.status === "pass" ? "#2F6B4F" : d.status === "review_required" ? "#C08A2E" : "#B33A3A",
              }}
              transition={{ duration: 0.15 }}
            />
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-6 left-0 bg-ink text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
              >
                {d.label}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
