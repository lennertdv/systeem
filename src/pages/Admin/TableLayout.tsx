import React, { useState, useRef } from 'react';
import { useTables } from '../../hooks/useTables';
import { useOrders } from '../../hooks/useOrders';
import { Table } from '../../types';
import { Plus, Trash2, Move, Save, X, Clock, Utensils, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function TableLayout() {
  const { tables, addTable, updateTable, deleteTable, loading } = useTables();
  const { orders: allOrders } = useOrders();
  const [isAdding, setIsAdding] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', seats: 2 });
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTable({
      ...newTable,
      x: 50,
      y: 50,
      status: 'available'
    });
    setIsAdding(false);
    setNewTable({ number: '', seats: 2 });
  };

  const handleDragStart = (id: string) => {
    setDraggingTable(id);
  };

  const handleDragOver = (e: React.MouseEvent) => {
    if (!draggingTable || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp values
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    updateTable(draggingTable, { x: clampedX, y: clampedY });
  };

  const handleDragEnd = () => {
    setDraggingTable(null);
  };

  const handleTableClick = (id: string) => {
    if (draggingTable) return;
    setSelectedTableId(id);
  };

  const handleUpdateStatus = async (status: Table['status'], reservationTime?: string) => {
    if (!selectedTableId) return;
    await updateTable(selectedTableId, { status, reservationTime: reservationTime || '' });
    setSelectedTableId(null);
  };

  if (loading) return <div>Loading tables...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Table Layout</h2>
          <p className="text-neutral-500">Drag tables to position them according to your restaurant layout.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-neutral-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAddTable} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Table Number</label>
              <input
                type="text"
                required
                value={newTable.number}
                onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Seats</label>
              <input
                type="number"
                required
                min="1"
                value={newTable.seats}
                onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-neutral-900 text-white py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                Save Table
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      <div 
        ref={containerRef}
        className="relative w-full aspect-[16/9] bg-neutral-100 rounded-3xl border-2 border-dashed border-neutral-300 overflow-hidden"
        onMouseMove={handleDragOver}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none opacity-5">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border border-neutral-900" />
          ))}
        </div>

        {tables.map((table) => (
          <div
            key={table.id}
            style={{
              left: `${table.x}%`,
              top: `${table.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            className={`absolute w-20 h-20 rounded-2xl flex flex-col items-center justify-center cursor-move transition-shadow ${
              draggingTable === table.id ? 'z-50 shadow-2xl scale-110' : 'shadow-md'
            } ${
              table.status === 'occupied' ? 'bg-red-100 border-2 border-red-500 text-red-700' :
              table.status === 'reserved' ? 'bg-amber-100 border-2 border-amber-500 text-amber-700' :
              'bg-white border-2 border-neutral-200 text-neutral-900'
            }`}
            onMouseDown={() => handleDragStart(table.id)}
            onClick={() => handleTableClick(table.id)}
          >
            <span className="text-xs font-bold uppercase opacity-50">Table</span>
            <span className="text-xl font-black">{table.number}</span>
            <span className="text-[10px] font-medium">{table.seats} seats</span>
            {table.status === 'reserved' && table.reservationTime && (
              <span className="text-[10px] font-bold mt-1 bg-amber-200 px-1 rounded">{table.reservationTime}</span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this table?')) deleteTable(table.id);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {tables.length === 0 && !isAdding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
            <Move className="w-12 h-12 mb-2 opacity-20" />
            <p>No tables added yet. Click "Add Table" to start.</p>
          </div>
        )}
      </div>

      <div className="bg-neutral-900 text-white p-6 rounded-3xl flex items-center justify-between">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border border-neutral-400" />
            <span className="text-sm font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm font-medium">Reserved</span>
          </div>
        </div>
        <p className="text-xs text-neutral-400 italic">Click a table to change status. Drag to move.</p>
      </div>

      {/* Status Update Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900">Table {selectedTable.number}</h3>
              <button onClick={() => setSelectedTableId(null)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus('available')}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all text-xs uppercase tracking-widest ${
                    selectedTable.status === 'available' 
                      ? 'border-neutral-900 bg-neutral-900 text-white' 
                      : 'border-neutral-100 hover:border-neutral-200 text-neutral-600'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => handleUpdateStatus('occupied')}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all text-xs uppercase tracking-widest ${
                    selectedTable.status === 'occupied' 
                      ? 'border-red-500 bg-red-500 text-white' 
                      : 'border-neutral-100 hover:border-red-100 text-red-600'
                  }`}
                >
                  Occupied
                </button>
                <button
                  onClick={() => {
                    const time = prompt('Reservation time (e.g. 19:00)?', selectedTable.reservationTime || '');
                    if (time !== null) handleUpdateStatus('reserved', time);
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all text-xs uppercase tracking-widest ${
                    selectedTable.status === 'reserved' 
                      ? 'border-amber-500 bg-amber-500 text-white' 
                      : 'border-neutral-100 hover:border-amber-100 text-amber-600'
                  }`}
                >
                  Reserved
                </button>
              </div>

              {/* Ongoing Orders */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                  <Utensils className="w-3 h-3" /> Ongoing Orders
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {allOrders
                    .filter(o => o.tableNumber === selectedTable.number && ['pending', 'in-progress'].includes(o.status))
                    .map(order => (
                      <div key={order.id} className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase text-neutral-400">{format(new Date(order.timestamp), 'HH:mm')}</span>
                          <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{order.status}</span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-xs font-bold text-neutral-700 flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-neutral-400">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  {allOrders.filter(o => o.tableNumber === selectedTable.number && ['pending', 'in-progress'].includes(o.status)).length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No ongoing orders.</p>
                  )}
                </div>
              </div>

              {/* Recent History (Last Hour) */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                  <HistoryIcon className="w-3 h-3" /> Last Hour
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {allOrders
                    .filter(o => {
                      const isRecent = (Date.now() - o.timestamp) < 3600000;
                      return o.tableNumber === selectedTable.number && o.status === 'completed' && isRecent;
                    })
                    .map(order => (
                      <div key={order.id} className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 opacity-70">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase text-neutral-400">{format(new Date(order.timestamp), 'HH:mm')}</span>
                          <span className="text-[10px] font-black text-neutral-900">${(order.totalPrice || 0).toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] font-medium text-neutral-500 truncate">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                    ))}
                  {allOrders.filter(o => {
                    const isRecent = (Date.now() - o.timestamp) < 3600000;
                    return o.tableNumber === selectedTable.number && o.status === 'completed' && isRecent;
                  }).length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No recent history.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
