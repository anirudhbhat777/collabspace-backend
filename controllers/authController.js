const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password required",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    delete user.password;

    res.json({
      message: "User created",
      user,
    });

  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    res.status(500).json({
      error: "Server error",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      "process.env.JWT_SECRET",
      { expiresIn: "1h" }
    );

    delete user.password;

    res.json({
      message: "Login successful",
      token,
      user,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

module.exports = {
  signup,
  login,
};