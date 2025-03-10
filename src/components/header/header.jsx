import React from "react";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-300 p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-semibold">
          LOGO
        </div>
        <h1 className="text-lg font-semibold text-gray-800">All Too Accountable</h1>
      </div>
      <nav className="flex items-center gap-2">
        <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition">Inicio</button>
        <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition">Transacciones</button>
        <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition">Gastos mensuales</button>
        <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition ml-4">Cerrar sesión</button>
      </nav>
    </header>
  );
}
