/** Turn rows into a CSV file and offer it as a download. Cells starting with = + - @ are neutralised so a spreadsheet can't run them as formulas. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | undefined)[][]) {
  const cell = (value: string | number | undefined) => {
    let text = value === undefined ? "" : String(value);
    if (/^[=+\-@]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
