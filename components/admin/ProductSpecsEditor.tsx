"use client";

import { Field, inputClass } from "@/components/admin/AdminFields";
import {
  createCustomSpecRow,
  parseProductSpecs,
  serializeProductSpecs,
  shouldDefaultRawMode,
  type SpecTableRow,
} from "@/lib/admin-product-specs";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function emptySpecRows() {
  return parseProductSpecs("", "").rows;
}

type EditorMode = "table" | "raw";

export default function ProductSpecsEditor({
  specsZh,
  specsEn,
  onChange,
}: {
  specsZh: string;
  specsEn: string;
  onChange: (patch: { specsZh: string; specsEn: string }) => void;
}) {
  const lastEmitted = useRef({ specsZh, specsEn });
  const [mode, setMode] = useState<EditorMode>(() =>
    shouldDefaultRawMode(specsZh, specsEn) ? "raw" : "table"
  );
  const [rows, setRows] = useState<SpecTableRow[]>(() =>
    shouldDefaultRawMode(specsZh, specsEn)
      ? emptySpecRows()
      : parseProductSpecs(specsZh, specsEn).rows
  );
  const [rawZh, setRawZh] = useState(specsZh);
  const [rawEn, setRawEn] = useState(specsEn);

  const emit = useCallback(
    (zh: string, en: string) => {
      lastEmitted.current = { specsZh: zh, specsEn: en };
      onChange({ specsZh: zh, specsEn: en });
    },
    [onChange]
  );

  useEffect(() => {
    if (
      specsZh === lastEmitted.current.specsZh &&
      specsEn === lastEmitted.current.specsEn
    ) {
      return;
    }
    lastEmitted.current = { specsZh, specsEn };
    setRawZh(specsZh);
    setRawEn(specsEn);

    if (shouldDefaultRawMode(specsZh, specsEn)) {
      setMode("raw");
      setRows(emptySpecRows());
      return;
    }

    setRows(parseProductSpecs(specsZh, specsEn).rows);
    setMode("table");
  }, [specsZh, specsEn]);

  const updateRows = (nextRows: SpecTableRow[]) => {
    setRows(nextRows);
    emit(serializeProductSpecs(nextRows).specsZh, serializeProductSpecs(nextRows).specsEn);
  };

  const updateRow = (id: string, patch: Partial<SpecTableRow>) => {
    updateRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addCustomRow = () => {
    updateRows([...rows, createCustomSpecRow(rows.length)]);
  };

  const removeRow = (row: SpecTableRow) => {
    if (row.isFixed) {
      const ok = window.confirm(`固定参数「${row.labelZh || row.labelEn}」将清空内容，确定吗？`);
      if (!ok) return;
      updateRow(row.id, { valueZh: "", valueEn: "" });
      return;
    }
    const ok = window.confirm("确定删除这条自定义参数吗？");
    if (!ok) return;
    updateRows(rows.filter((item) => item.id !== row.id));
  };

  const switchToTable = () => {
    const parsed = parseProductSpecs(rawZh, rawEn);
    setRows(parsed.rows);
    setMode("table");
    const serialized = serializeProductSpecs(parsed.rows);
    emit(serialized.specsZh, serialized.specsEn);
  };

  const switchToRaw = () => {
    setRawZh(specsZh);
    setRawEn(specsEn);
    setMode("raw");
  };

  const cellInput =
    "w-full min-w-0 rounded border border-white/10 bg-zinc-900/80 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-gold/50";

  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-200">技术规格表</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (mode === "table" ? switchToRaw() : switchToTable())}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-colors",
              mode === "table"
                ? "border-white/15 text-gray-400 hover:text-white"
                : "border-brand-gold/50 text-brand-gold bg-brand-gold/10"
            )}
          >
            {mode === "table" ? "切换到原文编辑" : "切换到表格编辑"}
          </button>
          <span
            className={cn(
              "text-[10px] px-2 py-1 rounded-full",
              mode === "table" ? "bg-brand-gold/15 text-brand-gold" : "bg-white/10 text-gray-400"
            )}
          >
            {mode === "table" ? "表格模式" : "原文模式"}
          </span>
        </div>
      </div>

      {mode === "raw" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="规格原文（中文）">
            <textarea
              className={cn(inputClass, "min-h-[160px] font-mono text-xs")}
              value={rawZh}
              onChange={(e) => {
                setRawZh(e.target.value);
                emit(e.target.value, rawEn);
              }}
              placeholder={"频率响应(-10dB): 85Hz–20kHz\n功率(额定/峰值): 250W / 1000W"}
            />
          </Field>
          <Field label="规格原文（英文）">
            <textarea
              className={cn(inputClass, "min-h-[160px] font-mono text-xs")}
              value={rawEn}
              onChange={(e) => {
                setRawEn(e.target.value);
                emit(rawZh, e.target.value);
              }}
              placeholder={"Frequency Response (-10dB): 85Hz–20kHz\nPower (Rated/Peak): 250W / 1000W"}
            />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-gray-500">
            原文模式直接编辑 specsZh / specsEn。切回表格模式时会自动重新解析（含紧凑摘要如 120Hz–20kHz | 80W/320W | IP66）。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-gray-400">
                  <th className="text-left font-normal px-2 py-2 w-[18%]">中文参数名</th>
                  <th className="text-left font-normal px-2 py-2 w-[22%]">中文参数值</th>
                  <th className="text-left font-normal px-2 py-2 w-[18%]">英文参数名</th>
                  <th className="text-left font-normal px-2 py-2 w-[22%]">英文参数值</th>
                  <th className="text-left font-normal px-2 py-2 w-[8%]">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 align-top">
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInput}
                        value={row.labelZh}
                        onChange={(e) => updateRow(row.id, { labelZh: e.target.value })}
                        readOnly={row.isFixed}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInput}
                        value={row.valueZh}
                        onChange={(e) => updateRow(row.id, { valueZh: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInput}
                        value={row.labelEn}
                        onChange={(e) => updateRow(row.id, { labelEn: e.target.value })}
                        readOnly={row.isFixed}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInput}
                        value={row.valueEn}
                        onChange={(e) => updateRow(row.id, { valueEn: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeRow(row)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/40"
                        title={row.isFixed ? "清空固定参数" : "删除自定义参数"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addCustomRow}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:border-brand-gold/40 hover:text-white"
          >
            <Plus size={14} />
            新增自定义参数行
          </button>

          <p className="text-[11px] text-gray-500">
            紧凑摘要会自动拆入对应字段；未识别片段归入「其他参数」。保存时序列化为「参数名: 参数值」，每行一条。
          </p>
        </div>
      )}
    </div>
  );
}
