const { db } = require('../database');

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateDeliveryCharge(distanceKm, totalBricks = 0) {
  const modeSetting = db.prepare("SELECT value FROM business_settings WHERE key='delivery_rate_mode'").get();
  const tiersSetting = db.prepare("SELECT value FROM business_settings WHERE key='delivery_rate_tiers'").get();
  const flatChargeSetting = db.prepare("SELECT value FROM business_settings WHERE key='delivery_charge'").get();
  const capacityEnabled = db.prepare("SELECT value FROM business_settings WHERE key='capacity_pricing_enabled'").get()?.value !== 'false';
  const truckCapSetting = parseInt(db.prepare("SELECT value FROM business_settings WHERE key='standard_truck_capacity'").get()?.value || '5000') || 5000;
  const vehicleTiersSetting = db.prepare("SELECT value FROM business_settings WHERE key='vehicle_rate_tiers'").get();

  // 1. Calculate base distance charge
  let baseCharge = parseFloat(flatChargeSetting?.value || '1500');
  if (modeSetting?.value === 'distance' && tiersSetting?.value && distanceKm !== null && distanceKm !== undefined) {
    try {
      const tiers = JSON.parse(tiersSetting.value).sort((a, b) => a.max_km - b.max_km);
      for (const tier of tiers) {
        if (distanceKm <= tier.max_km) {
          baseCharge = tier.charge;
          break;
        }
      }
    } catch {}
  }

  // If capacity calculation is disabled or totalBricks is 0, return base charge
  if (!capacityEnabled || !totalBricks || totalBricks <= 0) {
    return {
      charge: Math.round(baseCharge),
      base_charge: Math.round(baseCharge),
      vehicle_type: 'Standard Truck (1 Trip)',
      truck_trips: 1,
      multiplier: 1.0,
      extra_charge: 0,
      total_bricks: totalBricks || 0
    };
  }

  // 2. Capacity / Vehicle Tier calculation
  let vehicleName = 'Standard 6-Wheeler';
  let multiplier = 1.0;
  let extraCharge = 0;
  let trips = Math.max(1, Math.ceil(totalBricks / truckCapSetting));

  if (vehicleTiersSetting?.value) {
    try {
      const vTiers = JSON.parse(vehicleTiersSetting.value).sort((a, b) => a.max_bricks - b.max_bricks);
      let matched = false;
      for (const vt of vTiers) {
        if (totalBricks <= vt.max_bricks) {
          vehicleName = vt.name;
          multiplier = parseFloat(vt.multiplier ?? 1.0);
          extraCharge = parseFloat(vt.extra_charge ?? 0);
          matched = true;
          break;
        }
      }
      if (!matched && vTiers.length > 0) {
        const last = vTiers[vTiers.length - 1];
        trips = Math.ceil(totalBricks / truckCapSetting);
        vehicleName = `Multi-Truck Fleet (${trips} Trucks)`;
        multiplier = Math.max(1, trips * 0.9); // fleet efficiency rate
        extraCharge = parseFloat(last.extra_charge || 0);
      }
    } catch {}
  } else {
    // Default bricks capacity slabs:
    if (totalBricks <= 2500) {
      vehicleName = 'Mini Truck / Small (Up to 2,500 pcs)';
      multiplier = 0.8;
    } else if (totalBricks <= 5000) {
      vehicleName = 'Standard 6-Wheeler (Up to 5,000 pcs)';
      multiplier = 1.0;
    } else if (totalBricks <= 10000) {
      vehicleName = 'Heavy 10-Wheeler (5,001 - 10,000 pcs)';
      multiplier = 1.8;
      extraCharge = 500;
    } else {
      trips = Math.ceil(totalBricks / 5000);
      vehicleName = `Multi-Truck Fleet (${trips} Trucks)`;
      multiplier = trips * 0.9;
      extraCharge = 1000;
    }
  }

  const finalCharge = Math.round((baseCharge * multiplier) + extraCharge);

  return {
    charge: finalCharge,
    base_charge: Math.round(baseCharge),
    vehicle_type: vehicleName,
    truck_trips: trips,
    multiplier,
    extra_charge: extraCharge,
    total_bricks: totalBricks
  };
}

module.exports = { haversineKm, calculateDeliveryCharge };
