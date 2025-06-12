const { generateOTP, verifyOTP } = require('../utils/otp');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/emailService');
const { getUserById } = require('../controllers/userController');
const { connection } = require('../config/db');

/**
 * Middleware to check if auth timestamp is older than 24 hours
 * and redirect to OTP verification if needed
 */
const checkAuthTimestamp = (req, res, next) => {
    console.log('Running checkAuthTimestamp middleware');
    
    // Check if OTP is enabled in environment
    const otpEnabled = process.env.AUTH_OTP === 'true';
    console.log(`OTP enabled in environment: ${otpEnabled}`);
    
    if (!otpEnabled) {
        console.log('OTP is disabled, skipping verification');
        return next();
    }
    
    try {
    // Check if user exists in request (should be added by auth middleware)
        if (!req.user) {
            console.log('No user in request, authentication middleware may not be executed first');
            return res.status(401).json({ 
                requiresAuth: true,
                message: 'Authentication required' 
            });
        }
        
        // Get user ID for database check
        const userId = req.user.id || req.user.USUARIO_ID;
        
        // Check for OTP verification in database
        const query = `
            SELECT OTP_VERIFIED, OTP_VERIFIED_AT 
            FROM "DBADMIN"."USUARIO2" 
            WHERE USUARIO_ID = ?
        `;
        
        connection.exec(query, [userId], (err, results) => {
            if (err) {
                console.error('Error checking OTP verification status:', err);
                return res.status(500).json({ message: 'Server error during OTP check' });
            }
            
            if (!results || results.length === 0) {
                console.log('User not found in database');
                return res.status(401).json({ 
                    requiresAuth: true,
                    message: 'Authentication required' 
                });
            }
            
            const user = results[0];
            console.log('OTP verification status from DB:', {
                otpVerified: user.OTP_VERIFIED, 
                otpVerifiedAt: user.OTP_VERIFIED_AT
            });
            
            // If user has not verified OTP yet
            if (!user.OTP_VERIFIED) {
                console.log('User has not completed OTP verification');
                return res.status(401).json({ 
                    requiresOtp: true,
                    message: 'OTP verification required'
                });
            }
            
            // Check if OTP_VERIFIED_AT is older than 24 hours
            const now = new Date();
            const verifiedAt = new Date(user.OTP_VERIFIED_AT);
            const hoursDiff = (now - verifiedAt) / (1000 * 60 * 60);
            console.log(`OTP verified ${hoursDiff.toFixed(2)} hours ago`);
            
            if (hoursDiff > 24) {
                console.log('OTP verification is older than 24 hours, requiring new verification');
                return res.status(401).json({ 
                    requiresOtp: true,
                    message: 'OTP verification required (expired)'
                });
            }
            
            console.log('OTP verification is recent, proceeding without OTP');
            next();
        });
    } catch (error) {
        console.error('Error in checkAuthTimestamp middleware:', error);
        res.status(500).json({ message: 'Server error during OTP check' });
    }
};

/**
 * Generate OTP for user verification
 */
const generateOTPHandler = async (req, res) => {
    try {
        console.log("OTP Handler - Checking environment variables:");
        console.log(`AUTH_OTP set to: ${process.env.AUTH_OTP}`);
        console.log(`OTP enabled: ${process.env.AUTH_OTP === 'true'}`);
        
        // Get user info from JWT token
        const token = req.cookies.Auth;
        if (!token) {
            console.log("No Auth cookie found");
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const decoded = jwt.decode(token);
        if (!decoded) {
            console.log("Invalid token format");
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        console.log("Token decoded successfully:", { 
            userId: decoded.id,
            email: decoded.correo,
            hasAuthTimestamp: !!decoded.authTimestamp 
        });
        
        // Generate OTP
        const { otp, secret } = generateOTP();
        
        try {
            // Get user information to include in email
            let userName = "User";
            
            if (decoded.id) {
                try {
                    const user = await getUserById(decoded.id);
                    if (user && user.NOMBRE) {
                        userName = user.NOMBRE;
                    }
                } catch (userError) {
                    console.error("Failed to fetch user details:", userError);
                }
            }
            
            // Send OTP via email
            const userEmail = decoded.correo;
            console.log(`Sending OTP to email: ${userEmail} for user: ${userName}`);
            
            const emailSent = await sendOTPEmail(userEmail, otp, userName);
            
            if (!emailSent) {
                console.error("Failed to send OTP email");
                return res.status(500).json({ 
                    success: false,
                    message: 'Failed to send verification code. Please try again.'
                });
            }
            
            console.log(`OTP email sent successfully to ${userEmail}`);
            
            // Only send the secret to the client, never the OTP
            res.json({
                success: true, 
                message: 'Verification code sent to your email',
                secret,
                authOtpEnabled: process.env.AUTH_OTP === 'true'
            });
            
        } catch (error) {
            console.error("Error in OTP generation process:", error);
            res.status(500).json({ 
                success: false,
                message: 'Server error during OTP generation'
            });
        }
    } catch (error) {
        console.error('Error generating OTP:', error);
        res.status(500).json({ message: 'Failed to generate OTP' });
    }
};

/**
 * Verify OTP provided by user
 */
const verifyOTPHandler = async (req, res) => {    
    try {
        console.log("Verifying OTP...");
        const { otp, secret } = req.body;
        
        if (!otp || !secret) {
            return res.status(400).json({ 
                message: 'OTP and secret are required' 
            });
        }
        
        // Verify the OTP
        const isValid = verifyOTP(otp, secret);
        console.log("OTP verification result:", isValid);
        
        if (isValid) {
            // Get user info from token
            const token = req.cookies.Auth;
            
            try {
                // Verify token to ensure it's valid
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                if (!decoded) {
                    return res.status(401).json({ message: 'Invalid token' });
                }
                
                const userId = decoded.id || decoded.USUARIO_ID;
                
                // Update the user's OTP verification status in the database
                const updateQuery = `
                    UPDATE "DBADMIN"."USUARIO2" 
                    SET OTP_VERIFIED = TRUE, 
                        OTP_VERIFIED_AT = CURRENT_TIMESTAMP 
                    WHERE USUARIO_ID = ?
                `;
                
                connection.exec(updateQuery, [userId], (err, updateResult) => {
                    if (err) {
                        console.error("Error updating OTP verification status:", err);
                        // Continue with token update even if DB update fails
                    } else {
                        console.log("Database updated with OTP verification status");
                    }
                    
                    // Update token regardless of DB update success
                    const { exp, ...decodedWithoutExp } = decoded;
                    
                    const payload = {
                        ...decodedWithoutExp,
                        otpVerified: true, // Add OTP verification flag
                        authTimestamp: Date.now() // Update timestamp
                    };
                
                    const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
                    });
                    
                    res.cookie("Auth", newToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: "None",
                        maxAge: 24 * 60 * 60 * 1000, // 1 day
                        path: "/",
                    });
                    
                    console.log("OTP verification successful, token updated with otpVerified=true");
                    
                    res.json({ 
                        verified: true, 
                        message: 'OTP verified successfully',
                        token: newToken 
                    });
                });
            } catch (tokenError) {
                console.error("Token verification failed:", tokenError);
                return res.status(401).json({ message: 'Invalid token' });
            }
        } else {
            res.status(400).json({ 
                verified: false, 
                message: 'Invalid OTP' 
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

module.exports = {
    checkAuthTimestamp,
    generateOTPHandler,
    verifyOTPHandler
};
