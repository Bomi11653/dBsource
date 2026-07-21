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
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type EditorMode = "table" | "raw";

export default function ProductSpecsEditor({
  specsZh,
  specsEn,
  onChange,
  onPersist,
  persisting = false,
}: {
  specsZh: string;
  specsEn: string;
  onChange: (patch: { specsZh: string; specsEn: string }) => void;
  /** 排序变更后立即保存到 CMS */
  onPersist?: (patch: { specsZh: string; specsEn: string }) => void | Promise<void>;
  persisting?: boolean;
}) {
  const lastEmitted = useRef({ specsZh, specsEn });
  const [mode, setMode] = useState<EditorMode>(() =>
    shouldDefaultRawMode(specsZh, specsEn) ? "raw" : "table"
  );
  const [rows, setRows] = useState<SpecTableRow[]>(() =>
    shouldDefaultRawMode(specsZh, specsEn)
      ? []
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
      setRows([]);
      return;
    }

    setRows(parseProductSpecs(specsZh, specsEn).rows);
    setMode("table");
  }, [specsZh, specsEn]);

  const updateRows = (
    nextRows: SpecTableRow[],
    options?: { persist?: boolean }
  ) => {
    setRows(nextRows);
    const serialized = serializeProductSpecs(nextRows);
    emit(serialized.specsZh, serialized.specsEn);
    if (options?.persist && onPersist) {
      void onPersist(serialized);
    }
  };

  const updateRow = (id: string, patch: Partial<SpecTableRow>) => {
    updateRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addCustomRow = () => {
    updateRows([...rows, createCustomSpecRow(rows.length)]);
  };

  const removeRow = (row: SpecTableRow) => {
    const ok = window.confirm(`确定删除参数「${row.labelZh || row.labelEn || "未命名"}」吗？`);
    if (!ok) return;
    updateRows(rows.filter((item) => item.id !== row.id));
  };

  const moveRow = (row: SpecTableRow, direction: -1 | 1) => {
    const index = rows.findIndex((item) => item.id === row.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    updateRows(next, { persist: true });
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
            原文模式直接编辑 specsZh / specsEn。切回表格模式时会按行顺序解析（含紧凑摘要如 120Hz–20kHz | 80W/320W | IP66）。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[780px] text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-gray-400">
                  <th className="text-left font-normal px-2 py-2 w-[16%]">中文参数名</th>
                  <th className="text-left font-normal px-2 py-2 w-[20%]">中文参数值</th>
                  <th className="text-left font-normal px-2 py-2 w-[16%]">英文参数名</th>
                  <th className="text-left font-normal px-2 py-2 w-[20%]">英文参数值</th>
                  <th className="text-left font-normal px-2 py-2 w-[12%]">排序</th>
                  <th className="text-left font-normal px-2 py-2 w-[8%]">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      暂无参数，点击下方「新增参数行」开始编辑
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/5 align-top">
                      <td className="px-2 py-1.5">
                        <input
                          className={cellInput}
                          value={row.labelZh}
                          onChange={(e) => updateRow(row.id, { labelZh: e.target.value })}
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
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveRow(row, -1)}
                            disabled={index === 0 || persisting}
                            className="inline-flex items-center justify-center h-8 w-8 rounded border border-white/10 text-gray-500 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="上移"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(row, 1)}
                            disabled={index === rows.length - 1 || persisting}
                            className="inline-flex items-center justify-center h-8 w-8 rounded border border-white/10 text-gray-500 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="下移"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => removeRow(row)}
                          disabled={persisting}
                          className="inline-flex items-center justify-center h-8 w-8 rounded border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/40 disabled:opacity-30"
                          title="删除参数"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addCustomRow}
            disabled={persisting}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:border-brand-gold/40 hover:text-white disabled:opacity-40"
          >
            <Plus size={14} />
            新增参数行
          </button>

          <p className="text-[11px] text-gray-500">
            调整顺序后会立即保存到 CMS 并刷新前台详情页。修改名称或内容后请点击下方「保存并发布」。
            {persisting ? " 正在保存排序…" : null}
          </p>
        </div>
      )}
    </div>
  );
}
