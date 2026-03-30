export default function CustomCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border-2 transition-all"
      style={{
        borderColor: "var(--color-customBorder)",
        backgroundColor: "transparent",
      }}
    >
      {checked && (
        <span
          className="text-sm font-bold leading-none"
          style={{ color: "var(--color-primary)" }}
        >
          ✓
        </span>
      )}
    </div>
  );
}
