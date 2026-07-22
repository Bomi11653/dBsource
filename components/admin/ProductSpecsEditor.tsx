"use client";

import { Field, inputClass } from "@/components/admin/AdminFields";
import {
  createCustomSpecRow,
  parseProductSpecs,
  serializeProductSpecs,
  shouldDefaultRawMode,
  type SpecTableRow,
} from "@/lib/admin-product-specs";
import type { AdminProductSpecSource } from "@/lib/admin-product-spec-seed";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type EditorMode = "table" | "raw";

export default function ProductSpecsEditor({
  specsZh,
  specsEn,
  source = "cms",
  onChange,
}: {
  specsZh: string;
  specsEn: string;
  /** cms=来自 Strapi；static=CMS 为空，展示旧参数库 */
  source?: AdminProductSpecSource;
  onChange: (patch: { specsZh: string; specsEn: string }) => void;
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

  const updateRows = (nextRows: SpecTableRow[]) => {
    setRows(nextRows);
    const serialized = serializeProductSpecs(nextRows);
    emit(serialized.specsZh, serialized.specsEn);
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
    updateRows(next);
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
        <div>
          <p className="text-xs text-gray-400">
            {source === "static"
              ? "CMS 暂无参数，已自动载入旧参数库供编辑；保存后将写入 CMS。"
              : source === "cms"
                ? "当前参数来自 CMS。"
                : "暂无参数，可手动添加或导入 PDF。"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => (mode === "table" ? switchToRaw() : switchToTable())}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-colors",
              mode === "raw"
                ? "border-brand-gold/40 text-brand-gold bg-brand-gold/10"
                : "border-white/15 text-gray-400 hover:text-white"
            )}
          >
            {mode === "table" ? "原文模式" : "表格模式"}
          </button>
        </div>
      </div>

      {mode === "raw" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="specsZh">
            <textarea
              className={cn(inputClass, "min-h-[200px] font-mono text-xs")}
              value={rawZh}
              onChange={(e) => {
                setRawZh(e.target.value);
                emit(e.target.value, rawEn);
              }}
            />
          </Field>
          <Field label="specsEn">
            <textarea
              className={cn(inputClass, "min-h-[200px] font-mono text-xs")}
              value={rawEn}
              onChange={(e) => {
                setRawEn(e.target.value);
                emit(rawZh, e.target.value);
              }}
            />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-gray-500">
            原文模式直接编辑 specsZh / specsEn。切回表格模式时会按行顺序解析（含紧凑摘要如 120Hz–20kHz | 80W/320W | IP66）。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-500">
                  <th className="text-left px-2 py-2 font-normal w-[18%]">标签（中）</th>
                  <th className="text-left px-2 py-2 font-normal w-[22%]">值（中）</th>
                  <th className="text-left px-2 py-2 font-normal w-[18%]">Label (EN)</th>
                  <th className="text-left px-2 py-2 font-normal w-[22%]">Value (EN)</th>
                  <th className="text-left px-2 py-2 font-normal w-[10%]">排序</th>
                  <th className="text-left px-2 py-2 font-normal w-[10%]">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      暂无参数行，点击下方「新增参数行」或使用 PDF 导入。
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
                            disabled={index === 0}
                            className="inline-flex items-center justify-center h-8 w-8 rounded border border-white/10 text-gray-500 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="上移"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(row, 1)}
                            disabled={index === rows.length - 1}
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
                          className="inline-flex items-center justify-center h-8 w-8 rounded border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/40"
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
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:border-brand-gold/40 hover:text-white"
          >
            <Plus size={14} />
            新增参数行
          </button>

          <p className="text-[11px] text-gray-500">
            参数增删改与排序均随下方「保存并发布」一并写入 CMS，请勿使用其他保存入口。
          </p>
        </div>
      )}
    </div>
  );
}
