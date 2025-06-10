import React, { useState, useEffect, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import getCookie from '../../../utils/cookies';

const SalesStatisticOne = ({ locationId = "all" }) => {
  const chartContainerRef = useRef(null);
  const [filter, setFilter] = useState(() => localStorage.getItem('graphFilter') || 'yearly');
  const [graphData, setGraphData] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";
  
  const [chartOptions, setChartOptions] = useState({});
  const [chartSeries, setChartSeries] = useState([]);
  const [chartWidth, setChartWidth] = useState('100%');

  const [stats, setStats] = useState({ total: 0, percentageChange: 0, periodLabel: '' });
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.scrollLeft = 0;
      }
      try {
        // Get user data to extract location ID
        const cookieData = getCookie("UserData");
        let locationId = null;
        
        if (cookieData) {
          const parsedData = typeof cookieData === 'string' ? JSON.parse(cookieData) : cookieData;
          locationId = parsedData?.LOCATION_ID || parsedData?.locationId;
        }

        // Build query parameters
        let queryParams = `filter=${filter}`;
        if (locationId) {
          queryParams += `&locationId=${locationId}`;
        }

        const res = await fetch(`${API_BASE_URL}/kpi/unidades-vendidas-graph?${queryParams}`);
        const data = await res.json();
        setGraphData(data);
        setSelectedPoint(null); // Reset selection on filter change
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };
    fetchGraphData();
  }, [filter, locationId]);

  useEffect(() => {
    if (graphData.length > 0) {
      processChartData(graphData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, filter]);

  const processChartData = (graph) => {
    let seriesData, newOptions;
    const baseOptions = {
      chart: {
        id: 'sales-statistic-chart',
        toolbar: { show: false },
        locales: [{
          name: 'es',
          options: {
            months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            shortMonths: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            shortDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            toolbar: {
              download: 'Descargar SVG',
              selection: 'Selección',
              selectionZoom: 'Zoom de Selección',
              zoomIn: 'Acercar',
              zoomOut: 'Alejar',
              pan: 'Navegación',
              reset: 'Restablecer Zoom',
            }
          }
        }],
        defaultLocale: 'es',
      },
      markers: {
        size: 1,
        strokeWidth: 0,
        hover: {
          size: 7,
        },
        events: {
          click: (event, chartContext, config) => {
            const pointIndex = config.dataPointIndex;
            if (pointIndex < 0) return;

            if (selectedPoint && selectedPoint.index === pointIndex) {
              setSelectedPoint(null);
              return;
            }

            const currentValue = graph[pointIndex].UNIDADES_VENDIDAS;
            let percentageChange = 0;
            let periodLabel = 'Desde el inicio';

            if (pointIndex > 0) {
              const previousValue = graph[pointIndex - 1].UNIDADES_VENDIDAS;
              if (previousValue > 0) {
                percentageChange = ((currentValue - previousValue) / previousValue) * 100;
              } else if (currentValue > 0) {
                percentageChange = 100;
              }
              periodLabel = `vs ${filter === 'monthly' ? new Date(graph[pointIndex - 1].ANIO, graph[pointIndex - 1].MES - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : graph[pointIndex - 1].ANIO}`;
            }

            setSelectedPoint({
              value: currentValue,
              change: percentageChange,
              label: periodLabel,
              index: pointIndex,
            });
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' },
      colors: ['#5c61f2'],
      tooltip: {
        y: { formatter: val => `${val} unidades` },
      },
    };

    if (filter === 'yearly') {
      seriesData = [{
        name: 'Unidades Vendidas',
        data: graph.map(item => item.UNIDADES_VENDIDAS)
      }];
      newOptions = {
        ...baseOptions,
        xaxis: {
          type: 'category',
          categories: graph.map(item => item.ANIO.toString()),
          labels: { show: true }
        },
        tooltip: {
            ...baseOptions.tooltip,
            x: {
                formatter: undefined
            }
        }
      };
      setChartWidth('100%');
    } else { // monthly
      seriesData = [{
        name: 'Unidades Vendidas',
        data: graph.map(item => [new Date(item.ANIO, item.MES - 1).getTime(), item.UNIDADES_VENDIDAS])
      }];
      newOptions = {
        ...baseOptions,
        xaxis: {
          type: 'datetime',
          labels: { 
            show: false,
            datetimeUTC: false 
          }
        },
        tooltip: {
            ...baseOptions.tooltip,
            x: {
                formatter: function (value) {
                    return new Date(value).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long'
                    });
                }
            }
        }
      };
      setChartWidth(Math.max(500, graph.length * 50) + 'px');
    }
    
    const dataForCalc = graph.map(item => item.UNIDADES_VENDIDAS);
    let latestUnits = 0;
    let percentageChange = 0;
    if (dataForCalc.length > 0) {
        latestUnits = dataForCalc[dataForCalc.length - 1];
    }
    if (dataForCalc.length >= 2) {
        const currentPeriodValue = dataForCalc[dataForCalc.length - 1];
        const previousPeriodValue = dataForCalc[dataForCalc.length - 2];
        if (previousPeriodValue > 0) {
            percentageChange = ((currentPeriodValue - previousPeriodValue) / previousPeriodValue) * 100;
        } else if (currentPeriodValue > 0) {
            percentageChange = 100;
        }
    }
    
    setChartOptions(newOptions);
    setChartSeries(seriesData);
    if (!selectedPoint) {
    setStats({
        total: latestUnits,
      percentageChange,
        periodLabel: `desde el ${filter === 'monthly' ? 'mes' : 'año'} pasado`
      });
    }
  };

  const handleFilterChange = (event) => {
    localStorage.setItem('graphFilter', event.target.value);
    window.location.reload();
  };

  const scroll = (direction) => {
    if (chartContainerRef.current) {
      chartContainerRef.current.scrollBy({ left: direction * 200, behavior: 'smooth' });
    }
  };

  const displayValue = selectedPoint ? selectedPoint.value : stats.total;
  const displayChange = selectedPoint ? selectedPoint.change : stats.percentageChange;
  const displayLabel = selectedPoint ? selectedPoint.label : stats.periodLabel;
  const isPositive = displayChange >= 0;

  useEffect(() => {
    if (selectedPoint) {
      setStats({
        total: selectedPoint.value,
        percentageChange: selectedPoint.change,
        periodLabel: selectedPoint.label
      });
    } else if (graphData.length > 0) {
      processChartData(graphData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoint]);

  return (
    <div className='col-xxl-6 col-xl-6'>
      <div className='card h-100'>
        <div className='card-body'>
          <div className='d-flex flex-wrap align-items-center justify-content-between'>
            <h6 className='text-lg mb-0'>Unidades Vendidas</h6>
            <select
              className='form-select bg-base form-select-sm w-auto'
              value={filter}
              onChange={handleFilterChange}
            >
              <option value='yearly'>Anual</option>
              <option value='monthly'>Mensual</option>
            </select>
          </div>

          <div className='d-flex flex-wrap align-items-center gap-2 mt-8'>
            <h6 className='mb-0'>{`${displayValue.toLocaleString()} Unidades`}</h6>
            <span className={`text-sm fw-semibold rounded-pill ${isPositive ? 'bg-success-focus text-success-main border br-success' : 'bg-danger-focus text-danger-main border br-danger'} px-8 py-4 line-height-1 d-flex align-items-center gap-1`}>
              {isPositive ? '+' : ''}{displayChange.toFixed(1)}% 
              <Icon icon={isPositive ? 'bxs:up-arrow' : 'bxs:down-arrow'} className='text-xs' />
            </span>
            <span className='text-xs fw-medium'>↑ {displayLabel}</span>
          </div>

          <div className='position-relative'>
            <div ref={chartContainerRef} className={filter === 'monthly' ? 'overflow-x-auto' : ''} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                .overflow-x-auto::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {chartSeries.length > 0 && (
          <ReactApexChart
                  key={filter}
            options={chartOptions}
            series={chartSeries}
            type='area'
            height={264}
                  width={chartWidth}
                />
              )}
            </div>
            {filter === 'monthly' && (
              <>
                <div 
                  onClick={() => scroll(-1)} 
                  className='position-absolute top-0 start-0 h-100'
                  style={{ width: '15%', zIndex: 10, cursor: 'w-resize' }}
                ></div>
                <div 
                  onClick={() => scroll(1)} 
                  className='position-absolute top-0 end-0 h-100'
                  style={{ width: '15%', zIndex: 10, cursor: 'e-resize' }}
                ></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

SalesStatisticOne.propTypes = {
  locationId: PropTypes.string
};

export default SalesStatisticOne;
