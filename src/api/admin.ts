import express from 'express';
import { authenticateJWT, requireRole, AuthRequest } from '../../server/auth';
import { db } from '../../server/db';

const router = express.Router();

// All routes here require Admin authentication
router.use(authenticateJWT);
router.use(requireRole('admin'));

/**
 * GET /api/admin/products
 * Listing all products for the administrative dashboard with validation checks
 */
router.get('/products', async (req: AuthRequest, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to list products: ${err.message}` });
  }
});

/**
 * POST /api/admin/orders/:id/confirm
 * Explicit controller to confirm a customer's placed order
 */
router.post('/orders/:id/confirm', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const order = await db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ 
        error: 'Fulfillment Target Out of Bounds', 
        details: `The request order identifier "${id}" does not exist in our active database.` 
      });
    }

    const updated = await db.updateOrderStatus(id, { status: 'Confirmed' });
    res.json({
      message: 'Order confirmed successfully',
      order: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: `Internal query failure confirming order: ${err.message}` });
  }
});

/**
 * POST /api/admin/orders/:id/cancel
 * Explicit controller to cancel a customer's placed order
 */
router.post('/orders/:id/cancel', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const order = await db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ 
        error: 'Cancellation Target Out of Bounds', 
        details: `The request order identifier "${id}" does not exist in our active database.` 
      });
    }

    const updated = await db.updateOrderStatus(id, { status: 'Cancelled' });
    res.json({
      message: 'Order cancelled successfully',
      order: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: `Internal query failure cancelling order: ${err.message}` });
  }
});

/**
 * POST /api/admin/orders/:id/shipped
 * Explicit controller to mark a customer's order as Shipped
 */
router.post('/orders/:id/shipped', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const order = await db.getOrderById(id);
    if (!order) {
      return res.status(404).json({
        error: 'Shipping Target Out of Bounds',
        details: `The request order identifier "${id}" does not exist in our active database.`
      });
    }

    const updated = await db.updateOrderStatus(id, { status: 'Shipped' });
    res.json({
      message: 'Order marked as Shipped successfully',
      order: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: `Internal query failure shipping order: ${err.message}` });
  }
});

/**
 * POST /api/admin/orders/:id/delivered
 * Explicit controller to mark a customer's order as Delivered
 */
router.post('/orders/:id/delivered', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const order = await db.getOrderById(id);
    if (!order) {
      return res.status(404).json({
        error: 'Delivery Designation Out of Bounds',
        details: `The request order identifier "${id}" does not exist in our active database.`
      });
    }

    const updated = await db.updateOrderStatus(id, { status: 'Delivered' });
    res.json({
      message: 'Order marked as Delivered successfully',
      order: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: `Internal query failure delivering order: ${err.message}` });
  }
});

/**
 * GET /api/admin/emails
 * Fetch all transactionally sent/logged emails for auditing checks
 */
router.get('/emails', async (req: AuthRequest, res) => {
  try {
    const emails = await db.getSentEmails();
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to fetch email logs: ${err.message}` });
  }
});

export default router;
