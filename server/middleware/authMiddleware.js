import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // const authHeader = req.headers.authorization;

  // // ❌ No Authorization header
  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   return res.status(401).json({ message: "Not authorized, no token" });
  // }

  // const token = authHeader.split(" ")[1];

  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //   // ✅ NORMALIZED USER OBJECT (IMPORTANT)
  //   req.user = {
  //     id: decoded._id || decoded.id || decoded.userId,
  //     email: decoded.email,
  //     role: decoded.role || "user",
  //   };

  //   if (!req.user.id) {
  //     return res.status(401).json({ message: "Invalid token payload" });
  //   }

  //   next();
  // } catch (error) {
  //   console.error("JWT error:", error.message);
  //   return res.status(401).json({ message: "Invalid token" });
  // }

  // Guest user for bypassed authentication
  req.user = {
    id: "659d8f8e5f1a2b3c4d5e6f7a", // Hardcoded guest ID
    email: "guest@example.com",
    name: "Guest User",
    role: "user"
  };
  next();
};










// import jwt from "jsonwebtoken";

// export const protect = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "Not authorized" });

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(401).json({ message: "Invalid token" });
//     req.user = decoded;
//     next();
//   });
// };
