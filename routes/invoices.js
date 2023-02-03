const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

const db = require("../db");

/** GET / - returns `{invoices: [invoice, ...]}` */
router.get("/", async function (req, res, next) {
  try {
    const invoicesQuery = await db.query(
      "SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices"
    );
    return res.json({ invoices: invoicesQuery.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] - return data about one invoice: `{invoice: invoice}` */

router.get("/:id", async function (req, res, next) {
  try {
    const invoicesQuery = await db.query(
      "SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id = $1",
      [req.params.id]
    );

    if (invoicesQuery.rows.length === 0) {
      throw new ExpressError(
        `There is no invoice with id '${req.params.id}`,
        404
      );
    }
    return res.json({ invoice: invoicesQuery.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** POST / - create invoice from data; return `{invoice: invoice}` */

router.post("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2) 
           RETURNING comp_code, amt, paid, add_date, paid_date`,
      [req.body.comp_code, req.body.amt]
    );

    return res.status(201).json({ invoice: result.rows[0] }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] - update fields in invoice; return `{invoice: invoice}` */

router.patch("/:id", async function (req, res, next) {
  try {
    if ("id" in req.body) {
      throw new ExpressError("Not allowed", 400);
    }
    const currResult = await db.query(
      `SELECT paid
       FROM invoices
       WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(
        `There is no invoice with id of '${req.params.id}`,
        404
      );
    }

    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const result = await db.query(
      `UPDATE invoices
       SET amt=$1, paid=$2, paid_date=$3
       WHERE id=$4
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id] - delete invoice, return `{status: "deleted"}` */

router.delete("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(
        `There is no invoice with id of '${req.params.id}`,
        404
      );
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
