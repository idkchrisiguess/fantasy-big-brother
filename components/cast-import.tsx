"use client";

import { useId, useMemo, useState } from "react";
import {
  CAST_MAX_PLAYERS,
  CAST_MIN_PLAYERS,
  parseAndValidateCastText,
  parseCastLines,
} from "@/lib/cast-import";
import {
  CAST_PRESETS,
  createDefaultHouseguests,
  createHouseguestsFromNames,
  houseguestsForPreset,
  type CastPresetId,
} from "@/lib/houseguests";
import type { Houseguest } from "@/lib/types";

export type CastSource = "default" | CastPresetId | "custom";

interface CastImportProps {
  value: Houseguest[];
  onChange: (houseguests: Houseguest[], errors: string[]) => void;
  disabled?: boolean;
}

export function CastImport({ value, onChange, disabled }: CastImportProps) {
  const groupId = useId();
  const [source, setSource] = useState<CastSource>("default");
  const [customText, setCustomText] = useState("");

  function emitPool(pool: Houseguest[], errors: string[]) {
    if (!disabled) onChange(pool, errors);
  }

  function applySource(nextSource: CastSource, text = customText) {
    if (nextSource === "default") {
      emitPool(createDefaultHouseguests(), []);
      return;
    }
    if (nextSource !== "custom") {
      emitPool(houseguestsForPreset(nextSource), []);
      return;
    }
    const result = parseAndValidateCastText(text);
    if (result.ok) {
      emitPool(result.houseguests, []);
    } else {
      const names = parseCastLines(text);
      const preview =
        names.length > 0
          ? createHouseguestsFromNames(names)
          : value;
      emitPool(preview, result.errors);
    }
  }

  function handleSourceChange(next: CastSource) {
    setSource(next);
    if (next !== "custom") {
      setCustomText("");
    }
    applySource(next, next === "custom" ? customText : "");
  }

  function handleCustomTextChange(text: string) {
    setCustomText(text);
    applySource("custom", text);
  }

  const { preview, errors } = useMemo(() => {
    if (source === "default") {
      return { preview: createDefaultHouseguests(), errors: [] as string[] };
    }
    if (source !== "custom") {
      return { preview: houseguestsForPreset(source), errors: [] as string[] };
    }
    const result = parseAndValidateCastText(customText);
    if (result.ok) {
      return { preview: result.houseguests, errors: [] as string[] };
    }
    const names = parseCastLines(customText);
    return {
      preview:
        names.length > 0 ? createHouseguestsFromNames(names) : value,
      errors: result.errors,
    };
  }, [source, customText, value]);

  const previewValid =
    errors.length === 0 && preview.length >= CAST_MIN_PLAYERS;

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-2xl border border-white/10 bg-[#0f1629]/50 p-4"
    >
      <legend className="px-1 text-sm font-medium text-zinc-300">
        Houseguest cast ({CAST_MIN_PLAYERS}–{CAST_MAX_PLAYERS} players)
      </legend>

      <div className="space-y-2">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
            source === "default"
              ? "border-orange-500/40 bg-orange-500/10"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <input
            type="radio"
            name={groupId}
            checked={source === "default"}
            onChange={() => handleSourceChange("default")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-white">
              Default cast (16)
            </span>
            <span className="text-xs text-zinc-500">
              Built-in demo pool — good for trying the app
            </span>
          </span>
        </label>

        {CAST_PRESETS.filter((p) => p.id !== "default").map((preset) => (
          <label
            key={preset.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
              source === preset.id
                ? "border-orange-500/40 bg-orange-500/10"
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            <input
              type="radio"
              name={groupId}
              checked={source === preset.id}
              onChange={() => handleSourceChange(preset.id)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-white">
                {preset.label} ({preset.names.length})
              </span>
              <span className="text-xs text-zinc-500">{preset.description}</span>
            </span>
          </label>
        ))}

        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
            source === "custom"
              ? "border-orange-500/40 bg-orange-500/10"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <input
            type="radio"
            name={groupId}
            checked={source === "custom"}
            onChange={() => handleSourceChange("custom")}
            className="mt-1"
          />
          <span className="flex-1">
            <span className="block text-sm font-medium text-white">
              Paste custom cast
            </span>
            <span className="text-xs text-zinc-500">
              One name per line, or Name,Archetype (archetype optional)
            </span>
          </span>
        </label>
      </div>

      {source === "custom" ? (
        <div>
          <textarea
            rows={8}
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            placeholder={
              "Alex Rivera\nBlake Chen\nCasey Morgan,Veteran\n..."
            }
            className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 font-mono text-sm text-white placeholder:text-zinc-600"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {CAST_MIN_PLAYERS}–{CAST_MAX_PLAYERS} unique names required
          </p>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <ul className="space-y-1 text-sm text-rose-400">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Cast preview ({preview.length})
        </p>
        <ul
          className={`grid max-h-40 gap-1 overflow-y-auto text-sm sm:grid-cols-2 ${
            previewValid ? "text-zinc-300" : "text-zinc-500"
          }`}
        >
          {preview.length > 0 ? (
            preview.map((hg) => (
              <li
                key={hg.id}
                className="truncate rounded-md bg-white/5 px-2 py-1"
              >
                {hg.name}
              </li>
            ))
          ) : (
            <li className="text-zinc-500">No names yet</li>
          )}
        </ul>
      </div>
    </fieldset>
  );
}
