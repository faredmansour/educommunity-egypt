import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { api } from "../api.js";

// نحوّل الدقائق لصيغة ساعات ودقائق
function fmt(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (h > 0 ? h + " س " : "") + m + " د";
}

// سجل حضور المدرسين وإجمالي وقت الجلسات المسجلة.
function Attendance() {
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getAttendance()
      .then((data) => {
        setSessions(data.sessions || []);
        setTotals(data.totals || []);
      })
      .catch((err) => setError(err.message || "تعذر تحميل سجل الحضور."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-extrabold text-slate-800">حضور المدرسين وحساب الوقت</h1>
      </div>
      <p className="text-sm text-slate-400 mb-5">عرض أوقات الدخول والخروج وإجمالي مدة الجلسات المسجلة لكل مدرس.</p>

      {loading && <p className="text-sm text-slate-400">جاري التحميل...</p>}
      {error && <p role="alert" className="text-sm bg-red-50 text-red-700 rounded-lg p-3 mb-4">{error}</p>}

      {/* إجمالي وقت كل مدرس */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {totals.map((t) => {
          return (
            <div key={t.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="font-bold text-slate-800 text-sm">أ. {t.name}</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">{fmt(t.minutes)}</p>
              <p className="text-[11px] text-slate-400">إجمالي مدة الجلسات المسجلة فقط</p>
            </div>
          );
        })}
        {!loading && !error && totals.length === 0 && (
          <p className="text-sm text-slate-400">لا توجد بيانات حضور بعد.</p>
        )}
      </div>

      {/* جدول الجلسات */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm">أحدث 200 جلسة مسجلة</div>
        {!loading && !error && sessions.length === 0 && <p className="p-6 text-sm text-slate-400">لا توجد جلسات مسجلة بعد.</p>}
        {sessions.length > 0 && <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-right px-4 py-2 font-bold">المدرس</th>
              <th className="text-right px-4 py-2 font-bold">وقت الدخول</th>
              <th className="text-right px-4 py-2 font-bold">وقت الخروج</th>
              <th className="text-right px-4 py-2 font-bold">المدة</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s._id} className="border-t border-slate-50">
                <td className="px-4 py-2.5 font-bold text-slate-700">أ. {s.teacher?.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{new Date(s.loginAt).toLocaleString("ar-EG")}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {s.logoutAt ? new Date(s.logoutAt).toLocaleString("ar-EG") : <span className="text-green-600 font-bold">متصل الآن</span>}
                </td>
                <td className="px-4 py-2.5 text-slate-700 font-bold">{s.durationMinutes ? fmt(s.durationMinutes) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>}
      </div>
    </div>
  );
}

export default Attendance;
