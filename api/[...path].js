const { routeApi } = require('../serverless/apiRouter')

module.exports = async (req, res) => {
  return routeApi(req, res)
}
