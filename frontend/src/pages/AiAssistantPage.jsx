// ✅ Final visual alignment fix for input+button, right edge flush & vertically centered with min-width limit
import React from 'react';
import { useLocation } from 'react-router-dom';
import MasterLayout from '../components/masterLayout';
import { Icon } from '@iconify/react';
import { notify, NotificationType } from '../components/NotificationService';
import { useState, useRef, useEffect } from 'react';
import getCookie from '../utils/cookies';

const SUGGESTED_QUESTIONS = {
  pedidos: [
    "¿Cuál fue el último pedido?",
    "Muestra los pedidos pendientes",
    "¿Cuántos pedidos hay en total?",
    "¿Cuál es el pedido con el monto más alto?"
  ],
  inventario: [
    "¿Cuántos productos tenemos en inventario?",
    "¿Qué productos están bajos de stock?",
    "¿Cuál es el producto con mayor inventario?"
  ],
  proveedores: [
    "¿Cuáles son nuestros proveedores?",
    "¿Cuál es el proveedor con más pedidos?"
  ],
  articulos: [
    "¿Cuáles son los artículos más caros?",
    "¿Cuál es el precio promedio de los artículos?"
  ]
};

const AiAssistantPage = () => {
  const location = useLocation();
  const role = location.state?.role || localStorage.getItem('userRole') || 'admin';
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'assistant', text: 'Hola, soy el asistente de IA de Sapitos. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropdownSuggestions, setShowDropdownSuggestions] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Obtener datos del usuario de la cookie
    const cookieData = getCookie("UserData");
    if (cookieData) {
      try {
        let parsedData;
        if (typeof cookieData === "string") {
          parsedData = JSON.parse(cookieData);
        } else {
          parsedData = cookieData;
        }
        setUserData(parsedData);
      } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdownSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestedQuestion = (q) => {
    setQuestion(q);
    setShowSuggestions(false);
    setShowDropdownSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    addMessage({ type: 'user', text: question });
    setQuestion('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
      const data = await response.json();

      if (data && data.success) {
        addMessage({ type: 'assistant', text: data.answer });
        notify("Respuesta recibida del asistente", NotificationType.SUCCESS);
      } else {
        addMessage({ type: 'assistant', text: `Lo siento, no pude procesar tu pregunta. Error: ${data.message || 'Desconocido'}` });
        notify("Error al procesar la consulta: " + (data.message || 'Desconocido'), NotificationType.ERROR);
      }
    } catch (error) {
      addMessage({ type: 'assistant', text: `Error: ${error.message}` });
      notify("Error de comunicación con el asistente", NotificationType.ERROR);
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowSuggestions(true), 1000);
    }
  };

  const addMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  // Usar el rol del usuario de la cookie o localStorage
  const userRole = userData?.ROL || localStorage.getItem('userRole') || 'admin';

  return (
    <MasterLayout role={userRole}>
      <div className="chat-wrapper d-flex justify-content-center align-items-center w-100 h-100 p-3">
        <div className="chat-main card w-100" style={{ maxWidth: '1110px', height: '85vh' }}>
          <div className='chat-sidebar-single active d-flex align-items-center gap-3 p-3 border-bottom'>
            <div className='rounded-circle bg-primary d-flex align-items-center justify-content-center assistant-avatar'>
              <Icon icon="simple-icons:openai" width="24" height="24" className="text-white" />
            </div>
            <div>
              <h6 className='text-md mb-0'>Asistente IA</h6>
              <p className='mb-0'>Disponible</p>
            </div>
            <div className='btn-group ms-auto' ref={dropdownRef}>
              <button
                type='button'
                className='text-primary-light text-xl border-0 bg-transparent'
                onClick={(e) => {
                  e.preventDefault();
                  setShowDropdownSuggestions(!showDropdownSuggestions);
                }}
              >
                <Icon icon='tabler:dots-vertical' />
              </button>
              <ul className={`dropdown-menu dropdown-menu-end border ${showDropdownSuggestions ? 'show' : ''}`}>                
                {Object.entries(SUGGESTED_QUESTIONS).map(([category, questions]) => (
                  <li key={category} className="px-3 py-2">
                    <strong className='small'>{category.charAt(0).toUpperCase() + category.slice(1)}:</strong>
                    <div className="mt-1">
                      {questions.map((q, i) => (
                        <span 
                          key={`${category}-${i}`} 
                          className="badge bg-light text-dark border border-light-subtle rounded-pill me-1 mb-1 px-2 py-1 suggestion-badge"
                          onClick={() => handleSuggestedQuestion(q)}
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='chat-message-list flex-grow-1 overflow-auto p-3' ref={chatContainerRef}>
            {messages.map((message, index) => (
              <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-end' : ''}`}>
                <div className={`d-inline-flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`} style={{ maxWidth: '80%' }}>
                  {message.type === 'assistant' && (
                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2 assistant-avatar">
                      <Icon icon="simple-icons:openai" width="16" height="16" className="text-white" />
                    </div>
                  )}
                  <div className={`p-3 rounded shadow-sm ${message.type === 'user' ? 'bg-primary text-white rounded-chat-user' : 'bg-white text-dark rounded-chat-assistant'}`}>
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-4">
                <div className="d-inline-flex flex-row" style={{ maxWidth: '80%' }}>
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2 assistant-avatar">
                    <Icon icon="simple-icons:openai" width="16" height="16" className="text-white" />
                  </div>
                  <div className="p-3 rounded shadow-sm bg-white">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-top">
            <form onSubmit={handleSubmit} className="d-flex justify-content-center w-100">
              <div className="w-100" style={{ maxWidth: '1110px', minWidth: '300px' }}>
                <div className="d-flex align-items-center bg-white shadow-sm rounded-pill px-4 py-2">
                  <input
                    type="text"
                    className="form-control border-0 shadow-none flex-grow-1"
                    placeholder="Escribe tu pregunta aquí..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isLoading}
                    ref={inputRef}
                    style={{ height: '36px' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center ms-2"
                    disabled={isLoading || !question.trim()}
                    style={{ width: '36px', height: '36px', flexShrink: 0 }}
                  >
                    <Icon icon="mdi:send" width="18" height="18" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <style>
          {`
            .typing-dot {
              width: 8px;
              height: 8px;
              background-color: #aaa;
              border-radius: 50%;
              display: inline-block;
              animation: bounce 1.4s infinite ease-in-out both;
            }
            .typing-dot:nth-child(1) { animation-delay: 0s; }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1.0); }
            }
            .suggestion-badge {
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .suggestion-badge:hover {
              background-color: #e9ecef !important;
              border-color: #dee2e6 !important;
            }
            .assistant-avatar {
              width: 36px;
              height: 36px;
              min-width: 36px;
            }
            .rounded-chat-assistant {
              border-top-left-radius: 0 !important;
            }
            .rounded-chat-user {
              border-top-right-radius: 0 !important;
            }
            .btn-group {
              position: relative;
            }
            .dropdown-menu {
              position: absolute;
              right: 0;
              left: auto;
              max-height: 80vh;
              overflow-y: auto;
              transform: translateY(0);
            }
            .dropdown-menu.show {
              transform: none !important;
              top: 100% !important;
              margin-top: 0.5rem;
            }
            @media (max-width: 768px) {
              .dropdown-menu {
                position: fixed;
                top: auto !important;
                bottom: 100%;
                right: 1rem;
                left: 1rem;
                transform: none;
                max-height: calc(100vh - 200px);
              }
              .dropdown-menu.show {
                bottom: auto;
                top: 4rem !important;
              }
            }
          `}
        </style>
      </div>
    </MasterLayout>
  );
};

export default AiAssistantPage;