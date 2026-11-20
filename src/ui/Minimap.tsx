import { useGameStore } from '../app/store';
import { ROOM_711_MARKERS } from '../world/mapRegistry';

export function Minimap() {
  const player = useGameStore((state) => state.player);
  const incident = useGameStore((state) => state.incident);
  const guard = useGameStore((state) => state.guardMapPosition);
  return (
    <aside className="minimap" aria-label="Live Room 711 minimap">
      <div className="minimap-heading"><span>ROOM 711</span><strong>LEVEL {player.floor}</strong></div>
      <svg viewBox={`${player.x - 25} ${player.y - 25} 50 50`} role="img" aria-label="Player-following security markers in Salle des États">
        <path className="map-room" d="M8 12H92V76H68V88H32V76H8Z" />
        <path className="map-barrier" d="M36 22H64" />
        <rect className="map-artifact" x={ROOM_711_MARKERS.artifact.x - 3} y={ROOM_711_MARKERS.artifact.y - 2} width="6" height="4" rx="1" />
        <circle className="map-guard" cx={guard.x} cy={guard.y} r="2.4" />
        <rect className="map-camera" x={ROOM_711_MARKERS.camera.x - 2.5} y={ROOM_711_MARKERS.camera.y - 1.5} width="5" height="3" rx="1" />
        {incident && incident.stage !== 'resolved' && <g className="map-incident"><circle cx={ROOM_711_MARKERS.incident.x} cy={ROOM_711_MARKERS.incident.y} r="5" /><text x={ROOM_711_MARKERS.incident.x} y={ROOM_711_MARKERS.incident.y + 2}>!</text></g>}
        <g transform={`translate(${player.x} ${player.y}) rotate(${(player.yaw * 180) / Math.PI})`} className="map-player">
          <path d="M0 -5 L3.5 4 L0 2 L-3.5 4 Z" />
        </g>
      </svg>
      <div className="map-legend"><span><i className="legend-player" />You</span><span><i className="legend-incident" />Incident</span></div>
    </aside>
  );
}
