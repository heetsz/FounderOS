import React from "react";

type Block =
  | { type: "heading"; depth: number; text: string }
  | { type: "section"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", depth: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    const section = line.match(/^\*\*(.+)\*\*$/);
    if (section) {
      blocks.push({ type: "section", text: section[1] });
      index += 1;
      continue;
    }

    const firstListItem = line.match(/^([-+*])\s+(.+)$|^(\d+)[.)]\s+(.+)$/);
    if (firstListItem) {
      const ordered = Boolean(firstListItem[3]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^([-+*])\s+(.+)$|^(\d+)[.)]\s+(.+)$/);
        if (!item || Boolean(item[3]) !== ordered) break;
        items.push(item[2] ?? item[4]);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        /^(#{1,6})\s+/.test(next) ||
        /^\*\*.+\*\*$/.test(next) ||
        /^([-+*])\s+/.test(next) ||
        /^\d+[.)]\s+/.test(next)
      ) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-appText">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function MarkdownContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 text-sm leading-7 text-appText ${className}`}>
      {parseBlocks(content).map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 key={index} className="text-base font-bold leading-6 text-appText">
              {renderInline(block.text)}
            </h3>
          );
        }
        if (block.type === "section") {
          return (
            <h4 key={index} className="pt-1 text-sm font-semibold leading-6 text-appText">
              {renderInline(block.text)}
            </h4>
          );
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={index}
              className={`space-y-2 pl-6 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-primary`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </List>
          );
        }
        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}
