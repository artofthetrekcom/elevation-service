const {json, send} = require('micro')
const microCors = require('micro-cors')
const addElevation = require('geojson-elevation').addElevation
const TileSet = require('node-hgt').TileSet
const ImagicoElevationDownloader = require('node-hgt').ImagicoElevationDownloader
const tileDirectory = process.env.TILE_DIRECTORY || './data'
const noData = process.env.NO_DATA ? parseInt(process.env.NO_DATA) : null
const tileDownloader = process.env.TILE_DOWNLOADER === 'none'
  ? tileDownloader = undefined
  : new ImagicoElevationDownloader(tileDirectory)
const maxPostSize = process.env.MAX_POST_SIZE || "5120kb"
const tiles = new TileSet(tileDirectory, {downloader:tileDownloader})

const cors = microCors({
  allowMethods: ['POST']
})

module.exports = cors(async (req, res) => {

  res = cors(res)

  if (req.url === '/status' && req.method === 'GET') {
    return send(res, 200, { status: 'Ok'})
  }

  if (req.method !== 'POST') {
    return send(res, 405, {error: 'Only POST allowed'})
  }

  const geojson = await json(req, {limit: maxPostSize})
  if (!geojson || Object.keys(geojson).length === 0) {
    return send(res, 400, {error: 'invalid GeoJSON'})
  }

  return new Promise((resolve, reject) => {
    addElevation(geojson, tiles, function(err, newGeojson) {
      if (err) {
        return send(res, 500, err)
      }

      resolve(newGeojson)
    }, noData)
  })
})
