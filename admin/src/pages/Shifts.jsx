import { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { api } from "../api.js";

// شيفتات المناوبة — الأدمن يعيّن مدرس مناوب لمادة في وقت معيّن
function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await api.getShifts();
      setShifts(data.shifts || []);
    } catch (err) {
      setError(err.message || "تعذر تحميل الشيفتات.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    // نجيب المدرسين عشان نختار منهم
    api.getUsers().then((data) => {
      const list = (data.users || []).filter((u) => u.role === "teacher");
      setTeachers(list);
      if (list[0]) setTeacher(list[0].id);
    }).catch((err) => setError(err.message || "تعذر تحميل قائمة المدرسين."));
  }, []);

  function isNow(s) {
    const now = new Date();
    return new Date(s.startsAt) <= now && new Date(s.endsAt) >= now;
  }

  async function add(e) {
    e.preventDefault();
    setMsg("");
    if (!teacher || !subject || !startsAt || !endsAt) {
      setMsg("لازم تملأ كل الحقول");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setMsg("وقت النهاية لازم يكون بعد وقت البداية.");
      return;
    }
    try {
      setError("");
      await api.createShift({ teacher, subject, startsAt, endsAt });
      setMsg("تم إضافة الشيفت ✅");
      setSubject("");
      setStartsAt("");
      setEndsAt("");
      load();
    } catch (err) {
      setError(err.message || "تعذر إضافة الشيفت.");
    }
  }

  async function remove(id) {
    if (!window.confirm("هل تريد حذف هذا الشيفت؟")) return;
    try {
      await api.deleteShift(id);
      await load();
    } catch (err) { setError(err.message || "تعذر حذف الشيفت."); }
  }

  const input = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500";

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-extrabold text-slate-800">شيفتات المناوبة</h1>
      </div>
      <p className="text-sm text-slate-400 mb-5">عيّن مدرس مناوب لكل مادة عشان الطالب يلاقي حد يسأله في أي وقت.</p>

      {msg && <p className="text-sm bg-blue-50 text-blue-700 rounded-lg p-2 mb-4">{msg}</p>}
      {error && <p role="alert" className="text-sm bg-red-50 text-red-700 rounded-lg p-3 mb-4">{error}</p>}

      {/* نموذج إضافة شيفت */}
      <form onSubmit={add} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 grid sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1">المدرس</label>
          <select value={teacher} onChange={(e) => setTeacher(e.target.value)} className={input}>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">المادة</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={input} placeholder="الفيزياء" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">من</label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">إلى</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={input} />
        </div>
        <button className="bg-blue-600 text-white font-bold text-sm py-2 rounded-xl flex items-center justify-center gap-1">
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </form>

      {/* قائمة الشيفتات */}
      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">جارٍ تحميل الشيفتات...</p>}
        {!loading && !error && shifts.length === 0 && <p className="text-sm text-slate-400">لا توجد شيفتات بعد.</p>}
        {shifts.map((s) => (
          <div key={s._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 text-sm">أ. {s.teacher?.name}</p>
                {isNow(s) && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">مناوب الآن</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {s.subject} • {new Date(s.startsAt).toLocaleString("ar-EG")} ← {new Date(s.endsAt).toLocaleTimeString("ar-EG")}
              </p>
            </div>
            <button onClick={() => remove(s._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shifts;
