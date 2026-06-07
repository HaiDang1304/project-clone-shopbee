require('dotenv').config()

const { getPool } = require('../src/config/db')

const DEFAULT_ADDRESS_API_URL = 'https://provinces.open-api.vn/api/v2/?depth=2'

const northCodes = new Set([
  '01', '04', '06', '08', '10', '11', '12', '14', '15', '17', '19', '20', '22', '24', '25', '26', '27', '30', '31',
  '33', '34', '35', '36', '37',
])
const centralCodes = new Set(['38', '40', '42', '44', '45', '46', '48', '49', '51', '52', '54', '56', '58', '60', '62', '64', '66', '67', '68'])

function normalizeCode(value) {
  return String(value || '').trim()
}

function getRegion(province) {
  const code = normalizeCode(province.code).padStart(2, '0')
  if (northCodes.has(code)) return 'BAC'
  if (centralCodes.has(code)) return 'TRUNG'
  return 'NAM'
}

function getWardItems(province) {
  if (Array.isArray(province.wards)) return province.wards
  if (Array.isArray(province.districts)) {
    return province.districts.flatMap((district) => district.wards || [])
  }
  return []
}

function normalizeZoneType(ward) {
  const name = String(ward.name || '').toLowerCase()
  return /(dao|bien gioi|vung sau|vung xa|remote)/i.test(name) ? 'REMOTE' : 'NORMAL'
}

async function main() {
  const apiUrl = process.env.ADDRESS_API_URL || DEFAULT_ADDRESS_API_URL
  const response = await fetch(apiUrl)

  if (!response.ok) {
    throw new Error(`Khong tai duoc du lieu dia chi tu ${apiUrl}: HTTP ${response.status}`)
  }

  const provinces = await response.json()
  if (!Array.isArray(provinces)) {
    throw new Error('API dia chi tra ve sai dinh dang, can mang province')
  }

  const pool = getPool()
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    for (const province of provinces) {
      const provinceCode = normalizeCode(province.code)
      const provinceName = String(province.name || '').trim()
      if (!provinceCode || !provinceName) continue

      await connection.execute(
        `INSERT INTO provinces (code, name, region)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), region = VALUES(region)`,
        [provinceCode, provinceName, getRegion(province)],
      )

      const [provinceRows] = await connection.execute('SELECT id FROM provinces WHERE code = ? LIMIT 1', [provinceCode])
      const provinceId = Number(provinceRows[0]?.id)
      if (!provinceId) continue

      for (const ward of getWardItems(province)) {
        const wardCode = normalizeCode(ward.code)
        const wardName = String(ward.name || '').trim()
        if (!wardCode || !wardName) continue

        await connection.execute(
          `INSERT INTO wards (code, province_id, name, zone_type)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE province_id = VALUES(province_id), name = VALUES(name), zone_type = VALUES(zone_type)`,
          [wardCode, provinceId, wardName, normalizeZoneType(ward)],
        )
      }
    }

    await connection.commit()
    console.log(`Seeded ${provinces.length} provinces into local database.`)
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
