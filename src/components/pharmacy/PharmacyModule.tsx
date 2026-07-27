import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Banknote,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PharmacyItem } from '../../types';
import PharmacyItemForm from './PharmacyItemForm';
import PharmacySaleForm from './PharmacySaleForm';

const CATEGORY_COLORS: Record<PharmacyItem['category'], string> = {
  Medicamento: 'bg-blue-100 text-blue-700',
  Accesorio: 'bg-amber-100 text-amber-700',
  Alimento: 'bg-green-100 text-green-700',
  Otro: 'bg-slate-100 text-slate-600',
};

const LOW_STOCK_THRESHOLD = 5;

type TabType = 'inventory' | 'sales';

export default function PharmacyModule() {
  const { pharmacyItems, pharmacySales, addPharmacyItem, updatePharmacyItem, deletePharmacyItem, addPharmacySale, deletePharmacySale } = useApp();

  const [tab, setTab] = useState<TabType>('inventory');
  const [search, setSearch] = useState('');
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [editing, setEditing] = useState<PharmacyItem | null>(null);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return pharmacyItems.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [pharmacyItems, search]);

  const filteredSales = useMemo(() => {
    const q = search.toLowerCase();
    return [...pharmacySales]
      .filter(s => s.itemName.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [pharmacySales, search]);

  const stats = useMemo(() => {
    const totalItems = pharmacyItems.length;
    const lowStock = pharmacyItems.filter(i => i.stock <= LOW_STOCK_THRESHOLD).length;
    const totalSalesValue = pharmacySales.reduce((acc, s) => acc + s.total, 0);
    const cash = pharmacySales.filter(s => s.paymentMethod === 'Efectivo').reduce((a, s) => a + s.total, 0);
    const yappy = pharmacySales.filter(s => s.paymentMethod === 'Yappy').reduce((a, s) => a + s.total, 0);
    const transfer = pharmacySales.filter(s => s.paymentMethod === 'Transferencia').reduce((a, s) => a + s.total, 0);
    return { totalItems, lowStock, totalSalesValue, cash, yappy, transfer };
  }, [pharmacyItems, pharmacySales]);

  function handleSaveItem(item: PharmacyItem) {
    if (editing) {
      updatePharmacyItem(item);
    } else {
      addPharmacyItem(item);
    }
    setItemFormOpen(false);
    setEditing(null);
  }

  function handleDeleteItem(id: string) {
    if (confirm('¿Eliminar este producto del inventario?')) deletePharmacyItem(id);
  }

  function handleDeleteSale(id: string) {
    if (confirm('¿Eliminar esta venta? El stock NO se revertirá.')) deletePharmacySale(id);
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Productos en Inventario" value={String(stats.totalItems)} icon={<Package size={18} />} color="bg-teal-500" />
        <StatCard
          label="Stock Bajo"
          value={String(stats.lowStock)}
          icon={<AlertTriangle size={18} />}
          color={stats.lowStock > 0 ? 'bg-amber-500' : 'bg-slate-400'}
          sub="≤ 5 unidades"
        />
        <StatCard label="Ventas Totales" value={`$${stats.totalSalesValue.toFixed(2)}`} icon={<TrendingUp size={18} />} color="bg-green-500" sub={`${pharmacySales.length} transacciones`} />
        <StatCard label="Efectivo / Yappy / Trans." value={`$${stats.cash.toFixed(0)} / $${stats.yappy.toFixed(0)} / $${stats.transfer.toFixed(0)}`} icon={<Banknote size={18} />} color="bg-blue-500" />
      </div>

      {/* Tabs + search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab('inventory')}
            className={`flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'inventory' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => setTab('sales')}
            className={`flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'sales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ventas
          </button>
        </div>

        <div className="flex gap-2 flex-1 max-w-sm sm:ml-auto">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'inventory' ? 'Buscar producto...' : 'Buscar venta...'}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {tab === 'inventory' ? (
          <button
            onClick={() => { setEditing(null); setItemFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        ) : (
          <button
            onClick={() => setSaleFormOpen(true)}
            disabled={pharmacyItems.filter(i => i.stock > 0).length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} /> Registrar Venta
          </button>
        )}
      </div>

      {/* Inventory tab */}
      {tab === 'inventory' && (
        <>
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <Package size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {search ? 'Sin resultados.' : 'No hay productos registrados. Agrega el primero.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const lowStock = item.stock <= LOW_STOCK_THRESHOLD;
                const outOfStock = item.stock === 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    {/* Product image */}
                    <div className="relative h-36 bg-slate-50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={36} className="text-slate-200" />
                        </div>
                      )}
                      <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category]}`}>
                        {item.category}
                      </span>
                      {outOfStock && (
                        <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Agotado
                        </span>
                      )}
                      {/* Hover actions */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditing(item); setItemFormOpen(true); }}
                          className="p-1.5 rounded-md bg-white/90 text-slate-500 hover:text-teal-600 shadow-sm"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-md bg-white/90 text-slate-500 hover:text-red-600 shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Product info */}
                    <div className="p-3 space-y-1.5">
                      <p className="text-slate-800 font-medium text-sm leading-tight truncate">{item.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-teal-700 font-bold text-base">${item.salePrice.toFixed(2)}</span>
                        <span className={`text-sm font-semibold ${outOfStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-slate-600'}`}>
                          Stock: {item.stock}
                        </span>
                      </div>
                      {lowStock && !outOfStock && (
                        <p className="text-xs text-amber-500 flex items-center gap-1">
                          <AlertTriangle size={11} /> Stock bajo
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Sales tab */}
      {tab === 'sales' && (
        <>
          {filteredSales.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <ShoppingCart size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {search ? 'Sin resultados.' : 'No hay ventas registradas aún.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Producto</th>
                    <th className="text-center text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Cant.</th>
                    <th className="text-right text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Total</th>
                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Pago</th>
                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-slate-800 font-medium">{sale.itemName}</p>
                        {sale.notes && <p className="text-slate-400 text-xs">{sale.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 hidden sm:table-cell">{sale.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">${sale.total.toFixed(2)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PaymentBadge method={sale.paymentMethod} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {new Date(sale.date + 'T12:00:00').toLocaleDateString('es-PA')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {itemFormOpen && (
        <PharmacyItemForm
          initial={editing ?? undefined}
          onSave={handleSaveItem}
          onClose={() => { setItemFormOpen(false); setEditing(null); }}
        />
      )}

      {saleFormOpen && (
        <PharmacySaleForm
          items={pharmacyItems.filter(i => i.stock > 0)}
          onSave={sale => { addPharmacySale(sale); setSaleFormOpen(false); }}
          onClose={() => setSaleFormOpen(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
      </div>
      <p className="text-slate-800 font-bold text-xl leading-none">{value}</p>
      {sub && <p className="text-slate-400 text-xs">{sub}</p>}
    </div>
  );
}

function PaymentBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    Efectivo: 'bg-green-100 text-green-700',
    Yappy: 'bg-blue-100 text-blue-700',
    Transferencia: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[method] ?? 'bg-slate-100 text-slate-600'}`}>
      {method}
    </span>
  );
}
