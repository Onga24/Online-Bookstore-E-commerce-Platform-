const { Router } = require("express");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = Router();

//router.use(authMiddleware); // only authenticated users can access the cart

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove/:bookId", removeCartItem);
router.delete("/clear", clearCart);

module.exports = router;
