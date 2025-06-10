import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MasterLayout from "../../components/masterLayout";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * ML Model Management Component
 * 
 * Provides an interface for administrators to manage and monitor 
 * the stock prediction model, including manual updates and log viewing.
 */
const ModelManagement = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [modelStatus, setModelStatus] = useState({ status: 'inactive', lastUpdated: null });
  const [nextUpdate, setNextUpdate] = useState(null);
  const [logs, setLogs] = useState(null);
  // Performance metrics separated by dataset
  const [trainingData, setTrainingData] = useState([]);
  const [testData, setTestData] = useState([]);
  const [activeTab, setActiveTab] = useState('status'); // New state for active tab
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  
  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    let timer;
    if (message && message.type === 'error') {
      timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [message]);
  
  // Reverse log lines to show most recent first
  const reversedLogContent = logs?.logContent ? logs.logContent.split('\n').reverse().join('\n') : null;
  const navigate = useNavigate();
  
  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error) => {
    // Check if the error is related to authentication
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Redirect to login page
      console.error("Sesión expirada o no autorizada:", error.response.data);
      navigate('/');
      return true;
    }
    return false;
  }, [navigate]);

  /**
   * Fetch logs from the last model update
   */  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);      
      const response = await axios.get(`${API_BASE_URL}/ml/logs`, {
        withCredentials: true // Include credentials (cookies) with the request
      });
      setLogs(response.data);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error("Error fetching logs:", error);
        // Don't show error message for 404 (no logs found) as this is an expected state
        if (error.response && error.response.status === 404) {
          setLogs({ logFile: null, logContent: null }); // Set empty logs state
        } else {
          // Only show error message for unexpected errors
          setMessage({
            type: 'error',
            text: 'Error al obtener logs: ' + 
                  (error.response?.data?.message || error.message)
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  /**
   * Fetch the current status of the model
   */
  const fetchModelStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/ml/status`, { withCredentials: true });
      setModelStatus(response.data);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error("Error fetching model status:", error);
        // Don't show error message as this is non-critical
        // Fall back to default state (inactive)
        setModelStatus({ status: 'inactive', lastUpdated: null });
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  /**
   * Fetch information about the next scheduled update
   */  const fetchScheduleInfo = useCallback(async () => {
    try {
      setLoading(true);      
      const response = await axios.get(`${API_BASE_URL}/ml/schedule`, {
        withCredentials: true // Include credentials (cookies) with the request
      });
      setNextUpdate(response.data.schedule);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error("Error fetching schedule info:", error);
        // Don't show error message for 404 (no schedule found) as this is an expected state
        if (error.response && error.response.status === 404) {
          setNextUpdate(null); // Set empty schedule state
        } else {
          // Only show error message for unexpected errors
          setMessage({
            type: 'error',
            text: 'Error al obtener información de programación: ' + 
                  (error.response?.data?.message || error.message)
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);  // Ya no se necesita toggleModelStatus porque el estado del modelo es solo informativo

  /**
   * Fetch model performance metrics
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ml/metrics`, { withCredentials: true });
      console.log('Metrics response:', response.data);
      setTrainingData(response.data.training || []);
      setTestData(response.data.test || []);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Error fetching metrics:', error);
      }
    }
  }, [handleAuthError]);

  /**
   * Trigger a manual model update
   */
  const runManualUpdate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/ml/update`, {}, { withCredentials: true });
      setMessage({ type: 'success', text: response.data.message });
      await fetchLogs();
      await fetchModelStatus();
      await fetchMetrics();
    } catch (error) {
      if (!handleAuthError(error)) {
        setMessage({ type: 'error', text: 'Error al iniciar actualización: ' + (error.response?.data?.message || error.message) });
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, fetchLogs, fetchModelStatus, fetchMetrics]);
  
  // Check authenticated session and fetch schedule information on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Clear any previous error messages
        setMessage(null);
        
        // Verify user session before proceeding
        const sessionResponse = await axios.get(`${API_BASE_URL}/users/getSession`, {
          withCredentials: true
          // Removidos los headers que causan problemas con CORS
        });
        
        // Check if user has admin role
        const userRole = sessionResponse.data?.usuario?.rol;
        if (!userRole || userRole !== 'admin') {
          console.error("Access denied: User is not an admin");
          navigate('/');
          return;
        }
          // If session is valid and user is admin, fetch all model data
        await Promise.all([
          fetchScheduleInfo(),
          fetchLogs(),
          fetchModelStatus(),
          fetchMetrics()
        ]);
      } catch (error) {
        console.error("Session validation error:", error);
        navigate('/');
      }
    };
    
    initializeData();
  }, [navigate, fetchScheduleInfo, fetchLogs, fetchModelStatus, fetchMetrics]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Prepare chart data and options
  const trainingChartData = {
    labels: trainingData.map(item => formatDate(item.date)),
    datasets: [
      { label: 'Training MAPE (%)', data: trainingData.map(item => item.mae || item.mape), fill: false, borderColor: 'rgb(54,162,235)' }
    ]
  };
  const testChartData = {
    labels: testData.map(item => formatDate(item.date)),
    datasets: [
      { label: 'Test MAPE (%)', data: testData.map(item => item.mae || item.mape), fill: false, borderColor: 'rgb(255,99,132)' }
    ]
  };
  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, max: 100 } }
  };
  const smallChartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { display: false } } };

  return (
    <MasterLayout role="admin">
      <div className="container py-4">
        <h2 className="mb-4 text-center">Modelo IA</h2>
        <ul className="nav nav-tabs mb-4 justify-content-center">
          {['status','schedule','logs','info'].map(tab => (
            <li className="nav-item" key={tab}>
              <button
                className={`nav-link ${activeTab===tab?'active':''}`}
                onClick={()=>setActiveTab(tab)}
              >
                {tab==='status'? 'Estado' :
                 tab==='schedule'? 'Programación' :
                 tab==='logs'? 'Logs' : 'Acerca'}
              </button>
            </li>
          ))}
        </ul>
        <div className="tab-content">
          {activeTab==='status' && (
            <div className="row mb-4">
              {trainingData.length===0 && testData.length===0 && (
                <div className="col-12 text-center text-muted">Sin métricas disponibles</div>
              )}
              {trainingData.length>0 && (
                <div className="col-md-6">
                  <div className="card p-4 mb-4">
                    <h6 className="text-center mt-4 mb-4">Entrenamiento</h6>
                    <div className="mt-3">
                      <Line data={trainingChartData} options={chartOptions} height={150} />
                    </div>
                  </div>
                </div>
              )}
              {testData.length>0 && (
                <div className="col-md-6">
                  <div className="card p-4 mb-4">
                    <h6 className="text-center mt-4 mb-4">Prueba</h6>
                    <div className="mt-3">
                      <Line data={testChartData} options={chartOptions} height={150} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}          {activeTab==='schedule' && (
            <div>
              {/* Status section */}
              <div className="card p-4 mb-4 text-center">
                <span className={`badge bg-success fs-5`}>Activo</span>
                {modelStatus.lastUpdated && <p className="mt-2 small text-muted">Última: {formatDate(modelStatus.lastUpdated)}</p>}
              </div>
              {/* Schedule section */}
              <div className="card p-4 mb-4">
                {nextUpdate ? (
                  <div>
                    <p><strong>Día:</strong> {nextUpdate.day}</p>
                    <p><strong>Hora:</strong> {nextUpdate.hour}</p>
                    <p><strong>Próxima:</strong> {formatDate(nextUpdate.nextRun)}</p>
                    <button className="btn btn-primary mt-3" onClick={runManualUpdate} disabled={loading}>{loading? 'Iniciando...' : 'Actualizar Ahora'}</button>
                  </div>
                ) : (
                  <p className="text-center text-muted">No hay programación disponible</p>
                )}
              </div>
            </div>
          )}
          {activeTab==='logs' && (
            <div className="card p-4 mb-4" style={{maxHeight: '300px', overflowY: 'auto'}}>
              {logs?.logContent ? (
                <pre className="mb-0" style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                  {reversedLogContent}
                </pre>
              ) : (
                <p className="text-center text-muted">Sin logs</p>
              )}
            </div>
          )}
          {activeTab==='info' && (
            <div className="card mb-4">
              <div className="card-header bg-white border-bottom">
                <h5 className="card-title mb-0">Acerca del Modelo de Predicción</h5>
              </div>
              <div className="card-body">
                <div className="card-text">
                  <h6 className="mb-3">Modelo HybridGradientBoostingTree de Predicción de Stock Mínimo</h6>
                  <div className="mb-4">
                    <h6 className="text-primary mb-2"><i className="bi bi-diagram-3"></i> Arquitectura del Modelo</h6>
                    <p>Implementación avanzada basada en HybridGradientBoostingTree con preprocesamiento mediante biblioteca hana-ml. El modelo combina técnicas de árboles de decisión y boosting para optimizar la predicción de stock mínimo.</p>
                  </div>
                  <div className="mb-4">
                    <h6 className="text-primary mb-2"><i className="bi bi-bar-chart-line"></i> Variables Principales</h6>
                    <p><strong>Variable objetivo:</strong> <code>demanda_mensual</code></p>
                    <p><strong>Predictores clave:</strong></p>
                    <ul className="mb-3">
                      <li><code>historial_ventas</code> (últimos 6 meses)</li>
                      <li><code>temporada</code> (factor estacional)</li>
                      <li><code>dias_reposicion</code> (lead time del proveedor)</li>
                      <li><code>precio</code> (elasticidad de demanda)</li>
                      <li><code>tendencia_categoria</code> (análisis de mercado)</li>
                    </ul>
                  </div>
                  <div className="mb-4">
                    <h6 className="text-primary mb-2"><i className="bi bi-gear"></i> Pipeline de Procesamiento</h6>
                    <ol className="mb-3">
                      <li>Extracción de datos históricos de ventas</li>
                      <li>Preprocesamiento y normalización con hana-ml</li>
                      <li>Feature engineering y selección de variables</li>
                      <li>Entrenamiento del modelo HybridGradientBoostingTree</li>
                      <li>Validación con datos históricos (RMSE, MAE)</li>
                      <li>Predicción y cálculo de stock mínimo óptimo</li>
                      <li>Actualización automática en base de datos</li>
                    </ol>
                  </div>
                  <div className="mb-4">
                    <h6 className="text-primary mb-2"><i className="bi bi-calendar-check"></i> Parámetros Operativos</h6>
                    <ul className="mb-0">
                      <li>Entrenamiento mensual con datos actualizados</li>
                      <li>Predicción de demanda para los próximos 2 meses</li>
                      <li>Factor de seguridad dinámico (15%-25%) según categoría</li>
                      <li>Margen de error promedio: 8% (MAPE)</li>
                      <li>Monitoreo continuo con reentrenamiento mensual automático</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MasterLayout>
  );
};

export default ModelManagement;
