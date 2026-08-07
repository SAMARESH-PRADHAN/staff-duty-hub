export type Gender = "Male" | "Female" | "Other";
export type EmpStatus = "Active" | "Transferred" | "Retired (Early)";

export interface EmpDocument {
  id: string;
  name: string;
  fileName: string;
  dataUrl: string;
}

export interface Employee {
  id: string;
  photo: string;
  name: string;
  gender: Gender;
  tokenNo: string;
  hrmsId: string;
  batch: string;
  designation: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  emergencyContact: string;
  address: string;
  aadhaar: string;
  pan: string;
  pfNumber: string;
  dob: string;
  doa: string;
  qualification: string;
  documents: EmpDocument[];
  status: EmpStatus;
  actualRetirementDate?: string;
  earlyRetirementReason?: string;
}

export type EventType = "Promotion" | "Transfer" | "Early Retirement";

export interface ServiceEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  type: EventType;
  from: string;
  to: string;
  date: string;
  remarks: string;
  recordedBy: string;
}

export interface DarRecord {
  id: string;
  employeeId: string;
  type: string;
  date: string;
  description: string;
  reference: string;
  recordedBy: string;
}

export interface RewardRecord {
  id: string;
  employeeId: string;
  type: string;
  date: string;
  description: string;
  reference: string;
  recordedBy: string;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Session {
  role: "HR Manager" | "Roster Manager";
  username: string;
  name: string;
  loginAt: string;
}

export interface Credential {
  role: "HR Manager" | "Roster Manager";
  username: string;
  password: string;
  name: string;
}
