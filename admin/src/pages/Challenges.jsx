import { useEffect, useState } from "react";
import { Trophy, Star, Check, X } from "lucide-react";
import { api } from "../api.js";

// متابعة التحديات — الأدمن يشوف كل التحديات النشطة (عرض فقط)
function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [active, waiting] = await Promise.all([api.getChallenges(), api.getPendingChallenges()]);
      setChallenges(active.challenges || []);
      setPending(waiting.challenges || []);
    } catch (err) {
      setError(err.message || "تعذر تحميل التحديات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, action) {
    setError("");
    try {
      if (action === "approve") await api.approveChallenge(id);
      else await api.rejectChallenge(id);
      await load();
    } catch (err) { setError(err.message || "تعذر تحديث حالة المسابقة."); }
  }

  const card = "bg-white rounded-2xl border border-slate-100 shadow-sm";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-extrabold text-slate-800">متابعة التحديات</h1>
      </div>
      <p className="text-sm text-slate-400 mb-5">التحديات النشطة على المنصة ونقاطها.</p>

      {error && <p role="alert" className="text-sm bg-red-50 text-red-700 rounded-lg p-3 mb-4">{error}</p>}

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="font-extrabold text-slate-800 mb-3">مسابقات بانتظار الموافقة</h2>
          <div className="space-y-2">
            {pending.map((c) => (
              <div key={c.id || c._id} className={`${card} p-4 flex items-center gap-3`}>
                <div className="flex-1 text-right"><p className="font-bold text-slate-800">{c.title}</p><p className="text-xs text-slate-400">{c.subject} · {c.grade} · أضافها {c.createdBy?.name || "مدرس"}</p><p className="text-xs text-slate-500 mt-1">{c.description}</p></div>
                <button onClick={() => updateStatus(c.id || c._id, "approve")} className="bg-emerald-600 text-white rounded-lg p-2" title="اعتماد"><Check className="w-4 h-4" /></button>
                <button onClick={() => updateStatus(c.id || c._id, "reject")} className="bg-rose-600 text-white rounded-lg p-2" title="رفض"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">جاري التحميل...</p>}
      {!loading && !error && challenges.length === 0 && (
        <div className={`${card} p-8 text-center text-slate-400 text-sm`}>لا توجد تحديات نشطة.</div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {challenges.map((c) => (
          <div key={c.id || c._id} className={`${card} p-4`}>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">{c.subject || "عام"}</span>
              <span className="text-amber-500 text-xs font-bold flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {c.points} نقطة</span>
            </div>
            <p className="font-bold text-slate-800 text-sm mt-2">{c.title}</p>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{c.description}</p>
            <p className="text-[10px] text-slate-400 mt-2">ينتهي: {c.end_date ? new Date(c.end_date).toLocaleDateString("ar-EG") : "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Challenges;
