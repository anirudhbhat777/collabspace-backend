const pool = require("../db");

const createDocument = async (req, res) => {
  const { title } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO documents
      (title, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [title, "", req.userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM documents
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [req.userId]
    );

    res.json({
      documents: result.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
};