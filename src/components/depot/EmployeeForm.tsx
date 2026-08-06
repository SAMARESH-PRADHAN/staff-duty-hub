import { useEffect, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logActivity, store, uid } from "@/lib/storage";
import type { EmpDocument, Employee, Gender } from "@/lib/types";

const EMPTY: Employee = {
  id: "",
  photo: "",
  name: "",
  gender: "Male",
  tokenNo: "",
  hrmsId: "",
  batch: "",
  designation: "",
  phone: "",
  emergencyContact: "",
  address: "",
  aadhaar: "",
  pan: "",
  pfNumber: "",
  dob: "",
  doa: "",
  qualification: "",
  documents: [],
  status: "Active",
};

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="mb-4 text-sm font-semibold text-navy">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
  full,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function EmployeeForm({
  open,
  onOpenChange,
  employee,
  designations,
  batches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  designations: string[];
  batches: string[];
}) {
  const [form, setForm] = useState<Employee>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      employee ?? {
        ...EMPTY,
        designation: designations[0] ?? "",
        batch: batches[0] ?? "",
      },
    );
  }, [open, employee, designations, batches]);

  const change = <K extends keyof Employee>(key: K, value: Employee[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.tokenNo.trim()) e.tokenNo = "Token number is required.";
    if (!/^.{6}$/.test(form.hrmsId.trim()))
      e.hrmsId = "HRMS-ID must be exactly 6 characters.";
    if (!form.designation) e.designation = "Designation is required.";
    if (!form.batch) e.batch = "Batch is required.";
    if (form.phone && !/^[0-9]{10}$/.test(form.phone))
      e.phone = "Phone must be 10 digits.";
    if (form.aadhaar && !/^[0-9]{12}$/.test(form.aadhaar))
      e.aadhaar = "Aadhaar must be exactly 12 numeric digits.";
    if (form.pan && !PAN_RE.test(form.pan.toUpperCase()))
      e.pan = "PAN must be 5 letters, 4 digits and 1 letter (e.g. ABCDE1234F).";
    if (!form.dob) e.dob = "Date of birth is required.";
    if (!form.doa) e.doa = "Date of appointment is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }
    const list = store.employees();
    const record: Employee = {
      ...form,
      pan: form.pan.toUpperCase(),
      id: form.id || uid("emp"),
    };
    if (form.id) {
      store.setEmployees(list.map((e) => (e.id === form.id ? record : e)));
      logActivity("Employee record edited", record.name);
      toast.success("Employee updated");
    } else {
      store.setEmployees([record, ...list]);
      logActivity("Employee added", record.name);
      toast.success("Employee added");
    }
    onOpenChange(false);
  };

  const addDocument = () =>
    setForm((f) => ({
      ...f,
      documents: [...f.documents, { id: uid("doc"), name: "", fileName: "", dataUrl: "" }],
    }));

  const updateDocument = (id: string, patch: Partial<EmpDocument>) =>
    setForm((f) => ({
      ...f,
      documents: f.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="Basic Details">
            <div className="space-y-2 sm:col-span-2">
              <Label>Employee Photo</Label>
              <div className="flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {form.photo ? (
                    <img
                      src={form.photo}
                      alt="Employee preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Upload className="size-5 text-muted-foreground" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  className="max-w-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) change("photo", await readAsDataUrl(file));
                  }}
                />
              </div>
            </div>
            <Field label="Full Name" error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => change("name", e.target.value)}
                placeholder="Ramesh Kumar"
              />
            </Field>
            <Field label="Gender">
              <Select
                value={form.gender}
                onValueChange={(v) => change("gender", v as Gender)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Male", "Female", "Other"].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Token Number" error={errors.tokenNo}>
              <Input
                value={form.tokenNo}
                onChange={(e) => change("tokenNo", e.target.value)}
                placeholder="TKN1234"
              />
            </Field>
            <Field label="HRMS-ID (6 characters)" error={errors.hrmsId}>
              <Input
                value={form.hrmsId}
                maxLength={6}
                onChange={(e) => change("hrmsId", e.target.value)}
                placeholder="H10023"
              />
            </Field>
            <Field label="Batch" error={errors.batch}>
              <Select value={form.batch} onValueChange={(v) => change("batch", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Designation" error={errors.designation}>
              <Select
                value={form.designation}
                onValueChange={(v) => change("designation", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Contact">
            <Field label="Phone Number" error={errors.phone}>
              <Input
                value={form.phone}
                inputMode="numeric"
                onChange={(e) => change("phone", e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Emergency Contact Number">
              <Input
                value={form.emergencyContact}
                inputMode="numeric"
                onChange={(e) =>
                  change("emergencyContact", e.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field label="Address" full>
              <Textarea
                value={form.address}
                rows={3}
                onChange={(e) => change("address", e.target.value)}
              />
            </Field>
          </Section>

          <Section title="Identity">
            <Field label="Aadhaar Number" error={errors.aadhaar}>
              <Input
                value={form.aadhaar}
                inputMode="numeric"
                maxLength={12}
                onChange={(e) => change("aadhaar", e.target.value.replace(/\D/g, ""))}
                placeholder="123412341234"
              />
            </Field>
            <Field label="PAN Number" error={errors.pan}>
              <Input
                value={form.pan}
                maxLength={10}
                onChange={(e) => change("pan", e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
              />
            </Field>
            <Field label="PF Number">
              <Input
                value={form.pfNumber}
                onChange={(e) => change("pfNumber", e.target.value)}
              />
            </Field>
          </Section>

          <Section title="Service">
            <Field label="Date of Birth" error={errors.dob}>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => change("dob", e.target.value)}
              />
            </Field>
            <Field label="Date of Appointment" error={errors.doa}>
              <Input
                type="date"
                value={form.doa}
                onChange={(e) => change("doa", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => change("status", v as Employee["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Active", "Transferred", "Retired (Early)"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Qualification & Documents">
            <Field label="Qualification" full>
              <Input
                value={form.qualification}
                onChange={(e) => change("qualification", e.target.value)}
                placeholder="ITI / Diploma / B.E"
              />
            </Field>
            <div className="space-y-3 sm:col-span-2">
              {form.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="space-y-2 rounded-lg border border-border bg-muted/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={doc.name}
                      placeholder="Document name (e.g. Aadhaar Card)"
                      onChange={(e) => updateDocument(doc.id, { name: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove document"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          documents: f.documents.filter((d) => d.id !== doc.id),
                        }))
                      }
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                  <Input
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        updateDocument(doc.id, {
                          fileName: file.name,
                          dataUrl: await readAsDataUrl(file),
                        });
                    }}
                  />
                  {doc.fileName ? (
                    <p className="text-xs text-muted-foreground">
                      Attached: {doc.fileName}
                    </p>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addDocument}>
                <Plus className="size-4" /> Add Another Document
              </Button>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
