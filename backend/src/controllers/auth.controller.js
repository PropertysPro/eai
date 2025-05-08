import supabase from '../config/supabase.js';
import { validationResult } from 'express-validator';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Register user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        phone
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Optionally, you can insert into a profiles table here if needed

    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        phone: data.user.user_metadata?.phone,
        email_confirmed: data.user.email_confirmed_at ? true : false
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Authenticate user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    res.status(200).json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        phone: data.user.user_metadata?.phone,
        email_confirmed: data.user.email_confirmed_at ? true : false
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    // Expecting access token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // Get user from Supabase using the access token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
      phone: data.user.user_metadata?.phone,
      email_confirmed: data.user.email_confirmed_at ? true : false
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

export default {
  register,
  login,
  getMe,
  logout
};
