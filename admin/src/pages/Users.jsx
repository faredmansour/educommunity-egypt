import { useEffect, useRef, useState } from "react";
import { Users as UsersIcon, Trash2, Search, ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";
import { api } from "../api.js";

const roleBadge = {
  admin: "bg-purple-100 text-purple-700",
  teacher: "bg-blue-100 text-blue-700",
  student: "bg-teal-100 text-teal-700",
  supervisor: "bg-amber-100 text-amber-700",
};
const roleLabel = { admin: "أدمن", teacher: "مدرس", student: "طالب", supervisor: "مشرف" };
const PAGE_SIZE = 20;

function Users() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const latestRequest = useRef(0);

  async function load(page = meta.page, query = search, selectedRole = role) {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError("");
    try {
      const data = await api.getUsers({ page, limit: PAGE_SIZE, search: query.trim(), role: selectedRole });
      if (requestId !== latestRequest.current) return;
      setUsers(data.users || []);
      setMeta(data.meta || { page, total: (data.users || []).length, totalPages: 1 });
    } catch (err) {
      if (requestId === latestRequest.current) setError(err.message || "تعذر تحميل المستخدمين.");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => load(1, search, role), 250);
    return () => clearTimeout(timer);
  }, [search, role]);

  async function remove(user) {
    if (!window.confirm(`هل تريد حذف حساب ${user.name}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setDeletingId(user.id);
    setError("");
    setNotice("");
    try {
      await api.deleteUser(user.id);
      setNotice("تم حذف المستخدم.");
      const nextPage = users.length === 1 && meta.page > 1 ? meta.page - 1 : meta.page;
      await load(nextPage);
    } catch (err) {
      setError(err.message || "تعذر حذف المستخدم.");
    } finally {
      setDeletingId("");
    }
  }

  const input = "border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500";
  const firstItem = meta.total === 0 ? 0 : (meta.page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(meta.page * PAGE_SIZE, meta.total);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-2 mb-1"><UsersIcon className="w-5 h-5 text-blue-600" /><h1 className="text-xl font-extrabold text-slate-800">المستخدمون</h1></div>
      <p className="text-sm text-slate-400 mb-5">ابحث في حسابات المنصة وصفِّها حسب الدور.</p>

      {(error || notice) && <p role={error ? "alert" : "status"} className={`text-sm rounded-lg p-3 mb-3 ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{error || notice}</p>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 mb-4 flex flex-wrap gap-3">
        <label className="relative flex-1 min-w-[220px]"><Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" /><input aria-label="ابحث بالاسم أو البريد الإلكتروني" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد الإلكتروني" className={`${input} w-full pr-9`} /></label>
        <select aria-label="تصفية حسب الدور" value={role} onChange={(event) => setRole(event.target.value)} className={input}><option value="">كل الأدوار</option><option value="student">طالب</option><option value="teacher">مدرس</option><option value="admin">أدمن</option><option value="supervisor">مشرف</option></select>
        <button type="button" onClick={() => load(1)} disabled={loading} className="px-3 py-2 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 disabled:opacity-50"><RefreshCw className={`inline w-4 h-4 ml-1 ${loading ? "animate-spin" : ""}`} />تحديث</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && <p className="p-4 text-sm text-slate-400">جارٍ تحميل المستخدمين...</p>}
        {!loading && !error && users.length === 0 && <p className="p-8 text-center text-sm text-slate-400">لا توجد حسابات تطابق البحث.</p>}
        {users.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-right px-4 py-3 font-bold">الاسم</th><th className="text-right px-4 py-3 font-bold">البريد</th><th className="text-right px-4 py-3 font-bold">الدور</th><th className="text-right px-4 py-3 font-bold">الصف</th><th className="text-right px-4 py-3 font-bold">النقاط</th><th className="text-right px-4 py-3 font-bold">تاريخ الانضمام</th><th className="px-4 py-3" /></tr></thead>
          <tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-50">
            <td className="px-4 py-3 font-bold text-slate-700">{user.name}</td><td className="px-4 py-3 text-slate-500">{user.email}</td>
            <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2 py-1 rounded-full ${roleBadge[user.role] || "bg-slate-100 text-slate-600"}`}>{roleLabel[user.role] || user.role}</span></td>
            <td className="px-4 py-3 text-slate-500">{user.grade || "—"}</td><td className="px-4 py-3 text-slate-700">{user.points ?? 0}</td>
            <td className="px-4 py-3 text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString("ar-EG") : "—"}</td>
            <td className="px-4 py-3 text-left">{user.role !== "admin" && <button type="button" disabled={deletingId === user.id} onClick={() => remove(user)} aria-label={`حذف حساب ${user.name}`} className="text-red-500 hover:bg-red-50 p-2 rounded-lg disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>}</td>
          </tr>)}</tbody>
        </table></div>}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 text-sm">
        <span className="text-slate-500">عرض {firstItem}–{lastItem} من {meta.total}</span>
        <div className="flex items-center gap-2"><button type="button" onClick={() => load(meta.page - 1)} disabled={loading || meta.page <= 1} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" />السابق</button><span className="text-slate-500">صفحة {meta.page} من {meta.totalPages}</span><button type="button" onClick={() => load(meta.page + 1)} disabled={loading || meta.page >= meta.totalPages} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-40">التالي<ChevronLeft className="w-4 h-4" /></button></div>
      </div>
    </div>
  );
}

export default Users;
