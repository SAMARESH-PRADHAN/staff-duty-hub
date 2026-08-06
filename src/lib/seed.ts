import type {
  ActivityEntry,
  Credential,
  DarRecord,
  Employee,
  RewardRecord,
  ServiceEvent,
} from "./types";

export const DESIGNATIONS = [
  "Sr.Tech",
  "Tech-I",
  "Tech-II",
  "Tech-III",
  "Helper",
  "Supervisor",
  "Ministerial",
  "Miscellaneous",
];

export const BATCHES = [
  "Batch A",
  "Batch B",
  "Batch C",
  "Batch D",
  "Batch E",
  "Batch F",
  "Rajdhani Batch",
  "VB Batch",
  "General Pool",
  "Sick Line/IOH",
];

const NAMES = [
  ["Ramesh Kumar", "Male"],
  ["Suresh Babu", "Male"],
  ["Lakshmi Narayan", "Male"],
  ["Anitha Rao", "Female"],
  ["Manjunath Gowda", "Male"],
  ["Prakash Shetty", "Male"],
  ["Kavitha Reddy", "Female"],
  ["Venkatesh Murthy", "Male"],
  ["Shivaraj Patil", "Male"],
  ["Deepa Krishnan", "Female"],
  ["Basavaraj Hiremath", "Male"],
  ["Nagaraj Bhat", "Male"],
  ["Sunitha Devi", "Female"],
  ["Mohammed Irfan", "Male"],
  ["Ravi Shankar", "Male"],
  ["Girish Naik", "Male"],
  ["Pushpa Latha", "Female"],
  ["Chandrashekar N", "Male"],
  ["Vinod Kamath", "Male"],
  ["Rekha Joshi", "Female"],
  ["Srinivas Rao", "Male"],
  ["Harish Chandra", "Male"],
  ["Geetha Mani", "Female"],
  ["Ashok Pawar", "Male"],
  ["Yogesh Salian", "Male"],
  ["Bhavani Shankari", "Female"],
  ["Tarun Kulkarni", "Male"],
  ["Imran Pasha", "Male"],
] as const;

const QUALIFICATIONS = ["ITI", "Diploma (Mech)", "B.E (Mech)", "SSLC", "PUC", "B.Com"];

function avatar(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`;
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function panFor(i: number) {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const p = (k: number) => L[(i * 7 + k * 3) % L.length];
  return `${p(0)}${p(1)}${p(2)}${p(3)}${p(4)}${pad(1000 + ((i * 137) % 8999), 4)}${p(5)}`;
}

function aadhaarFor(i: number) {
  return String(200000000000 + i * 373727371).slice(0, 12);
}

/** Deterministic demo dataset. */
export function seedData() {
  const today = new Date();
  const employees: Employee[] = NAMES.map(([name, gender], i) => {
    // A few employees retire soon: birth years chosen so age ~59.5-60
    let dobYear: number;
    let dobMonth: number;
    let dobDay: number;
    if (i < 5) {
      dobYear = today.getUTCFullYear() - 60;
      dobMonth = today.getUTCMonth() + 1 + i; // retiring in next months
      dobDay = i === 0 ? 1 : 3 + i * 4;
    } else if (i < 9) {
      dobYear = today.getUTCFullYear() - 59;
      dobMonth = ((today.getUTCMonth() + i) % 12) + 1;
      dobDay = 5 + i;
    } else {
      dobYear = 1968 + ((i * 3) % 26);
      dobMonth = ((i * 5) % 12) + 1;
      dobDay = ((i * 7) % 27) + 1;
    }
    if (dobMonth > 12) {
      dobMonth -= 12;
      dobYear += 1;
    }
    const dob = `${dobYear}-${pad(dobMonth)}-${pad(dobDay)}`;
    const doaYear = dobYear + 23 + (i % 5);
    const doa = `${doaYear}-${pad((i % 12) + 1)}-${pad((i % 25) + 1)}`;
    const status: Employee["status"] = i === 12 ? "Transferred" : "Active";
    return {
      id: `emp-${pad(i + 1, 3)}`,
      photo: avatar(name),
      name,
      gender: gender as Employee["gender"],
      tokenNo: `TKN${pad(1200 + i * 7, 4)}`,
      hrmsId: `H${pad(10000 + i * 137, 5)}`,
      batch: BATCHES[i % BATCHES.length]!,
      designation: DESIGNATIONS[i % DESIGNATIONS.length]!,
      phone: `9${pad(800000000 + i * 1234567, 9)}`.slice(0, 10),
      emergencyContact: `8${pad(700000000 + i * 7654321, 9)}`.slice(0, 10),
      address: `#${12 + i}, ${["Rail Nagar", "Yeshwanthpur", "Malleshwaram", "Peenya", "Yelahanka"][i % 5]!}, Bengaluru - 5600${pad(i % 99)}`,
      aadhaar: i === 6 ? "" : aadhaarFor(i + 1),
      pan: panFor(i + 1),
      pfNumber: `KN/BNG/${pad(45000 + i * 31, 5)}`,
      dob,
      doa,
      qualification: QUALIFICATIONS[i % QUALIFICATIONS.length]!,
      documents: [
        {
          id: `doc-${i}-1`,
          name: "Aadhaar Card",
          fileName: "aadhaar.pdf",
          dataUrl: "",
        },
        ...(i % 3 === 0
          ? [
              {
                id: `doc-${i}-2`,
                name: "Appointment Letter",
                fileName: "appointment.pdf",
                dataUrl: "",
              },
            ]
          : []),
      ],
      ...(i === 17
        ? {
            status: "Retired (Early)" as Employee["status"],
            actualRetirementDate: `${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 1)}-28`,
            earlyRetirementReason: "Voluntary retirement on medical grounds",
          }
        : { status }),
    } satisfies Employee;
  });

  const y = today.getUTCFullYear();
  const events: ServiceEvent[] = [
    {
      id: "evt-001",
      employeeId: "emp-001",
      employeeName: employees[0]!.name,
      type: "Promotion",
      from: "Tech-I",
      to: "Sr.Tech",
      date: `${y - 2}-04-01`,
      remarks: "Selection post promotion",
      recordedBy: "Priya Menon",
    },
    {
      id: "evt-002",
      employeeId: "emp-004",
      employeeName: employees[3]!.name,
      type: "Promotion",
      from: "Tech-III",
      to: "Tech-II",
      date: `${y - 1}-07-15`,
      remarks: "Seniority based promotion",
      recordedBy: "Priya Menon",
    },
    {
      id: "evt-003",
      employeeId: "emp-013",
      employeeName: employees[12]!.name,
      type: "Transfer",
      from: "Batch C",
      to: "Transferred Out of Depot",
      date: `${y}-01-20`,
      remarks: "Transferred to KJM Coaching Depot",
      recordedBy: "Priya Menon",
    },
    {
      id: "evt-004",
      employeeId: "emp-008",
      employeeName: employees[7]!.name,
      type: "Transfer",
      from: "General Pool",
      to: "Rajdhani Batch",
      date: `${y}-03-05`,
      remarks: "Batch rebalancing",
      recordedBy: "Priya Menon",
    },
    {
      id: "evt-005",
      employeeId: "emp-018",
      employeeName: employees[17]!.name,
      type: "Early Retirement",
      from: "Tech-II",
      to: "Retired (Early)",
      date: `${y}-${pad(today.getUTCMonth() + 1)}-28`,
      remarks: "Voluntary retirement on medical grounds",
      recordedBy: "Priya Menon",
    },
  ];

  const dar: DarRecord[] = [
    {
      id: "dar-001",
      employeeId: "emp-002",
      type: "Warning",
      date: `${y - 1}-06-11`,
      description: "Late attendance on repeated occasions during night shift.",
      reference: "SBC/DAR/2024/118",
      recordedBy: "Priya Menon",
    },
    {
      id: "dar-002",
      employeeId: "emp-005",
      type: "Censure",
      date: `${y - 1}-09-02`,
      description: "Negligence in brake power certificate verification.",
      reference: "SBC/DAR/2024/205",
      recordedBy: "Priya Menon",
    },
    {
      id: "dar-003",
      employeeId: "emp-011",
      type: "Withholding of Increment",
      date: `${y}-02-18`,
      description: "Unauthorised absence for 9 days without leave sanction.",
      reference: "SBC/DAR/2025/041",
      recordedBy: "Priya Menon",
    },
    {
      id: "dar-004",
      employeeId: "emp-011",
      type: "Warning",
      date: `${y}-05-06`,
      description: "Failure to maintain tool custody register.",
      reference: "SBC/DAR/2025/097",
      recordedBy: "Priya Menon",
    },
    {
      id: "dar-005",
      employeeId: "emp-020",
      type: "Reduction in Rank",
      date: `${y}-06-30`,
      description: "Major penalty imposed after enquiry into safety lapse.",
      reference: "SBC/DAR/2025/152",
      recordedBy: "Priya Menon",
    },
  ];

  const rewards: RewardRecord[] = [
    {
      id: "rw-001",
      employeeId: "emp-001",
      type: "Appreciation Letter",
      date: `${y - 1}-08-15`,
      description: "Outstanding work during Rajdhani rake maintenance drive.",
      reference: "SBC/RW/2024/033",
      recordedBy: "Priya Menon",
    },
    {
      id: "rw-002",
      employeeId: "emp-004",
      type: "Cash Award",
      date: `${y}-01-26`,
      description: "Republic Day cash award of Rs. 5,000 for zero-defect record.",
      reference: "SBC/RW/2025/008",
      recordedBy: "Priya Menon",
    },
    {
      id: "rw-003",
      employeeId: "emp-009",
      type: "Medal",
      date: `${y}-04-16`,
      description: "GM's medal for safety excellence.",
      reference: "SBC/RW/2025/019",
      recordedBy: "Priya Menon",
    },
    {
      id: "rw-004",
      employeeId: "emp-015",
      type: "Appreciation Letter",
      date: `${y}-06-11`,
      description: "Quick restoration of AC coach during peak summer rush.",
      reference: "SBC/RW/2025/044",
      recordedBy: "Priya Menon",
    },
  ];

  const activityTemplates: [string, string][] = [
    ["Employee added", employees[26]!.name],
    ["Employee record edited", employees[3]!.name],
    ["Promotion recorded", `${employees[3]!.name} — Tech-III → Tech-II`],
    ["Transfer recorded", `${employees[7]!.name} — General Pool → Rajdhani Batch`],
    ["DAR module accessed", "DAR & Rewards"],
    ["DAR record added", employees[10]!.name],
    ["Reward record added", employees[14]!.name],
    ["Aadhaar revealed", employees[1]!.name],
    ["Designation added", "Miscellaneous"],
    ["Batch added", "Sick Line/IOH"],
    ["Early retirement recorded", employees[17]!.name],
    ["Excel export", "Employees list"],
    ["PDF export", "Retirement forecast"],
    ["Employee record edited", employees[20]!.name],
    ["Login", "HR Manager"],
  ];
  const activity: ActivityEntry[] = activityTemplates.map(([action, target], i) => ({
    id: `act-${pad(i + 1, 3)}`,
    actor: "Priya Menon",
    action,
    target,
    timestamp: new Date(today.getTime() - (i + 1) * 5.4e6).toISOString(),
  }));

  const credentials: Credential[] = [
    { role: "HR Manager", username: "hr", password: "hr123", name: "Priya Menon" },
    {
      role: "Roster Manager",
      username: "roster",
      password: "roster123",
      name: "Arun Kishore",
    },
  ];

  return {
    designations: DESIGNATIONS,
    batches: BATCHES,
    employees,
    events,
    dar,
    rewards,
    activity,
    credentials,
  };
}
