import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GameMap, MapPin } from '@/lib/data';

interface MapCanvasProps {
  gameMap: GameMap;
  pins: MapPin[];
  focusPinId: string | null;
  onFocusHandled: () => void;
  labelFor: (pin: MapPin) => string;
  attribution: string;
  imageAlt: string;
}

/**
 * Carte Looty Bay sur l'image du jeu (Leaflet, CRS.Simple).
 * Les coordonnées sources sont en pourcentage : x → largeur, y → hauteur
 * (inversée car Leaflet compte les latitudes vers le haut).
 */
export default function MapCanvas({
  gameMap,
  pins,
  focusPinId,
  onFocusHandled,
  labelFor,
  attribution,
  imageAlt,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const [map, setMap] = useState<L.Map | null>(null);

  const toLatLng = (pin: MapPin): L.LatLng =>
    L.latLng(gameMap.height - (pin.y / 100) * gameMap.height, (pin.x / 100) * gameMap.width);

  // Création de la carte (une seule fois par jeu de données).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bounds = L.latLngBounds([0, 0], [gameMap.height, gameMap.width]);
    const instance = L.map(container, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 1,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      attributionControl: true,
    });

    L.imageOverlay(gameMap.image, bounds, { alt: imageAlt }).addTo(instance);
    instance.fitBounds(bounds, { padding: [12, 12] });
    instance.attributionControl.addAttribution(attribution);
    setMap(instance);

    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      markersRef.current.clear();
      instance.remove();
      setMap(null);
    };
  }, [gameMap, attribution, imageAlt]);

  // Marqueurs : recréés à chaque changement de filtre.
  useEffect(() => {
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    markersRef.current.clear();

    for (const pin of pins) {
      const label = labelFor(pin);
      const marker = L.marker(toLatLng(pin), {
        icon: L.divIcon({
          className: `robrun-pin robrun-pin--${pin.type}`,
          html: '<span class="robrun-pin__dot"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -12],
        }),
        title: label,
        alt: label,
        riseOnHover: true,
      });

      const content = document.createElement('div');
      content.className = 'robrun-popup-content';
      const title = document.createElement('p');
      title.className = 'robrun-popup-title';
      title.textContent = label;
      const coords = document.createElement('p');
      coords.className = 'robrun-popup-coords';
      coords.dir = 'ltr';
      coords.textContent = `${pin.x.toFixed(2)} · ${pin.y.toFixed(2)}`;
      content.append(title, coords);

      marker.bindPopup(L.popup({ className: 'robrun-popup', closeButton: true }).setContent(content));
      marker.addTo(layer);
      markersRef.current.set(pin.id, marker);
    }

    return () => {
      markersRef.current.clear();
      layer.remove();
    };
    // toLatLng dépend uniquement de gameMap (déjà dans les dépendances via map).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pins, labelFor]);

  // Centrage demandé depuis la liste des marqueurs.
  useEffect(() => {
    if (!map || !focusPinId) return;
    const marker = markersRef.current.get(focusPinId);
    if (!marker) {
      onFocusHandled();
      return;
    }
    map.panTo(marker.getLatLng(), { animate: true });
    marker.openPopup();
    onFocusHandled();
  }, [map, focusPinId, onFocusHandled]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      role="application"
      aria-label={imageAlt}
      className="h-[320px] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-[460px]"
    />
  );
}
