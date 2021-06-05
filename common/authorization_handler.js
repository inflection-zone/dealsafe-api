const jwt = require('jsonwebtoken');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const role_authorization_service = require("./role_authorization.service");
const { ApiError } = require('../common/api_error');
const request_ip = require('request-ip');
const { request } = require('needle');
////////////////////////////////////////////////////////////////////////////

module.exports.authenticate = (req, res, next) => {
  try {
    req.context = 'address.controller';
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
      throw new ApiError('Unauthorized access', 401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
      if (error) {
        throw new ApiError('Forebidden access', 403);
      }
      req.user = user;
      request.client_ip = request_ip.getClientIp(req);
      next();
    });
  }
  catch (err) {
    logger.log(JSON.stringify(err));
    response_handler.handle_error(res, req, err);
  }
};

module.exports.check_role_authorization = async (user, privilege_name) => {
  if (privilege_name == null || privilege_name === 'undefined') {
    throw new ApiError('Unauthorized access', 401);
  }
  if (user == null) {
    throw new ApiError('Unauthorized access', 401);
  }
  var has_privilege = await has_user_privilege(user.user_id, privilege_name);
  if (!has_privilege) {
    throw new ApiError('Forebidden access', 403);
  }
  return true;
}

module.exports.generate_token = (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '90d' });
  return token;
};

//////////////////////////////////////////////////////////////////////////////

async function has_user_privilege(user_id, privilege_name) {
  var privilege = await role_authorization_service.get_privilege_by_name(privilege_name);
  if (privilege == null) {
    return true;
  }
  var privilege_ids = [];
  var roles = await role_authorization_service.get_roles_for_user(user_id);
  for await (var role of roles) {
    var role_privileges = await role_authorization_service.get_role_privileges_for_role(role.id);
    var privileges = role_privileges.map(rp => rp.privilege_id);
    if (privileges.length > 0) {
      privilege_ids.push(...privileges);
    }
  }
  for await (var pid of privilege_ids) {
    if (pid == privilege.id) {
      return true;
    }
  }
  return false;
}
