import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkAuth(req, res, next) {

  // Give access to /api/users/login
  if (req.path.toLowerCase() === '/users/login') {
    return next();
  }

  // Check if req.path contains with /api/cli/
  if (req.path.toLowerCase().indexOf('/cli/') !== -1) {

    // Check if Authorization header is present
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];

      // Check if token is valid
      const count = await prisma.user.count({
        where: {
          apiToken: token
        }
      });

      if (count > 0) {
        return next();
      } else {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  // check if logged in
  if (req.session.isLoggedIn) {

    // Update session user data if it is older than 1 minute
    if (req.session.user.lastUpdatedDB) {
      const lastUpdatedDB = new Date(req.session.user.lastUpdatedDB);
      const currentTime = new Date();
      const diffInMinutes = Math.floor((currentTime - lastUpdatedDB) / (1000 * 60));
      if (diffInMinutes >= 1) {
        // Fetch user data from the database
        const updatedUser = await prisma.user.findUnique({
          where: {
            id: req.session.user.id,
          },
        });
        req.session.user = updatedUser;
        req.session.user.lastUpdatedDB = new Date();
        delete req.session.user.password;
      }
    }

    return next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
}

export default checkAuth;