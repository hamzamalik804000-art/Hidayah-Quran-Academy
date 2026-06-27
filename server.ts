import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DashboardData, TrialRequest, Teacher, Student, AttendanceRecord } from "./src/types";

// Helper to secure data directory
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default database state
const DEFAULT_DB: DashboardData = {
  trials: [
    {
      id: "trial-1",
      studentName: "Zayd Ahmed",
      age: 8,
      country: "United Kingdom",
      courseId: "noorani-qaida",
      preferredTime: "17:00 (GMT)",
      parentWhatsApp: "+447712345678",
      teacherId: "teacher-1",
      status: "assigned",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      id: "trial-2",
      studentName: "Maryam Fatima",
      age: 12,
      country: "United States",
      courseId: "tajweed",
      preferredTime: "16:30 (EST)",
      parentWhatsApp: "+13125550192",
      teacherId: null,
      status: "pending",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    },
    {
      id: "trial-3",
      studentName: "Hamza Malik",
      age: 15,
      country: "Canada",
      courseId: "hifz",
      preferredTime: "18:00 (EST)",
      parentWhatsApp: "+14165550183",
      teacherId: "teacher-3",
      status: "completed",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }
  ],
  teachers: [
    {
      id: "teacher-1",
      name: "Qari Bilal Al-Azhari",
      gender: "male",
      specialization: "Tajweed & Qaida specialist, graduate of Al-Azhar University",
      email: "bilal@quranacademy.com",
      whatsapp: "+923377554241",
      status: "active"
    },
    {
      id: "teacher-2",
      name: "Qariah Aisha Siddiqua",
      gender: "female",
      specialization: "Noorani Qaida & Nazra Specialist for kids and female adults",
      email: "aisha@quranacademy.com",
      whatsapp: "+923001234567",
      status: "active"
    },
    {
      id: "teacher-3",
      name: "Sheikh Tariq Mahmood",
      gender: "male",
      specialization: "Hifz-ul-Quran coach with 10+ years experience of memorization",
      email: "tariq@quranacademy.com",
      whatsapp: "+923219876543",
      status: "active"
    }
  ],
  students: [
    {
      id: "student-1",
      name: "Zayn Yusuf",
      age: 9,
      country: "Canada",
      courseId: "recitation",
      parentWhatsApp: "+14165550211",
      teacherId: "teacher-2",
      monthlyFee: 60,
      paymentStatus: "paid",
      status: "active",
      joinedAt: "2026-03-15T10:00:00.000Z"
    },
    {
      id: "student-2",
      name: "Safiyyah Khan",
      age: 7,
      country: "United Arab Emirates",
      courseId: "noorani-qaida",
      parentWhatsApp: "+971501234567",
      teacherId: "teacher-2",
      monthlyFee: 50,
      paymentStatus: "unpaid",
      status: "active",
      joinedAt: "2026-05-01T12:00:00.000Z"
    },
    {
      id: "student-3",
      name: "Yousef Ibrahim",
      age: 14,
      country: "Australia",
      courseId: "hifz",
      parentWhatsApp: "+61298765432",
      teacherId: "teacher-3",
      monthlyFee: 90,
      paymentStatus: "paid",
      status: "active",
      joinedAt: "2026-01-10T09:00:00.000Z"
    }
  ],
  attendance: [
    {
      id: "att-1",
      studentId: "student-1",
      date: "2026-06-25",
      status: "present",
      notes: "Excellent flow in Nazra"
    },
    {
      id: "att-2",
      studentId: "student-2",
      date: "2026-06-25",
      status: "present",
      notes: "Completed lesson 4 in Noorani Qaida"
    },
    {
      id: "att-3",
      studentId: "student-3",
      date: "2026-06-25",
      status: "absent",
      notes: "Sore throat, father informed via WhatsApp"
    },
    {
      id: "att-4",
      studentId: "student-1",
      date: "2026-06-26",
      status: "present"
    },
    {
      id: "att-5",
      studentId: "student-2",
      date: "2026-06-26",
      status: "present"
    },
    {
      id: "att-6",
      studentId: "student-3",
      date: "2026-06-26",
      status: "present"
    }
  ]
};

// Helper to read database
function getDbData(): DashboardData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Error reading database file, resetting to default:", error);
  }
  // Save default DB if missing or corrupted
  saveDbData(DEFAULT_DB);
  return DEFAULT_DB;
}

// Helper to write database
function saveDbData(data: DashboardData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API - Auth Login
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    // Simple secure default credentials
    if (username === "admin" && password === "quran123") {
      res.json({ success: true, token: "mock-jwt-token-admin", role: "admin" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials. Hint: use 'admin' and 'quran123'" });
    }
  });

  // API - Fetch Complete Dashboard Data
  app.get("/api/dashboard", (req, res) => {
    const data = getDbData();
    res.json(data);
  });

  // API - Synchronize data from localStorage fallback (re-populates server if container scaled down)
  app.post("/api/dashboard/sync", (req, res) => {
    const clientData = req.body;
    if (clientData && Array.isArray(clientData.trials) && Array.isArray(clientData.students)) {
      const serverData = getDbData();
      
      // Smart merge: Keep items that have more recent updates or merge unique IDs
      const trialMap = new Map(serverData.trials.map(t => [t.id, t]));
      clientData.trials.forEach((t: TrialRequest) => {
        if (!trialMap.has(t.id)) trialMap.set(t.id, t);
      });

      const studentMap = new Map(serverData.students.map(s => [s.id, s]));
      clientData.students.forEach((s: Student) => {
        if (!studentMap.has(s.id)) studentMap.set(s.id, s);
      });

      const teacherMap = new Map(serverData.teachers.map(t => [t.id, t]));
      clientData.teachers.forEach((t: Teacher) => {
        if (!teacherMap.has(t.id)) teacherMap.set(t.id, t);
      });

      const attMap = new Map(serverData.attendance.map(a => [a.id, a]));
      clientData.attendance.forEach((a: AttendanceRecord) => {
        if (!attMap.has(a.id)) attMap.set(a.id, a);
      });

      const mergedData: DashboardData = {
        trials: Array.from(trialMap.values()),
        teachers: Array.from(teacherMap.values()),
        students: Array.from(studentMap.values()),
        attendance: Array.from(attMap.values())
      };

      saveDbData(mergedData);
      res.json({ success: true, data: mergedData });
    } else {
      res.status(400).json({ success: false, message: "Invalid sync format" });
    }
  });

  // API - Register Free Trial Request (Public Form)
  app.post("/api/trials", (req, res) => {
    const { studentName, age, country, courseId, preferredTime, parentWhatsApp } = req.body;
    if (!studentName || !age || !country || !courseId || !parentWhatsApp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const data = getDbData();
    const newTrial: TrialRequest = {
      id: "trial-" + Date.now(),
      studentName,
      age: Number(age),
      country,
      courseId,
      preferredTime: preferredTime || "Flexible",
      parentWhatsApp,
      teacherId: null,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    data.trials.unshift(newTrial);
    saveDbData(data);
    res.json({ success: true, trial: newTrial });
  });

  // API - Update Free Trial (Assign Teacher, Change Status)
  app.put("/api/trials/:id", (req, res) => {
    const { id } = req.params;
    const { teacherId, status, notes } = req.body;
    const data = getDbData();

    const index = data.trials.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Trial request not found" });
    }

    data.trials[index] = {
      ...data.trials[index],
      teacherId: teacherId !== undefined ? teacherId : data.trials[index].teacherId,
      status: status || data.trials[index].status,
      notes: notes !== undefined ? notes : data.trials[index].notes
    };

    // If marked as completed and was pending/assigned, we can automatically promote to active student
    if (status === "completed" && data.trials[index].status !== "completed") {
      // Check if student already exists to prevent duplicate promotion
      const studentExists = data.students.some(s => s.parentWhatsApp === data.trials[index].parentWhatsApp && s.name === data.trials[index].studentName);
      if (!studentExists) {
        // Find default fee based on courseId
        let defaultFee = 50;
        if (data.trials[index].courseId === "recitation") defaultFee = 60;
        else if (data.trials[index].courseId === "tajweed") defaultFee = 70;
        else if (data.trials[index].courseId === "hifz") defaultFee = 90;

        const newStudent: Student = {
          id: "student-" + Date.now(),
          name: data.trials[index].studentName,
          age: data.trials[index].age,
          country: data.trials[index].country,
          courseId: data.trials[index].courseId,
          parentWhatsApp: data.trials[index].parentWhatsApp,
          teacherId: data.trials[index].teacherId,
          monthlyFee: defaultFee,
          paymentStatus: "unpaid",
          status: "active",
          joinedAt: new Date().toISOString()
        };
        data.students.unshift(newStudent);
      }
    }

    saveDbData(data);
    res.json({ success: true, trial: data.trials[index], students: data.students });
  });

  // API - Add Direct Student / Convert approved Trial
  app.post("/api/students", (req, res) => {
    const { name, age, country, courseId, parentWhatsApp, teacherId, monthlyFee } = req.body;
    if (!name || !age || !country || !courseId || !parentWhatsApp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const data = getDbData();
    const newStudent: Student = {
      id: "student-" + Date.now(),
      name,
      age: Number(age),
      country,
      courseId,
      parentWhatsApp,
      teacherId: teacherId || null,
      monthlyFee: Number(monthlyFee) || 50,
      paymentStatus: "unpaid",
      status: "active",
      joinedAt: new Date().toISOString()
    };

    data.students.unshift(newStudent);
    saveDbData(data);
    res.json({ success: true, student: newStudent });
  });

  // API - Update Student Details, Fee Payment status, or Active status
  app.put("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const { teacherId, monthlyFee, paymentStatus, status, name, courseId } = req.body;
    const data = getDbData();

    const index = data.students.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    data.students[index] = {
      ...data.students[index],
      name: name !== undefined ? name : data.students[index].name,
      courseId: courseId !== undefined ? courseId : data.students[index].courseId,
      teacherId: teacherId !== undefined ? teacherId : data.students[index].teacherId,
      monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : data.students[index].monthlyFee,
      paymentStatus: paymentStatus || data.students[index].paymentStatus,
      status: status || data.students[index].status
    };

    saveDbData(data);
    res.json({ success: true, student: data.students[index] });
  });

  // API - Add Teacher
  app.post("/api/teachers", (req, res) => {
    const { name, gender, specialization, email, whatsapp } = req.body;
    if (!name || !gender || !specialization || !whatsapp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const data = getDbData();
    const newTeacher: Teacher = {
      id: "teacher-" + Date.now(),
      name,
      gender,
      specialization,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@quranacademy.com`,
      whatsapp,
      status: "active"
    };

    data.teachers.push(newTeacher);
    saveDbData(data);
    res.json({ success: true, teacher: newTeacher });
  });

  // API - Update Teacher Status
  app.put("/api/teachers/:id", (req, res) => {
    const { id } = req.params;
    const { status, specialization, whatsapp, email } = req.body;
    const data = getDbData();

    const index = data.teachers.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    data.teachers[index] = {
      ...data.teachers[index],
      status: status || data.teachers[index].status,
      specialization: specialization !== undefined ? specialization : data.teachers[index].specialization,
      whatsapp: whatsapp !== undefined ? whatsapp : data.teachers[index].whatsapp,
      email: email !== undefined ? email : data.teachers[index].email
    };

    saveDbData(data);
    res.json({ success: true, teacher: data.teachers[index] });
  });

  // API - Log Attendance for a student on a specific date
  app.post("/api/attendance", (req, res) => {
    const { studentId, date, status, notes } = req.body;
    if (!studentId || !date || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const data = getDbData();
    
    // Check if attendance record already exists for this student on this date
    const existingIndex = data.attendance.findIndex(a => a.studentId === studentId && a.date === date);

    const updatedRecord: AttendanceRecord = {
      id: existingIndex !== -1 ? data.attendance[existingIndex].id : "att-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      studentId,
      date,
      status,
      notes: notes !== undefined ? notes : (existingIndex !== -1 ? data.attendance[existingIndex].notes : "")
    };

    if (existingIndex !== -1) {
      data.attendance[existingIndex] = updatedRecord;
    } else {
      data.attendance.push(updatedRecord);
    }

    saveDbData(data);
    res.json({ success: true, record: updatedRecord });
  });

  // Vite development integration or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Online Quran Academy running on port ${PORT}`);
  });
}

startServer();
