const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorize = (roles = []) => {
    // roles param can be a single role string (e.g. Role.User) or an array of roles (e.g. [Role.Admin, Role.User])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // authenticate JWT first
        authenticateToken,

        // authorize based on user role
        (req, res, next) => {
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // authentication and authorization successful
            next();
        }
    ];
};

module.exports = {
    authenticateToken,
    authorize
};
