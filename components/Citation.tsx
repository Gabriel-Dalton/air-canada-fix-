import React from "react";

// Render any text that contains [APPR §...]-style brackets as inline chips.
// This is what visually answers "why won't this hallucinate?" — every claim
// is anchored to a clause the user can see.
export function CitedText({ text }: { text: string }) {
  // Match anything inside square brackets that mentions a section/article.
  // We accept §, Section, Article, Rule, and clause numbers like 19(1)(a)(i).
  const parts = text.split(/(\[[^\]]*?(?:§|Section|Article|Rule|Convention|Tariff|APPR|SOR\/)[^\]]*?\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          return (
            <span
              key={i}
              className="mx-0.5 inline-flex items-center rounded-full border border-ac-line bg-white px-2 py-[1px] text-[11px] font-medium tracking-tight text-ac-muted"
              title="Cited policy clause"
            >
              {part.slice(1, -1)}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
