"use client";

/**
 * 「ペアに振る」ダイアログ（§9 / Pane4 相当）。
 * title・deadline・delegatedOn 必須。columnId・note は任意。
 */

import { useState } from "react";

import { type MiraiColumnId } from "@/lib/mirai-schema";
import { MIRAI_COLUMN_MASTER } from "@/lib/mirai/columns";
import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import { InlineDateField } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MiraiDelegateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 端末ロール（振った側 = createdBy） */
  createdBy: string;
  actions: MiraiRosterActions;
  /** 既定の期限・振った日（未指定時は空） */
  defaultDeadline?: string;
  defaultDelegatedOn?: string;
};

export function MiraiDelegateDialog({
  open,
  onOpenChange,
  createdBy,
  actions,
  defaultDeadline = "",
  defaultDelegatedOn = defaultDeadline,
}: MiraiDelegateDialogProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [delegatedOn, setDelegatedOn] = useState(defaultDelegatedOn);
  const [columnId, setColumnId] = useState<MiraiColumnId | "">("");
  const [note, setNote] = useState("");

  const reset = () => {
    setTitle("");
    setDeadline(defaultDeadline);
    setDelegatedOn(defaultDelegatedOn);
    setColumnId("");
    setNote("");
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed || !deadline || !delegatedOn) return;
    actions.addDelegatedToPair({
      title: trimmed,
      deadline,
      delegatedOn,
      columnId: columnId || undefined,
      note: note.trim() || undefined,
      createdBy,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ペアに振る</DialogTitle>
          <DialogDescription>
            内容・期限・振った日を登録すると別枠に表示されます。振った側（
            {createdBy}）が [完了] するとリストから消えます。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="delegate-title">内容</FieldLabel>
            <Input
              id="delegate-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ETC明細の確認"
            />
          </Field>

          <Field>
            <FieldLabel>期限</FieldLabel>
            <InlineDateField
              value={deadline}
              onSave={setDeadline}
              ariaLabel="ペア振りの期限"
            />
          </Field>

          <Field>
            <FieldLabel>振った日</FieldLabel>
            <InlineDateField
              value={delegatedOn}
              onSave={setDelegatedOn}
              ariaLabel="ペアに振った日"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="delegate-column">業務列（任意）</FieldLabel>
            <Select
              value={columnId || "none"}
              onValueChange={(v) =>
                setColumnId(v === "none" ? "" : (v as MiraiColumnId))
              }
            >
              <SelectTrigger id="delegate-column" className="bg-card">
                <SelectValue placeholder="列を選ぶ（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">（指定なし）</SelectItem>
                {MIRAI_COLUMN_MASTER.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="delegate-note">メモ（任意）</FieldLabel>
            <Textarea
              id="delegate-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="補足があれば"
              rows={2}
              className="bg-card"
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">キャンセル</Button>} />
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !deadline || !delegatedOn}
          >
            振る
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
