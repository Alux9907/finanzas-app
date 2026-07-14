import React, { useState, useEffect } from 'react';
import './App.css';
import Graficos from './Graficos';

// ============ BASE DE DATOS (IndexedDB) ============
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open('FinanzasDB', 1);
  
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
  
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('transacciones')) {
      db.createObjectStore('transacciones', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
    }
  };
});

const agregarTransaccion = async (transaccion) => {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['transacciones'], 'readwrite');
    const store = transaction.objectStore('transacciones');
    const request = store.add({
      ...transaccion,
      fecha: transaccion.fecha || new Date().toISOString().split('T')[0]
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const obtenerTransacciones = async () => {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['transacciones'], 'readonly');
    const store = transaction.objectStore('transacciones');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const eliminarTransaccion = async (id) => {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['transacciones'], 'readwrite');
    const store = transaction.objectStore('transacciones');
    const request = store.delete(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const obtenerBalance = async () => {
  const transacciones = await obtenerTransacciones();
  const totalIngresos = transacciones
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + t.monto, 0);
  const totalGastos = transacciones
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + t.monto, 0);
  return {
    total: totalIngresos - totalGastos,
    ingresos: totalIngresos,
    gastos: totalGastos
  };
};

// ============ COMPONENTE PRINCIPAL ============
function App() {
  const [transacciones, setTransacciones] = useState([]);
  const [balance, setBalance] = useState({ total: 0, ingresos: 0, gastos: 0 });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    tipo: 'gasto',
    categoria: 'comida',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const trans = await obtenerTransacciones();
      setTransacciones(trans);
      const bal = await obtenerBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaTransaccion.monto || parseFloat(nuevaTransaccion.monto) <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }
    
    try {
      await agregarTransaccion({
        ...nuevaTransaccion,
        monto: parseFloat(nuevaTransaccion.monto)
      });
      
      setNuevaTransaccion({
        tipo: 'gasto',
        categoria: 'comida',
        monto: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      setMostrarFormulario(false);
      await cargarDatos();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Eliminar esta transacción?')) {
      try {
        await eliminarTransaccion(id);
        await cargarDatos();
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  const categorias = {
    ingreso: ['salario', 'inversion', 'regalo', 'otros'],
    gasto: ['comida', 'transporte', 'vivienda', 'salud', 'educacion', 'entretenimiento', 'otros']
  };

  return (
    <div className="App">
      <header className="header">
        <h1>💰 Mis Finanzas</h1>
      </header>

      <div className="dashboard">
        <div className="balance-cards">
          <div className="card total">
            <span className="label">Balance Total</span>
            <span className={`value ${balance.total >= 0 ? 'positive' : 'negative'}`}>
              ${balance.total.toFixed(2)}
            </span>
          </div>
          <div className="card ingresos">
            <span className="label">Ingresos</span>
            <span className="value positive">${balance.ingresos.toFixed(2)}</span>
          </div>
          <div className="card gastos">
            <span className="label">Gastos</span>
            <span className="value negative">${balance.gastos.toFixed(2)}</span>
          </div>
        </div>

        <button 
          className="btn-agregar"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? '✕ Cerrar' : '+ Agregar Transacción'}
        </button>

        {mostrarFormulario && (
          <form className="form-transaccion" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo</label>
              <select 
                value={nuevaTransaccion.tipo}
                onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, tipo: e.target.value})}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select 
                value={nuevaTransaccion.categoria}
                onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, categoria: e.target.value})}
              >
                {(nuevaTransaccion.tipo === 'ingreso' ? categorias.ingreso : categorias.gasto).map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Monto ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={nuevaTransaccion.monto}
                onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, monto: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input 
                type="text"
                value={nuevaTransaccion.descripcion}
                onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, descripcion: e.target.value})}
                placeholder="Ej: Compras del supermercado"
              />
            </div>

            <div className="form-group">
              <label>Fecha</label>
              <input 
                type="date"
                value={nuevaTransaccion.fecha}
                onChange={(e) => setNuevaTransaccion({...nuevaTransaccion, fecha: e.target.value})}
              />
            </div>

            <button type="submit" className="btn-guardar">Guardar</button>
          </form>
        )}

         <Graficos transacciones={transacciones} />

        <div className="lista-transacciones">
          <h3>Historial</h3>
          {transacciones.length === 0 ? (
            <p className="empty">No hay transacciones aún</p>
          ) : (
            <ul>
              {transacciones.sort((a, b) => b.id - a.id).map(t => (
                <li key={t.id} className={`transaccion ${t.tipo}`}>
                  <div className="info">
                    <span className="categoria">{t.categoria}</span>
                    <span className="descripcion">{t.descripcion || 'Sin descripción'}</span>
                    <span className="fecha">{t.fecha}</span>
                  </div>
                  <div className="monto">
                    <span className={t.tipo === 'ingreso' ? 'positive' : 'negative'}>
                      {t.tipo === 'ingreso' ? '+' : '-'}${t.monto.toFixed(2)}
                    </span>
                    <button 
                      className="btn-eliminar"
                      onClick={() => handleEliminar(t.id)}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;