"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Archive,
  ArrowClockwise,
  ArrowLeft,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ArchivedPage() {
  const archived = useQuery(api.teams.listArchived);
  const restoreMutation = useMutation(api.teams.restore);
  const deleteMutation = useMutation(api.teams.deleteTeam);

  const [restoringId, setRestoringId] = useState<Id<"teams"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"teams"> | null>(null);

  const handleRestore = async (teamId: Id<"teams">, name: string) => {
    setRestoringId(teamId);
    try {
      await restoreMutation({ teamId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Failed to restore "${name}".`);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (teamId: Id<"teams">, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone — all products and votes will be erased.`)) return;
    setDeletingId(teamId);
    try {
      await deleteMutation({ teamId });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Failed to delete "${name}".`);
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 font-normal selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition text-neutral-700"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} weight="light" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Archive size={20} weight="light" className="text-neutral-500" />
            <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 font-normal tracking-tight">
              Archived Rooms
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Rooms you own that have been archived. Restore or permanently delete them.
          </p>
        </div>
      </div>

      {/* Content */}
      {archived === undefined ? (
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-xs text-neutral-500 font-mono">Loading...</span>
          </div>
        </div>
      ) : archived.length === 0 ? (
        <div className="p-14 bg-white rounded-3xl border border-dashed border-neutral-200 text-center space-y-3">
          <Archive size={32} weight="light" className="mx-auto text-neutral-300" />
          <h3 className="font-serif text-lg text-neutral-800 font-normal">No archived rooms</h3>
          <p className="text-xs text-neutral-500 font-normal max-w-xs mx-auto">
            Rooms you archive from the room page will appear here. You can restore or permanently delete them.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-normal hover:bg-black transition"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {archived.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-2xl border border-neutral-200/80 p-5 flex items-center justify-between gap-4 hover:border-neutral-300 transition"
            >
              <div className="min-w-0">
                <h3 className="font-serif text-base text-neutral-900 font-normal truncate">
                  {team.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xs font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-normal">
                    {team.role}
                  </span>
                  {team.archivedAt && (
                    <span className="text-2xs text-neutral-400 font-normal">
                      Archived {formatDate(team.archivedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Restore */}
                <button
                  type="button"
                  disabled={restoringId === team._id || deletingId === team._id}
                  onClick={() => handleRestore(team._id, team.name)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-normal hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer disabled:opacity-50"
                >
                  {restoringId === team._id ? (
                    <span className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                  ) : (
                    <ArrowClockwise size={14} weight="light" />
                  )}
                  <span>Restore</span>
                </button>

                {/* Delete permanently */}
                <button
                  type="button"
                  disabled={restoringId === team._id || deletingId === team._id}
                  onClick={() => handleDelete(team._id, team.name)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-white text-red-600 text-xs font-normal hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                >
                  {deletingId === team._id ? (
                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <Trash size={14} weight="light" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          <p className="text-2xs text-neutral-400 font-normal text-center pt-2">
            Deleting a room permanently removes all products, votes, and invite links.
          </p>
        </div>
      )}
    </div>
  );
}
