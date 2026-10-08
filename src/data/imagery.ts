export interface DestinationImagery {
  heroCover: string;
  lodgingPhoto: string;
  landscapePhoto: string;
  activityPhoto: string;
}

export function getImageryForDestination(destination: string): DestinationImagery {
  const norm = destination.toLowerCase().trim();

  // Coorg / Western Ghats
  if (norm.includes('coorg') || norm.includes('kodagu') || norm.includes('chikmagalur') || norm.includes('sakleshpur') || norm.includes('kabini')) {
    return {
      heroCover: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1200&q=80',
      lodgingPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      landscapePhoto: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      activityPhoto: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Big Sur / Northern California
  if (norm.includes('big sur') || norm.includes('carmel') || norm.includes('napa') || norm.includes('tahoe')) {
    return {
      heroCover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      lodgingPhoto: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      landscapePhoto: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      activityPhoto: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Japan / Hakone / Tokyo
  if (norm.includes('hakone') || norm.includes('izu') || norm.includes('kamakura') || norm.includes('nikko') || norm.includes('japan')) {
    return {
      heroCover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      lodgingPhoto: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      landscapePhoto: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
      activityPhoto: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Cotswolds / UK
  if (norm.includes('cotswolds') || norm.includes('slaughter') || norm.includes('bath') || norm.includes('somerset') || norm.includes('uk')) {
    return {
      heroCover: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
      lodgingPhoto: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      landscapePhoto: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
      activityPhoto: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Alibaug / Coastal Maharashtra / Goa
  if (norm.includes('alibaug') || norm.includes('kashid') || norm.includes('goa') || norm.includes('mandwa')) {
    return {
      heroCover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      lodgingPhoto: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      landscapePhoto: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
      activityPhoto: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Normandy / France
  if (norm.includes('normandy') || norm.includes('honfleur') || norm.includes('france') || norm.includes('loire')) {
    return {
      heroCover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      lodgingPhoto: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      landscapePhoto: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80',
      activityPhoto: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Universal Luxury Retreat Fallback
  return {
    heroCover: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    lodgingPhoto: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    landscapePhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    activityPhoto: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  };
}
