const { query, throwStatus } = require('./common')

async function readLocationTree() {
  const [provinces, wards] = await Promise.all([
    query('SELECT id, name, region FROM provinces ORDER BY name ASC'),
    query('SELECT id, province_id AS provinceId, name, zone_type AS zoneType FROM wards ORDER BY name ASC'),
  ])

  const wardsByProvince = new Map()
  wards.forEach((ward) => {
    const items = wardsByProvince.get(Number(ward.provinceId)) || []
    items.push({
      id: Number(ward.id),
      provinceId: Number(ward.provinceId),
      name: ward.name,
      zoneType: ward.zoneType,
    })
    wardsByProvince.set(Number(ward.provinceId), items)
  })

  return provinces.map((province) => ({
    id: Number(province.id),
    name: province.name,
    region: province.region,
    wards: wardsByProvince.get(Number(province.id)) || [],
  }))
}

async function resolveLocationIds(provinceId, wardId) {
  if (!provinceId || !wardId) {
    throwStatus('Vui long chon day du tinh/thanh pho va phuong/xa')
  }

  const rows = await query(
    `SELECT p.id AS provinceId, p.name AS province, p.region,
            w.id AS wardId, w.name AS ward, w.zone_type AS zoneType
     FROM provinces p
     JOIN wards w ON w.province_id = p.id
     WHERE p.id = ? AND w.id = ?
     LIMIT 1`,
    [provinceId, wardId],
  )

  if (!rows.length) throwStatus('Dia chi tinh/phuong khong hop le')

  return {
    provinceId: Number(rows[0].provinceId),
    wardId: Number(rows[0].wardId),
    province: rows[0].province,
    ward: rows[0].ward,
    region: rows[0].region,
    zoneType: rows[0].zoneType,
  }
}

module.exports = {
  readLocationTree,
  resolveLocationIds,
}
