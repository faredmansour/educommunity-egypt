import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, GraduationCap, FileCheck2, CalendarClock, BookOpen, UserPlus, Clock, ArrowLeft, RefreshCw, Trophy, MessageSquare } from "lucide-react";
import { api } from "../api.js";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const BAR_COLORS = ["bg-blue-600", "bg-teal-500", "bg-amber-500", "bg-rose-500", "bg-purple-500"];
const ROLE_LABELS = { student: "طالب", teacher: "مدرس", admin: "أدمن", supervisor: "مشرف" };

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setStats(await api.getStats());
    } catch (err) {
      setError(err.message || "تعذر تحميل إحصائيات اللوحة.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const card = "bg-white rounded-2xl border border-slate-100 shadow-sm";
  const roleCounts = Object.fromEntries((stats?.usersByRole || []).map(({ role, count }) => [role, count]));
  const growth = (stats?.userGrowth || []).map((item) => ({
    ...item,
    label: MONTHS[item.month - 1],
  }));
  const maxGrowth = Math.max(...growth.map((item) => item.count), 1);
  const topSubjects = stats?.topSubjects || [];
  const maxSubject = Math.max(...topSubjects.map((item) => item.count), 1);
  const kpis = [
    { label: "إجمالي المستخدمين", value: stats?.totalUsers ?? "—", icon: Users, color: "bg-blue-100 text-blue-600", to: "/users" },
    { label: "الطلاب", value: roleCounts.student ?? 0, icon: GraduationCap, color: "bg-teal-100 text-teal-600", to: "/users" },
    { label: "المدرسون", value: roleCounts.teacher ?? 0, icon: Users, color: "bg-indigo-100 text-indigo-600", to: "/users" },
    { label: "مواد بانتظار الموافقة", value: stats?.pendingMaterials ?? "—", icon: FileCheck2, color: "bg-amber-100 text-amber-600", to: "/materials" },
    { label: "مواد تعليمية", value: stats?.totalMaterials ?? "—", icon: BookOpen, color: "bg-cyan-100 text-cyan-700", to: "/materials" },
    { label: "مدرسون مناوبون الآن", value: stats?.activeShifts ?? "—", icon: CalendarClock, color: "bg-purple-100 text-purple-600", to: "/shifts" },
    { label: "تحديات نشطة", value: stats?.activeChallenges ?? "—", icon: Trophy, color: "bg-orange-100 text-orange-600", to: "/challenges" },
    { label: "منشورات المجتمع", value: stats?.totalPosts ?? "—", icon: MessageSquare, color: "bg-rose-100 text-rose-600" },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">نظرة تحليلية</h1>
          <p className="text-sm text-slate-400">إحصائيات مباشرة من بيانات المنصة.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="text-xs text-blue-700 font-bold flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> تحديث البيانات
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && !stats && <p className="mb-4 text-sm text-slate-400">جارٍ تحميل الإحصائيات...</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {kpis.map((item) => {
          const Icon = item.icon;
          const content = <div className={`${card} p-4 h-full`}>
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-500">{item.label}</span><span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}><Icon className="w-4 h-4" /></span></div>
            <p className="text-2xl font-extrabold mt-2 text-slate-800">{item.value}</p>
          </div>;
          return item.to ? <Link key={item.label} to={item.to}>{content}</Link> : <div key={item.label}>{content}</div>;
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <section className={`${card} p-5 lg:col-span-2`}>
          <h2 className="font-extrabold text-slate-800">نمو المستخدمين</h2>
          <p className="text-xs text-slate-400 mb-4">التسجيلات الجديدة خلال آخر ستة أشهر</p>
          {growth.length > 0 ? <div className="flex items-end justify-between gap-3 h-44" aria-label="مخطط نمو المستخدمين">
            {growth.map((item) => <div key={`${item.year}-${item.month}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-500">{item.count}</span>
              <div className="w-full rounded-t-lg bg-blue-600" style={{ height: `${Math.max((item.count / maxGrowth) * 75, item.count ? 4 : 2)}%`, opacity: item.count ? 1 : 0.15 }} />
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </div>)}
          </div> : stats && <p className="text-sm text-slate-400">لا توجد بيانات نمو.</p>}
        </section>

        <section className={`${card} p-5`}>
          <h2 className="font-extrabold text-slate-800">المواد حسب المادة الدراسية</h2>
          <p className="text-xs text-slate-400 mb-4">أكثر خمس مواد تعليمية معتمدة</p>
          {stats && topSubjects.length === 0 && <p className="text-sm text-slate-400">لا توجد مواد معتمدة بعد.</p>}
          {topSubjects.map((subject, index) => <div key={subject.name} className="mb-3">
            <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-500">{subject.count}</span><span className="text-slate-600">{subject.name}</span></div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${BAR_COLORS[index % BAR_COLORS.length]}`} style={{ width: `${(subject.count / maxSubject) * 100}%` }} /></div>
          </div>)}
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className={`${card} lg:col-span-2 overflow-hidden`}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100"><div><h2 className="font-extrabold text-slate-800">أحدث التسجيلات</h2><p className="text-xs text-slate-400">آخر الحسابات التي انضمت</p></div><Link to="/users" className="text-xs text-blue-600 font-bold">عرض المستخدمين</Link></div>
          {stats && (stats.recentUsers || []).length === 0 ? <p className="p-5 text-sm text-slate-400">لا توجد حسابات بعد.</p> : stats && <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-right px-5 py-2">المستخدم</th><th className="text-right px-5 py-2">الدور</th><th className="text-right px-5 py-2">تاريخ الانضمام</th></tr></thead><tbody>
            {stats.recentUsers.map((user) => <tr key={user.id} className="border-t border-slate-50"><td className="px-5 py-2.5"><p className="font-bold text-slate-700">{user.name}</p><p className="text-[11px] text-slate-400">{user.email}</p></td><td className="px-5 py-2.5 text-slate-600">{ROLE_LABELS[user.role] || user.role}</td><td className="px-5 py-2.5 text-slate-500 text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "—"}</td></tr>)}
          </tbody></table></div>}
        </section>

        <section className={`${card} p-5`}>
          <h2 className="font-extrabold text-slate-800">اختصارات الإدارة</h2>
          <div className="mt-4 space-y-3">
            <Link to="/materials" className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-blue-50"><FileCheck2 className="w-5 h-5 text-blue-600"/><span className="flex-1 text-sm font-bold text-slate-700">مراجعة المواد</span><ArrowLeft className="w-4 h-4 text-slate-400"/></Link>
            <Link to="/attendance" className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-blue-50"><Clock className="w-5 h-5 text-blue-600"/><span className="flex-1 text-sm font-bold text-slate-700">سجل الحضور</span><ArrowLeft className="w-4 h-4 text-slate-400"/></Link>
            <Link to="/shifts" className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-blue-50"><CalendarClock className="w-5 h-5 text-blue-600"/><span className="flex-1 text-sm font-bold text-slate-700">إدارة الشيفتات</span><ArrowLeft className="w-4 h-4 text-slate-400"/></Link>
            <Link to="/users" className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-blue-50"><UserPlus className="w-5 h-5 text-blue-600"/><span className="flex-1 text-sm font-bold text-slate-700">إدارة المستخدمين</span><ArrowLeft className="w-4 h-4 text-slate-400"/></Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
