// src/Graficos.js
import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Graficos = ({ transacciones }) => {
  // Filtrar solo gastos
  const gastos = transacciones.filter(t => t.tipo === 'gasto');
  
  // Agrupar gastos por categoría
  const gastosPorCategoria = gastos.reduce((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + t.monto;
    return acc;
  }, {});

  const categorias = Object.keys(gastosPorCategoria);
  const montos = Object.values(gastosPorCategoria);

  // Colores para cada categoría
  const colores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];

  // Datos para gráfico de pastel
  const dataPie = {
    labels: categorias.length > 0 ? categorias : ['Sin datos'],
    datasets: [
      {
        data: montos.length > 0 ? montos : [1],
        backgroundColor: colores.slice(0, categorias.length || 1),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Datos para gráfico de barras
  const dataBar = {
    labels: categorias.length > 0 ? categorias : ['Sin datos'],
    datasets: [
      {
        label: 'Gastos por Categoría',
        data: montos.length > 0 ? montos : [0],
        backgroundColor: colores.slice(0, categorias.length || 1),
        borderRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  const optionsBar = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  return (
    <div className="graficos-container">
      <h3>📊 Distribución de Gastos</h3>
      
      {gastos.length === 0 ? (
        <div className="sin-datos">
          <p>No hay gastos registrados para mostrar gráficos</p>
          <p style={{ fontSize: '0.9rem', color: '#a0aec0' }}>
            Agrega algunos gastos para ver la visualización
          </p>
        </div>
      ) : (
        <div className="graficos-grid">
          <div className="grafico-card">
            <h4>Porcentaje por Categoría</h4>
            <div className="grafico-wrapper">
              <Pie data={dataPie} options={options} />
            </div>
          </div>
          
          <div className="grafico-card">
            <h4>Montos por Categoría</h4>
            <div className="grafico-wrapper">
              <Bar data={dataBar} options={optionsBar} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Graficos;