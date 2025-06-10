const { connection } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const getSession = async (req, res) => {
  const token = req.cookies.Auth;
  
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.USUARIO_ID;
    
    // Verificar el estado de OTP en la base de datos
    connection.exec(
      `SELECT OTP_VERIFIED, OTP_VERIFIED_AT FROM "DBADMIN"."USUARIO2" WHERE USUARIO_ID = ?`,
      [userId],
      (err, results) => {
        if (err) {
          console.error('Error checking OTP verification status:', err);
          return res.status(500).json({ error: "Server error" });
        }
        
        let otpVerified = false;
        let otpVerifiedAt = null;
        let otpExpired = true;
        
        // Si hay resultados, verificar estado de OTP
        if (results && results.length > 0) {
          const user = results[0];
          otpVerified = !!user.OTP_VERIFIED;
          otpVerifiedAt = user.OTP_VERIFIED_AT;
          
          // Verificar si la verificación OTP tiene menos de 24 horas
          if (otpVerified && otpVerifiedAt) {
            const now = new Date();
            const verifiedAt = new Date(otpVerifiedAt);
            const hoursDiff = (now - verifiedAt) / (1000 * 60 * 60);
            otpExpired = hoursDiff > 24;
          }
        }
          res.json({
          token: token,
          otpVerified: otpVerified,
          otpExpired: otpExpired,
          usuario: {
            id: decoded.id || decoded.USUARIO_ID,
            nombre: decoded.nombre || decoded.NOMBRE,
            rol: decoded.rol || decoded.ROL,
            correo: decoded.correo || decoded.CORREO,
            username: decoded.username || decoded.USERNAME,
            locationId: decoded.locationId || decoded.LOCATION_ID,
            LOCATION_ID: decoded.locationId || decoded.LOCATION_ID // Agregar también en formato mayúsculas
          }
        });
      }
    );
  } catch (err) {
    // Si el token es inválido, limpiar la cookie
    res.clearCookie("Auth", { 
      path: "/", 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax" 
    });
    return res.status(401).json({ error: "Invalid token" });
  }
};

const registerUser = async (req, res) => {
  const { correo, nombre, contrasena, rol, username, rfc, location_id } = req.body;

  if (!correo || !nombre || !contrasena) {
    return res.status(400).json({ error: "Todos los campos obligatorios" });
  }

  try {
    const contrasenaHash = await bcrypt.hash(contrasena, 10);

    let rolId = null;

    if (rol) {
      // Usar Promise para esperar el resultado de exec
      rolId = await new Promise((resolve, reject) => {
        const rolQuery = "SELECT Rol_ID FROM Rol2 WHERE Nombre = ?";
        connection.exec(rolQuery, [rol], (err, rolResult) => {
          if (err) {
            return reject(err);
          }
          if (rolResult && rolResult.length > 0) {
            return resolve(rolResult[0].ROL_ID);
          }
          return resolve(null); // si no encontró el rol
        });
      });
    }

    const query = `
      INSERT INTO Usuario2 
      (Nombre, Rol_ID, Clave, Location_ID, FechaEmpiezo, RFC, Correo, Username)
      VALUES (?, ?, ?, ?, CURRENT_DATE, ?, ?, ?)
    `;

    const params = [
      nombre,
      rolId, // puede ser null
      contrasenaHash,
      location_id || null,
      rfc || null,
      correo,
      username || null,
    ];

    connection.exec(query, params, (err) => {
      if (err) {
        console.error("Insert Error:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }
      res.status(201).json({ message: "Usuario registrado exitosamente" });
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const loginUser = (req, res) => {
  const { correo, contrasena } = req.body;
  
  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo/Usuario y contraseña son requeridos" });
  }
  
  // Primero limpiar cualquier cookie existente
  res.clearCookie("Auth", { 
    path: "/", 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax" 
  });
  
  res.clearCookie("UserData", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax"
  });
  
  res.clearCookie("UserData");
  
  const query = `SELECT u.*, r.Nombre as RolNombre FROM Usuario2 u 
                LEFT JOIN Rol2 r ON u.Rol_ID = r.Rol_ID 
                WHERE u.Correo = ? OR u.Username = ?`;
  
  connection.exec(query, [correo, correo], async (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Error del servidor" });
    }
    
    console.log("Query result:", rows); 
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = rows[0];
    console.log("Usuario encontrado:", usuario);
    
    try {
      const passwordCorrecta = await bcrypt.compare(contrasena, usuario.CLAVE);
      if (!passwordCorrecta) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }      // SOLO USAR 'rol' en minúsculas en el payload
      const payload = {
        id: usuario.USUARIO_ID,
        nombre: usuario.NOMBRE,
        rol: usuario.ROLNOMBRE, // solo esta propiedad para rol
        correo: usuario.CORREO,
        username: usuario.USERNAME,
        locationId: usuario.LOCATION_ID,
        otpVerified: !(process.env.AUTH_OTP === 'true'), // Only set to true if OTP is not required
        authTimestamp: Date.now() // Add authTimestamp to track login time
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      });

      // Establecer la cookie Auth
      res.cookie("Auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 día
        path: "/",
      });

      // Check if OTP is required (based on environment variable)
      const otpRequired = process.env.AUTH_OTP === 'true';
      console.log(`OTP requirement check: ${otpRequired ? 'OTP required' : 'OTP not required'}`);      // Establecer la cookie UserData con la información necesaria
      const userData = {
        USUARIO_ID: usuario.USUARIO_ID,
        NOMBRE: usuario.NOMBRE,
        ROL: usuario.ROLNOMBRE,
        CORREO: usuario.CORREO,
        USERNAME: usuario.USERNAME,
        LOCATION_ID: usuario.LOCATION_ID || null,
        locationId: usuario.LOCATION_ID || null // Agregar también en formato camelCase para compatibilidad
      };

      res.cookie("UserData", JSON.stringify(userData), {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 día
      });      // Fetch users from the same organization if user has a location
      if (usuario.LOCATION_ID) {
        // First get the organization of the user's location
        const locationQuery = `SELECT Organizacion FROM Location2 WHERE Location_ID = ?`;
        
        connection.exec(locationQuery, [usuario.LOCATION_ID], (locationErr, locationResult) => {
          if (locationErr) {
            console.error("Error getting location:", locationErr);
            return res.status(500).json({ error: "Error del servidor" });
          }
          
          if (locationResult && locationResult.length > 0) {
            const userOrganization = locationResult[0].ORGANIZACION;
            
            // Now fetch all users from locations with the same organization
            const sameOrgUsersQuery = `
              SELECT DISTINCT 
                u.Usuario_ID,
                u.Nombre,
                u.Correo,
                u.Username,
                u.Rol_ID,
                u.RFC,
                u.FechaEmpiezo,
                u.Location_ID,
                r.Nombre as RolNombre,
                l.Nombre as LocationNombre,
                l.Organizacion
              FROM Usuario2 u
              LEFT JOIN Rol2 r ON u.Rol_ID = r.Rol_ID
              LEFT JOIN Location2 l ON u.Location_ID = l.Location_ID
              WHERE l.Organizacion = ? AND u.Usuario_ID != ?
            `;
            
            connection.exec(sameOrgUsersQuery, [userOrganization, usuario.USUARIO_ID], (orgErr, orgUsers) => {
              if (orgErr) {
                console.error("Error getting organization users:", orgErr);
                // Continue with login even if this fails
                orgUsers = [];
              }
              
              const formattedOrgUsers = orgUsers ? orgUsers.map(user => ({
                id: user.USUARIO_ID,
                correo: user.CORREO,
                nombre: user.NOMBRE,
                username: user.USERNAME,
                rolId: user.ROL_ID,
                rol: user.ROLNOMBRE,
                rfc: user.RFC,
                fechaEmpiezo: user.FECHAEMPIEZO,
                locationId: user.LOCATION_ID,
                locationNombre: user.LOCATIONNOMBRE,
                organizacion: user.ORGANIZACION
              })) : [];
              
              // SOLO ENVIAR LOS DATOS NECESARIOS AL FRONTEND
              res.json({ 
                mensaje: "Login exitoso", 
                token, 
                requiresOtp: otpRequired,  // Add this flag
                usuario: {
                  id: usuario.USUARIO_ID,
                  nombre: usuario.NOMBRE,
                  rol: usuario.ROLNOMBRE,
                  correo: usuario.CORREO,
                  username: usuario.USERNAME,
                  locationId: usuario.LOCATION_ID,
                  organizacion: userOrganization
                },
                organizationUsers: formattedOrgUsers
              });
            });
          } else {
            // No location found, proceed without organization users
            res.json({ 
              mensaje: "Login exitoso", 
              token, 
              requiresOtp: otpRequired,
              usuario: {
                id: usuario.USUARIO_ID,
                nombre: usuario.NOMBRE,
                rol: usuario.ROLNOMBRE,
                correo: usuario.CORREO,
                username: usuario.USERNAME,
                locationId: usuario.LOCATION_ID
              },
              organizationUsers: []
            });
          }
        });
      } else {
        // User has no location, proceed without organization users
        res.json({ 
          mensaje: "Login exitoso", 
          token, 
          requiresOtp: otpRequired,
          usuario: {
            id: usuario.USUARIO_ID,
            nombre: usuario.NOMBRE,
            rol: usuario.ROLNOMBRE,
            correo: usuario.CORREO,
            username: usuario.USERNAME,
            locationId: usuario.LOCATION_ID
          },
          organizationUsers: []
        });
      }
    } catch (error) {
      console.error("Error comparing password:", error);
      return res.status(500).json({ error: "Error del servidor" });
    }
  });
};

const getUsers = async (req, res) => {
  try {
    const query = `
      SELECT
        u.Usuario_ID,
        u.Nombre,
        u.Correo,
        u.Username,
        u.Rol_ID,
        u.RFC,
        u.FechaEmpiezo,
        u.Location_ID,
        r.Nombre as RolNombre
      FROM Usuario2 u
      LEFT JOIN Rol2 r ON u.Rol_ID = r.Rol_ID
    `;

    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error("Error al obtener los usuarios:", err);
        return res.status(500).json({ error: "Error al obtener los usuarios" });
      }

      const formatted = result.map(usuario => ({
        id: usuario.USUARIO_ID,
        correo: usuario.CORREO,
        nombre: usuario.NOMBRE,
        username: usuario.USERNAME,
        rolId: usuario.ROL_ID, // <-- ESTO ESTÁ BIEN
        rol: usuario.ROLNombre ,
        rfc: usuario.RFC,
        fechaEmpiezo: usuario.FECHAEMPIEZO,
        locationId: usuario.LOCATION_ID,
        diasOrdenProm: null,
        valorOrdenProm: null
      }));
      
      res.status(200).json(formatted);
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const deleteUser = async (req, res) => {
  const { correo } = req.params;
  
  if (!correo) {
    return res.status(400).json({ error: "Necesitas un email" });
  }
  
  try {
    const query = "DELETE FROM Usuario2 WHERE Correo = ?";
    connection.exec(query, [correo], (err, result) => {
      if (err) {
        console.error("Error eliminando usuario:", err);
        return res.status(500).json({ error: "Error servidor" });
      }
      res.status(200).json({ message: "Borrado exito" });
    });
  } catch (error) {
    console.error("Error borrando usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const updateUser = async (req, res) => {
  const { correo, nombre, rol, contrasena, username, rfc, location_id } = req.body;
  
  if (!correo) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  try {
    if (rol) {
      const rolQuery = "SELECT Rol_ID FROM Rol2 WHERE Nombre = ?";
      connection.exec(rolQuery, [rol], async (err, rolResult) => {
        if (err) {
          console.error("Error getting role:", err);
          return res.status(500).json({ error: "Error servidor" });
        }
        
        let rolId = null;
        if (rolResult && rolResult.length > 0) {
          rolId = rolResult[0].ROL_ID;
        }
        
        await updateUserRecord(correo, nombre, rolId, contrasena, username, rfc, location_id, res);
      });
    } else {
      await updateUserRecord(correo, nombre, null, contrasena, username, rfc, location_id, res);
    }
  } catch (error) {
    console.error("Error actualizando:", error);
    res.status(500).json({ error: "Error servidor" });
  }
};

const updateUserRecord = async (correo, nombre, rolId, contrasena, username, rfc, location_id, res) => {
  try {
    let query = `UPDATE Usuario2 SET Nombre = ?, Username = ?, RFC = ?, Location_ID = ?`;
    let params = [nombre, username, rfc, location_id];
    
    if (rolId !== null) {
      query += `, Rol_ID = ?`;
      params.push(rolId);
    }
    
    if (contrasena) {
      const contrasenaHash = await bcrypt.hash(contrasena, 10);
      query += `, Clave = ?`;
      params.push(contrasenaHash);
    }
    
    query += ` WHERE Correo = ?`;
    params.push(correo);
    
    connection.exec(query, params, (err, result) => {
      if (err) {
        console.error("Error actualizando:", err);
        return res.status(500).json({ error: "Error servidor" });
      }
      res.status(200).json({ message: "Se actualizo bien" });
    });
  } catch (error) {
    console.error("Error actualizando:", error);
    res.status(500).json({ error: "Error servidor" });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Limpiar la cookie Auth con todas las opciones posibles para asegurar que se elimine
    res.clearCookie("Auth", { 
      path: "/", 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax" 
    });
    
    // También intentar limpiar sin las opciones por si acaso
    res.clearCookie("Auth");
    
    // Limpiar la cookie UserData
    res.clearCookie("UserData", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax"
    });
    
    res.clearCookie("UserData");
    
    // Enviar headers adicionales para asegurar que no se cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(200).json({ 
      message: "Sesión cerrada correctamente",
      success: true 
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ error: "Error cerrando sesión" });
  }
};

const getUserByEmail = async (req, res) => {
  const { correo } = req.params;
  
  try {
    const query = `
      SELECT 
        u.Usuario_ID,
        u.Nombre,
        u.Correo,
        u.Username,
        u.RFC,
        u.FechaEmpiezo,
        u.Location_ID,
        r.Nombre as RolNombre
      FROM Usuario2 u
      LEFT JOIN Rol2 r ON u.Rol_ID = r.Rol_ID
      WHERE u.Correo = ?
    `;
    
    connection.exec(query, [correo], (err, result) => {
      if (err) {
        console.error("Error al obtener usuario:", err);
        return res.status(500).json({ error: "Error del servidor" });
      }
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      const usuario = {
        id: result[0].USUARIO_ID,
        correo: result[0].CORREO,
        nombre: result[0].NOMBRE,
        username: result[0].USERNAME,
        organizacion: 'DEFAULT',
        rol: result[0].ROLNombre || 'USER',
        rfc: result[0].RFC,
        fechaEmpiezo: result[0].FECHAEMPIEZO,
        locationId: result[0].LOCATION_ID,
        diasOrdenProm: null,
        valorOrdenProm: null
      };
      
      res.status(200).json(usuario);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getProfileImage = (req, res) => {
  const { correo } = req.params;
  
  try {
    const query = "SELECT IMAGEN FROM USUARIO2 WHERE CORREO = ?";
    
    connection.exec(query, [correo], (err, result) => {
      if (err) {
        console.error("Error obteniendo imagen:", err);
        return res.status(500).json({ error: "Error del servidor" });
      }
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      const imagenData = result[0].IMAGEN;
      
      if (!imagenData) {
        return res.status(404).json({ error: "Imagen no encontrada" });
      }
      
      // Si la imagen está almacenada como array de bytes, convertirla a Buffer
      let buffer;
      if (Array.isArray(imagenData)) {
        buffer = Buffer.from(imagenData);
      } else if (imagenData instanceof Buffer) {
        buffer = imagenData;
      } else {
        // Si es un string o algo más, intentar convertirlo
        buffer = Buffer.from(imagenData);
      }
      
      // Enviar la imagen como respuesta
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=31536000' // Cache por 1 año
      });
      
      res.send(buffer);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Función para actualizar imagen de perfil en la base de datos
const updateProfileImage = (req, res) => {
  const { correo, imageData, contentType } = req.body;
  
  if (!correo || !imageData) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  
  try {
    // Convertir el array de bytes a Buffer
    const buffer = Buffer.from(imageData);
    
    const query = "UPDATE USUARIO2 SET IMAGEN = ? WHERE CORREO = ?";
    
    connection.exec(query, [buffer, correo], (err, result) => {
      if (err) {
        console.error("Error actualizando imagen:", err);
        return res.status(500).json({ error: "Error del servidor" });
      }
      
      res.status(200).json({ message: "Imagen actualizada correctamente" });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const getLocations = async (req, res) => {
  try {
    console.log("getLocations endpoint called"); // Log when the endpoint is hit

    const query = `
      SELECT Location_ID, Nombre, Tipo
      FROM Location2
      ORDER BY Nombre
    `;

    connection.exec(query, [], (err, result) => {
      if (err) {
        console.error("Error al obtener ubicaciones:", err);
        return res.status(500).json({ error: "Error al obtener ubicaciones" });
      }

      if (!result || result.length === 0) 
        {
        console.warn("No locations found in the database");
        return res.status(404).json({ error: "No se encontraron ubicaciones" });
      }

      console.log("Query executed successfully, result:", result); // Log the query result

      const locations = result.map(location => ({
        Location_ID: location.LOCATION_ID,
        Nombre: location.NOMBRE,
        Tipo: location.TIPO
      }));

      res.status(200).json(locations);
    });
  } catch (error) {
    console.error("Error in getLocations:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} - User data or null if not found
 */
const getUserById = async (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT u.*, r.NOMBRE as ROLNOMBRE
      FROM USUARIO u
      LEFT JOIN ROL r ON u.ROL_ID = r.ROL_ID
      WHERE u.USUARIO_ID = ?
    `;
    
    connection.execute(query, [id], (err, results) => {
      if (err) {
        console.error("Error fetching user by ID:", err);
        return reject(err);
      }
      
      if (results.length === 0) {
        return resolve(null);
      }
      
      console.log("Usuario encontrado:", results[0]);
      resolve(results[0]);
    });
  });
};

const getOrganizationUsers = async (req, res) => {
  try {
    const token = req.cookies.Auth;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.USUARIO_ID;
    const userLocationId = decoded.locationId || decoded.LOCATION_ID;

    if (!userLocationId) {
      return res.status(200).json([]); // Return empty array if user has no location
    }

    // First get the organization of the user's location
    const locationQuery = `SELECT Organizacion FROM Location2 WHERE Location_ID = ?`;
    
    connection.exec(locationQuery, [userLocationId], (locationErr, locationResult) => {
      if (locationErr) {
        console.error("Error getting location:", locationErr);
        return res.status(500).json({ error: "Error del servidor" });
      }
      
      if (!locationResult || locationResult.length === 0) {
        return res.status(200).json([]); // Return empty array if location not found
      }

      const userOrganization = locationResult[0].ORGANIZACION;
      
      // Now fetch all users from locations with the same organization
      const sameOrgUsersQuery = `
        SELECT DISTINCT 
          u.Usuario_ID,
          u.Nombre,
          u.Correo,
          u.Username,
          u.Rol_ID,
          u.RFC,
          u.FechaEmpiezo,
          u.Location_ID,
          r.Nombre as RolNombre,
          l.Nombre as LocationNombre,
          l.Organizacion
        FROM Usuario2 u
        LEFT JOIN Rol2 r ON u.Rol_ID = r.Rol_ID
        LEFT JOIN Location2 l ON u.Location_ID = l.Location_ID
        WHERE l.Organizacion = ? AND u.Usuario_ID != ?
      `;
      
      connection.exec(sameOrgUsersQuery, [userOrganization, userId], (orgErr, orgUsers) => {
        if (orgErr) {
          console.error("Error getting organization users:", orgErr);
          return res.status(500).json({ error: "Error del servidor" });
        }
        
        const formattedOrgUsers = orgUsers ? orgUsers.map(user => ({
          id: user.USUARIO_ID,
          correo: user.CORREO,
          nombre: user.NOMBRE,
          username: user.USERNAME,
          rolId: user.ROL_ID,
          rol: user.ROLNOMBRE,
          rfc: user.RFC,
          fechaEmpiezo: user.FECHAEMPIEZO,
          locationId: user.LOCATION_ID,
          locationNombre: user.LOCATIONNOMBRE,
          organizacion: user.ORGANIZACION,
          diasOrdenProm: null,
          valorOrdenProm: null
        })) : [];
        
        res.status(200).json(formattedOrgUsers);
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getUsers, 
  getSession, 
  logoutUser, 
  deleteUser, 
  updateUser, 
  getUserByEmail,
  getProfileImage,
  updateProfileImage,
  getLocations,
  getUserById,
  getOrganizationUsers
};