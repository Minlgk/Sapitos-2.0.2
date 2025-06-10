import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserPerfil = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ correo: "", nombre: "", contrasena: "", rol: "", username: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sapitos-backend.cfapps.us10-001.hana.ondemand.com";

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/getSession`, {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) {
          navigate("/");
          return;
        }
        const data = await response.json();
        if (data.usuario) {
          setUser(data.usuario);
          setForm({
            correo: data.usuario.correo,
            nombre: data.usuario.nombre,
            contrasena: "",
            rol: data.usuario.rol,
            username: data.usuario.username || ""
          });
          setIsAdmin(data.usuario.rol === "admin");
          try {
            const imageResponse = await fetch(`${API_BASE_URL}/users/${data.usuario.correo}/profileImage`, {
              credentials: "include",
              headers: {
                'Accept': 'application/octet-stream, image/*',
              }
            });
            if (imageResponse.ok) {
              const arrayBuffer = await imageResponse.arrayBuffer();
              if (arrayBuffer.byteLength > 0) {
                const uint8Array = new Uint8Array(arrayBuffer);
                const blob = new Blob([uint8Array], { type: 'image/jpeg' });
                setProfileImage(URL.createObjectURL(blob));
              }
            }
          } catch {}
          
        } else {
          navigate("/");
        }
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
    return () => {
      if (profileImage && profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [navigate, profileImage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = () => {
          // Definir tamaño máximo
          const maxDim = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height *= maxDim / width));
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width *= maxDim / height));
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          // Comprimir a JPEG calidad 0.7
          canvas.toBlob((blob) => {
            setSelectedImageFile(blob);
            setProfileImage(URL.createObjectURL(blob));
          }, 'image/jpeg', 0.7);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // 1. Update user info
      const response = await fetch(`${API_BASE_URL}/users/updateUser`, {
        method: 'PUT',
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });
      let imageUploadSuccess = true;
      // 2. If a new image was selected, upload it
      if (selectedImageFile) {
        const arrayBuffer = await selectedImageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const imageData = Array.from(uint8Array);
        const imgRes = await fetch(`${API_BASE_URL}/users/updateProfileImage`, {
          method: 'POST',
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            correo: form.correo,
            imageData,
            contentType: selectedImageFile.type
          })
        });
        imageUploadSuccess = imgRes.ok;
      }
      if (response.ok && imageUploadSuccess) {
        setUser(prev => ({ ...prev, ...form }));
        setIsEditing(false);
        setSelectedImageFile(null);
        // Refresh profile image from backend
        try {
          const imageResponse = await fetch(`${API_BASE_URL}/users/${form.correo}/profileImage`, {
            credentials: "include",
            headers: {
              'Accept': 'application/octet-stream, image/*',
            }
          });
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            if (arrayBuffer.byteLength > 0) {
              const uint8Array = new Uint8Array(arrayBuffer);
              const blob = new Blob([uint8Array], { type: 'image/jpeg' });
              setProfileImage(URL.createObjectURL(blob));
            }
          }
        } catch {}
        alert('Perfil actualizado correctamente');
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (error) {
      alert('Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setForm({
      correo: user.correo,
      nombre: user.nombre,
      contrasena: "",
      rol: user.rol,
      username: user.username || ""
    });
    setIsEditing(false);
    setSelectedImageFile(null);
    // Optionally reset profileImage to the last saved one
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: "400px"}}>
        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card mt-4 mb-4">
        <div className="card-header">
          <h2 className="card-title">Mi Perfil</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-warning">No se pudo cargar la información del usuario.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-4 mb-4" style={{maxWidth: 600, margin: "0 auto"}}>
      <div className="card-header">
        <h3 className="card-title">Mi Perfil</h3>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <label className="form-label">Imagen de perfil</label>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
            <img 
              src={profileImage || "/assets/images/user.png"} 
              alt="Perfil" 
              className="rounded-circle border"
              style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
            />
            {isEditing && (
              <>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-control"
                  style={{ position: 'absolute', width: 120, height: 120, opacity: 0, cursor: 'pointer', top: 0, left: 0 }}
                  title="Cambiar imagen"
                />
                <div style={{ position: 'absolute', top: 0, left: 0, width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <i className="ri-edit-2-fill" style={{ fontSize: 32, color: '#fff', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: 8 }}></i>
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <small className="form-text text-muted d-block text-center">Haz clic en "Editar Perfil" para cambiar tu imagen.</small>
          )}
        </div>
        
        <div className="mb-3">
          <label className="form-label">Correo</label>
          <input 
            type="email" 
            name="correo"
            value={form.correo} 
            onChange={handleInputChange}
            disabled={!isEditing} 
            className="form-control" 
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input 
            type="text" 
            name="nombre"
            value={form.nombre} 
            onChange={handleInputChange}
            disabled={!isEditing} 
            className="form-control" 
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input 
            type="text" 
            name="username"
            value={form.username} 
            onChange={handleInputChange}
            disabled={!isEditing} 
            className="form-control" 
          />
        </div>

        {isEditing && (
          <div className="mb-3">
            <label className="form-label">Nueva Contraseña (opcional)</label>
            <input 
              type="password" 
              name="contrasena"
              value={form.contrasena} 
              onChange={handleInputChange}
              className="form-control"
              placeholder="Dejar vacío si no deseas cambiarla"
            />
          </div>
        )}
        
        <div className="mb-3">
          <label className="form-label">Rol</label>
          <input 
            type="text" 
            name="rol"
            value={form.rol} 
            onChange={handleInputChange}
            disabled={!isEditing || !isAdmin} 
            className="form-control" 
          />
          {!isAdmin && (
            <small className="form-text text-muted">Solo los administradores pueden cambiar roles.</small>
          )}
        </div>
        
        <div className="card-footer">
          {!isEditing ? (
            <div className="d-flex align-items-center justify-content-center gap-3">
              <button 
                type="button"
                className="border border-primary-600 bg-hover-primary-200 text-primary-600 text-md px-56 py-11 radius-8"
                onClick={() => window.history.back()}
              >
                Regresar
              </button>
                              <button 
                type="button"
                className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setIsEditing(true)}
              >
                Editar Perfil
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center gap-3">
              <button 
                type="button"
                className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-56 py-11 radius-8"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8 d-flex align-items-center justify-content-center gap-2"
                onClick={handleSave}
              >
                Guardar
              </button>
            </div>
          )}
        </div>
        
        <hr />
        
        
      </div>
    </div>
  );
};

export default UserPerfil;